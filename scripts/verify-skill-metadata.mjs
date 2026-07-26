import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(import.meta.dirname, "..");
const metadata = require(path.join(projectRoot, "src", "openclaw-shell-app", "dist", "main", "skill-metadata.cjs"));
const root = fs.mkdtempSync(path.join(os.tmpdir(), "openclawpro-skill-metadata-"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function writeSkill(relative, content) {
  const directory = path.join(root, relative);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "SKILL.md"), content, "utf8");
}

try {
  writeSkill("literal", `---\nname: literal\ndescription: |\n  First line.\n  Second line.\n---\n`);
  writeSkill("folded", `---\nname: folded\ndescription: >-\n  First folded line.\n  Second folded line.\n---\n`);
  writeSkill("category/nested", `---\nname: nested\n---\n# Nested\n\nUseful body description for the nested skill.\n`);
  writeSkill("quoted", `---\nname: "quoted"\ndescription: "Quoted description"\n---\n`);
  fs.mkdirSync(path.join(root, "references"), { recursive: true });

  const discovery = metadata.discoverSkillPackages(root);
  const byName = new Map(discovery.packages.map((item) => [item.meta?.name, item]));
  assert(discovery.packages.length === 4, `expected 4 packages, got ${discovery.packages.length}`);
  assert(byName.get("literal")?.meta.description === "First line.\nSecond line.", "literal YAML block was not parsed");
  assert(byName.get("folded")?.meta.description === "First folded line. Second folded line.", "folded YAML block was not parsed");
  assert(byName.get("nested")?.meta.description === "Useful body description for the nested skill.", "body fallback was not parsed");
  assert(byName.get("quoted")?.meta.description === "Quoted description", "quoted YAML scalar was not parsed");
  assert(discovery.invalidDirectories.some((item) => item.name === "references"), "invalid top-level directory was not reported");
  const sessions = {
    "agent:main:main": {
      sessionId: "keep-session-id",
      updatedAt: 123,
      skillsSnapshot: { version: 0, skills: [{ name: "stale" }] },
      status: "done"
    }
  };
  assert(metadata.stripSessionSkillSnapshots(sessions) === 1, "stale session skill snapshot was not removed");
  assert(!sessions["agent:main:main"].skillsSnapshot, "skill snapshot still exists");
  assert(sessions["agent:main:main"].sessionId === "keep-session-id" && sessions["agent:main:main"].status === "done", "session history metadata was changed");
  const worker = spawnSync(process.execPath, [path.join(projectRoot, "src", "openclaw-shell-app", "dist", "main", "skill-metadata.cjs"), root], { encoding: "utf8", windowsHide: true, timeout: 30000 });
  assert(worker.status === 0, worker.stderr || `metadata worker exited ${worker.status}`);
  const workerResult = JSON.parse(worker.stdout.trim());
  assert(workerResult.ok && workerResult.packages.length === 4, "metadata worker did not return the discovered packages");
  console.log(JSON.stringify({ ok: true, packages: discovery.packages.map((item) => ({ relativeName: item.relativeName, name: item.meta?.name, description: item.meta?.description })), invalidDirectories: discovery.invalidDirectories }, null, 2));
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
