import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const shellRoot = path.join(projectRoot, "src", "openclaw-shell-app");
const files = {
  main: path.join(shellRoot, "dist", "main", "index.js"),
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
  ["main", "OpenClaw skills mirrored to Hermes", "syncOpenClawSkillsToHermes"],
  ["main", "OpenClaw model bridge status", "modelBridgeReady"],
  ["main", "OpenAI-compatible provider mapping", "openai-api"],
  ["main", "Portable OpenClaw config path rewrite", "codex-portable-openclaw-config-rewrite"],
  ["preload", "Hermes start API", "ipcStartHermes"],
  ["preload", "Hermes status API", "ipcGetHermesStatus"],
  ["preload", "Hermes chat API", "ipcHermesChat"],
  ["preload", "Hermes skill sync API", "ipcSyncHermesSkills"],
  ["renderer", "Original OpenClaw navigation", "AI会话"],
  ["renderer", "Home Hermes console", "Hermes Agent 协同控制台"],
  ["renderer", "Shared model config copy", "当前应用的模型会同时供 OpenClaw 与 Hermes 使用"],
  ["renderer", "Model editing form", "编辑模型配置"],
  ["renderer", "Hermes chat mode", "Hermes Agent 会话"],
  ["renderer", "Collaborative chat mode", "OpenClaw / Hermes 协同会话"],
  ["renderer", "Hermes chat persistence", "uclaw_hermes_chat_state"],
  ["renderer", "Hermes skill sync UI", "同步到 Hermes"],
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
console.log(JSON.stringify({
  ok: failed.length === 0,
  checkedAt: new Date().toISOString(),
  passed: results.length - failed.length,
  total: results.length,
  failed,
  results
}, null, 2));

if (failed.length) process.exit(1);
