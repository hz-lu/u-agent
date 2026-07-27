import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const rendererPath = path.join(root, "src", "openclaw-shell-app", "dist", "assets", "assets", "main-DIeui7ZO.js");
const source = fs.readFileSync(rendererPath, "utf8");
const failures = [];

const scrollStart = source.indexOf("function scrollToBottom(force = false)");
const scrollEnd = source.indexOf("function handleScroll()", scrollStart);
const scrollBlock = scrollStart >= 0 && scrollEnd > scrollStart ? source.slice(scrollStart, scrollEnd) : "";
const guardCount = (scrollBlock.match(/if \(!force && !autoScroll\.value\) return;/g) || []).length;
if (guardCount !== 2) failures.push("scrollToBottom must guard both scheduling and nextTick execution");
if (!scrollBlock.includes("el.scrollTop = el.scrollHeight")) failures.push("scrollToBottom no longer updates the message viewport");

const stateStart = source.indexOf("function handleHermesStateEvent()");
const stateEnd = source.indexOf("function handleActiveModelChanged()", stateStart);
const stateBlock = stateStart >= 0 && stateEnd > stateStart ? source.slice(stateStart, stateEnd) : "";
if (!stateBlock.includes("scrollToBottom()") || stateBlock.includes("scrollToBottom(true)")) {
  failures.push("Hermes persistence events must respect the user's current scroll position");
}
if (source.includes("scrollToBottom(0)")) failures.push("legacy duration-style scrollToBottom(0) call remains");
if (!source.includes("store.sendMessage(buildOpenClawSkillRequest(text2, skills), attachments);\n          autoScroll.value = true;\n          scrollToBottom(true);")) {
  failures.push("explicit OpenClaw sends must opt back into bottom-following");
}

console.log(JSON.stringify({ ok: failures.length === 0, failures }, null, 2));
if (failures.length) process.exit(1);
