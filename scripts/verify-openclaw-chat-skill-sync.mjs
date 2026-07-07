import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertRendererChatSync(relativePath) {
  const source = read(relativePath);
  assert(source.includes("function scheduleOpenClawHistorySync(sessionKey, options = {})"), `${relativePath}: OpenClaw history sync should accept options`);
  assert(source.includes("options?.immediate === true"), `${relativePath}: OpenClaw final sync should support immediate refresh`);
  assert(source.includes("function finishOpenClawResponse(sessionKey)"), `${relativePath}: missing shared OpenClaw response finalizer`);
  assert(source.includes("scheduleOpenClawHistorySync(sessionKey, { immediate: true })"), `${relativePath}: finalizer must force Gateway history refresh`);
  assert(source.includes("finishOpenClawResponse(sk);"), `${relativePath}: final/done events must use forced history refresh`);
}

function assertMainSkillRoots(relativePath) {
  const source = read(relativePath);
  assert(source.includes("function getOpenClawSkillSourceRoots(config)"), `${relativePath}: missing shared OpenClaw skill source root resolver`);
  assert(source.includes('path$1.join(getAppRoot(), "skills")'), `${relativePath}: root skills directory must always be included`);
  assert(source.includes("getOpenClawSkillSourceRoots(config)"), `${relativePath}: skill scan/sync must use shared source roots`);
}

for (const relativePath of [
  "src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js",
  "dist/assets/assets/main-DIeui7ZO.js"
]) {
  assertRendererChatSync(relativePath);
}

for (const relativePath of [
  "src/openclaw-shell-app/dist/main/index.js",
  "dist/main/index.js",
  "dist/main/index.cjs"
]) {
  assertMainSkillRoots(relativePath);
}

const restore = read("scripts/restore-openclaw-shell.mjs");
assert(restore.includes("function getOpenClawSkillSourceRoots(config)"), "scripts/restore-openclaw-shell.mjs: restore script must preserve root skill source scanning");
assert(restore.includes("scheduleOpenClawHistorySync(sessionKey, { immediate: true })"), "scripts/restore-openclaw-shell.mjs: restore script must preserve final history refresh");

console.log("OpenClaw chat and skill sync checks passed");
