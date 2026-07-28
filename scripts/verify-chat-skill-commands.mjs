import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const projectRoot = path.resolve(import.meta.dirname, "..");
const sourceRoot = path.join(projectRoot, "src", "openclaw-shell-app", "dist");
const routingPath = path.join(sourceRoot, "main", "chat-skill-routing.cjs");
const mainPath = path.join(sourceRoot, "main", "index.js");
const preloadPath = path.join(sourceRoot, "preload", "index.js");
const rendererPath = path.join(sourceRoot, "assets", "assets", "main-DIeui7ZO.js");
const require = createRequire(import.meta.url);

const {
  buildOpenClawSkillMessage,
  normalizeSelectedSkills,
  parseOpenClawSkillMessage,
  routeCompleteSkillSet
} = require(routingPath);

const selected = [
  { id: "pkg/a", name: "skill-a", command: "/skill skill-a" },
  { id: "pkg/b", name: "skill-b", command: "/skill skill-b" },
  { id: "pkg/a-copy", name: "skill-a", command: "/skill skill-a" }
];
assert.deepEqual(
  normalizeSelectedSkills(selected).map((item) => item.name),
  ["skill-a", "skill-b"]
);

const openClawBoth = [
  { name: "skill-a", command: "/skill skill-a", invocable: true },
  { name: "skill-b", command: "/skill skill-b", invocable: true }
];
const openClawA = [openClawBoth[0]];
const hermesBoth = [
  { name: "skill-a", command: "/skill-a", invocable: true },
  { name: "skill-b", command: "/skill-b", invocable: true }
];
const hermesB = [hermesBoth[1]];

assert.equal(
  routeCompleteSkillSet("collab", selected, {
    openclaw: openClawBoth,
    hermes: hermesBoth,
    gatewayReady: true
  }).executionAgent,
  "openclaw"
);
const hermesFallback = routeCompleteSkillSet("collab", selected, {
  openclaw: openClawA,
  hermes: hermesBoth,
  gatewayReady: true
});
assert.equal(hermesFallback.executionAgent, "hermes");
assert.match(hermesFallback.fallbackReason, /OpenClaw/);

const rejected = routeCompleteSkillSet("collab", selected, {
  openclaw: openClawA,
  hermes: hermesB,
  gatewayReady: true
});
assert.equal(rejected.ok, false);
assert.deepEqual(rejected.availability.openclaw.missing, ["skill-b"]);
assert.deepEqual(rejected.availability.hermes.missing, ["skill-a"]);

assert.equal(
  buildOpenClawSkillMessage([selected[0]], "summarize this"),
  "/skill skill-a summarize this"
);
const multiMessage = buildOpenClawSkillMessage(selected, "summarize this");
assert.match(multiMessage, /Use all of the following skills together/);
assert.match(multiMessage, /- "skill-a"/);
assert.match(multiMessage, /- "skill-b"/);
assert.match(multiMessage, /User input:\nsummarize this/);
assert.equal((multiMessage.match(/skill-a/g) || []).length, 1);
assert.deepEqual(parseOpenClawSkillMessage("/skill skill-a summarize this"), {
  displayText: "summarize this",
  skills: [{ name: "skill-a", command: "/skill skill-a" }]
});
assert.deepEqual(parseOpenClawSkillMessage(multiMessage), {
  displayText: "summarize this",
  skills: [
    { name: "skill-a", command: "/skill skill-a" },
    { name: "skill-b", command: "/skill skill-b" }
  ]
});

const main = fs.readFileSync(mainPath, "utf8");
const preload = fs.readFileSync(preloadPath, "utf8");
const renderer = fs.readFileSync(rendererPath, "utf8");
for (const marker of [
  'item?.source === "skill"',
  "runHermesSkillCommandBridge",
  "from agent.skill_commands import get_skill_commands",
  "build_skill_invocation_message",
  "build_preloaded_skills_prompt",
  'electron.ipcMain.handle("list-chat-skills"',
  'electron.ipcMain.handle("prepare-chat-skill-request"'
]) {
  assert(main.includes(marker), `main process is missing ${marker}`);
}
assert(/gatewayRpcViaMain\(\s*["']commands\.list["']/.test(main));
assert(preload.includes("ipcListChatSkills"));
assert(preload.includes("ipcPrepareChatSkillRequest"));
assert(!main.includes("expandedSkillPrompt="));
assert(!main.includes("runtimeMessage="));

for (const marker of [
  "submit: { type: Function, required: true }",
  "const selectedSkills = /* @__PURE__ */ ref([])",
  'name: "/skill"',
  "window.uclaw?.ipcListChatSkills",
  "function selectChatSkill(skill)",
  "function removeSelectedSkill(identity)",
  "await props.submit(text2 || \"\", attachments.value.length ? [...attachments.value] : void 0, [...selectedSkills.value])",
  "if (!result?.accepted) return result"
]) {
  assert(renderer.includes(marker), `renderer is missing ${marker}`);
}
for (const marker of [
  "async function sendMessage(text2, attachments, options = {})",
  "content: displayText",
  "skills: messageSkills",
  "return { accepted: true, queued: false }",
  "retrySafe: true",
  "window.uclaw?.ipcPrepareChatSkillRequest",
  "async function sendSkillMessage(text2, attachments, selectedSkills)",
  'prepared.executionAgent === "hermes"',
  "store.sendMessage(prepared.runtimeMessage, attachments, sendOptions)",
  "sendCollaborativeSkillMessage",
  "const result = !selectedSkills.length",
  "function parseStoredOpenClawSkillMessage(content)",
  'const collabOpenClawSessionKey = "openclawpro-collab"',
  "getSessionMessages(sessionKey)",
  "sendOptions.sessionKey = collabOpenClawSessionKey"
]) {
  assert(renderer.includes(marker), `renderer is missing execution marker ${marker}`);
}
assert(!renderer.includes("content: prepared.runtimeMessage"), "runtime skill prompts must not be persisted as user content");
const openClawGatewaySendBody = renderer.match(/async function sendOpenClawToGateway\(item\) \{([\s\S]*?)\n  \}\n  async function flushOpenClawQueue/)?.[1] || "";
assert(openClawGatewaySendBody, "renderer is missing sendOpenClawToGateway body");
assert(!openClawGatewaySendBody.includes('inputText.value = ""'), "OpenClaw store must not clear the draft before Gateway acceptance");
const selectSkillBody = renderer.match(/function selectChatSkill\(skill\) \{([\s\S]*?)\n    \}/)?.[1] || "";
assert(selectSkillBody, "renderer is missing selectChatSkill body");
assert(!selectSkillBody.includes("handleSend("), "selecting a skill must not send the message");
assert(!selectSkillBody.includes("props.submit("), "selecting a skill must not call submit");

console.log("Chat skill command checks passed");
