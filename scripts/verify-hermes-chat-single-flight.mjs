import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const mainPath = path.join(root, "src", "openclaw-shell-app", "dist", "main", "index.js");
const rendererPath = path.join(root, "src", "openclaw-shell-app", "dist", "assets", "assets", "main-DIeui7ZO.js");
const main = fs.readFileSync(mainPath, "utf8");
const renderer = fs.readFileSync(rendererPath, "utf8");

const failures = [];
function requireMarker(source, marker, label) {
  if (!source.includes(marker)) failures.push(`${label}: missing ${marker}`);
}

requireMarker(main, "this.chatSessionTasks", "main-process session lock");
requireMarker(main, "manager.chatSessionTasks.get(sessionId)", "main-process duplicate rejection");
requireMarker(main, "taskId: options.taskId || \"\"", "task-scoped progress event");
requireMarker(renderer, "hermesPendingMessages.value.length >= 3", "bounded pending messages");
requireMarker(renderer, "payload.taskId !== hermesActiveTaskId.value", "stale progress rejection");
requireMarker(renderer, "hermesPendingMessages: hermesPendingMessages.value.slice(0, 3)", "pending-message persistence");
requireMarker(renderer, 'stage === "waiting" && previousStage === "waiting"', "in-place waiting progress update");

const sendStart = renderer.indexOf("async function sendHermesMessage");
const sendEnd = renderer.indexOf("async function sendCollaborativeMessage", sendStart);
const sendBlock = sendStart >= 0 && sendEnd > sendStart ? renderer.slice(sendStart, sendEnd) : "";
const localEchoAt = sendBlock.indexOf("hermesMessages.value = [...hermesMessages.value");
const busyCheckAt = sendBlock.indexOf("if (hermesSending.value)");
if (localEchoAt < 0 || busyCheckAt < 0 || localEchoAt > busyCheckAt) {
  failures.push("Hermes user message must be appended before the asynchronous busy check");
}
if (!sendBlock.includes("drainHermesPendingMessages();")) failures.push("Hermes pending messages are not drained after completion");

const backgroundStart = renderer.indexOf("async function runHermesChatBackground");
const backgroundEnd = renderer.indexOf("function upsertHermesProgress", backgroundStart);
const backgroundBlock = backgroundStart >= 0 && backgroundEnd > backgroundStart ? renderer.slice(backgroundStart, backgroundEnd) : "";
if (backgroundBlock.includes("const waitPromise = waitForHermesChatResult")) {
  failures.push("Result listener is allocated before the main process accepts the task");
}
if (!backgroundBlock.includes("return await waitForHermesChatResult(taskId)")) {
  failures.push("Accepted Hermes task does not wait for its task-scoped result");
}

console.log(JSON.stringify({ ok: failures.length === 0, failures }, null, 2));
if (failures.length) process.exit(1);
