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
  'resolveHermesSkillInvocation',
  'electron.ipcMain.handle("list-chat-skills"'
]) assert(source.main.includes(marker), `main process is missing ${marker}`);

assert(source.preload.includes("ipcListChatSkills"), "preload chat skill API is missing");
for (const marker of [
  'name: "/skill"',
  'emit2("requestSkills")',
  'emit2("skill", skill)',
  'skillMode: agentMode.value',
  'onRequestSkills: loadChatSkills',
  'currentChatAdapter().skill?.(skill)'
]) assert(source.renderer.includes(marker), `renderer is missing ${marker}`);

assert(source.styles.includes(".skill-command-menu"), "skill command menu styles are missing");
assert(source.renderer.includes('props.skillMode === "collab" ? commands.filter'), "collaboration mode must hide the ambiguous skill command picker");

console.log(JSON.stringify({
  ok: true,
  openClaw: "commands.list + official slash alias",
  hermes: "agent.skill_commands + build_skill_invocation_message",
  interaction: "/skill lazy picker"
}, null, 2));
