import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-runtime-test-"));
const runtimeRoot = path.join(fixtureRoot, "runtime");
const packageRoot = path.join(runtimeRoot, "node_modules", "openclaw");

try {
  fs.mkdirSync(path.join(packageRoot, "dist"), { recursive: true });
  fs.mkdirSync(path.join(packageRoot, "src", "agents", "templates"), { recursive: true });
  fs.symlinkSync(process.execPath, path.join(runtimeRoot, "node"));
  fs.writeFileSync(path.join(runtimeRoot, "openclaw"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
  fs.writeFileSync(path.join(packageRoot, "openclaw.mjs"), "process.exit(0);\n");
  fs.writeFileSync(path.join(packageRoot, "dist", "entry.mjs"), "export {};\n");
  fs.writeFileSync(path.join(packageRoot, "package.json"), `${JSON.stringify({
    name: "openclaw",
    version: "test",
    dependencies: { "highlight.js": "11.11.1" }
  }, null, 2)}\n`);
  for (const name of ["AGENTS.md", "BOOT.md", "BOOTSTRAP.md", "HEARTBEAT.md", "IDENTITY.md", "SOUL.md", "TOOLS.md", "USER.md"]) {
    fs.writeFileSync(path.join(packageRoot, "src", "agents", "templates", name), "test\n");
  }

  const result = spawnSync(process.execPath, [path.join(projectRoot, "scripts", "verify-openclaw-runtime.mjs")], {
    cwd: projectRoot,
    encoding: "utf8",
    env: { ...process.env, AGENT_HUB_ROOT: fixtureRoot }
  });
  const report = JSON.parse(result.stdout);

  assert.equal(result.status, 1, "missing production dependency must fail runtime verification");
  assert.equal(report.runtimeIntegrity.ok, false);
  assert.deepEqual(report.runtimeIntegrity.missingProductionDependencies, [
    { packageName: "highlight.js", requiredVersion: "11.11.1" }
  ]);
  assert.match(report.runtimeIntegrity.errors.join("\n"), /Missing OpenClaw production dependency "highlight\.js"/);
  console.log("OpenClaw production dependency verification test passed");
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
