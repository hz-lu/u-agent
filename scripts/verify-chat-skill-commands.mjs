import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const sourceRoot = path.join(projectRoot, "src", "openclaw-shell-app", "dist");
const files = {
  main: path.join(sourceRoot, "main", "index.js"),
  preload: path.join(sourceRoot, "preload", "index.js"),
  renderer: path.join(sourceRoot, "assets", "assets", "main-DIeui7ZO.js"),
  styles: path.join(sourceRoot, "assets", "main-CAx6YYDG.css")
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, fs.readFileSync(file, "utf8")]));

for (const marker of [
  'gatewayRpcViaMain("commands.list"',
  'item?.source === "skill"',
  'runHermesSkillCommandBridge',
  'from agent.skill_commands import get_skill_commands',
  'build_skill_invocation_message',
  "payload.get('commands')",
  'resolveHermesSkillInvocation',
  'electron.ipcMain.handle("list-chat-skills"'
]) assert(source.main.includes(marker), `main process is missing ${marker}`);

assert(source.preload.includes("ipcListChatSkills"), "preload chat skill API is missing");
for (const marker of [
  'name: "/skill"',
  'emit2("requestSkills")',
  'selectedSkills.value',
  'emit2("send", text2 || "", attachments.value.length ? [...attachments.value] : void 0, [...selectedSkills.value])',
  'skillMode: agentMode.value',
  'onRequestSkills: loadChatSkills',
  'buildOpenClawSkillRequest',
  'buildHermesSkillRequest',
  'sendCollaborativeSkillMessage',
  'OpenClaw 未完成'
]) assert(source.renderer.includes(marker), `renderer is missing ${marker}`);

assert(source.styles.includes(".skill-command-menu"), "skill command menu styles are missing");
assert(source.styles.includes(".selected-skill-chip"), "selected skill chip styles are missing");
assert(!source.renderer.includes('props.skillMode === "collab" ? commands.filter'), "collaboration mode must expose the compatibility-aware skill picker");

console.log(JSON.stringify({
  ok: true,
  openClaw: "commands.list + official slash alias",
  hermes: "agent.skill_commands + build_skill_invocation_message",
  interaction: "/skill lazy multi-select picker with deferred send",
  collaboration: "OpenClaw preferred with Hermes compatibility fallback"
}, null, 2));
