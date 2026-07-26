import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const workerPath = path.join(
  projectRoot,
  "src",
  "openclaw-shell-app",
  "dist",
  "main",
  "skill-repository-worker.cjs"
);
const mainPath = path.join(
  projectRoot,
  "src",
  "openclaw-shell-app",
  "dist",
  "main",
  "index.js"
);
const buildPath = path.join(projectRoot, "scripts", "build-openclaw-shell-app.mjs");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "uclaw-skill-repository-"));

function writeSkill(relativeRoot, name, description = name) {
  const target = path.join(tempRoot, relativeRoot, name, "SKILL.md");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(
    target,
    `---\nname: ${name}\ndescription: ${description}\n---\n`,
    "utf8"
  );
  return target;
}

function runWorker() {
  const result = spawnSync(process.execPath, [workerPath, tempRoot, "--once"], {
    cwd: projectRoot,
    encoding: "utf8",
    env: { ...process.env, SKILL_REPOSITORY_FALLBACK_MS: "300000" }
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const reportLine = result.stdout
    .trim()
    .split(/\r?\n/)
    .reverse()
    .find((line) => line.trim().startsWith("{"));
  assert(reportLine, "worker must emit a JSON reconciliation report");
  const report = JSON.parse(reportLine);
  assert.equal(report.ok, true, report.error || "worker report failed");
  return report;
}

function runQueuedWorkerCommands() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [workerPath, tempRoot], {
      cwd: projectRoot,
      encoding: "utf8",
      env: { ...process.env, SKILL_REPOSITORY_FALLBACK_MS: "300000" },
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let reports = 0;
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`expected two queued reconciliation reports, received ${reports}`));
    }, 3000);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      const lines = stdout.split(/\r?\n/);
      stdout = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const report = JSON.parse(line);
        if (report.type === "skill-repository" && report.ok) reports += 1;
      }
      if (reports >= 2) {
        clearTimeout(timer);
        child.kill("SIGTERM");
        resolve(reports);
      }
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.stdin.write("reconcile\nreconcile\n");
  });
}

try {
  writeSkill("data/.openclaw/skills", "openclaw-made");
  writeSkill("data/.openclaw/workspace/skills", "workspace-made");
  writeSkill("data/.hermes/skills", "hermes-made");

  const first = runWorker();
  assert.equal(first.changes.added.length, 3);
  assert.equal(first.changedCount, 3);
  for (const name of ["openclaw-made", "workspace-made", "hermes-made"]) {
    assert(fs.existsSync(path.join(tempRoot, "skills", name, "SKILL.md")));
  }

  const second = runWorker();
  assert.equal(second.changedCount, 0);
  assert.deepEqual(second.changes.conflicts, []);
  assert.equal(await runQueuedWorkerCommands(), 2);

  const canonical = path.join(tempRoot, "skills", "openclaw-made", "SKILL.md");
  const userEditedText = `${fs.readFileSync(canonical, "utf8")}\nUser edit must survive.\n`;
  fs.writeFileSync(canonical, userEditedText, "utf8");
  writeSkill("data/.openclaw/skills", "openclaw-made", "updated internal copy");

  const conflict = runWorker();
  assert.equal(conflict.changes.conflicts.length, 1);
  assert.equal(fs.readFileSync(canonical, "utf8"), userEditedText);
  const importedAs = conflict.changes.conflicts[0].importedAs;
  assert(importedAs && importedAs !== "openclaw-made");
  assert(fs.existsSync(path.join(tempRoot, "skills", importedAs, "SKILL.md")));

  const mainSource = fs.readFileSync(mainPath, "utf8");
  const scanHandler = mainSource.split('electron.ipcMain.handle("scan-local-skills"')[1]
    ?.split('electron.ipcMain.handle("toggle-skill"')[0] || "";
  assert(mainSource.includes("requestPortableSkillRepositoryReconcile"));
  assert(mainSource.includes("SKILL_REPOSITORY_FALLBACK_MS"));
  assert(!mainSource.includes("SKILL_REPOSITORY_INTERVAL_MS"));
  assert(!scanHandler.includes("readdirSync"));
  assert(!scanHandler.includes("cpSync"));

  const buildSource = fs.readFileSync(buildPath, "utf8");
  assert(buildSource.includes('path.join(sourceDist, "main", "skill-metadata.cjs")'));
  assert(buildSource.includes('path.join(sourceDist, "main", "skill-repository-worker.cjs")'));

  console.log("Portable skill repository checks passed");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
