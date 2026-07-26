"use strict";

const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const portableRoot = path.resolve(process.argv[2] || process.env.OPENCLAW_PORTABLE_ROOT || process.cwd());
const once = process.argv.includes("--once");
const canonicalRoot = path.join(portableRoot, "skills");
const stateRoot = path.join(portableRoot, "data", ".agent-hub");
const manifestPath = path.join(stateRoot, "shared-skills.json");
const intervalMs = Math.max(60000, Number(process.env.SKILL_REPOSITORY_INTERVAL_MS || 10 * 60 * 1000));
const watchDebounceMs = Math.max(500, Number(process.env.SKILL_REPOSITORY_WATCH_DEBOUNCE_MS || 1500));
const watchStatIntervalMs = Math.max(500, Number(process.env.SKILL_REPOSITORY_WATCH_STAT_INTERVAL_MS || 5000));
const excludedDirectories = new Set([".git", ".github", ".hub", ".archive", "node_modules", "__pycache__", ".venv", "venv", "dist", "build", ".next", ".cache"]);
const sources = [
  { id: "openclaw-managed", tag: "openclaw", root: path.join(portableRoot, "data", ".openclaw", "skills") },
  { id: "openclaw-workspace", tag: "openclaw", root: path.join(portableRoot, "data", ".openclaw", "workspace", "skills") },
  { id: "hermes-local", tag: "hermes", root: path.join(portableRoot, "data", ".hermes", "skills") }
];

let running = false;
let queued = false;
let queuedForceEmit = false;
let queuedReason = "queued";
let stopping = false;
let watchTimer = null;
let watchRefreshTimer = null;
let watchers = [];
let suppressCanonicalWatchUntil = 0;

function emit(payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function normalizeRelative(value) {
  return value.split(path.sep).join("/");
}

function safeDirectoryName(value) {
  const cleaned = String(value || "skill").replace(/[\\/:*?"<>|]/g, "_").trim();
  return cleaned || "skill";
}

async function pathExists(target) {
  try {
    await fsp.access(target);
    return true;
  } catch {
    return false;
  }
}

async function readManifest() {
  try {
    const parsed = JSON.parse(await fsp.readFile(manifestPath, "utf8"));
    if (parsed?.version === 1 && parsed.entries && typeof parsed.entries === "object") return parsed;
  } catch {}
  return { version: 1, entries: {} };
}

async function writeManifest(manifest) {
  await fsp.mkdir(stateRoot, { recursive: true });
  const tempPath = `${manifestPath}.tmp-${process.pid}`;
  await fsp.writeFile(tempPath, `${JSON.stringify({ ...manifest, updatedAt: new Date().toISOString() }, null, 2)}\n`, "utf8");
  await fsp.rm(manifestPath, { force: true });
  await fsp.rename(tempPath, manifestPath);
}

function suppressCanonicalWatch() {
  suppressCanonicalWatchUntil = Math.max(suppressCanonicalWatchUntil, Date.now() + 2500);
}

async function discoverSkillPackages(source) {
  if (!await pathExists(source.root)) return [];
  try {
    if (path.resolve(await fsp.realpath(source.root)) === path.resolve(await fsp.realpath(canonicalRoot))) return [];
  } catch {}
  const packages = [];
  const queue = [{ dir: source.root, depth: 0 }];
  while (queue.length) {
    const current = queue.shift();
    if (!current || current.depth > 6) continue;
    let entries;
    try {
      entries = await fsp.readdir(current.dir, { withFileTypes: true });
    } catch {
      continue;
    }
    if (entries.some((entry) => entry.isFile() && entry.name.toLowerCase() === "skill.md")) {
      const relative = normalizeRelative(path.relative(source.root, current.dir));
      if (relative && !(source.id === "hermes-local" && relative.split("/")[0].toLowerCase() === "openclaw")) {
        packages.push({ source, sourcePath: current.dir, sourceId: `${source.id}:${relative}`, relative });
      }
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".") || excludedDirectories.has(entry.name)) continue;
      if (source.id === "hermes-local" && current.depth === 0 && entry.name.toLowerCase() === "openclaw") continue;
      queue.push({ dir: path.join(current.dir, entry.name), depth: current.depth + 1 });
    }
  }
  return packages;
}

async function fingerprintDirectory(root) {
  const hash = crypto.createHash("sha256");
  const queue = [root];
  let fileCount = 0;
  while (queue.length) {
    const dir = queue.shift();
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name, "en"));
    for (const entry of entries) {
      if (entry.name.startsWith(".skill-import-") || entry.name.startsWith(".skill-backup-")) continue;
      const full = path.join(dir, entry.name);
      const relative = normalizeRelative(path.relative(root, full));
      if (entry.isDirectory()) {
        if (!excludedDirectories.has(entry.name)) queue.push(full);
        continue;
      }
      if (!entry.isFile()) continue;
      const stat = await fsp.stat(full);
      hash.update(relative);
      hash.update("\0");
      hash.update(String(stat.size));
      hash.update("\0");
      hash.update(String(Math.round(stat.mtimeMs)));
      hash.update("\n");
      fileCount += 1;
    }
  }
  return { hash: hash.digest("hex"), fileCount };
}

