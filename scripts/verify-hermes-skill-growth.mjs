import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { resolvePortableRoot } from "./portable-root.mjs";

const usbRoot = resolvePortableRoot();
const hermesRoot = path.join(usbRoot, "runtime", "HermesPortable");
const dataRoot = path.join(usbRoot, "data", ".hermes");
const sourceRoot = path.join(hermesRoot, "hermes-agent");
const pythonExe = path.join(hermesRoot, "venv", "Scripts", "python.exe");
const hermesSkillsRoot = path.join(dataRoot, "skills");
const openClawSkillsRoot = path.join(usbRoot, "skills");
const reportPath = path.join(dataRoot, "reports", "skills", "growth-last.json");

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, value) {
  mkdirp(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function safeFileName(value) {
  return String(value || "skill").replace(/[\\/:*?"<>|]/g, "-").trim() || "skill";
}

function copySkillDir(source, target) {
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, {
    recursive: true,
    filter: (sourcePath) => {
      const rel = path.relative(source, sourcePath).replace(/\\/g, "/");
      return !rel.split("/").some((part) => [
        ".git",
        ".github",
        ".hub",
        ".archive",
        "node_modules",
        "__pycache__",
        ".venv",
        "venv",
        "dist",
        "build",
        ".next",
        ".cache"
      ].includes(part));
    }
  });
}

function writeHermesConfig() {
  mkdirp(dataRoot);
  const yaml = [
    "# Managed by OpenClawPro Agent Hub. Kept inside the USB data/.hermes directory.",
    "memory:",
    "  memory_enabled: true",
    "  user_profile_enabled: true",
    "  memory_char_limit: 2200",
    "  user_char_limit: 1375",
    "  provider: \"\"",
    "skills:",
    "  auto_skill_enabled: true",
    "  external_dirs:",
    `    - ${JSON.stringify(openClawSkillsRoot)}`,
    "paths:",
    `  home: ${JSON.stringify(path.join(dataRoot, "home"))}`,
    `  logs: ${JSON.stringify(path.join(dataRoot, "logs"))}`,
    `  memories: ${JSON.stringify(path.join(dataRoot, "memories"))}`,
    `  skills: ${JSON.stringify(hermesSkillsRoot)}`,
    ""
  ].join("\n");
  fs.writeFileSync(path.join(dataRoot, "config.yaml"), yaml, "utf8");
}

function buildHermesEnv() {
  const home = path.join(dataRoot, "home");
  const cache = path.join(dataRoot, "cache");
  const config = path.join(dataRoot, "config");
  const logs = path.join(dataRoot, "logs");
  const tmp = path.join(dataRoot, "tmp");
  for (const dir of [dataRoot, home, cache, config, logs, tmp, hermesSkillsRoot, openClawSkillsRoot, path.dirname(reportPath)]) {
    mkdirp(dir);
  }
  const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") || "Path";
  return {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    XDG_CONFIG_HOME: config,
    XDG_CACHE_HOME: cache,
    HERMES_HOME: dataRoot,
    HERMES_LOG_DIR: logs,
    HERMES_MEMORY_PATH: path.join(dataRoot, "memories"),
    HERMES_SKILLS_PATH: hermesSkillsRoot,
    HERMES_BROWSER_OPENED: "1",
    PYTHONIOENCODING: "utf-8",
    PYTHONUTF8: "1",
    PIP_CACHE_DIR: path.join(cache, "pip"),
    npm_config_cache: path.join(cache, "npm"),
    TMP: tmp,
    TEMP: tmp,
    [pathKey]: [
      path.join(hermesRoot, "venv", "Scripts"),
      path.join(hermesRoot, "node"),
      path.dirname(pythonExe),
      process.env[pathKey] || ""
    ].join(path.delimiter)
  };
}

function runPython(script, timeout = 45000) {
  if (!fs.existsSync(pythonExe)) throw new Error(`missing Python: ${pythonExe}`);
  if (!fs.existsSync(path.join(sourceRoot, "tools", "skill_manager_tool.py"))) {
    throw new Error(`missing Hermes skill manager: ${sourceRoot}`);
  }
  const result = spawnSync(pythonExe, ["-c", script], {
    cwd: dataRoot,
    env: buildHermesEnv(),
    encoding: "utf8",
    windowsHide: true,
    timeout
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `python exited with ${result.status}`).trim());
  }
  return JSON.parse(result.stdout.trim());
}

function createOfficialSkill(skillName) {
  const content = [
    "---",
    `name: ${skillName}`,
    "description: Portable verification skill created through Hermes official skill_manage tool.",
    "---",
    "",
    "# Portable Skill Growth Verification",
    "",
    "Use this temporary skill only to verify that Hermes can create procedural memory, reload it as a slash command, and share it with OpenClaw.",
    "",
    "## Steps",
    "1. Confirm the skill was created by `skill_manage(action=\"create\")`.",
    "2. Confirm `/openclaw-hermes-growth-*` appears after `reload_skills()`.",
    "3. Confirm OpenClaw receives the mirrored skill under the USB `skills/` directory."
  ].join("\n");
  const script = [
    "import json, sys",
    "from pathlib import Path",
    `sys.path.insert(0, ${JSON.stringify(sourceRoot)})`,
    "from tools.skill_manager_tool import skill_manage",
    "from tools.skill_usage import mark_agent_created, is_agent_created",
    "from agent.skill_commands import reload_skills, get_skill_commands",
    `name = ${JSON.stringify(skillName)}`,
    `content = ${JSON.stringify(content)}`,
    "create = json.loads(skill_manage(action='create', name=name, content=content))",
    "if create.get('success'): mark_agent_created(name)",
    "reload = reload_skills()",
    "commands = get_skill_commands()",
    "payload = {",
    "  'ok': bool(create.get('success') and ('/' + name) in commands),",
    "  'create': create,",
    "  'agentCreated': bool(is_agent_created(name)),",
    "  'reload': reload,",
    "  'visible': ('/' + name) in commands,",
    "  'commands': sorted(commands.keys()),",
    "  'skillDir': str(Path(create.get('skill_md', '')).parent) if create.get('skill_md') else ''",
    "}",
    "print(json.dumps(payload, ensure_ascii=False))"
  ].join("\n");
  return runPython(script);
}

function cleanupOfficialSkill(skillName) {
  const script = [
    "import json, sys",
    `sys.path.insert(0, ${JSON.stringify(sourceRoot)})`,
    "from tools.skill_manager_tool import skill_manage",
    "from agent.skill_commands import reload_skills, get_skill_commands",
    `name = ${JSON.stringify(skillName)}`,
    "delete = json.loads(skill_manage(action='delete', name=name, absorbed_into=''))",
    "reload = reload_skills()",
    "commands = get_skill_commands()",
    "payload = {'delete': delete, 'stillVisible': ('/' + name) in commands, 'reload': reload}",
    "print(json.dumps(payload, ensure_ascii=False))"
  ].join("\n");
  return runPython(script);
}

function verifySkillInvisible(skillName) {
  const script = [
    "import json, sys",
    `sys.path.insert(0, ${JSON.stringify(sourceRoot)})`,
    "from agent.skill_commands import reload_skills, get_skill_commands",
    `name = ${JSON.stringify(skillName)}`,
    "reload = reload_skills()",
    "commands = get_skill_commands()",
    "payload = {'visible': ('/' + name) in commands, 'reload': reload}",
    "print(json.dumps(payload, ensure_ascii=False))"
  ].join("\n");
  return runPython(script);
}

let skillName = `openclaw-hermes-growth-${Date.now()}`;
let openClawTarget = path.join(openClawSkillsRoot, safeFileName(skillName));
let report;

try {
  writeHermesConfig();
  const official = createOfficialSkill(skillName);
  const hermesSkillDir = official.skillDir || path.join(hermesSkillsRoot, skillName);
  if (!official.ok) {
    throw new Error(`Hermes official skill creation did not become visible: ${JSON.stringify(official.create)}`);
  }
  if (!fs.existsSync(path.join(hermesSkillDir, "SKILL.md"))) {
    throw new Error(`Created Hermes skill was not found: ${hermesSkillDir}`);
  }

  copySkillDir(hermesSkillDir, openClawTarget);
  writeJson(path.join(openClawTarget, ".hermes-generated.json"), {
    name: skillName,
    source: hermesSkillDir,
    syncedAt: new Date().toISOString(),
    createdBy: "hermes-agent"
  });

  const openClawVisible = fs.existsSync(path.join(openClawTarget, "SKILL.md"));
  const cleanup = cleanupOfficialSkill(skillName);
  fs.rmSync(openClawTarget, { recursive: true, force: true });
  const postCleanup = verifySkillInvisible(skillName);

  report = {
    ok: official.ok && official.agentCreated && openClawVisible && cleanup.delete?.success && !postCleanup.visible,
    checkedAt: new Date().toISOString(),
    skillName,
    hermesSkillDir,
    openClawSkillDir: openClawTarget,
    officialCreated: !!official.create?.success,
    officialVisible: !!official.visible,
    officialAgentCreated: !!official.agentCreated,
    openClawSynced: openClawVisible,
    cleanupDeleted: !!cleanup.delete?.success,
    cleanupStillVisible: !!postCleanup.visible,
    reportPath
  };
} catch (error) {
  try {
    cleanupOfficialSkill(skillName);
  } catch {
    // best-effort cleanup
  }
  fs.rmSync(openClawTarget, { recursive: true, force: true });
  report = {
    ok: false,
    checkedAt: new Date().toISOString(),
    skillName,
    openClawSkillDir: openClawTarget,
    reportPath,
    error: error instanceof Error ? error.message : String(error)
  };
}

writeJson(reportPath, report);
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
