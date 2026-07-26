import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const portableRoot = path.resolve(process.env.PORTABLE_ROOT || process.argv[2] || "E:\\");
const skillsRoot = path.join(portableRoot, "skills");
const runtimeRoot = path.join(portableRoot, "runtime");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openclawpro-skill-closure-"));
const skillLimits = {
  maxCandidatesPerRoot: 400,
  maxSkillsLoadedPerSource: 400,
  maxSkillsInPrompt: 400,
  maxSkillsPromptChars: 65536
};
const require = createRequire(import.meta.url);
const skillMetadata = require(path.join(path.resolve(import.meta.dirname, ".."), "src", "openclaw-shell-app", "dist", "main", "skill-metadata.cjs"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function findPortablePython() {
  const hermesRoot = path.join(runtimeRoot, "HermesPortable");
  const exact = path.join(hermesRoot, "python", "cpython-3.12.13-windows-x86_64-none", "python.exe");
  if (fs.existsSync(exact)) return exact;
  const stack = [path.join(hermesRoot, "python")].filter(fs.existsSync);
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && entry.name.toLowerCase() === "python.exe") return full;
    }
  }
  return path.join(hermesRoot, "venv", "Scripts", "python.exe");
}

function discoverPackages() {
  const directoryEntries = fs.readdirSync(skillsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  const discovery = skillMetadata.discoverSkillPackages(skillsRoot);
  const packages = discovery.packages.map((item) => ({ packageName: item.relativeName, name: item.meta?.name || item.packageName }));
  return {
    directoryCount: directoryEntries.length,
    packageCount: packages.length,
    uniqueNameCount: new Set(packages.map((item) => item.name)).size,
    invalidDirectories: discovery.invalidDirectories.map((item) => item.name)
  };
}

function runOpenClaw() {
  const stateRoot = path.join(tempRoot, "openclaw");
  fs.mkdirSync(stateRoot, { recursive: true });
  fs.writeFileSync(path.join(stateRoot, "openclaw.json"), JSON.stringify({
    skills: {
      load: { extraDirs: [skillsRoot] },
      limits: skillLimits,
      entries: {}
    }
  }, null, 2));
  const node = path.join(runtimeRoot, "node.exe");
  const entry = path.join(runtimeRoot, "node_modules", "openclaw", "openclaw.mjs");
  assert(fs.existsSync(node), `Missing portable Node: ${node}`);
  assert(fs.existsSync(entry), `Missing OpenClaw entry: ${entry}`);
  const result = spawnSync(node, [entry, "skills", "list", "--json"], {
    cwd: portableRoot,
    encoding: "utf8",
    windowsHide: true,
    timeout: 120000,
    env: {
      ...process.env,
      OPENCLAW_HOME: stateRoot,
      OPENCLAW_STATE_DIR: stateRoot,
      HOME: path.join(stateRoot, "home"),
      USERPROFILE: path.join(stateRoot, "home")
    }
  });
  assert(result.status === 0, (result.stderr || result.stdout || `OpenClaw exited ${result.status}`).trim());
  return JSON.parse(result.stdout);
}

async function auditOpenClawPrompt() {
  const distRoot = path.join(runtimeRoot, "node_modules", "openclaw", "dist");
  const facade = fs.readdirSync(distRoot)
    .filter((name) => /^workspace-[A-Za-z0-9_-]+\.js$/.test(name))
    .map((name) => path.join(distRoot, name))
    .find((file) => fs.readFileSync(file, "utf8").includes("buildWorkspaceSkillSnapshot"));
  assert(facade, `OpenClaw workspace skill facade was not found under ${distRoot}`);
  process.env.OPENCLAW_HOME = path.join(tempRoot, "openclaw-prompt");
  process.env.OPENCLAW_STATE_DIR = process.env.OPENCLAW_HOME;
  const workspace = path.join(tempRoot, "workspace");
  fs.mkdirSync(workspace, { recursive: true });
  const module = await import(pathToFileURL(facade).href);
  const snapshot = module.buildWorkspaceSkillSnapshot(workspace, {
    config: { skills: { load: { extraDirs: [skillsRoot] }, limits: skillLimits, entries: {} } },
    agentId: "main"
  });
  const warning = snapshot.prompt.match(/Skills truncated: included (\d+) of (\d+)/);
  return {
    eligible: snapshot.skills?.length || 0,
    promptVisible: snapshot.resolvedSkills?.length || 0,
    promptIncluded: warning ? Number(warning[1]) : snapshot.resolvedSkills?.length || 0,
    truncated: Boolean(warning),
    promptChars: snapshot.prompt?.length || 0
  };
}

function runHermes() {
  const hermesRoot = path.join(runtimeRoot, "HermesPortable");
  const sourceRoot = path.join(hermesRoot, "hermes-agent");
  const dataRoot = path.join(tempRoot, "hermes");
  const python = findPortablePython();
  const sitePackages = path.join(hermesRoot, "venv", "Lib", "site-packages");
  for (const dir of [dataRoot, path.join(dataRoot, "skills"), path.join(dataRoot, "home"), path.join(dataRoot, "cache"), path.join(dataRoot, "tmp")]) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dataRoot, "config.yaml"), [
    "skills:",
    "  auto_skill_enabled: true",
    "  external_dirs:",
    `    - ${JSON.stringify(skillsRoot)}`,
    ""
  ].join("\n"));
  const script = [
    "import json, sys",
    `sys.path.insert(0, ${JSON.stringify(sourceRoot)})`,
    "from agent.skill_commands import reload_skills, get_skill_commands, resolve_skill_command_key, build_skill_invocation_message",
    "from agent.skill_utils import get_external_skills_dirs",
    "reload = reload_skills()",
    "commands = get_skill_commands()",
    "selected = list(commands.keys())[:2]",
    "resolved = [resolve_skill_command_key(key.lstrip('/')) for key in selected]",
    "messages = [build_skill_invocation_message(key, '', task_id='verify-multi-skill') for key in resolved if key]",
    "print(json.dumps({'reload': reload, 'commandCount': len(commands), 'externalDirs': [str(p) for p in get_external_skills_dirs()], 'multiSkill': {'selected': selected, 'resolved': resolved, 'messageCount': len([m for m in messages if m])}}, ensure_ascii=False))"
  ].join("\n");
  const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") || "Path";
  const result = spawnSync(python, ["-c", script], {
    cwd: dataRoot,
    encoding: "utf8",
    windowsHide: true,
    timeout: 120000,
    env: {
      ...process.env,
      HERMES_HOME: dataRoot,
      HERMES_SKILLS_PATH: path.join(dataRoot, "skills"),
      HOME: path.join(dataRoot, "home"),
      USERPROFILE: path.join(dataRoot, "home"),
      XDG_CACHE_HOME: path.join(dataRoot, "cache"),
      TMP: path.join(dataRoot, "tmp"),
      TEMP: path.join(dataRoot, "tmp"),
      PYTHONUTF8: "1",
      PYTHONIOENCODING: "utf-8",
      PYTHONPATH: [sitePackages, sourceRoot, process.env.PYTHONPATH || ""].filter(Boolean).join(path.delimiter),
      [pathKey]: [path.join(hermesRoot, "venv", "Scripts"), path.dirname(python), process.env[pathKey] || ""].join(path.delimiter)
    }
  });
  assert(result.status === 0, (result.stderr || result.stdout || `Hermes exited ${result.status}`).trim());
  return JSON.parse(result.stdout);
}

