import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertRenderer(relativePath) {
  const source = read(relativePath);
  assert(source.includes("isComposingInput"), `${relativePath}: ChatInput must track IME composition state`);
  assert(source.includes("e.isComposing") && source.includes("e.keyCode === 229"), `${relativePath}: Enter send must ignore IME/composition confirmation`);
  assert(source.includes("onCompositionstart") && source.includes("onCompositionend"), `${relativePath}: textarea must wire composition events`);
  assert(source.includes("function previewAttachment(att)"), `${relativePath}: pending attachments need a preview handler`);
  assert(source.includes("onClick: ($event) => previewAttachment(att)"), `${relativePath}: attachment chips must open preview on click`);
  assert(source.includes("filePath: window.uclaw?.getFilePath(file) || file.path || null"), `${relativePath}: image and file attachments must preserve filePath`);
  assert(source.includes("function normalizeHermesAttachments(attachments = [])"), `${relativePath}: Hermes messages must normalize attachment metadata`);
  assert(source.includes("function buildHermesMessageWithAttachments(content, attachments = [])"), `${relativePath}: Hermes prompt must include attachment context`);
  assert(source.includes("attachments: hermesAttachments"), `${relativePath}: Hermes IPC payload must include attachments`);
  assert(source.includes("await fetchAllSkills();") && source.includes('document.addEventListener("visibilitychange"'), `${relativePath}: skill management must refresh while the app is open`);
  assert(source.includes("window.uclaw?.reloadGateway?.()"), `${relativePath}: skill sync should request OpenClaw Gateway reload`);
}

function assertMain(relativePath) {
  const source = read(relativePath);
  assert(source.includes("function buildHermesAttachmentContext(attachments = [])"), `${relativePath}: main Hermes chat must build attachment context`);
  assert(source.includes("function materializeHermesAttachment(att, index)"), `${relativePath}: inline pasted attachments must be materialized into portable data`);
  assert(source.includes('path$1.join(getAppRoot(), "data", ".hermes", "uploads")'), `${relativePath}: materialized Hermes attachments must stay inside portable data`);
  assert(source.includes("const attachmentContext = buildHermesAttachmentContext(options.attachments);"), `${relativePath}: Hermes chat must read IPC attachments`);
  assert(source.includes("const effectiveMessage = attachmentContext ? message +"), `${relativePath}: Hermes oneshot prompt must include attachment context`);
  assert(source.includes('const args = ["--oneshot", effectiveMessage];'), `${relativePath}: Hermes CLI must receive attachment-aware message`);
  assert(source.includes("const reload = reloadGateway();") && source.includes("openClawReload: reload"), `${relativePath}: skill sync/install should reload OpenClaw Gateway`);
}

for (const relativePath of [
  "src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js",
  "dist/assets/assets/main-DIeui7ZO.js"
]) {
  assertRenderer(relativePath);
}

for (const relativePath of [
  "src/openclaw-shell-app/dist/main/index.js",
  "dist/main/index.js",
  "dist/main/index.cjs"
]) {
  assertMain(relativePath);
}

const restore = read("scripts/restore-openclaw-shell.mjs");
assert(restore.includes("isComposingInput"), "scripts/restore-openclaw-shell.mjs: restore script must preserve IME-safe send handling");
assert(restore.includes("buildHermesMessageWithAttachments"), "scripts/restore-openclaw-shell.mjs: restore script must preserve Hermes attachment context");
assert(restore.includes("openClawReload"), "scripts/restore-openclaw-shell.mjs: restore script must preserve OpenClaw skill reload feedback");

console.log("AI chat skill runtime checks passed");
