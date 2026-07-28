import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const rendererPath = path.join(root, "src", "openclaw-shell-app", "dist", "assets", "assets", "main-DIeui7ZO.js");
const source = fs.readFileSync(rendererPath, "utf8");
const failures = [];

function requireMarker(marker, label) {
  if (!source.includes(marker)) failures.push(`${label}: missing ${marker}`);
}

requireMarker("function isSameAssistantTurn(base, next)", "assistant stage identity");
requireMarker("if (msg.role === \"assistant\" && last?.role === \"assistant\" && isSameAssistantTurn(last, msg))", "same-turn-only merge");
requireMarker("for (let index = result.length - 1; index >= 0; index--)", "tool result owner lookup");
requireMarker("updated.content = textContent;", "snapshot delta replacement");
requireMarker("updated.timestamp = payload.message?.timestamp || Date.now()", "final completion ordering");

const mergeStart = source.indexOf("function _mergeToolResults(msgs)");
const mergeEnd = source.indexOf("function _doPersist", mergeStart);
const mergeBlock = mergeStart >= 0 && mergeEnd > mergeStart ? source.slice(mergeStart, mergeEnd) : "";
for (const obsolete of [
  "if (hasText && hasTools)",
  "if (hasText && !hasTools && lastHasTools)",
  "if (hasText && lastHasTools && !lastHasText)"
]) {
  if (mergeBlock.includes(obsolete)) failures.push(`assistant stages are still merged by shape: ${obsolete}`);
}
if (source.includes("updated.content = (oldMsg.content || \"\") + textContent;")) {
  failures.push("full message snapshots are still appended as deltas");
}

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) return "";
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = bodyStart; index < source.length; index++) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth++;
    if (char === "}" && --depth === 0) return source.slice(start, index + 1);
  }
  return "";
}

if (!failures.length) {
  try {
    const definitions = ["isSameAssistantTurn", "mergeSameAssistantTurn", "_mergeToolResults"].map(extractFunction).join("\n");
    const reconcile = new Function("syncMessageBlocks", `${definitions}; return _mergeToolResults;`)((message) => message);
    const messages = reconcile([
      { id: "a", role: "assistant", content: "阶段一", tools: [{ id: "t1", name: "fetch", output: null }], timestamp: 1, status: "done" },
      { id: "r1", role: "toolResult", content: "结果一", _toolCallId: "t1", timestamp: 2, status: "done" },
      { id: "b", role: "assistant", content: "阶段二", tools: [{ id: "t2", name: "fetch", output: null }], timestamp: 3, status: "done" },
      { id: "r2", role: "toolResult", content: "结果二", _toolCallId: "t2", timestamp: 4, status: "done" },
      { id: "c", role: "assistant", content: "最终结果", tools: [], timestamp: 5, status: "done", _final: true }
    ]);
    if (messages.length !== 3) failures.push(`official assistant stages collapsed: expected 3, got ${messages.length}`);
    if (messages.map((message) => message.content).join("|") !== "阶段一|阶段二|最终结果") failures.push("official assistant stage order changed");
    if (messages[0]?.tools?.[0]?.output !== "结果一" || messages[1]?.tools?.[0]?.output !== "结果二") failures.push("tool results were not attached to their owning assistant stage");
  } catch (error) {
    failures.push(`production reconciliation execution failed: ${error.message}`);
  }
}

console.log(JSON.stringify({ ok: failures.length === 0, failures }, null, 2));
if (failures.length) process.exit(1);
