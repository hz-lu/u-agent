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
  assert(source.includes("submit: { type: Function, required: true }"), `${relativePath}: ChatInput must use an explicit async submit prop`);
  assert(source.includes("if (!result?.accepted) return result"), `${relativePath}: rejected sends must preserve text, attachments, and selected skills`);
  assert(source.includes("function selectChatSkill(skill)"), `${relativePath}: ChatInput must support selecting skills without sending`);
  assert(source.includes("selectedSkills.value = []"), `${relativePath}: accepted sends must clear selected skill tags`);
  assert(source.includes("onCompositionstart") && source.includes("onCompositionend"), `${relativePath}: textarea must wire composition events`);
  assert(source.includes("function previewAttachment(att)"), `${relativePath}: pending attachments need a preview handler`);
  assert(source.includes("onClick: ($event) => previewAttachment(att)"), `${relativePath}: attachment chips must open preview on click`);
  assert(source.includes("lightboxSrc.value = att.preview"), `${relativePath}: image attachment preview must use in-app lightbox instead of opening a new window`);
  assert(source.includes('event.key === "Escape"') && source.includes('document.addEventListener("keydown"'), `${relativePath}: image lightbox must close on Escape`);
  assert(!source.includes("window.open(att.preview"), `${relativePath}: image attachment preview must not rely on window.open(data:)`);
  assert(source.includes("filePath: window.uclaw?.getFilePath(file) || file.path || null"), `${relativePath}: image and file attachments must preserve filePath`);
  assert(source.includes("function normalizeHermesAttachments(attachments = [])"), `${relativePath}: Hermes messages must normalize attachment metadata`);
  assert(source.includes("function buildHermesMessageWithAttachments(content, attachments = [])"), `${relativePath}: Hermes prompt must include attachment context`);
  assert(source.includes("attachments: hermesAttachments"), `${relativePath}: Hermes IPC payload must include attachments`);
  assert(source.includes("await fetchAllSkills();") && source.includes('document.addEventListener("visibilitychange"'), `${relativePath}: skill management must refresh on page/focus events`);
  assert(!source.includes("skillRefreshTimer"), `${relativePath}: skill management must not poll the USB skills directory`);
  assert(!source.includes("setInterval(refreshLocalSkills"), `${relativePath}: skill management must not repeatedly scan skills on a timer`);
  assert(!source.includes("window.uclaw?.reloadGateway?.()"), `${relativePath}: renderer must not issue a second Gateway reload after sync`);
}

function assertMain(relativePath) {
  const source = read(relativePath);
  assert(source.includes("function buildHermesAttachmentContext(attachments = [])"), `${relativePath}: main Hermes chat must build attachment context`);
  assert(source.includes("function materializeHermesAttachment(att, index)"), `${relativePath}: inline pasted attachments must be materialized into portable data`);
  assert(source.includes('path$1.join(getAppRoot(), "data", ".hermes", "uploads")'), `${relativePath}: materialized Hermes attachments must stay inside portable data`);
  assert(source.includes("const attachmentContext = buildHermesAttachmentContext(options.attachments);"), `${relativePath}: Hermes chat must read IPC attachments`);
  assert(source.includes("const effectiveMessage = attachmentContext ? message +"), `${relativePath}: Hermes oneshot prompt must include attachment context`);
  assert(source.includes('const args = ["--oneshot", effectiveMessage];'), `${relativePath}: Hermes CLI must receive attachment-aware message`);
  assert(source.includes("options?.reloadOpenClaw === true"), `${relativePath}: OpenClaw Gateway reload must be opt-in for explicit skill sync/install only`);
  assert(source.includes("openClawReload: options?.reloadOpenClaw === true ? reloadOpenClawSkills() : null"), `${relativePath}: silent environment checks must not reload OpenClaw Gateway`);
  assert(source.includes('child.on("exit", async (code, signal) =>'), `${relativePath}: Hermes chat exit handler must record process signal`);
  assert(source.includes('errorKind: "interrupted"') && source.includes("exitSignal"), `${relativePath}: Hermes signal/code-null exits must be classified as interrupted`);
  assert(source.includes("codex-hermes-chat-readiness-wait") && source.includes("Hermes 正在等待本地 API/Gateway 就绪"), `${relativePath}: Hermes chat must wait for local runtime readiness before oneshot`);
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
assert(restore.includes("reloadOpenClaw === true"), "scripts/restore-openclaw-shell.mjs: restore script must preserve opt-in OpenClaw skill reload");
assert(restore.includes('event.key === "Escape"') && restore.includes('document.addEventListener("keydown"'), "scripts/restore-openclaw-shell.mjs: restore script must preserve Escape-close image preview");
assert(restore.includes('async (code, signal)') && restore.includes("interrupted") && restore.includes("exitSignal"), "scripts/restore-openclaw-shell.mjs: restore script must preserve Hermes interrupted exit classification");
assert(restore.includes("codex-hermes-chat-readiness-wait"), "scripts/restore-openclaw-shell.mjs: restore script must preserve Hermes chat readiness wait");
assert(!restore.includes("skillRefreshTimer"), "scripts/restore-openclaw-shell.mjs: restore script must not restore timer-based skill scanning");

console.log("AI chat skill runtime checks passed");
