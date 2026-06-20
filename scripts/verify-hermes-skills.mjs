import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { resolvePortableRoot } from "./portable-root.mjs";

const usbRoot = resolvePortableRoot();
const hermesRoot = path.join(usbRoot, "runtime", "HermesPortable");
const dataRoot = path.join(usbRoot, "data", ".hermes");
const sourceRoot = path.join(hermesRoot, "hermes-agent");
const pythonExe = path.join(hermesRoot, "venv", "Scripts", "python.exe");
const skillsRoot = path.join(usbRoot, "skills");
const mirrorRoot = path.join(dataRoot, "skills", "openclaw");
const reportPath = path.join(dataRoot, "reports", "skills", "visibility-last.json");

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function writeJson(filePath, value) {
  mkdirp(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeHermesConfig() {
  mkdirp(dataRoot);
  const yaml = [
    "# Managed by OpenClawPro Agent Hub. Kept inside the USB data/.hermes directory.",
    "memory:",
    "  memory_enabled: true",
    "  user_profile_enabled: true",
    "  memory_char_limit: 2200",
    "  user_char_limit: 1375",
    "  provider: \"\"",
    "skills:",
    "  auto_skill_enabled: true",
    "  external_dirs:",
    `    - ${JSON.stringify(skillsRoot)}`,
    "paths:",
    `  home: ${JSON.stringify(path.join(dataRoot, "home"))}`,
    `  logs: ${JSON.stringify(path.join(dataRoot, "logs"))}`,
    `  memories: ${JSON.stringify(path.join(dataRoot, "memories"))}`,
    `  skills: ${JSON.stringify(path.join(dataRoot, "skills"))}`,
    ""
  ].join("\n");
  fs.writeFileSync(path.join(dataRoot, "config.yaml"), yaml, "utf8");
}

function buildHermesEnv() {
  const home = path.join(dataRoot, "home");
  const cache = path.join(dataRoot, "cache");
  const config = path.join(dataRoot, "config");
  const logs = path.join(dataRoot, "logs");
  const tmp = path.join(dataRoot, "tmp");
  for (const dir of [dataRoot, home, cache, config, logs, tmp, path.join(dataRoot, "skills")]) mkdirp(dir);
  const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") || "Path";
  return {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    XDG_CONFIG_HOME: config,
    XDG_CACHE_HOME: cache,
    HERMES_HOME: dataRoot,
    HERMES_LOG_DIR: logs,
    HERMES_MEMORY_PATH: path.join(dataRoot, "memories"),
    HERMES_SKILLS_PATH: path.join(dataRoot, "skills"),
    HERMES_BROWSER_OPENED: "1",
    PYTHONIOENCODING: "utf-8",
    PYTHONUTF8: "1",
    PIP_CACHE_DIR: path.join(cache, "pip"),
    npm_config_cache: path.join(cache, "npm"),
    TMP: tmp,
    TEMP: tmp,
    [pathKey]: [
      path.join(hermesRoot, "venv", "Scripts"),
      path.join(hermesRoot, "node"),
      path.dirname(pythonExe),
      process.env[pathKey] || ""
    ].join(path.delimiter)
  };
}

function parseSkillName(skillFile, fallback) {
  try {
    const content = fs.readFileSync(skillFile, "utf8");
    const match = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/);
    const frontmatter = match ? match[1] : content.slice(0, 2048);
    const name = frontmatter.match(/^name:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1];
    return (name || fallback).trim();
  } catch {
    return fallback;
  }
}

function safeFileName(value) {
  return String(value || "skill").replace(/[\\/:*?"<>|]/g, "_").trim() || "skill";
}

function skillSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function uniqueName(name, used) {
  let candidate = name;
  let index = 2;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${name}-${index}`;
    index += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

function listOpenClawSkills() {
  const rows = [];
  const config = readJsonSafe(path.join(usbRoot, "data", ".openclaw", "openclaw.json")) || {};
  const entries = config?.skills?.entries || {};
  if (!fs.existsSync(skillsRoot)) return rows;
  for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
    const full = path.join(skillsRoot, entry.name);
    if (entry.isDirectory()) {
      const skillFile = path.join(full, "SKILL.md");
      if (!fs.existsSync(skillFile)) continue;
      const name = parseSkillName(skillFile, entry.name);
      if (entries[name]?.enabled === false || entries[entry.name]?.enabled === false) continue;
      const stat = fs.statSync(skillFile);
      rows.push({ source: full, key: entry.name, name, isDirectory: true, skillMtimeMs: Math.round(stat.mtimeMs) });
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      const key = entry.name.replace(/\.md$/i, "");
      const name = parseSkillName(full, key);
      if (entries[name]?.enabled === false || entries[key]?.enabled === false) continue;
      const stat = fs.statSync(full);
      rows.push({ source: full, key, name, isDirectory: false, skillMtimeMs: Math.round(stat.mtimeMs) });
    }
  }
  return rows;
}

function syncMirror(rows) {
  const manifestPath = path.join(mirrorRoot, ".openclaw_sync_manifest.json");
  const nextManifest = {
    version: 3,
    syncedAt: new Date().toISOString(),
    sourceRoots: [skillsRoot],
    mirrorRoot,
    skills: rows.map(({ source, name, key, skillMtimeMs }) => ({ source, name, key, targetName: safeFileName(key || name), skillMtimeMs }))
  };
  const oldManifest = readJsonSafe(manifestPath);
  const unchanged = !!oldManifest && JSON.stringify({ ...oldManifest, syncedAt: nextManifest.syncedAt }) === JSON.stringify(nextManifest);
  if (unchanged) return { copied: 0, unchanged: true };

  fs.rmSync(mirrorRoot, { recursive: true, force: true });
  mkdirp(mirrorRoot);
  const used = new Set();
  let copied = 0;
  for (const row of rows) {
    const targetName = uniqueName(safeFileName(row.key || row.name), used);
    const manifestRow = nextManifest.skills.find((item) => item.source === row.source);
    if (manifestRow) manifestRow.targetName = targetName;
    const target = path.join(mirrorRoot, targetName);
    if (row.isDirectory) {
      fs.cpSync(row.source, target, {
        recursive: true,
        filter: (source) => {
          const rel = path.relative(row.source, source).replace(/\\/g, "/");
          return !rel.split("/").some((part) => [
            ".git",
            ".github",
            ".hub",
            ".archive",
            "node_modules",
            "__pycache__",
            ".venv",
            "venv",
            "dist",
            "build",
            ".next",
            ".cache"
          ].includes(part));
        }
      });
    } else {
      mkdirp(target);
      fs.copyFileSync(row.source, path.join(target, "SKILL.md"));
    }
    copied += 1;
  }
  writeJson(manifestPath, nextManifest);
  return { copied, unchanged: false };
}

function verifyOfficialVisibility() {
  if (!fs.existsSync(pythonExe)) throw new Error(`missing Python: ${pythonExe}`);
  if (!fs.existsSync(path.join(sourceRoot, "agent", "skill_commands.py"))) {
    throw new Error(`missing Hermes source: ${sourceRoot}`);
  }
  const script = [
    "import json, sys",
    `sys.path.insert(0, ${JSON.stringify(sourceRoot)})`,
    "from agent.skill_commands import reload_skills, get_skill_commands",
    "result = reload_skills()",
    "commands = get_skill_commands()",
    "names = sorted(set((info or {}).get('name') or key.lstrip('/') for key, info in commands.items()))",
    "cmd_keys = sorted(commands.keys())",
    "print(json.dumps({'ok': True, 'reload': result, 'commands': cmd_keys, 'names': names}, ensure_ascii=False))"
  ].join("; ");
  const result = spawnSync(pythonExe, ["-c", script], {
    cwd: dataRoot,
    env: buildHermesEnv(),
    encoding: "utf8",
    windowsHide: true,
    timeout: 45000
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `scan failed: ${result.status}`).trim());
  }
  return JSON.parse(result.stdout.trim());
}

let report;
try {
  writeHermesConfig();
  const rows = listOpenClawSkills();
  const sync = syncMirror(rows);
  const visibility = verifyOfficialVisibility();
  const visible = new Set([...(visibility.names || []), ...(visibility.commands || []).map((cmd) => cmd.replace(/^\//, ""))].map(skillSlug));
  report = {
    ok: true,
    checkedAt: new Date().toISOString(),
    sourceCount: rows.length,
    copied: sync.copied,
    mirroredCount: rows.length,
    visibleCount: visibility.names?.length || 0,
    commandCount: visibility.commands?.length || 0,
    invocationCommand: "",
    invocationLoaded: false,
    invocationStatus: "not-run",
    usageTracked: fs.existsSync(path.join(dataRoot, "skills", ".usage.json")),
    mirrorRoot,
    path: mirrorRoot,
    reportPath,
    sampleCommands: (visibility.commands || []).slice(0, 20),
    missingNames: rows.map((row) => row.name).filter((name) => !visible.has(skillSlug(name))).slice(0, 50),
    unchanged: sync.unchanged
  };
} catch (error) {
  report = {
    ok: false,
    checkedAt: new Date().toISOString(),
    sourceCount: 0,
    mirroredCount: 0,
    visibleCount: 0,
    commandCount: 0,
    usageTracked: fs.existsSync(path.join(dataRoot, "skills", ".usage.json")),
    mirrorRoot,
    path: mirrorRoot,
    reportPath,
    sampleCommands: [],
    missingNames: [],
    error: error instanceof Error ? error.message : String(error)
  };
}

writeJson(reportPath, report);
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