async function countCanonicalPackages() {
  let count = 0;
  const queue = [{ dir: canonicalRoot, depth: 0 }];
  while (queue.length) {
    const current = queue.shift();
    if (!current || current.depth > 6) continue;
    let entries;
    try {
      entries = await fsp.readdir(current.dir, { withFileTypes: true });
    } catch {
      continue;
    }
    if (entries.some((entry) => entry.isFile() && entry.name.toLowerCase() === "skill.md")) {
      count += 1;
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".") || excludedDirectories.has(entry.name)) continue;
      queue.push({ dir: path.join(current.dir, entry.name), depth: current.depth + 1 });
    }
  }
  return count;
}

function shouldCopy(sourceRoot, candidate) {
  const relative = normalizeRelative(path.relative(sourceRoot, candidate));
  return !relative.split("/").some((part) => excludedDirectories.has(part));
}

async function chooseTarget(packageInfo, manifest, sourceFingerprint) {
  const existing = manifest.entries[packageInfo.sourceId];
  if (existing?.targetName) return { targetName: existing.targetName, entry: existing };
  const base = safeDirectoryName(path.basename(packageInfo.sourcePath));
  const candidates = [base, `${base}-${packageInfo.source.tag}`];
  for (let index = 2; index < 1000; index += 1) candidates.push(`${base}-${packageInfo.source.tag}-${index}`);
  for (const targetName of candidates) {
    const targetPath = path.join(canonicalRoot, targetName);
    if (!await pathExists(targetPath)) return { targetName, entry: null };
    const targetFingerprint = await fingerprintDirectory(targetPath);
    if (targetFingerprint.hash === sourceFingerprint.hash) {
      return { targetName, entry: { owned: false, targetFingerprint: targetFingerprint.hash } };
    }
  }
  throw new Error(`Unable to allocate canonical skill directory for ${packageInfo.sourceId}`);
}

