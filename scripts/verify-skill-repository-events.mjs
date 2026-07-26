import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const workerPath = path.join(projectRoot, "src", "openclaw-shell-app", "dist", "main", "skill-repository-worker.cjs");
const portableRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openclawpro-skill-events-"));
const sourceSkill = path.join(portableRoot, "data", ".openclaw", "skills", "event-skill");
const canonicalSkill = path.join(portableRoot, "skills", "event-skill");

for (let index = 0; index < 300; index += 1) {
  const directory = path.join(portableRoot, "skills", `existing-${String(index).padStart(3, "0")}`);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "SKILL.md"), `---\nname: existing-${index}\ndescription: fixture\n---\n`, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function writeSkill(marker) {
  fs.mkdirSync(sourceSkill, { recursive: true });
  fs.writeFileSync(path.join(sourceSkill, "SKILL.md"), `---\nname: event-skill\ndescription: ${marker}\n---\n\n${marker}\n`, "utf8");
}

const child = spawn(process.execPath, [workerPath, portableRoot], {
  cwd: projectRoot,
  env: {
    ...process.env,
    SKILL_REPOSITORY_INTERVAL_MS: "600000",
    SKILL_REPOSITORY_WATCH_DEBOUNCE_MS: "500",
    SKILL_REPOSITORY_WATCH_STAT_INTERVAL_MS: "500"
  },
  stdio: ["pipe", "pipe", "pipe"],
  windowsHide: true
});

let buffer = "";
let stderr = "";
const reports = [];
const waiters = [];

function acceptReport(report) {
  reports.push(report);
  for (let index = waiters.length - 1; index >= 0; index -= 1) {
    const waiter = waiters[index];
    if (!waiter.predicate(report)) continue;
    waiters.splice(index, 1);
    clearTimeout(waiter.timer);
    waiter.resolve(report);
  }
}

child.stdout.on("data", (chunk) => {
  buffer += Buffer.from(chunk).toString("utf8");
  const lines = buffer.split(/\r?\n/);
  buffer = lines.pop() || "";
  for (const line of lines) {
    if (!line.trim()) continue;
    acceptReport(JSON.parse(line));
  }
});
child.stderr.on("data", (chunk) => {
  stderr = (stderr + Buffer.from(chunk).toString("utf8")).slice(-8000);
});

function waitForReport(predicate, timeoutMs = 10000) {
  const existing = reports.find(predicate);
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve, reject) => {
    const waiter = {
      predicate,
      resolve,
      timer: setTimeout(() => {
        const index = waiters.indexOf(waiter);
        if (index >= 0) waiters.splice(index, 1);
        reject(new Error(`timed out waiting for worker report\n${stderr}`));
      }, timeoutMs)
    };
    waiters.push(waiter);
  });
}

try {
  const startup = await waitForReport((report) => report.trigger === "startup");
  assert(startup.ok, startup.error || "startup reconcile failed");
  assert(startup.canonicalPackageCount === undefined, "live worker startup must not traverse the canonical repository for diagnostics");
  await new Promise((resolve) => setTimeout(resolve, 750));

  const startedAt = Date.now();
  writeSkill("event-v1");
  const watched = await waitForReport((report) => report.trigger === "watch" && report.changedCount > 0);
  assert(watched.ok, watched.error || "watch reconcile failed");
  assert(Date.now() - startedAt < 8000, "watch reconcile did not run promptly");
  assert(fs.existsSync(path.join(canonicalSkill, "SKILL.md")), "watched skill was not imported");
  assert(fs.readFileSync(path.join(canonicalSkill, "SKILL.md"), "utf8").includes("event-v1"), "canonical skill content mismatch");

  console.log(JSON.stringify({
    ok: true,
    startupTrigger: startup.trigger,
    watchTrigger: watched.trigger,
    elapsedMs: Date.now() - startedAt,
    fallbackIntervalMs: 600000
  }, null, 2));
} finally {
  try { child.kill(); } catch {}
  await new Promise((resolve) => setTimeout(resolve, 150));
  fs.rmSync(portableRoot, { recursive: true, force: true });
}
