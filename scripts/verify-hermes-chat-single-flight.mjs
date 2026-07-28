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
requireMarker(renderer, "payload.taskId !== hermesActiveTaskId.value", "stale progress rejection");
requireMarker(renderer, "upsertHermesProgress(text, payload?.stage || \"working\", \"running\")", "in-chat Hermes progress");

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
