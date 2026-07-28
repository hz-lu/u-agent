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
  assert(source.includes('path$1.join(getDataRoot(), ".openclaw", "workspace", "skills")'), `${relativePath}: OpenClaw workspace-installed skills must be included`);
  assert(source.includes('path$1.join(getDataRoot(), ".openclaw", "skills")'), `${relativePath}: OpenClaw managed skills must be included`);
  assert(source.includes("ensurePortableOpenClawSkillConfig"), `${relativePath}: OpenClaw config should be repaired to include portable skills root`);
  assert(source.includes("getOpenClawSkillSourceRoots(config)"), `${relativePath}: skill scan/sync must use shared source roots`);
  assert(source.includes("function ensureOpenClawSkillLimits(config)"), `${relativePath}: missing official OpenClaw skill capacity repair`);
  for (const expected of [
    "maxCandidatesPerRoot: 400",
    "maxSkillsLoadedPerSource: 400",
    "maxSkillsInPrompt: 400",
    "maxSkillsPromptChars: 65536"
  ]) {
    assert(source.includes(expected), `${relativePath}: missing skill limit ${expected}`);
  }
  assert(source.includes("function invalidateOpenClawSessionSkillSnapshots()"), `${relativePath}: missing persisted skill snapshot invalidation`);
  assert(source.includes("Number(report.changedCount) > 0"), `${relativePath}: repository changes must invalidate stale session skill snapshots`);
  assert(source.includes("invalidateOpenClawSessionSkillSnapshots();"), `${relativePath}: skill repository change handler does not invalidate snapshots`);
  const gatewayEnv = source.split("function getGatewayEnv()")[1]?.split("function ")[0] || "";
  assert(gatewayEnv.includes("ensurePortableOpenClawSkillConfig();"), `${relativePath}: Gateway startup must repair portable skill config`);
  assert(gatewayEnv.includes("invalidateOpenClawSessionSkillSnapshots();"), `${relativePath}: Gateway startup must invalidate stale skill snapshots before the first chat`);
  assert(
    gatewayEnv.indexOf("invalidateOpenClawSessionSkillSnapshots();") > gatewayEnv.indexOf("ensurePortableOpenClawSkillConfig();"),
    `${relativePath}: skill snapshot invalidation must run after portable skill config repair`
  );
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
assert(restore.includes('path.join(projectRoot, "src", "openclaw-shell-app")'), "scripts/restore-openclaw-shell.mjs: restore must deploy source containing skill sync behavior");
assert(!restore.includes("function patchHermesSkillManagement"), "scripts/restore-openclaw-shell.mjs: restore must not patch skill management onto a baseline bundle");

console.log("OpenClaw chat and skill sync checks passed");
