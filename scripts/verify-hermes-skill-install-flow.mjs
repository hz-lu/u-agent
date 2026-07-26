import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertMainFlow(relativePath) {
  const source = read(relativePath);
  const chatIndex = source.indexOf("async chat(options = {})");
  assert(chatIndex >= 0, `${relativePath}: missing Hermes chat method`);
  const installIndex = source.indexOf("const skillInstallRequest = this.detectPortableSkillInstallRequest(message);", chatIndex);
  const runtimeIndex = source.indexOf("const hermesCommand = this.getHermesCommand([]);", chatIndex);
  const startIndex = source.indexOf("this.start({ open: false })", chatIndex);
  assert(installIndex >= 0, `${relativePath}: missing skill install detection`);
  assert(runtimeIndex >= 0, `${relativePath}: missing Hermes runtime check`);
  assert(startIndex >= 0, `${relativePath}: missing Hermes auto-start path`);
  assert(runtimeIndex < installIndex, `${relativePath}: skill install must not bypass Hermes runtime validation`);
  assert(startIndex < installIndex, `${relativePath}: skill install must not bypass Hermes auto-start`);
  assert(source.includes("normalizeGitHubSkillUrl"), `${relativePath}: missing GitHub skill URL normalization`);
  assert(source.includes("subdir"), `${relativePath}: GitHub /tree subdir should be preserved for installation`);
}

for (const relativePath of [
  "src/openclaw-shell-app/dist/main/index.js",
  "dist/main/index.js",
  "dist/main/index.cjs"
]) {
  assertMainFlow(relativePath);
}

const restore = read("scripts/restore-openclaw-shell.mjs");
assert(restore.includes('path.join(projectRoot, "src", "openclaw-shell-app")'), "scripts/restore-openclaw-shell.mjs: restore must deploy source containing GitHub skill URL normalization");
assert(!restore.includes("function patchHermesSkillBridge"), "scripts/restore-openclaw-shell.mjs: restore must not inject a separate Hermes skill bridge");

console.log("Hermes skill install flow checks passed");
