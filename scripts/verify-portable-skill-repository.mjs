import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const worker = path.join(projectRoot, "src", "openclaw-shell-app", "dist", "main", "skill-repository-worker.cjs");
const portableRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openclawpro-skill-repository-"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function writeSkill(directory, name, marker) {
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "SKILL.md"), `---\nname: ${name}\ndescription: ${marker}\n---\n\n${marker}\n`, "utf8");
  fs.writeFileSync(path.join(directory, "payload.txt"), marker, "utf8");
}

function runWorker() {
  const result = spawnSync(process.execPath, [worker, portableRoot, "--once"], {
    cwd: projectRoot,
    encoding: "utf8",
    windowsHide: true,
    timeout: 30000
  });
  assert(result.status === 0, result.stderr || result.stdout || `worker exited ${result.status}`);
  const line = result.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1);
  const report = JSON.parse(line || "{}");
  assert(report.ok, report.error || "worker report failed");
  return report;
}

function readMarker(directory) {
  return fs.readFileSync(path.join(directory, "payload.txt"), "utf8");
}

try {
  const canonical = path.join(portableRoot, "skills");
  const openClawManaged = path.join(portableRoot, "data", ".openclaw", "skills");
  const openClawWorkspace = path.join(portableRoot, "data", ".openclaw", "workspace", "skills");
  const hermesLocal = path.join(portableRoot, "data", ".hermes", "skills");

  writeSkill(path.join(canonical, "manual"), "manual", "manual-root");
  writeSkill(path.join(canonical, "categories", "nested-manual"), "nested-manual", "nested-manual-root");
  writeSkill(path.join(openClawManaged, "native"), "native", "openclaw-v1");
  writeSkill(path.join(openClawWorkspace, "manual"), "manual-workspace", "openclaw-collision");
  writeSkill(path.join(hermesLocal, "generated", "grown"), "grown", "hermes-v1");

  const first = runWorker();
  assert(first.canonicalPackageCount === 5, `nested canonical package count mismatch: ${first.canonicalPackageCount}`);
  assert(readMarker(path.join(canonical, "manual")) === "manual-root", "manual root skill was overwritten");
  assert(readMarker(path.join(canonical, "categories", "nested-manual")) === "nested-manual-root", "nested manual root skill was overwritten");
  assert(readMarker(path.join(canonical, "native")) === "openclaw-v1", "OpenClaw managed skill was not imported");
  assert(readMarker(path.join(canonical, "grown")) === "hermes-v1", "Hermes generated skill was not imported");
  assert(readMarker(path.join(canonical, "manual-openclaw")) === "openclaw-collision", "name collision was not isolated");

  writeSkill(path.join(openClawManaged, "native"), "native", "openclaw-v2-longer");
  const second = runWorker();
  assert(readMarker(path.join(canonical, "native")) === "openclaw-v2-longer", "OpenClaw update was not propagated");

  fs.writeFileSync(path.join(canonical, "grown", "payload.txt"), "user-edited", "utf8");
  fs.rmSync(path.join(hermesLocal, "generated", "grown"), { recursive: true, force: true });
  fs.rmSync(path.join(openClawManaged, "native"), { recursive: true, force: true });
  const third = runWorker();
  assert(!fs.existsSync(path.join(canonical, "native")), "unmodified canonical copy was not removed after source deletion");
  assert(readMarker(path.join(canonical, "grown")) === "user-edited", "user-modified canonical skill was deleted");
  assert(readMarker(path.join(canonical, "manual")) === "manual-root", "manual skill changed during reconciliation");

  console.log(JSON.stringify({
    ok: true,
    portableRoot,
    first: { changedCount: first.changedCount, changes: first.changes },
    second: { changedCount: second.changedCount, changes: second.changes },
    third: { changedCount: third.changedCount, changes: third.changes },
    canonicalSkills: fs.readdirSync(canonical).filter((name) => !name.startsWith("."))
  }, null, 2));
} finally {
  fs.rmSync(portableRoot, { recursive: true, force: true });
}
