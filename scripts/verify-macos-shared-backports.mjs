import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function verifyRenderer(relativePath) {
  const source = read(relativePath);
  assert(source.includes("function finishOpenClawResponse(sessionKey)"), `${relativePath}: missing OpenClaw response finalizer`);
  assert(source.includes("scheduleOpenClawHistorySync(sessionKey, { immediate: true })"), `${relativePath}: final responses must refresh Gateway history immediately`);
  assert(source.includes("uclaw-active-model-changed"), `${relativePath}: chat model selection must follow model configuration changes`);
  assert(source.includes("isComposingInput") && source.includes("e.isComposing") && source.includes("e.keyCode === 229"), `${relativePath}: Enter handling must be IME-safe`);
  assert(source.includes("function previewAttachment(att)"), `${relativePath}: attachment chips need preview support`);
  assert(source.includes('event.key === "Escape"'), `${relativePath}: image preview must close on Escape`);
  assert(source.includes("function normalizeHermesAttachments(attachments = [])"), `${relativePath}: Hermes attachments must be normalized`);
  assert(source.includes("attachments: hermesAttachments"), `${relativePath}: Hermes IPC calls must preserve attachments`);
  assert(!source.includes("skillRefreshTimer"), `${relativePath}: skill management must not poll the USB drive`);
}

function verifyMain(relativePath) {
  const source = read(relativePath);
  assert(source.includes("function getOpenClawSkillSourceRoots(config)"), `${relativePath}: missing unified OpenClaw skill roots`);
  assert(source.includes('path$1.join(getAppRoot(), "skills")'), `${relativePath}: root skills directory is not included`);
  assert(source.includes('path$1.join(getDataRoot(), ".openclaw", "workspace", "skills")'), `${relativePath}: workspace skills directory is not included`);
  assert(source.includes('path$1.join(getDataRoot(), ".openclaw", "skills")'), `${relativePath}: managed skills directory is not included`);
  assert(source.includes("options?.reloadOpenClaw !== true"), `${relativePath}: Gateway skill reload must be explicit`);
  assert(source.includes("normalizeGitHubSkillUrl"), `${relativePath}: GitHub skill URL normalization is missing`);
  assert(source.includes("function buildHermesAttachmentContext(attachments = [])"), `${relativePath}: Hermes attachment context is missing`);
  assert(source.includes('path$1.join(getAppRoot(), "data", ".hermes", "uploads")'), `${relativePath}: Hermes uploads must remain in portable data`);
  assert(source.includes("Hermes 正在等待本地 API/Gateway 就绪"), `${relativePath}: Hermes chat readiness wait is missing`);
  assert(source.includes("--oneshot [message redacted]"), `${relativePath}: Hermes prompt must be redacted from logs`);
  assert(source.includes("messageLength: String(effectiveMessage).length") && !source.includes("mode: options.sessionId === \"openclaw-hermes-collab\" ? \"collab\" : \"hermes\", message, provider"), `${relativePath}: Hermes run metadata must not persist the raw prompt`);
  assert(source.includes("verifyEnvironment()") && source.includes('hermes:verifyEnvironment'), `${relativePath}: fast Hermes environment verification is missing`);
  assert(source.includes('child.on("exit", async (code, signal) =>'), `${relativePath}: Hermes exit signals are not handled`);
  assert(source.includes('errorKind: "interrupted"') && source.includes("exitSignal"), `${relativePath}: interrupted Hermes tasks are not classified`);
  assert(source.includes("bak-invalid-model-fields"), `${relativePath}: invalid model config cleanup must create a backup`);
}

for (const relativePath of [
  "src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js",
  "dist/assets/assets/main-DIeui7ZO.js"
]) verifyRenderer(relativePath);

for (const relativePath of [
  "src/openclaw-shell-app/dist/main/index.js",
  "dist/main/index.js",
  "dist/main/index.cjs"
]) verifyMain(relativePath);

for (const relativePath of [
  "src/openclaw-shell-app/dist/preload/index.js",
  "dist/preload/index.js",
  "dist/preload/index.cjs"
]) {
  assert(read(relativePath).includes("ipcVerifyHermesEnvironment"), `${relativePath}: Hermes environment verification is not exposed to the renderer`);
}

const weixinSend = read("extensions/openclaw-weixin/src/messaging/send.ts");
assert(weixinSend.includes("sendMessageWithRetry"), "Weixin outbound messages must retry transient failures");
assert(weixinSend.includes("SEND_RETRY_DELAYS_MS"), "Weixin retry backoff is missing");
assert(weixinSend.includes("opts.timeoutMs ?? 30_000"), "Weixin send timeout must have a portable default");

const weixinProcess = read("extensions/openclaw-weixin/src/messaging/process-message.ts");
assert(weixinProcess.includes("classifyWeixinReplyError"), "Weixin reply errors must be classified for users");

console.log("Shared macOS-discovered backport checks passed");