async function replaceDirectory(sourcePath, targetPath) {
  suppressCanonicalWatch();
  const tempPath = path.join(canonicalRoot, `.skill-import-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const backupPath = path.join(canonicalRoot, `.skill-backup-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  await fsp.cp(sourcePath, tempPath, { recursive: true, preserveTimestamps: true, filter: (candidate) => shouldCopy(sourcePath, candidate) });
  let movedExisting = false;
  try {
    if (await pathExists(targetPath)) {
      await fsp.rename(targetPath, backupPath);
      movedExisting = true;
    }
    await fsp.rename(tempPath, targetPath);
    if (movedExisting) await fsp.rm(backupPath, { recursive: true, force: true });
  } catch (error) {
    if (!await pathExists(targetPath) && movedExisting && await pathExists(backupPath)) await fsp.rename(backupPath, targetPath).catch(() => {});
    await fsp.rm(tempPath, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

async function reconcile(forceEmit = false, reason = "requested") {
  if (running) {
    queued = true;
    queuedForceEmit ||= forceEmit;
    queuedReason = reason || queuedReason;
    return null;
  }
  running = true;
  const startedAt = Date.now();
  const changes = { added: [], updated: [], removed: [], conflicts: [], preserved: [] };
  try {
    await fsp.mkdir(canonicalRoot, { recursive: true });
    const manifest = await readManifest();
    const discovered = [];
    for (const source of sources) discovered.push(...await discoverSkillPackages(source));
    const activeSourceIds = new Set(discovered.map((item) => item.sourceId));
    for (const packageInfo of discovered) {
      const sourceFingerprint = await fingerprintDirectory(packageInfo.sourcePath);
      const allocation = await chooseTarget(packageInfo, manifest, sourceFingerprint);
      const targetPath = path.join(canonicalRoot, allocation.targetName);
      const previous = manifest.entries[packageInfo.sourceId] || allocation.entry;
      if (previous?.sourceFingerprint === sourceFingerprint.hash && await pathExists(targetPath)) continue;
      let owned = previous?.owned !== false;
      if (await pathExists(targetPath)) {
        const targetFingerprint = await fingerprintDirectory(targetPath);
        if (previous?.owned && previous.targetFingerprint && targetFingerprint.hash !== previous.targetFingerprint) {
          delete manifest.entries[packageInfo.sourceId];
          const alternate = await chooseTarget(packageInfo, manifest, sourceFingerprint);
          allocation.targetName = alternate.targetName;
          changes.conflicts.push({ sourceId: packageInfo.sourceId, preserved: path.basename(targetPath), importedAs: alternate.targetName });
          owned = true;
        } else if (previous?.owned === false && targetFingerprint.hash !== sourceFingerprint.hash) {
          delete manifest.entries[packageInfo.sourceId];
          const alternate = await chooseTarget(packageInfo, manifest, sourceFingerprint);
          allocation.targetName = alternate.targetName;
          changes.conflicts.push({ sourceId: packageInfo.sourceId, preserved: path.basename(targetPath), importedAs: alternate.targetName });
          owned = true;
        } else if (!previous?.owned && targetFingerprint.hash === sourceFingerprint.hash) {
          manifest.entries[packageInfo.sourceId] = { sourceId: packageInfo.sourceId, sourceType: packageInfo.source.id, sourceRelative: packageInfo.relative, targetName: allocation.targetName, owned: false, sourceFingerprint: sourceFingerprint.hash, targetFingerprint: targetFingerprint.hash };
          continue;
        }
      }
      const finalTargetPath = path.join(canonicalRoot, allocation.targetName);
      const existed = await pathExists(finalTargetPath);
      await replaceDirectory(packageInfo.sourcePath, finalTargetPath);
      const targetFingerprint = await fingerprintDirectory(finalTargetPath);
      manifest.entries[packageInfo.sourceId] = { sourceId: packageInfo.sourceId, sourceType: packageInfo.source.id, sourceRelative: packageInfo.relative, targetName: allocation.targetName, owned, sourceFingerprint: sourceFingerprint.hash, targetFingerprint: targetFingerprint.hash };
      changes[existed ? "updated" : "added"].push({ sourceId: packageInfo.sourceId, targetName: allocation.targetName });
    }
    for (const [sourceId, entry] of Object.entries(manifest.entries)) {
      if (activeSourceIds.has(sourceId)) continue;
      const targetPath = path.join(canonicalRoot, entry.targetName || "");
      if (entry.owned && entry.targetName && await pathExists(targetPath)) {
        const targetFingerprint = await fingerprintDirectory(targetPath);
        if (entry.targetFingerprint && targetFingerprint.hash === entry.targetFingerprint) {
          await fsp.rm(targetPath, { recursive: true, force: true });
          changes.removed.push({ sourceId, targetName: entry.targetName });
        } else {
          changes.preserved.push({ sourceId, targetName: entry.targetName, reason: "canonical-copy-modified" });
        }
      }
      delete manifest.entries[sourceId];
    }
    suppressCanonicalWatch();
    await writeManifest(manifest);
    const changedCount = changes.added.length + changes.updated.length + changes.removed.length + changes.conflicts.length;
    // The live worker never walks the entire canonical repository just to count it.
    // UI metadata scans own that diagnostic; --once keeps the count for release tests.
    const canonicalPackageCount = once ? await countCanonicalPackages() : void 0;
    const report = { type: "skill-repository", ok: true, portableRoot, canonicalRoot, discovered: discovered.length, canonicalPackageCount, changedCount, changes, trigger: reason, catalogChanged: changedCount > 0 || reason === "watch", elapsedMs: Date.now() - startedAt };
    if (changedCount || once || forceEmit) emit(report);
    return report;
  } catch (error) {
    const report = { type: "skill-repository", ok: false, portableRoot, canonicalRoot, error: error?.stack || error?.message || String(error), elapsedMs: Date.now() - startedAt };
    emit(report);
    return report;
  } finally {
    running = false;
    if (queued && !stopping) {
      queued = false;
      const nextForceEmit = queuedForceEmit;
      const nextReason = queuedReason;
      queuedForceEmit = false;
      queuedReason = "queued";
      setTimeout(() => reconcile(nextForceEmit, nextReason), 50);
    }
  }
}

function closeWatchers() {
  for (const watcher of watchers) {
    try {
      if (typeof watcher === "function") watcher();
      else watcher.close();
    } catch {}
  }
  watchers = [];
}

function scheduleWatcherRefresh() {
  clearTimeout(watchRefreshTimer);
  watchRefreshTimer = setTimeout(() => {
    watchRefreshTimer = null;
    startWatchers();
  }, watchDebounceMs * 3);
  watchRefreshTimer.unref?.();
}

function scheduleWatchedReconcile(root, filename) {
  if (stopping) return;
  const relative = String(filename || "").replace(/\\/g, "/");
  if (relative.includes(".skill-import-") || relative.includes(".skill-backup-")) return;
  if (path.resolve(root) === path.resolve(canonicalRoot) && Date.now() < suppressCanonicalWatchUntil) return;
  clearTimeout(watchTimer);
  watchTimer = setTimeout(() => {
    watchTimer = null;
    reconcile(true, "watch");
  }, watchDebounceMs);
  watchTimer.unref?.();
}

async function collectWatchDirectories(root) {
  const dirs = [];
  const queue = [{ dir: root, depth: 0 }];
  while (queue.length) {
    const current = queue.shift();
    if (!current || current.depth > 6) continue;
    let entries;
    try {
      entries = await fsp.readdir(current.dir, { withFileTypes: true });
    } catch {
      continue;
    }
    dirs.push(current.dir);
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".") || excludedDirectories.has(entry.name)) continue;
      queue.push({ dir: path.join(current.dir, entry.name), depth: current.depth + 1 });
    }
  }
  return dirs;
}

async function startWatchers() {
  closeWatchers();
  const roots = [canonicalRoot, ...sources.map((source) => source.root)];
  for (const root of roots) {
    try { await fsp.mkdir(root, { recursive: true }); } catch {}
    if (process.platform === "win32") {
      const listener = (current, previous) => {
        if (current.mtimeMs === previous.mtimeMs && current.size === previous.size) return;
        scheduleWatchedReconcile(root, "");
      };
      fs.watchFile(root, { interval: watchStatIntervalMs, persistent: false }, listener);
      watchers.push(() => fs.unwatchFile(root, listener));
      continue;
    }
    for (const dir of await collectWatchDirectories(root)) {
      try {
        watchers.push(fs.watch(dir, (_event, filename) => {
          scheduleWatchedReconcile(root, filename);
          scheduleWatcherRefresh();
        }));
      } catch {}
    }
  }
}

process.on("SIGTERM", () => { stopping = true; clearTimeout(watchTimer); clearTimeout(watchRefreshTimer); closeWatchers(); process.exit(0); });
process.on("SIGINT", () => { stopping = true; clearTimeout(watchTimer); clearTimeout(watchRefreshTimer); closeWatchers(); process.exit(0); });

reconcile(true, "startup").then(async () => {
  if (once) return;
  await startWatchers();
  const timer = setInterval(() => { if (!stopping) reconcile(false, "fallback"); }, intervalMs);
  timer.unref?.();
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    if (String(chunk).split(/\r?\n/).some((line) => line.trim() === "reconcile")) reconcile(true, "requested");
  });
  process.stdin.resume();
});
