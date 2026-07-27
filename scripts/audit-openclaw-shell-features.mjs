import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const shellRoot = path.join(projectRoot, "src", "openclaw-shell-app");
const files = {
  main: path.join(shellRoot, "dist", "main", "index.js"),
  skillRepository: path.join(shellRoot, "dist", "main", "skill-repository-worker.cjs"),
  preload: path.join(shellRoot, "dist", "preload", "index.js"),
  renderer: path.join(shellRoot, "dist", "assets", "assets", "main-DIeui7ZO.js"),
  styles: path.join(shellRoot, "dist", "assets", "main-CAx6YYDG.css"),
  html: path.join(shellRoot, "dist", "assets", "main", "index.html"),
  hermesFrame: path.join(shellRoot, "dist", "assets", "hermes-frame.html")
};

function read(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${path.relative(projectRoot, filePath)}`);
  return fs.readFileSync(filePath, "utf8");
}

const source = Object.fromEntries(Object.entries(files).map(([key, filePath]) => [key, read(filePath)]));

const checks = [
  ["main", "Hermes manager", "class HermesManager"],
  ["main", "Hermes chat IPC", "\"hermes:chat\""],
  ["main", "OpenClaw skills shared with Hermes", "syncOpenClawSkillsToHermes"],
  ["main", "OpenClaw model bridge status", "modelBridgeReady"],
  ["main", "OpenAI-compatible provider mapping", "openai-api"],
  ["main", "Portable OpenClaw config path rewrite", "codex-portable-openclaw-config-rewrite"],
  ["main", "Clash fake-IP web fetch compatibility", "allowRfc2544BenchmarkRange"],
  ["main", "Unavailable web search disabled", "configuredSearchProvider"],
  ["main", "Hermes allowlist warning localization", "formatHermesUserFacingLog"],
  ["main", "Portable skill repository lifecycle", "startPortableSkillRepositoryWorker"],
  ["main", "Deferred skill repository startup", "setTimeout(() => {\n    startPortableSkillRepositoryWorker();\n  }, 12e3)"],
  ["main", "Graceful portable process shutdown", "shutdownComplete = true"],
  ["main", "Non-blocking Hermes memory sampling", "child_process.spawn(\"tasklist\""],
  ["main", "Persistent Hermes chat skill cache", "hermes-chat-skills.json"],
  ["skillRepository", "Canonical root skill repository", "const canonicalRoot = path.join(portableRoot, \"skills\")"],
  ["skillRepository", "OpenClaw native skill import", "openclaw-managed"],
  ["skillRepository", "Hermes generated skill import", "hermes-local"],
  ["skillRepository", "User modification preservation", "canonical-copy-modified"],
  ["skillRepository", "Event-triggered repository sync", "scheduleWatchedReconcile"],
  ["skillRepository", "Low-frequency repository fallback", "10 * 60 * 1000"],
  ["main", "OpenClaw session skill snapshot refresh", "invalidateOpenClawSessionSkillSnapshots"],
  ["main", "Portable Python exposed to OpenClaw skills", "OPENCLAW_PORTABLE_ROOT: getAppRoot()"],
  ["main", "Hermes environment uses live port checks", "return await this.getStatus({ fast: false })"],
  ["main", "Portable skill metadata parser", "skill-metadata.cjs"],
  ["main", "Agent chat skill command catalog", "list-chat-skills"],
  ["main", "Hermes official skill invocation bridge", "build_skill_invocation_message"],
  ["preload", "Hermes start API", "ipcStartHermes"],
  ["preload", "Hermes status API", "ipcGetHermesStatus"],
  ["preload", "Hermes chat API", "ipcHermesChat"],
  ["preload", "Hermes skill sync API", "ipcSyncHermesSkills"],
  ["preload", "Chat skill catalog API", "ipcListChatSkills"],
  ["renderer", "Original OpenClaw navigation", "AI会话"],
  ["renderer", "Home Hermes console", "Hermes Agent 协同控制台"],
  ["renderer", "Shared model config copy", "当前应用的模型会同时供 OpenClaw 与 Hermes 使用"],
  ["renderer", "Model editing form", "编辑模型配置"],
  ["renderer", "Hermes chat mode", "Hermes Agent 会话"],
  ["renderer", "Collaborative chat mode", "OpenClaw / Hermes 协同会话"],
  ["renderer", "Hermes chat persistence", "uclaw_hermes_chat_state"],
  ["renderer", "Hermes skill sync UI", "同步到 Hermes"],
  ["renderer", "Chat /skill picker", "skill-command-menu"],
  ["renderer", "Deferred multi-skill selection", "selectedSkills.value"],
  ["renderer", "Hermes progress shown inside chat", "upsertHermesProgress(text, payload?.stage || \"working\", \"running\")"],
  ["renderer", "Compatibility-aware collaborative skill routing", "sendCollaborativeSkillMessage"],
  ["styles", "Hermes chat topbar overflow guard", ".hermes-chat-status"],
  ["styles", "Scrollable home page", ".home-home-view[data-v-16de922d]"],
  ["styles", "Offline document overflow reset", "#app {\n  width: 100%;"],
  ["styles", "Main workspace flex width containment", ".main-app-main-wrapper {\n  flex: 1 1 0;\n  height: calc(100vh - 38px);\n  min-height: 0;\n  width: 0;"],
  ["styles", "AI chat viewport containment", "height: calc(100vh - 80px);\n  flex: 1 1 auto;"],
  ["renderer", "Hermes environment checks", "Hermes 模型桥接"],
  ["styles", "Home Hermes styles", "home-hermes-card"],
  ["styles", "Hermes chat styles", "hermes-chat-status"],
  ["styles", "Model edit styles", "model-edit-form"],
  ["html", "Original shell HTML", "../assets/main-DIeui7ZO.js"],
  ["hermesFrame", "Hermes embedded frame", "target"]
];

const results = checks.map(([fileKey, name, marker]) => ({
  name,
  file: path.relative(projectRoot, files[fileKey]),
  ok: source[fileKey].includes(marker),
  marker
}));

const failed = results.filter((item) => !item.ok);
if (source.main.includes('execFileSync("tasklist"')) failed.push({ name: "Synchronous tasklist regression", file: path.relative(projectRoot, files.main), ok: false, marker: 'execFileSync("tasklist")' });
if (source.styles.includes("div {\n  transition: all")) failed.push({ name: "Global div transition regression", file: path.relative(projectRoot, files.styles), ok: false, marker: "div transition: all" });
if (source.renderer.includes("function scrollToBottom(duration = 300)")) failed.push({ name: "Chat auto-scroll animation regression", file: path.relative(projectRoot, files.renderer), ok: false, marker: "animated scrollToBottom" });
if (!source.styles.includes(".home-home-view[data-v-16de922d] > * {\n  flex-shrink: 0;")) failed.push({ name: "Home cards may shrink instead of scroll", file: path.relative(projectRoot, files.styles), ok: false, marker: "home child flex-shrink: 0" });
if (!source.styles.includes("overflow-y: auto;\n  overflow-x: hidden;\n  display: flex;\n  flex-direction: column;")) failed.push({ name: "Main page scrolling missing", file: path.relative(projectRoot, files.styles), ok: false, marker: "main page overflow-y: auto" });
console.log(JSON.stringify({
  ok: failed.length === 0,
  checkedAt: new Date().toISOString(),
  passed: results.length - failed.length,
  total: results.length,
  failed,
  results
}, null, 2));

if (failed.length) process.exit(1);