try {
  assert(fs.existsSync(skillsRoot), `Skills directory does not exist: ${skillsRoot}`);
  const discovery = discoverPackages();
  const openClaw = runOpenClaw();
  const openClawPrompt = await auditOpenClawPrompt();
  const hermes = runHermes();
  assert(hermes.multiSkill?.selected?.length === 2, "Hermes multi-skill fixture did not select two commands");
  assert(hermes.multiSkill?.resolved?.every(Boolean), "Hermes official resolver failed for a selected command");
  assert(hermes.multiSkill?.messageCount === 2, "Hermes official invocation builder did not produce two skill messages");
  const openClawSourceCounts = new Map();
  for (const skill of openClaw.skills || []) openClawSourceCounts.set(skill.source, (openClawSourceCounts.get(skill.source) || 0) + 1);
  const report = {
    portableRoot,
    discovery,
    openClaw: {
      total: openClaw.total ?? openClaw.skills?.length ?? 0,
      eligible: openClaw.skills?.filter((skill) => skill.eligible).length || 0,
      prompt: openClawPrompt,
      sourceCounts: Array.from(openClawSourceCounts, ([source, count]) => ({ source, count }))
    },
    hermes: {
      total: hermes.reload?.total || 0,
      commandCount: hermes.commandCount,
      externalDirs: hermes.externalDirs,
      multiSkill: hermes.multiSkill
    }
  };
  console.log(JSON.stringify(report, null, 2));
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
