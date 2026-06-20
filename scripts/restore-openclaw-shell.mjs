import fs from "node:fs";
import path from "node:path";
import { resolvePortableRoot } from "./portable-root.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const usbRoot = resolvePortableRoot(projectRoot);
const backupRoot = process.env.OPENCLAW_BASELINE_APP || path.join(usbRoot, "backups", "app-before-full-source-20260618164815");
const targetApp = path.join(usbRoot, "win-unpacked", "resources", "app");
const backupsRoot = path.join(usbRoot, "backups");

function timestamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("");
}

function copyFile(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyDir(source, target) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(target, { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

function replaceMethodBlock(source, startMarker, nextMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`Could not find ${label} start marker.`);
  const end = source.indexOf(nextMarker, start + startMarker.length);
  if (end < 0) throw new Error(`Could not find ${label} end marker.`);
  return source.slice(0, start) + replacement + source.slice(end);
}

function patchHermesTrayMenu(filePath) {
  const marker = "label: \"🧠 Hermes Agent\"";
  let source = fs.readFileSync(filePath, "utf8");
  if (source.includes(marker)) return;

  const anchor = "        { type: \"separator\" },\r\n        {\r\n          label: \"❌ 完全退出\",";
  const normalizedAnchor = "        { type: \"separator\" },\n        {\n          label: \"❌ 完全退出\",";
  const insert = [
    "        { type: \"separator\" },",
    "        {",
    "          label: \"🧠 Hermes Agent\",",
    "          submenu: [",
    "            {",
    "              label: \"打开配置中心\",",
    "              click: async () => {",
    "                await getHermesManager().openConfig();",
    "              }",
    "            },",
    "            {",
    "              label: \"打开 Dashboard\",",
    "              click: async () => {",
    "                await getHermesManager().openDashboard();",
    "              }",
    "            },",
    "            {",
    "              label: \"启动 Agent API\",",
    "              click: async () => {",
    "                await getHermesManager().openApiServer();",
    "              }",
    "            },",
    "            { type: \"separator\" },",
    "            {",
    "              label: \"停止 Hermes\",",
    "              click: async () => {",
    "                await getHermesManager().stop();",
    "              }",
    "            }",
    "          ]",
    "        },"
  ].join("\n");

  if (source.includes(anchor)) {
    source = source.replace(anchor, insert.replace(/\n/g, "\r\n") + "\r\n" + anchor);
  } else if (source.includes(normalizedAnchor)) {
    source = source.replace(normalizedAnchor, insert + "\n" + normalizedAnchor);
  } else {
    throw new Error("Could not find tray menu insertion point in OpenClaw main process.");
  }

  fs.writeFileSync(filePath, source, "utf8");
}

function patchHermesRuntimeEnv(filePath) {
  let source = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  if (!source.includes("codex-portable-openclaw-config-rewrite")) {
    const anchor = "function getGatewayEnv() {";
    const helper = [
      "function rewritePortableOpenClawConfigPaths() {",
      "  /* codex-portable-openclaw-config-rewrite */",
      "  const configPath = path$1.join(getDataRoot(), \".openclaw\", \"openclaw.json\");",
      "  try {",
      "    if (!fs$1.existsSync(configPath)) return;",
      "    const config = JSON.parse(fs$1.readFileSync(configPath, \"utf8\"));",
      "    let changed = false;",
      "    const extraDirs = config?.skills?.load?.extraDirs;",
      "    if (Array.isArray(extraDirs)) {",
      "      const normalized = extraDirs.map((entry) => {",
      "        if (typeof entry !== \"string\") return entry;",
      "        const clean = entry.replace(/\\\\/g, \"/\");",
      "        if (/^[A-Za-z]:\\/skills\\/?$/i.test(clean) || clean === \"skills\" || clean.endsWith(\"/skills\")) return \"skills\";",
      "        return entry;",
      "      });",
      "      if (JSON.stringify(normalized) !== JSON.stringify(extraDirs)) {",
      "        config.skills.load.extraDirs = normalized;",
      "        changed = true;",
      "      }",
      "    }",
      "    if (changed) fs$1.writeFileSync(configPath, JSON.stringify(config, null, 2) + \"\\n\", \"utf8\");",
      "  } catch (err) {",
      "    console.warn(\"[portable] failed to rewrite OpenClaw config paths:\", err instanceof Error ? err.message : String(err));",
      "  }",
      "}",
      ""
    ].join("\n");
    if (source.includes(anchor)) {
      source = source.replace(anchor, helper + anchor);
    }
  }
  source = source.replace(
    "function getGatewayEnv() {\n  const usbRuntime = path$1.join(getAppRoot(), \"runtime\");",
    "function getGatewayEnv() {\n  rewritePortableOpenClawConfigPaths();\n  const usbRuntime = path$1.join(getAppRoot(), \"runtime\");"
  );
  const gatewayEnvAnchor = [
    "  return {",
    "    ...process.env,",
    "    OPENCLAW_HOME: getDataRoot(),",
    "    OPENCLAW_WORKSPACE: path$1.join(getDataRoot(), \".openclaw\", \"workspace\"),",
    "    NODE_PATH: path$1.join(runtimePath, \"node_modules\"),",
    "    PATH: `${paths.join(path$1.delimiter)}${path$1.delimiter}${process.env.PATH}`,",
    "    NODE_OPTIONS: nodeOptions,",
    "    NO_PROXY: noProxy,",
    "    NO_COLOR: \"1\"",
    "  };"
  ].join("\n");
  const gatewayEnvReplacement = [
    "  const portableStateRoot = path$1.join(getDataRoot(), \".openclaw\");",
    "  const portableTmp = path$1.join(portableStateRoot, \"tmp\");",
    "  const portableHome = path$1.join(portableStateRoot, \"home\");",
    "  fs$1.mkdirSync(portableTmp, { recursive: true });",
    "  fs$1.mkdirSync(portableHome, { recursive: true });",
    "  return {",
    "    ...process.env,",
    "    HOME: portableHome,",
    "    USERPROFILE: portableHome,",
    "    OPENCLAW_HOME: getDataRoot(),",
    "    OPENCLAW_STATE_DIR: portableStateRoot,",
    "    OPENCLAW_CONFIG: path$1.join(portableStateRoot, \"openclaw.json\"),",
    "    OPENCLAW_CONFIG_PATH: path$1.join(portableStateRoot, \"openclaw.json\"),",
    "    OPENCLAW_WORKSPACE: path$1.join(portableStateRoot, \"workspace\"),",
    "    TMP: portableTmp,",
    "    TEMP: portableTmp,",
    "    NODE_PATH: path$1.join(runtimePath, \"node_modules\"),",
    "    PATH: `${paths.join(path$1.delimiter)}${path$1.delimiter}${process.env.PATH}`,",
    "    NODE_OPTIONS: nodeOptions,",
    "    NO_PROXY: noProxy,",
    "    NO_COLOR: \"1\"",
    "  };"
  ].join("\n");
  if (source.includes(gatewayEnvAnchor)) {
    source = source.replace(gatewayEnvAnchor, gatewayEnvReplacement);
  }
  source = source.replace(
    "      OPENCLAW_HOME: this.dataDir,\n      PATH: `${paths.join(path$1.delimiter)}${path$1.delimiter}${process.env.PATH}`",
    "      OPENCLAW_HOME: this.dataDir,\n      OPENCLAW_STATE_DIR: path$1.join(this.dataDir, \".openclaw\"),\n      OPENCLAW_CONFIG: path$1.join(this.dataDir, \".openclaw\", \"openclaw.json\"),\n      OPENCLAW_CONFIG_PATH: path$1.join(this.dataDir, \".openclaw\", \"openclaw.json\"),\n      PATH: `${paths.join(path$1.delimiter)}${path$1.delimiter}${process.env.PATH}`"
  );
  source = source.replace(
    "      const accountsFile = path$1.join(this.dataDir, \"openclaw-weixin\", \"accounts.json\");",
    "      const accountsFile = path$1.join(this.dataDir, \".openclaw\", \"openclaw-weixin\", \"accounts.json\");"
  );
  source = source.replace(
    "      const wechatDataDir = path$1.join(dataDir, \"openclaw-weixin\");",
    "      const wechatDataDir = path$1.join(dataDir, \".openclaw\", \"openclaw-weixin\");"
  );
  source = source.replace(
    "      this.emit(\"login-exit\", code);",
    "      if (code === 0 || this.status === \"connected\") {\n        const restart = this.restartGateway();\n        this.emit(\"log\", restart.success ? \"[weixin] Gateway 已刷新，微信账号配置已加载\" : `[weixin] Gateway 刷新失败: ${restart.error}`);\n      }\n      this.emit(\"login-exit\", code);"
  );
  source = source.replace(
    "        const urlMatch = clean2.match(/(https?:\\/\\/[^\\s]+(?:weixin|qrcode)[^\\s]*)/);",
    "        const urlMatch = clean2.match(/(https?:\\/\\/[^\\s]+(?:weixin|qrcode|liteapp)[^\\s]*)/);"
  );
  source = source.replace(
    "          this.emit(\"qr-url\", url2);",
    "          this.emit(\"qr-url\", url2);"
  );
  source = source.replace(
    "      if (clean2.includes(\"寰俊杩炴帴鎴愬姛\") || clean2.includes(\"鐧诲綍鎴愬姛\") || clean2.includes(\"logged in\") || clean2.includes(\"connected\")) {",
    "      if ((clean2.match(/[█▄▀]{4,}/g) || []).length >= 2 || clean2.includes(\"二维码\") || clean2.includes(\"浜岀淮鐮\")) {\n        this.emit(\"qr-text\", clean2);\n        this.status = \"scanning\";\n        this.emit(\"status\", this.status);\n      }\n      if (clean2.includes(\"寰俊杩炴帴鎴愬姛\") || clean2.includes(\"鐧诲綍鎴愬姛\") || clean2.includes(\"logged in\") || clean2.includes(\"connected\")) {"
  );
  const envAnchor = [
    "  getHermesEnv() {",
    "    const root = this.getPortableRoot();",
    "    const home = path$1.join(root, \"_home\");",
    "    const data = path$1.join(root, \"data\");"
  ].join("\n");
  const envReplacement = [
    "  getHermesEnv() {",
    "    const root = this.getPortableRoot();",
    "    const usbRoot = getAppRoot();",
    "    const data = path$1.join(usbRoot, \"data\", \".hermes\");",
    "    const home = path$1.join(data, \"home\");"
  ].join("\n");
  if (source.includes(envAnchor)) {
    source = source.replace(envAnchor, envReplacement);
  }
  const mkdirAnchor = [
    "    if (!fs$1.existsSync(home)) fs$1.mkdirSync(home, { recursive: true });",
    "    if (!fs$1.existsSync(data)) fs$1.mkdirSync(data, { recursive: true });"
  ].join("\n");
  const mkdirReplacement = [
    "    for (const dir of [data, home, path$1.join(data, \"config\"), path$1.join(data, \"cache\"), path$1.join(data, \"logs\"), path$1.join(data, \"memories\"), path$1.join(data, \"skills\"), path$1.join(data, \"tmp\")]) {",
    "      if (!fs$1.existsSync(dir)) fs$1.mkdirSync(dir, { recursive: true });",
    "    }"
  ].join("\n");
  if (source.includes(mkdirAnchor)) {
    source = source.replace(mkdirAnchor, mkdirReplacement);
  }
  const homeEnvAnchor = [
    "      HOME: home,",
    "      USERPROFILE: home,",
    "      HERMES_HOME: data,",
    "      HERMES_BROWSER_OPENED: \"1\","
  ].join("\n");
  const homeEnvReplacement = [
    "      HOME: home,",
    "      USERPROFILE: home,",
    "      XDG_CONFIG_HOME: path$1.join(data, \"config\"),",
    "      XDG_CACHE_HOME: path$1.join(data, \"cache\"),",
    "      HERMES_HOME: data,",
    "      HERMES_LOG_DIR: path$1.join(data, \"logs\"),",
    "      HERMES_MEMORY_PATH: path$1.join(data, \"memories\"),",
    "      HERMES_SKILLS_PATH: path$1.join(data, \"skills\"),",
    "      TMP: path$1.join(data, \"tmp\"),",
    "      TEMP: path$1.join(data, \"tmp\"),",
    "      HERMES_BROWSER_OPENED: \"1\","
  ].join("\n");
  if (source.includes(homeEnvAnchor)) {
    source = source.replace(homeEnvAnchor, homeEnvReplacement);
  }

  const syncMethodMarker = "  syncOpenClawSkillsToHermes(options = {}) {";
  const repairAnchor = "  repairShims() {";
  const syncMethod = [
      "  syncOpenClawSkillsToHermes(options = {}) {",
      "    const silent = options?.silent !== false;",
      "    const hermesSkillsRoot = path$1.join(getAppRoot(), \"data\", \".hermes\", \"skills\");",
      "    const openClawTargetRoot = path$1.join(hermesSkillsRoot, \"openclaw\");",
      "    const manifestPath = path$1.join(openClawTargetRoot, \".openclaw_sync_manifest.json\");",
      "    const reportPath = path$1.join(getAppRoot(), \"data\", \".hermes\", \"reports\", \"skills\", \"visibility-last.json\");",
      "    fs$1.mkdirSync(openClawTargetRoot, { recursive: true });",
      "    fs$1.mkdirSync(path$1.dirname(reportPath), { recursive: true });",
      "    function readJsonSafe(filePath) {",
      "      try {",
      "        if (!fs$1.existsSync(filePath)) return null;",
      "        return JSON.parse(fs$1.readFileSync(filePath, \"utf8\"));",
      "      } catch {",
      "        return null;",
      "      }",
      "    }",
      "    function writeJson(filePath, value) {",
      "      fs$1.mkdirSync(path$1.dirname(filePath), { recursive: true });",
      "      fs$1.writeFileSync(filePath, JSON.stringify(value, null, 2) + \"\\n\", \"utf8\");",
      "    }",
      "    function safeSkillDirName(name, fallback) {",
      "      return String(name || fallback || \"skill\").replace(/[\\\\/:*?\\\"<>|]/g, \"_\").trim() || \"skill\";",
      "    }",
      "    function skillSlug(value) {",
      "      return String(value || \"\").toLowerCase().replace(/[\\s_]+/g, \"-\").replace(/[^a-z0-9-]/g, \"\").replace(/-+/g, \"-\").replace(/^-|-$/g, \"\");",
      "    }",
      "    function uniqueTargetName(name, used) {",
      "      let candidate = name;",
      "      let index = 2;",
      "      while (used.has(candidate.toLowerCase())) {",
      "        candidate = name + \"-\" + index;",
      "        index += 1;",
      "      }",
      "      used.add(candidate.toLowerCase());",
      "      return candidate;",
      "    }",
      "    function shouldCopySkillPath(rootDir, sourcePath) {",
      "      const rel = path$1.relative(rootDir, sourcePath).replace(/\\\\/g, \"/\");",
      "      const excluded = new Set([\".git\", \".github\", \".hub\", \".archive\", \"node_modules\", \"__pycache__\", \".venv\", \"venv\", \"dist\", \"build\", \".next\", \".cache\"]);",
      "      return !rel.split(\"/\").some((part) => excluded.has(part));",
      "    }",
      "    function findSkillSources(rootDir) {",
      "      const rows = [];",
      "      if (!rootDir || !fs$1.existsSync(rootDir)) return rows;",
      "      for (const entry of fs$1.readdirSync(rootDir, { withFileTypes: true })) {",
      "        const full = path$1.join(rootDir, entry.name);",
      "        if (entry.isDirectory()) {",
      "          const skillFile = path$1.join(full, \"SKILL.md\");",
      "          if (!fs$1.existsSync(skillFile)) continue;",
      "          let meta = null;",
      "          try { meta = parseSkillMeta(skillFile); } catch { meta = null; }",
      "          rows.push({ source: full, name: meta?.name || entry.name, key: entry.name, skillFile });",
      "        } else if (entry.isFile() && entry.name.toLowerCase().endsWith(\".md\")) {",
      "          let meta = null;",
      "          try { meta = parseSkillMeta(full); } catch { meta = null; }",
      "          rows.push({ source: full, name: meta?.name || entry.name.replace(/\\.md$/i, \"\"), key: entry.name.replace(/\\.md$/i, \"\"), skillFile: full });",
      "        }",
      "      }",
      "      return rows;",
      "    }",
      "    function verifyHermesSkills(python, sourceRoot, env2) {",
      "      if (!fs$1.existsSync(python)) throw new Error(\"Hermes portable Python was not found: \" + python);",
      "      if (!fs$1.existsSync(path$1.join(sourceRoot, \"agent\", \"skill_commands.py\"))) throw new Error(\"Hermes skill_commands.py was not found: \" + sourceRoot);",
      "      const script = [",
      "        \"import json, sys\",",
      "        \"sys.path.insert(0, \" + JSON.stringify(sourceRoot) + \")\",",
      "        \"from agent.skill_commands import reload_skills, get_skill_commands\",",
      "        \"result = reload_skills()\",",
      "        \"commands = get_skill_commands()\",",
      "        \"names = sorted(set((info or {}).get('name') or key.lstrip('/') for key, info in commands.items()))\",",
      "        \"cmd_keys = sorted(commands.keys())\",",
      "        \"print(json.dumps({'ok': True, 'reload': result, 'commands': cmd_keys, 'names': names}, ensure_ascii=False))\"",
      "      ].join(\"; \");",
      "      const result = child_process.spawnSync(python, [\"-c\", script], {",
      "        cwd: path$1.join(getAppRoot(), \"data\", \".hermes\"),",
      "        env: env2,",
      "        encoding: \"utf8\",",
      "        windowsHide: true,",
      "        timeout: 45000",
      "      });",
      "      if (result.status !== 0) throw new Error((result.stderr || result.stdout || \"Hermes skill scan exited with \" + result.status).trim());",
      "      const parsed = JSON.parse((result.stdout || \"{}\").trim());",
      "      return {",
      "        ok: !!parsed.ok,",
      "        names: Array.isArray(parsed.names) ? parsed.names.map(String) : [],",
      "        commands: Array.isArray(parsed.commands) ? parsed.commands.map(String) : [],",
      "        invocationCommand: \"\",",
      "        invocationLoaded: false",
      "      };",
      "    }",
      "    try {",
      "      const config = readJsonSafe(path$1.join(getAppRoot(), \"data\", \".openclaw\", \"openclaw.json\")) || {};",
      "      const extraDirs = Array.isArray(config?.skills?.load?.extraDirs) ? config.skills.load.extraDirs : [];",
      "      const skillEntries = config?.skills?.entries || {};",
      "      const sourceRoots = extraDirs.map((dir) => path$1.isAbsolute(dir) ? dir : path$1.join(getAppRoot(), dir));",
      "      const sources = [];",
      "      const seenKeys = new Set();",
      "      for (const rootDir of sourceRoots) {",
      "        for (const item of findSkillSources(rootDir)) {",
      "          const disabled = skillEntries[item.name]?.enabled === false || skillEntries[item.key]?.enabled === false;",
      "          if (disabled) continue;",
      "          const targetName = uniqueTargetName(safeSkillDirName(item.key || item.name, item.name), seenKeys);",
      "          const stat = fs$1.statSync(item.skillFile);",
      "          sources.push({ ...item, targetName, skillMtimeMs: Math.round(stat.mtimeMs), rootDir });",
      "        }",
      "      }",
      "      const nextManifest = { version: 3, syncedAt: new Date().toISOString(), sourceRoots, skills: sources.map(({ source, name, key, targetName, skillMtimeMs }) => ({ source, name, key, targetName, skillMtimeMs })) };",
      "      const oldManifest = readJsonSafe(manifestPath);",
      "      const unchanged = !!oldManifest && JSON.stringify({ ...oldManifest, syncedAt: nextManifest.syncedAt }) === JSON.stringify(nextManifest);",
      "      let copied = 0;",
      "      if (!unchanged) {",
      "        fs$1.rmSync(openClawTargetRoot, { recursive: true, force: true });",
      "        fs$1.mkdirSync(openClawTargetRoot, { recursive: true });",
      "        fs$1.writeFileSync(path$1.join(openClawTargetRoot, \"DESCRIPTION.md\"), \"# OpenClaw Skills\\n\\nOpenClaw skills synchronized from the portable USB skills directory and verified through Hermes native skill command scanning.\\n\", \"utf8\");",
      "        for (const item of sources) {",
      "          const target = path$1.join(openClawTargetRoot, item.targetName);",
      "          if (fs$1.statSync(item.source).isDirectory()) {",
      "            fs$1.cpSync(item.source, target, { recursive: true, filter: (sourcePath) => shouldCopySkillPath(item.source, sourcePath) });",
      "          } else {",
      "            fs$1.mkdirSync(target, { recursive: true });",
      "            fs$1.copyFileSync(item.source, path$1.join(target, \"SKILL.md\"));",
      "          }",
      "          copied += 1;",
      "        }",
      "        fs$1.writeFileSync(manifestPath, JSON.stringify(nextManifest, null, 2) + \"\\n\", \"utf8\");",
      "      }",
      "      const verification = verifyHermesSkills(this.getPortablePython(), path$1.join(this.getPortableRoot(), \"hermes-agent\"), this.getHermesEnv());",
      "      const visibleSet = new Set([...verification.names, ...verification.commands.map((cmd) => cmd.replace(/^\\//, \"\"))].map(skillSlug));",
      "      const missingNames = sources.map((item) => item.name).filter((name) => !visibleSet.has(skillSlug(name))).slice(0, 50);",
      "      const report = {",
      "        ok: verification.ok,",
      "        checkedAt: new Date().toISOString(),",
      "        sourceCount: sources.length,",
      "        copied,",
      "        mirroredCount: sources.length,",
      "        visibleCount: verification.names.length,",
      "        commandCount: verification.commands.length,",
      "        invocationCommand: \"\",",
      "        invocationLoaded: false,",
      "        invocationStatus: \"not-run\",",
      "        usageTracked: fs$1.existsSync(path$1.join(hermesSkillsRoot, \".usage.json\")),",
      "        mirrorRoot: openClawTargetRoot,",
      "        path: openClawTargetRoot,",
      "        reportPath,",
      "        sampleCommands: verification.commands.slice(0, 20),",
      "        missingNames,",
      "        unchanged",
      "      };",
      "      writeJson(reportPath, report);",
      "      if (!silent) safeSend(\"hermes-log\", { type: \"system\", msg: \"[skills] synced=\" + copied + \" source=\" + report.sourceCount + \" visible=\" + report.visibleCount + \" commands=\" + report.commandCount + \" report=\" + reportPath });",
      "      return report;",
      "    } catch (err) {",
      "      const error = err instanceof Error ? err.message : String(err);",
      "      const report = { ok: false, checkedAt: new Date().toISOString(), copied: 0, sourceCount: 0, mirroredCount: 0, visibleCount: 0, commandCount: 0, usageTracked: fs$1.existsSync(path$1.join(hermesSkillsRoot, \".usage.json\")), mirrorRoot: openClawTargetRoot, path: openClawTargetRoot, reportPath, sampleCommands: [], missingNames: [], error };",
      "      writeJson(reportPath, report);",
      "      safeSend(\"hermes-log\", { type: \"stderr\", msg: \"[skills] sync failed: \" + error });",
      "      return report;",
      "    }",
      "  }",
      ""
    ].join("\n");
  if (source.includes(syncMethodMarker)) {
    source = replaceMethodBlock(source, syncMethodMarker, repairAnchor, syncMethod, "Hermes skills sync method");
  } else {
    if (!source.includes(repairAnchor)) {
      throw new Error("Could not find Hermes repairShims insertion point.");
    }
    source = source.replace(repairAnchor, syncMethod + repairAnchor);
  }

  const snapshotAnchor = [
    "    return {",
    "      status: this.status,",
    "      pid: this.proc?.pid ?? null,",
    "      memoryMb: this.memoryMb,",
    "      iterations: this.iterations,",
    "      memoryPath: this.memoryPath,",
    "      model: this.model,",
    "      lastError: this.lastError",
    "    };"
  ].join("\n");
  const snapshotReplacement = [
    "    const root = this.getPortableRoot();",
    "    const hermesBin = this.getHermesBin();",
    "    const python = this.getPortablePython();",
    "    const nodeDir = fs$1.existsSync(path$1.join(root, \"node-windows-x64\")) ? path$1.join(root, \"node-windows-x64\") : path$1.join(root, \"node\");",
    "    const nodeBin = process.platform === \"win32\" ? path$1.join(nodeDir, \"node.exe\") : path$1.join(nodeDir, \"bin\", \"node\");",
    "    const npmBin = process.platform === \"win32\" ? path$1.join(nodeDir, \"npm.cmd\") : path$1.join(nodeDir, \"bin\", \"npm\");",
    "    const data = path$1.join(getAppRoot(), \"data\", \".hermes\");",
    "    const skillsRoot = path$1.join(data, \"skills\");",
    "    function countHermesSkills(rootDir) {",
    "      const seen = /* @__PURE__ */ new Set();",
    "      function walk(dir) {",
    "        if (!fs$1.existsSync(dir)) return;",
    "        for (const entry of fs$1.readdirSync(dir, { withFileTypes: true })) {",
    "          const full = path$1.join(dir, entry.name);",
    "          if (entry.isDirectory()) {",
    "            if (fs$1.existsSync(path$1.join(full, \"SKILL.md\")) || fs$1.existsSync(path$1.join(full, \"DESCRIPTION.md\"))) seen.add(path$1.relative(rootDir, full).replace(/\\\\/g, \"/\"));",
    "            walk(full);",
    "          } else if (/^(SKILL|DESCRIPTION)\\.md$/i.test(entry.name)) {",
    "            seen.add(path$1.relative(rootDir, dir).replace(/\\\\/g, \"/\") || entry.name);",
    "          }",
    "        }",
    "      }",
    "      walk(rootDir);",
    "      return seen.size;",
    "    }",
    "    function readJsonSafe(filePath) {",
    "      try {",
    "        if (!fs$1.existsSync(filePath)) return null;",
    "        return JSON.parse(fs$1.readFileSync(filePath, \"utf8\"));",
    "      } catch {",
    "        return null;",
    "      }",
    "    }",
    "    const openClawConfig = readJsonSafe(path$1.join(getAppRoot(), \"data\", \".openclaw\", \"openclaw.json\"));",
    "    const openClawSkillDirs = Array.isArray(openClawConfig?.skills?.load?.extraDirs) ? openClawConfig.skills.load.extraDirs.map((dir) => path$1.isAbsolute(dir) ? dir : path$1.join(getAppRoot(), dir)) : [];",
    "    const skillReport = this.syncOpenClawSkillsToHermes({ silent: true });",
    "    const skillCount = countHermesSkills(skillsRoot);",
    "    const primaryModel = openClawConfig?.agents?.defaults?.model?.primary || \"\";",
    "    return {",
    "      status: this.status,",
    "      pid: this.proc?.pid ?? this.dashboardProc?.pid ?? this.apiProc?.pid ?? null,",
    "      memoryMb: this.memoryMb,",
    "      iterations: this.iterations,",
    "      memoryPath: path$1.join(data, \"memories\"),",
    "      model: this.model,",
    "      runtimeRoot: root,",
    "      dataRoot: data,",
    "      configRoot: path$1.join(data, \"config\"),",
    "      logsRoot: path$1.join(data, \"logs\"),",
    "      skillsRoot,",
    "      nodeBin,",
    "      npmBin,",
    "      hermesBin,",
    "      pythonBin: python,",
    "      hermesReady: fs$1.existsSync(hermesBin),",
    "      pythonReady: fs$1.existsSync(python),",
    "      nodeReady: fs$1.existsSync(nodeBin),",
    "      npmReady: fs$1.existsSync(npmBin),",
    "      sourceReady: fs$1.existsSync(path$1.join(root, \"hermes-agent\", \"pyproject.toml\")),",
    "      dataReady: fs$1.existsSync(data),",
    "      configDirReady: fs$1.existsSync(path$1.join(data, \"config\")),",
    "      skillsReady: fs$1.existsSync(skillsRoot),",
    "      skillCount,",
    "      skillVisibleCount: skillReport?.visibleCount || 0,",
    "      skillCommandCount: skillReport?.commandCount || 0,",
    "      skillMissingNames: skillReport?.missingNames || [],",
    "      skillReportPath: skillReport?.reportPath || path$1.join(data, \"reports\", \"skills\", \"visibility-last.json\"),",
    "      skillsUsageTracked: !!skillReport?.usageTracked,",
    "      skillsReport: skillReport,",
    "      modelBridgeReady: !!primaryModel,",
    "      modelBridge: primaryModel || \"未配置 OpenClaw 当前模型\",",
    "      lastError: this.lastError",
    "    };"
  ].join("\n");
  if (source.includes(snapshotAnchor)) {
    source = source.replace(snapshotAnchor, snapshotReplacement);
  } else if (source.includes("  snapshot() {")) {
    const snapshotMethod = [
      "  snapshot() {",
      ...snapshotReplacement.split("\n"),
      "  }",
      ""
    ].join("\n");
    source = replaceMethodBlock(source, "  snapshot() {", "  emitStatus() {", snapshotMethod, "Hermes snapshot method");
  }

  const chatStart = source.indexOf("  async chat(options = {}) {");
  const chatEnd = chatStart >= 0 ? source.indexOf("\n}\nlet hermesManager", chatStart) : -1;
  if (chatStart < 0 || chatEnd < 0) {
    throw new Error("Could not find Hermes chat method in OpenClaw main process.");
  }
  const chatReplacement = [
    "  async chat(options = {}) {",
    "    const message = typeof options.message === \"string\" ? options.message.trim() : \"\";",
    "    if (!message) {",
    "      return { ok: false, error: \"消息不能为空\" };",
    "    }",
    "    const hermesBin = this.getHermesBin();",
    "    if (!fs$1.existsSync(hermesBin)) {",
    "      return { ok: false, error: \"Hermes CLI not found: \" + hermesBin };",
    "    }",
    "    function readJsonSafe(filePath) {",
    "      try {",
    "        if (!fs$1.existsSync(filePath)) return null;",
    "        return JSON.parse(fs$1.readFileSync(filePath, \"utf8\"));",
    "      } catch {",
    "        return null;",
    "      }",
    "    }",
    "    function resolveOpenClawModel() {",
    "      const config = readJsonSafe(path$1.join(getAppRoot(), \"data\", \".openclaw\", \"openclaw.json\"));",
    "      const primary = config?.agents?.defaults?.model?.primary || \"\";",
    "      const parts = String(primary).split(\"/\");",
    "      const providerId = parts.length > 1 ? parts[0] : \"\";",
    "      const modelId = parts.length > 1 ? parts.slice(1).join(\"/\") : primary;",
    "      const providerConfig = providerId ? config?.models?.providers?.[providerId] : null;",
    "      if (!providerConfig) return null;",
    "      return {",
    "        provider: providerId,",
    "        model: modelId,",
    "        apiKey: providerConfig.apiKey || providerConfig.key || \"\",",
    "        baseUrl: providerConfig.baseUrl || providerConfig.base || \"\",",
    "        api: providerConfig.api || \"\"",
    "      };",
    "    }",
    "    function resolveHermesModel() {",
    "      const hub = readJsonSafe(path$1.join(getAppRoot(), \"data\", \".hermes\", \"config\", \"hub.json\"));",
    "      const model = hub?.model || {};",
    "      if (model.apiKey || model.baseUrl || model.model && model.model !== \"hermes-agent\") {",
    "        return { provider: model.provider || \"\", model: model.model || \"\", apiKey: model.apiKey || \"\", baseUrl: model.baseUrl || \"\" };",
    "      }",
    "      return null;",
    "    }",
    "    function mapProvider(provider, baseUrl) {",
    "      const id = String(provider || \"\").toLowerCase();",
    "      const base = String(baseUrl || \"\").toLowerCase();",
    "      if (id === \"qwen\" || base.includes(\"dashscope\")) return \"alibaba\";",
    "      if (id === \"deepseek\" || base.includes(\"deepseek\")) return \"deepseek\";",
    "      if (id === \"kimi\" || id === \"moonshot\" || base.includes(\"moonshot\")) return \"kimi-coding-cn\";",
    "      if (id === \"custom\" || id === \"openai-compatible\") return \"openai-api\";",
    "      return provider || \"openai-api\";",
    "    }",
    "    const runtimeModel = resolveHermesModel() || resolveOpenClawModel() || {};",
    "    try {",
    "      if (!this.proc && !(await this.checkTcpPort(17520))) {",
    "        await this.start({ open: false });",
    "      }",
    "    } catch (err) {",
    "      safeSend(\"hermes-log\", { type: \"stderr\", msg: \"[hermes-chat] background start failed: \" + (err instanceof Error ? err.message : String(err)) });",
    "    }",
    "    this.repairShims();",
    "    const args = [\"--oneshot\", message];",
    "    const provider = typeof options.provider === \"string\" && options.provider.trim() ? options.provider.trim() : mapProvider(runtimeModel.provider, runtimeModel.baseUrl);",
    "    const modelName = typeof options.modelName === \"string\" && options.modelName.trim() ? options.modelName.trim() : runtimeModel.model || \"\";",
    "    if (provider) args.push(\"--provider\", provider);",
    "    if (modelName) args.push(\"--model\", modelName);",
    "    const memoryPath = typeof options.memoryPath === \"string\" && options.memoryPath.trim() ? options.memoryPath.trim() : path$1.join(getAppRoot(), \"data\", \".hermes\", \"memories\");",
    "    const env2 = {",
    "      ...this.getHermesEnv(),",
    "      HERMES_MEMORY_PATH: memoryPath,",
    "      HERMES_ACCEPT_HOOKS: \"1\",",
    "      HERMES_BROWSER_OPENED: \"1\",",
    "      PYTHONIOENCODING: \"utf-8\",",
    "      PYTHONUTF8: \"1\"",
    "    };",
    "    const apiKey = typeof options.apiKey === \"string\" && options.apiKey.trim() ? options.apiKey.trim() : runtimeModel.apiKey || \"\";",
    "    const baseUrl = typeof options.baseUrl === \"string\" && options.baseUrl.trim() ? options.baseUrl.trim() : runtimeModel.baseUrl || \"\";",
    "    if (apiKey) {",
    "      env2.HERMES_API_KEY = apiKey;",
    "      env2.OPENAI_API_KEY = apiKey;",
    "      env2.DASHSCOPE_API_KEY = apiKey;",
    "      env2.DEEPSEEK_API_KEY = apiKey;",
    "      env2.KIMI_CN_API_KEY = apiKey;",
    "    }",
    "    if (baseUrl) {",
    "      env2.HERMES_BASE_URL = baseUrl;",
    "      env2.OPENAI_BASE_URL = baseUrl;",
    "      env2.DASHSCOPE_BASE_URL = baseUrl;",
    "      env2.DEEPSEEK_BASE_URL = baseUrl;",
    "      env2.KIMI_CN_BASE_URL = baseUrl;",
    "    }",
    "    safeSend(\"hermes-log\", { type: \"system\", msg: \"[hermes-chat] starting oneshot: \" + hermesBin + \" provider=\" + (provider || \"auto\") + \" model=\" + (modelName || \"auto\") + \" key=\" + (apiKey ? \"present\" : \"missing\") });",
    "    return await new Promise((resolve) => {",
    "      const child = child_process.spawn(hermesBin, args, {",
    "        cwd: path$1.join(getAppRoot(), \"data\", \".hermes\"),",
    "        env: env2,",
    "        stdio: [\"ignore\", \"pipe\", \"pipe\"],",
    "        windowsHide: true",
    "      });",
    "      let stdout = \"\";",
    "      let stderr = \"\";",
    "      const timer = setTimeout(() => {",
    "        try {",
    "          child.kill(\"SIGKILL\");",
    "        } catch {",
    "        }",
    "        resolve({ ok: false, error: \"Hermes 模型调用超时\" });",
    "      }, 180000);",
    "      child.stdout?.on(\"data\", (data) => {",
    "        stdout += Buffer.from(data).toString(\"utf8\");",
    "      });",
    "      child.stderr?.on(\"data\", (data) => {",
    "        const text = Buffer.from(data).toString(\"utf8\");",
    "        stderr += text;",
    "        safeSend(\"hermes-log\", { type: \"stderr\", msg: \"[chat] \" + text });",
    "      });",
    "      child.on(\"error\", (err) => {",
    "        clearTimeout(timer);",
    "        resolve({ ok: false, error: err.message });",
    "      });",
    "      child.on(\"exit\", (code) => {",
    "        clearTimeout(timer);",
    "        const reply = stdout.trim();",
    "        const errText = stderr.trim();",
    "        if (code !== 0) {",
    "          resolve({ ok: false, error: errText || reply || \"Hermes chat exited with code \" + code });",
    "          return;",
    "        }",
    "        resolve({ ok: true, reply, raw: stdout });",
    "      });",
    "    });",
    "  }"
  ].join("\n");
  source = source.slice(0, chatStart) + chatReplacement + source.slice(chatEnd);
  source = source.replaceAll(
    "\n    this.repairShims();",
    "\n    this.syncOpenClawSkillsToHermes({ silent: false });\n    this.repairShims();"
  );

  fs.writeFileSync(filePath, source, "utf8");
}

function patchHermesSkillBridge(filePath) {
  const marker = "sync-hermes-skills";
  let source = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  if (source.includes(marker)) return;

  const toggleAnchor = [
    "  electron.ipcMain.handle(\"toggle-skill\", async (_, { skillName, enabled }) => {",
    "    try {",
    "      await writeOpenClawConfig({",
    "        skills: {",
    "          entries: {",
    "            [skillName]: { enabled }",
    "          }",
    "        }",
    "      }, \"skills\");",
    "      return { ok: true };",
    "    } catch (err) {",
    "      console.error(\"toggle-skill 失败:\", err);",
    "      return { ok: false, error: err.message };",
    "    }",
    "  });"
  ].join("\n");
  const syncBlock = [
    toggleAnchor,
    "",
    "  electron.ipcMain.handle(\"sync-hermes-skills\", async () => {",
    "    try {",
    "      return getHermesManager().syncOpenClawSkillsToHermes({ silent: false });",
    "      const hermesSkillsRoot = path$1.join(getAppRoot(), \"data\", \".hermes\", \"skills\");",
    "      fs$1.mkdirSync(hermesSkillsRoot, { recursive: true });",
    "      let extraDirs = [];",
    "      let skillEntries = {};",
    "      if (fs$1.existsSync(configPath)) {",
    "        try {",
    "          const config = JSON.parse(fs$1.readFileSync(configPath, \"utf-8\"));",
    "          extraDirs = config.skills?.load?.extraDirs || [];",
    "          skillEntries = config.skills?.entries || {};",
    "        } catch (e) {",
    "          console.warn(\"读取 openclaw skills 配置失败:\", e.message);",
    "        }",
    "      }",
    "      let copied = 0;",
    "      const seen = new Set();",
    "      function copySkillEntry(skillPath, name) {",
    "        if (!name || seen.has(name) || skillEntries[name]?.enabled === false) return;",
    "        seen.add(name);",
    "        const target = path$1.join(hermesSkillsRoot, name.replace(/[\\\\/:*?\\\"<>|]/g, \"_\"));",
    "        fs$1.rmSync(target, { recursive: true, force: true });",
    "        if (fs$1.statSync(skillPath).isDirectory()) {",
    "          fs$1.cpSync(skillPath, target, { recursive: true });",
    "        } else {",
    "          fs$1.mkdirSync(target, { recursive: true });",
    "          fs$1.copyFileSync(skillPath, path$1.join(target, \"SKILL.md\"));",
    "        }",
    "        copied += 1;",
    "      }",
    "      for (const extraDir of extraDirs) {",
    "        let resolvedDir = extraDir;",
    "        if (!path$1.isAbsolute(extraDir)) resolvedDir = path$1.join(path$1.dirname(configDir), extraDir);",
    "        if (!fs$1.existsSync(resolvedDir)) continue;",
    "        for (const entry of fs$1.readdirSync(resolvedDir, { withFileTypes: true })) {",
    "          const skillPath = path$1.join(resolvedDir, entry.name);",
    "          if (entry.isDirectory()) {",
    "            const skillFile = path$1.join(skillPath, \"SKILL.md\");",
    "            if (!fs$1.existsSync(skillFile)) continue;",
    "            const meta = parseSkillMeta(skillFile);",
    "            copySkillEntry(skillPath, meta?.name || entry.name);",
    "          } else if (entry.name.toLowerCase().endsWith(\".md\")) {",
    "            const meta = parseSkillMeta(skillPath);",
    "            copySkillEntry(skillPath, meta?.name || entry.name.replace(/\\.md$/i, \"\"));",
    "          }",
    "        }",
    "      }",
    "      safeSend(\"hermes-log\", { type: \"system\", msg: \"[skills] synced \" + copied + \" OpenClaw skills to Hermes: \" + hermesSkillsRoot });",
    "      return { ok: true, copied, path: hermesSkillsRoot };",
    "    } catch (err) {",
    "      console.error(\"sync-hermes-skills 失败:\", err);",
    "      return { ok: false, error: err.message };",
    "    }",
    "  });"
  ].join("\n");
  if (!source.includes(toggleAnchor)) {
    throw new Error("Could not find toggle-skill IPC block.");
  }
  source = source.replace(toggleAnchor, syncBlock);
  fs.writeFileSync(filePath, source, "utf8");
}

function patchHermesLogAndWechatDiagnostics(filePath) {
  let source = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  if (!source.includes("wechat-login-gateway-restart")) {
    const initAnchor = [
      "function registerWechatIPCHandler({ gateway }) {",
      "  initWechat();"
    ].join("\n");
    const initReplacement = [
      "function registerWechatIPCHandler({ gateway }) {",
      "  initWechat();",
      "  const wechatManagerForGateway = getWechatManagerInstance();",
      "  wechatManagerForGateway?.on(\"login-exit\", async (code) => {",
      "    try {",
      "      if (code === 0 || wechatManagerForGateway.getStatus() === \"connected\") {",
      "        wechatManagerForGateway.emit(\"log\", \"[weixin] login complete, restarting desktop Gateway... /* wechat-login-gateway-restart */\");",
      "        await gateway.restartGateway();",
      "        wechatManagerForGateway.emit(\"log\", \"[weixin] Gateway 已重启，微信账号配置已加载\");",
      "      }",
      "    } catch (err) {",
      "      wechatManagerForGateway?.emit(\"log\", \"[weixin] Gateway 重启失败: \" + (err instanceof Error ? err.message : String(err)));",
      "    }",
      "  });"
    ].join("\n");
    if (!source.includes(initAnchor)) {
      throw new Error("Could not find WeChat IPC init insertion point.");
    }
    source = source.replace(initAnchor, initReplacement);
  }

  if (!source.includes("hermes:getLogs")) {
    const statusAnchor = [
      "  electron.ipcMain.handle(\"hermes:getStatus\", async () => {",
      "    return await getHermesManager().getStatus();",
      "  });"
    ].join("\n");
    const statusReplacement = [
      statusAnchor,
      "  electron.ipcMain.handle(\"hermes:getLogs\", async (_, options = {}) => {",
      "    const limit = Number.isFinite(options?.limit) ? Math.max(1, Math.min(1e3, Number(options.limit))) : 300;",
      "    const logsRoot = path$1.join(getAppRoot(), \"data\", \".hermes\", \"logs\");",
      "    const files = [\"gateway.log\", \"agent.log\", \"errors.log\", \"gui.log\", \"gateway-exit-diag.log\"];",
      "    const rows = [];",
      "    for (const name of files) {",
      "      const filePath = path$1.join(logsRoot, name);",
      "      try {",
      "        if (!fs$1.existsSync(filePath)) continue;",
      "        const lines = fs$1.readFileSync(filePath, \"utf8\").split(/\\r?\\n/).filter(Boolean).slice(-limit);",
      "        for (const line of lines) rows.push({ type: name.includes(\"error\") ? \"stderr\" : \"system\", msg: \"[\" + name + \"] \" + line, file: name });",
      "      } catch (err) {",
      "        rows.push({ type: \"stderr\", msg: \"[\" + name + \"] read failed: \" + err.message, file: name });",
      "      }",
      "    }",
      "    return rows.slice(-limit);",
      "  });"
    ].join("\n");
    if (!source.includes(statusAnchor)) {
      throw new Error("Could not find Hermes status IPC block.");
    }
    source = source.replace(statusAnchor, statusReplacement);
  }

  if (!source.includes("wechat:diagnostics")) {
    const statusAnchor = [
      "  electron.ipcMain.handle(\"get-wechat-status\", () => {",
      "    return getWechatManagerInstance().getStatus();",
      "  });"
    ].join("\n");
    const statusReplacement = [
      "  function getWeChatDiagnostics() {",
      "    const stateRoot = path$1.join(getDataRoot(), \".openclaw\");",
      "    const weixinRoot = path$1.join(stateRoot, \"openclaw-weixin\");",
      "    const indexPath = path$1.join(weixinRoot, \"accounts.json\");",
      "    const accountsDir = path$1.join(weixinRoot, \"accounts\");",
      "    let accountIds = [];",
      "    try {",
      "      if (fs$1.existsSync(indexPath)) {",
      "        const parsed = JSON.parse(fs$1.readFileSync(indexPath, \"utf8\"));",
      "        if (Array.isArray(parsed)) accountIds = parsed.filter((id) => typeof id === \"string\" && id.trim());",
      "      }",
      "    } catch {",
      "      accountIds = [];",
      "    }",
      "    const accountFiles = fs$1.existsSync(accountsDir) ? fs$1.readdirSync(accountsDir).filter((name) => name.endsWith(\".json\")) : [];",
      "    return { stateRoot, weixinRoot, indexPath, accountsDir, indexExists: fs$1.existsSync(indexPath), accountIds, accountFiles, accountCount: accountIds.length || accountFiles.filter((name) => !name.includes(\".sync\") && !name.includes(\"context-tokens\")).length };",
      "  }",
      "  electron.ipcMain.handle(\"get-wechat-status\", () => {",
      "    const status = getWechatManagerInstance().getStatus();",
      "    return { ...(typeof status === \"object\" && status ? status : { status }), diagnostics: getWeChatDiagnostics() };",
      "  });",
      "  electron.ipcMain.handle(\"wechat:diagnostics\", () => getWeChatDiagnostics());"
    ].join("\n");
    if (!source.includes(statusAnchor)) {
      throw new Error("Could not find WeChat status IPC block.");
    }
    source = source.replace(statusAnchor, statusReplacement);
  }

  fs.writeFileSync(filePath, source, "utf8");
}

function patchHermesPreload(filePath) {
  let source = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  if (source.includes("ipcGetHermesLogs") && source.includes("ipcGetWeChatDiagnostics") && source.includes("ipcOnWeChatQrText")) return;
  const anchor = "  ipcToggleSkill: (skillName, enabled) => electron.ipcRenderer.invoke(\"toggle-skill\", { skillName, enabled }),";
  const replacement = [
    anchor,
    "  ipcSyncHermesSkills: () => electron.ipcRenderer.invoke(\"sync-hermes-skills\"),",
    "  ipcGetHermesLogs: (options) => electron.ipcRenderer.invoke(\"hermes:getLogs\", options),",
    "  ipcGetWeChatDiagnostics: () => electron.ipcRenderer.invoke(\"wechat:diagnostics\"),"
  ].join("\n");
  if (!source.includes(anchor)) {
    throw new Error("Could not find preload skill IPC insertion point.");
  }
  source = source.replace(anchor, replacement);
  source = source.replace(
    "  ipcOnWeChatQrUrl: (callback) => electron.ipcRenderer.on(\"wechat-qr-url\", (_, url) => callback(url)),",
    "  ipcOnWeChatQrUrl: (callback) => electron.ipcRenderer.on(\"wechat-qr-url\", (_, url) => callback(url)),\n  ipcOnWeChatQrText: (callback) => electron.ipcRenderer.on(\"wechat-qr-text\", (_, text) => callback(text)),"
  );
  fs.writeFileSync(filePath, source, "utf8");
}

function patchWeChatDiagnosticsUi(filePath) {
  const marker = "codex-wechat-diagnostics-ui";
  let source = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  if (source.includes(marker)) return;

  const setupAnchor = [
    "    const activeChatTab = /* @__PURE__ */ ref(\"wechat\");",
    "    const feishuMode = /* @__PURE__ */ ref(\"auto\");"
  ].join("\n");
  const setupReplacement = [
    "    const activeChatTab = /* @__PURE__ */ ref(\"wechat\");",
    "    const wechatDiagnostics = /* codex-wechat-diagnostics-ui */ ref(null);",
    "    function normalizeWechatStatus(payload) {",
    "      if (payload && typeof payload === \"object\") {",
    "        wechatDiagnostics.value = payload.diagnostics || null;",
    "        return payload.status || \"disconnected\";",
    "      }",
    "      return payload || \"disconnected\";",
    "    }",
    "    function appendWechatDiagnostics(payload) {",
    "      const diag = payload?.diagnostics || payload || wechatDiagnostics.value;",
    "      if (!diag || typeof diag !== \"object\") return;",
    "      wechatDiagnostics.value = diag;",
    "      const count = Number(diag.accountCount || 0);",
    "      if (count > 0) {",
    "        wechatStore.addLog(`[diagnostics] 已发现 ${count} 个微信账号凭据，目录：${diag.weixinRoot || \"未知\"}`);",
    "      } else {",
    "        wechatStore.addLog(`[diagnostics] 未发现微信账号凭据，请重新扫码。账号目录：${diag.weixinRoot || \"未知\"}`);",
    "      }",
    "    }",
    "    const feishuMode = /* @__PURE__ */ ref(\"auto\");"
  ].join("\n");
  if (!source.includes(setupAnchor)) {
    throw new Error("Could not find Chat setup insertion point for WeChat diagnostics.");
  }
  source = source.replace(setupAnchor, setupReplacement);

  source = source.replace(
    "      window.uclaw.ipcGetWeChatStatus();",
    "      window.uclaw.ipcGetWeChatStatus().then((payload) => { setStatus(normalizeWechatStatus(payload)); appendWechatDiagnostics(payload); }).catch(() => {});"
  );
  source = source.replace(
    "      window.uclaw.ipcOnWeChatQrUrl((url) => {\n        console.log(\"WeChat QR URL received:\", url);\n        setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`, \"\");\n      });",
    "      window.uclaw.ipcOnWeChatQrUrl((url) => {\n        console.log(\"WeChat QR URL received:\", url);\n        setStatus(\"scanning\");\n        setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`, \"\");\n      });\n      window.uclaw.ipcOnWeChatQrText?.((text) => {\n        setStatus(\"scanning\");\n        setQrCode(\"\", text);\n      });"
  );
  source = source.replace(
    "    function startScan() {",
    "    async function startScan() {"
  );
  source = source.replace(
    "        const result = window.uclaw.startWeChatScan();",
    "        const result = await window.uclaw.startWeChatScan();"
  );
  source = source.replace(
    "          showToast(result.error, true);",
    "          showToast(result.error, true);\n          try { appendWechatDiagnostics(await window.uclaw.ipcGetWeChatDiagnostics?.()); } catch {}"
  );
  source = source.replace(
    "    function handleWechatStatus(status) {\n      wechatStore.setStatus(status === \"refreshing\" ? \"scanning\" : status);",
    "    function handleWechatStatus(status) {\n      const payload = status && typeof status === \"object\" ? status : { status };\n      const normalized = payload.status || \"disconnected\";\n      const diag = payload.diagnostics;\n      if (diag && typeof diag === \"object\") {\n        const count = Number(diag.accountCount || 0);\n        wechatStore.addLog(count > 0 ? `[diagnostics] 已发现 ${count} 个微信账号凭据，目录：${diag.weixinRoot || \"未知\"}` : `[diagnostics] 未发现微信账号凭据，请重新扫码。账号目录：${diag.weixinRoot || \"未知\"}`);\n      }\n      wechatStore.setStatus(normalized === \"refreshing\" ? \"scanning\" : normalized);"
  );
  source = source.replace(
    "      if (status === \"connected\") {\n        wechatStore.checkInstalled();\n      }",
    "      if (normalized === \"connected\") {\n        wechatStore.checkInstalled();\n      }"
  );
  source = source.replace(
    "        const status = await window.uclaw.ipcGetWeChatStatus();\n        handleWechatStatus(status);",
    "        const status = await window.uclaw.ipcGetWeChatStatus();\n        handleWechatStatus(status);"
  );
  fs.writeFileSync(filePath, source, "utf8");
}

function patchHermesHomeDashboard(filePath) {
  const marker = "home-hermes-card";
  let source = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  if (source.includes(marker)) return;

  const setupAnchor = [
    "    const logs = computed(() => gatewayStore.logs);",
    "    function extractTimestamp(msg) {"
  ].join("\n");
  const setupReplacement = [
    "    const logs = computed(() => gatewayStore.logs);",
    "    const hermesStatus = /* @__PURE__ */ ref({ status: \"idle\" });",
    "    const hermesLogs = /* @__PURE__ */ ref([]);",
    "    const activeLogSource = /* @__PURE__ */ ref(\"openclaw\");",
    "    const hermesPanelTitle = /* @__PURE__ */ ref(\"\");",
    "    const hermesPanelUrl = /* @__PURE__ */ ref(\"\");",
    "    const hermesPanelKind = /* @__PURE__ */ ref(\"\");",
    "    const hermesActionBusy = /* @__PURE__ */ ref(\"\");",
    "    const hermesRunning = computed(() => hermesStatus.value?.status === \"running\");",
    "    const hermesStatusText = computed(() => {",
    "      if (hermesStatus.value?.status === \"running\") return \"运行中\";",
    "      if (hermesStatus.value?.status === \"error\") return \"异常\";",
    "      return \"未启动\";",
    "    });",
    "    const activeLogs = computed(() => activeLogSource.value === \"hermes\" ? hermesLogs.value : logs.value);",
    "    function extractTimestamp(msg) {"
  ].join("\n");
  if (!source.includes(setupAnchor)) {
    throw new Error("Could not find Home log setup block.");
  }
  source = source.replace(setupAnchor, setupReplacement);

  const openAnchor = [
    "    function handleOpen() {",
    "      window.uclaw.ipcOpenDashboard();",
    "    }"
  ].join("\n");
  const openReplacement = [
    openAnchor,
    "    async function refreshHermesStatus() {",
    "      try {",
    "        hermesStatus.value = await window.uclaw.ipcGetHermesStatus();",
    "      } catch (e) {",
    "        hermesStatus.value = { status: \"error\", lastError: e.message };",
    "      }",
    "    }",
    "    function appendHermesLog(log) {",
    "      const typeLabel = { stdout: \"[stdout]\", stderr: \"[stderr]\", system: \"[system]\", error: \"[error]\", exit: \"[exit]\" }[log.type] || \"[log]\";",
    "      const typeColor = { stdout: \"#4ade80\", stderr: \"#f87171\", system: \"#60a5fa\", error: \"#f87171\", exit: \"#a78bfa\" }[log.type] || \"#ffffff\";",
    "      const msg = String(log.msg || \"\");",
    "      hermesLogs.value.push({ id: Date.now() + Math.random(), typeLabel, typeColor, message: cleanLogMessage(msg), timestamp: extractTimestamp(msg) });",
    "      if (hermesLogs.value.length > 500) hermesLogs.value.shift();",
    "      nextTick(() => {",
    "        const container = document.getElementById(\"terminal-logs\");",
    "        if (container && activeLogSource.value === \"hermes\") container.scrollTop = container.scrollHeight;",
    "      });",
    "    }",
    "    async function loadHermesLogs() {",
    "      try {",
    "        const rows = window.uclaw.ipcGetHermesLogs ? await window.uclaw.ipcGetHermesLogs({ limit: 300 }) : [];",
    "        hermesLogs.value = [];",
    "        for (const row of rows || []) appendHermesLog(row);",
    "      } catch (e) {",
    "        appendHermesLog({ type: \"stderr\", msg: \"[ui] Hermes 日志读取失败: \" + e.message });",
    "      }",
    "    }",
    "    function switchLogSource(source) {",
    "      activeLogSource.value = source;",
    "      if (source === \"hermes\" && hermesLogs.value.length === 0) loadHermesLogs();",
    "    }",
    "    async function handleHermesStart() {",
    "      try {",
    "        hermesActionBusy.value = \"start\";",
    "        showToast(\"正在启动 Hermes...\");",
    "        await window.uclaw.ipcStartHermes({ open: false });",
    "        await refreshHermesStatus();",
    "        await loadHermesLogs();",
    "        activeLogSource.value = \"hermes\";",
    "        showToast(\"Hermes 已启动\");",
    "      } catch (e) {",
    "        showToast(\"Hermes 启动失败: \" + e.message, true);",
    "      } finally {",
    "        hermesActionBusy.value = \"\";",
    "      }",
    "    }",
    "    async function handleHermesRestart() {",
    "      try {",
    "        hermesActionBusy.value = \"restart\";",
    "        showToast(\"正在重启 Hermes...\");",
    "        await window.uclaw.ipcStopHermes();",
    "        await window.uclaw.ipcStartHermes({ open: false });",
    "        await refreshHermesStatus();",
    "        await loadHermesLogs();",
    "        activeLogSource.value = \"hermes\";",
    "        showToast(\"Hermes 已重启\");",
    "      } catch (e) {",
    "        showToast(\"Hermes 重启失败: \" + e.message, true);",
    "      } finally {",
    "        hermesActionBusy.value = \"\";",
    "      }",
    "    }",
    "    async function showHermesPanel(kind, title, targetUrl, starter) {",
    "      hermesPanelKind.value = kind;",
    "      hermesPanelTitle.value = title;",
    "      hermesPanelUrl.value = \"\";",
    "      hermesActionBusy.value = kind;",
    "      try {",
    "        showToast(\"正在打开 \" + title + \"...\");",
    "        const status = await starter();",
    "        await refreshHermesStatus();",
    "        const url = targetUrl || status?.configUrl || hermesStatus.value?.configUrl;",
    "        if (kind === \"api\") {",
    "          hermesPanelUrl.value = \"\";",
    "        } else if (window.uclaw.ipcGetHermesFrameUrl) {",
    "          hermesPanelUrl.value = await window.uclaw.ipcGetHermesFrameUrl(url);",
    "        } else {",
    "          hermesPanelUrl.value = url;",
    "        }",
    "        showToast(title + \" 已打开\");",
    "      } catch (e) {",
    "        showToast(title + \" 打开失败: \" + e.message, true);",
    "      } finally {",
    "        hermesActionBusy.value = \"\";",
    "      }",
    "    }",
    "    async function handleHermesConfig() {",
    "      await showHermesPanel(\"config\", \"Hermes 配置中心\", \"http://127.0.0.1:17520\", () => window.uclaw.ipcStartHermes({ open: false }));",
    "    }",
    "    async function handleHermesDashboard() {",
    "      await showHermesPanel(\"dashboard\", \"Hermes Dashboard\", \"http://127.0.0.1:9119\", () => window.uclaw.ipcStartHermesDashboard({ open: false }));",
    "    }",
    "    async function handleHermesApi() {",
    "      await showHermesPanel(\"api\", \"Hermes Agent API\", \"http://127.0.0.1:8642/v1\", () => window.uclaw.ipcStartHermesApiServer({ open: false }));",
    "    }",
    "    async function handleHermesStop() {",
    "      try {",
    "        hermesActionBusy.value = \"stop\";",
    "        await window.uclaw.ipcStopHermes();",
    "        await refreshHermesStatus();",
    "        hermesPanelTitle.value = \"\";",
    "        hermesPanelUrl.value = \"\";",
    "        hermesPanelKind.value = \"\";",
    "        showToast(\"Hermes 已停止\");",
    "      } catch (e) {",
    "        showToast(\"Hermes 停止失败: \" + e.message, true);",
    "      } finally {",
    "        hermesActionBusy.value = \"\";",
    "      }",
    "    }"
  ].join("\n");
  if (!source.includes(openAnchor)) {
    throw new Error("Could not find Home open-dashboard handler in OpenClaw renderer bundle.");
  }
  source = source.replace(openAnchor, openReplacement);

  const mountedAnchor = [
    "      runAllChecks();",
    "      startLiveLogs();"
  ].join("\n");
  source = source.replace(mountedAnchor, "      runAllChecks();\n      refreshHermesStatus();\n      loadHermesLogs();\n      startLiveLogs();");

  const liveLogsAnchor = [
    "        nextTick(() => {",
    "          const container = document.getElementById(\"terminal-logs\");",
    "          if (container) container.scrollTop = container.scrollHeight;",
    "        });",
    "      });",
    "    }"
  ].join("\n");
  const liveLogsReplacement = [
    "        nextTick(() => {",
    "          const container = document.getElementById(\"terminal-logs\");",
    "          if (container && activeLogSource.value === \"openclaw\") container.scrollTop = container.scrollHeight;",
    "        });",
    "      });",
    "      if (window.uclaw.ipcOnHermesLog) window.uclaw.ipcOnHermesLog((log) => appendHermesLog(log));",
    "      if (window.uclaw.ipcOnHermesStatus) window.uclaw.ipcOnHermesStatus((status) => hermesStatus.value = status);",
    "    }"
  ].join("\n");
  if (!source.includes(liveLogsAnchor)) {
    throw new Error("Could not find Home live log closing block.");
  }
  source = source.replace(liveLogsAnchor, liveLogsReplacement);

  source = source.replace(
    "        showToast(\"日志已复制\");\n      }\n    }\n    function clearTerminal() {\n      gatewayStore.clearLogs();\n    }",
    "        showToast(\"日志已复制\");\n      }\n    }\n    function clearTerminal() {\n      if (activeLogSource.value === \"hermes\") {\n        hermesLogs.value = [];\n        return;\n      }\n      gatewayStore.clearLogs();\n    }"
  );

  const panelAnchor = [
    "        ]),",
    "        createBaseVNode(\"div\", _hoisted_10$h, ["
  ].join("\n");
  const hermesPanel = [
    "        ]),",
    "        createBaseVNode(\"div\", { class: \"home-hermes-card\" }, [",
    "          createBaseVNode(\"div\", { class: \"home-hermes-main\" }, [",
    "            createBaseVNode(\"div\", { class: \"home-hermes-icon\" }, \"H\"),",
    "            createBaseVNode(\"div\", { class: \"home-hermes-copy\" }, [",
    "              createBaseVNode(\"div\", { class: \"home-hermes-title\" }, \"Hermes Agent 协同控制台\"),",
    "              createBaseVNode(\"div\", { class: \"home-hermes-desc\" }, \"启动后可在 AI 会话中切换 Hermes 或协同模式；模型默认复用当前 OpenClaw 配置。\"),",
    "              createBaseVNode(\"div\", { class: \"home-hermes-status-row\" }, [",
    "                createBaseVNode(\"span\", {",
    "                  class: normalizeClass([\"home-hermes-status\", hermesRunning.value ? \"running\" : hermesStatus.value?.status === \"error\" ? \"error\" : \"idle\"])",
    "                }, toDisplayString(hermesStatusText.value), 3),",
    "                createBaseVNode(\"span\", null, \"PID: \" + toDisplayString(hermesStatus.value?.pid || \"--\"), 1),",
    "                createBaseVNode(\"span\", null, \"API: \" + toDisplayString(hermesStatus.value?.apiServerReady ? \"已就绪\" : \"未启动\"), 1)",
    "              ])",
    "            ])",
    "          ]),",
    "          createBaseVNode(\"div\", { class: \"home-hermes-actions\" }, [",
    "            !hermesRunning.value ? (openBlock(), createElementBlock(\"button\", { key: 0, class: \"home-hermes-btn primary\", onClick: handleHermesStart, title: \"启动 Hermes 配置服务和本地运行环境\" }, \"启动 Hermes\")) : createCommentVNode(\"\", true),",
    "            hermesRunning.value ? (openBlock(), createElementBlock(\"button\", { key: 1, class: \"home-hermes-btn\", onClick: handleHermesConfig, title: \"打开 Hermes 配置中心\" }, \"配置中心\")) : createCommentVNode(\"\", true),",
    "            hermesRunning.value ? (openBlock(), createElementBlock(\"button\", { key: 2, class: \"home-hermes-btn\", onClick: handleHermesDashboard, title: \"打开 Hermes 官方 Dashboard\" }, \"Dashboard\")) : createCommentVNode(\"\", true),",
    "            hermesRunning.value ? (openBlock(), createElementBlock(\"button\", { key: 3, class: \"home-hermes-btn\", onClick: handleHermesApi, title: \"启动 Hermes OpenAI 兼容 Agent API\" }, \"Agent API\")) : createCommentVNode(\"\", true),",
    "            hermesRunning.value ? (openBlock(), createElementBlock(\"button\", { key: 4, class: \"home-hermes-btn\", onClick: handleHermesRestart, title: \"停止并重新启动 Hermes\" }, \"重启\")) : createCommentVNode(\"\", true),",
    "            hermesRunning.value ? (openBlock(), createElementBlock(\"button\", { key: 5, class: \"home-hermes-btn danger\", onClick: handleHermesStop, title: \"停止 Hermes 配置服务、Dashboard 和 Agent API\" }, \"停止\")) : createCommentVNode(\"\", true)",
    "          ])",
    "        ]),",
    "        hermesPanelTitle.value ? (openBlock(), createElementBlock(\"div\", { key: 6, class: \"home-hermes-panel\" }, [",
    "          createBaseVNode(\"div\", { class: \"home-hermes-panel-head\" }, [",
    "            createBaseVNode(\"div\", null, [",
    "              createBaseVNode(\"strong\", null, toDisplayString(hermesPanelTitle.value), 1),",
    "              createBaseVNode(\"span\", null, toDisplayString(hermesActionBusy.value ? \"正在准备服务...\" : hermesPanelKind.value === \"api\" ? \"本地 OpenAI 兼容接口已准备给外部工具调用\" : \"已在下方内嵌打开\"), 1)",
    "            ]),",
    "            createBaseVNode(\"button\", { class: \"home-hermes-panel-close\", onClick: ($event) => { hermesPanelTitle.value = \"\"; hermesPanelUrl.value = \"\"; hermesPanelKind.value = \"\"; } }, \"收起\")",
    "          ]),",
    "          hermesPanelKind.value === \"api\" ? (openBlock(), createElementBlock(\"div\", { key: 0, class: \"home-hermes-api-info\" }, [",
    "            createBaseVNode(\"div\", null, [createBaseVNode(\"span\", null, \"Base URL\"), createBaseVNode(\"code\", null, \"http://127.0.0.1:8642/v1\")]),",
    "            createBaseVNode(\"div\", null, [createBaseVNode(\"span\", null, \"鉴权\"), createBaseVNode(\"code\", null, \"Bearer openclaw-local-hermes\")]),",
    "            createBaseVNode(\"div\", null, [createBaseVNode(\"span\", null, \"用途\"), createBaseVNode(\"p\", null, \"供本地工具、子代理或 OpenAI 兼容客户端调用 Hermes Agent。普通用户聊天请到 AI 会话中切换 Hermes 或协同模式。\")])",
    "          ])) : hermesPanelUrl.value ? (openBlock(), createElementBlock(\"iframe\", { key: 1, class: \"home-hermes-frame\", src: hermesPanelUrl.value }, null, 8, [\"src\"])) : (openBlock(), createElementBlock(\"div\", { key: 2, class: \"home-hermes-loading\" }, \"正在加载...\"))",
    "        ])) : createCommentVNode(\"\", true),",
    "        createBaseVNode(\"div\", _hoisted_10$h, ["
  ].join("\n");
  if (!source.includes(panelAnchor)) {
    throw new Error("Could not find Home dashboard insertion point in OpenClaw renderer bundle.");
  }
  source = source.replace(panelAnchor, hermesPanel);

  source = source.replace(
    "_cache[15] || (_cache[15] = createBaseVNode(\"span\", { class: \"home-terminal-title\" }, \"实时日志\", -1)),",
    "createBaseVNode(\"div\", { class: \"home-terminal-title-row\" }, [\n              createBaseVNode(\"span\", { class: \"home-terminal-title\" }, \"实时日志\"),\n              createBaseVNode(\"div\", { class: \"home-log-tabs\" }, [\n                createBaseVNode(\"button\", { class: normalizeClass({ active: activeLogSource.value === \"openclaw\" }), onClick: ($event) => switchLogSource(\"openclaw\") }, \"OpenClaw\", 2),\n                createBaseVNode(\"button\", { class: normalizeClass({ active: activeLogSource.value === \"hermes\" }), onClick: ($event) => switchLogSource(\"hermes\") }, \"Hermes\", 2)\n              ])\n            ]),"
  );
  source = source.replaceAll("logs.value.length", "activeLogs.value.length");
  source = source.replace("renderList(logs.value, (log) => {", "renderList(activeLogs.value, (log) => {");
  fs.writeFileSync(filePath, source, "utf8");
}

function patchHermesEnvCheck(filePath) {
  let source = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  if (source.includes("id: \"hermes-cli\"")) {
    source = source.replace(
      "updateItem(\"hermes-skills\", status?.skillsReady ? { status: \"pass\", statusText: \"可用\", detail: `${status.skillCount || 0} 个技能可供 Hermes 使用` } : { status: \"warn\", statusText: \"待同步\", detail: status?.skillsRoot || \"请在技能管理页同步\" });",
      "updateItem(\"hermes-skills\", status?.skillsReady && (status?.skillVisibleCount || 0) > 0 ? { status: \"pass\", statusText: \"可见\", detail: `镜像 ${status.skillCount || 0} 个；Hermes 官方可见 ${status.skillVisibleCount || 0} 个，slash 命令 ${status.skillCommandCount || 0} 个。报告：${status.skillReportPath || \"未生成\"}` } : { status: \"warn\", statusText: \"待验证\", detail: status?.skillReportPath || status?.skillsRoot || \"请在技能管理页同步并验证\" });"
    );
    source = source.replace(
      "updateItem(\"hermes-skills\", status?.skillsReady ? { status: \"pass\", statusText: \"鍙敤\", detail: `${status.skillCount || 0} 涓妧鑳藉彲渚?Hermes 浣跨敤` } : { status: \"warn\", statusText: \"寰呭悓姝\", detail: status?.skillsRoot || \"璇峰湪鎶€鑳界鐞嗛〉鍚屾\" });",
      "updateItem(\"hermes-skills\", status?.skillsReady && (status?.skillVisibleCount || 0) > 0 ? { status: \"pass\", statusText: \"可见\", detail: `镜像 ${status.skillCount || 0} 个；Hermes 官方可见 ${status.skillVisibleCount || 0} 个，slash 命令 ${status.skillCommandCount || 0} 个。报告：${status.skillReportPath || \"未生成\"}` } : { status: \"warn\", statusText: \"待验证\", detail: status?.skillReportPath || status?.skillsRoot || \"请在技能管理页同步并验证\" });"
    );
    fs.writeFileSync(filePath, source, "utf8");
    return;
  }

  const listAnchor = "    { id: \"port\", title: \"端口状态\", icon: \"icon-clawzhandianduankouhao\", status: \"checking\", statusText: \"检测中\", detail: \"\" }\n";
  const listReplacement = [
    "    { id: \"port\", title: \"端口状态\", icon: \"icon-clawzhandianduankouhao\", status: \"checking\", statusText: \"检测中\", detail: \"\" },",
    "    { id: \"hermes-python\", title: \"Hermes Python\", icon: \"icon-clawnodejs\", status: \"checking\", statusText: \"检测中\", detail: \"\" },",
    "    { id: \"hermes-node\", title: \"Hermes Node.js\", icon: \"icon-clawnodejs\", status: \"checking\", statusText: \"检测中\", detail: \"\" },",
    "    { id: \"hermes-cli\", title: \"Hermes CLI\", icon: \"icon-clawopenclaw\", status: \"checking\", statusText: \"检测中\", detail: \"\" },",
    "    { id: \"hermes-data\", title: \"Hermes 数据目录\", icon: \"icon-clawmoxingpeizhi\", status: \"checking\", statusText: \"检测中\", detail: \"\" },",
    "    { id: \"hermes-model\", title: \"Hermes 模型桥接\", icon: \"icon-clawmoxingpeizhi\", status: \"checking\", statusText: \"检测中\", detail: \"\" },",
    "    { id: \"hermes-skills\", title: \"Hermes 技能\", icon: \"icon-clawjinengguanli\", status: \"checking\", statusText: \"检测中\", detail: \"\" },",
    "    { id: \"hermes-ports\", title: \"Hermes 端口\", icon: \"icon-clawzhandianduankouhao\", status: \"checking\", statusText: \"检测中\", detail: \"\" }",
    ""
  ].join("\n");
  if (!source.includes(listAnchor)) {
    throw new Error("Could not find env check item insertion point in OpenClaw renderer bundle.");
  }
  source = source.replace(listAnchor, listReplacement);

  const portAnchor = [
    "  function checkPort() {",
    "    updateItem(\"port\", { status: \"checking\", statusText: \"检测中\", detail: \"\" });",
    "    try {",
    "      updateItem(\"port\", { status: \"pass\", statusText: \"正常\", detail: `端口可用` });",
    "    } catch (e) {",
    "      updateItem(\"port\", { status: \"fail\", statusText: \"异常\", detail: e.message });",
    "    }",
    "  }"
  ].join("\n");
  const portReplacement = [
    portAnchor,
    "  async function checkHermes() {",
    "    for (const id of [\"hermes-python\", \"hermes-node\", \"hermes-cli\", \"hermes-data\", \"hermes-model\", \"hermes-skills\", \"hermes-ports\"]) {",
    "      updateItem(id, { status: \"checking\", statusText: \"检测中\", detail: \"\" });",
    "    }",
    "    try {",
    "      const status = await window.uclaw.ipcGetHermesStatus();",
    "      updateItem(\"hermes-python\", status?.pythonReady ? { status: \"pass\", statusText: \"正常\", detail: status.pythonBin || \"Portable Python 已就绪\" } : { status: \"fail\", statusText: \"缺失\", detail: status?.pythonBin || \"未找到 portable python\" });",
    "      updateItem(\"hermes-node\", status?.nodeReady ? { status: \"pass\", statusText: \"正常\", detail: status.nodeBin || \"Portable Node.js 已就绪\" } : { status: \"warn\", statusText: \"未找到\", detail: status?.nodeBin || \"Hermes Node runtime 待补齐\" });",
    "      updateItem(\"hermes-cli\", status?.hermesReady && status?.sourceReady ? { status: \"pass\", statusText: \"正常\", detail: status.hermesBin || \"Hermes CLI 已就绪\" } : { status: \"fail\", statusText: \"缺失\", detail: status?.lastError || status?.hermesBin || \"Hermes CLI 或源码不完整\" });",
    "      updateItem(\"hermes-data\", status?.dataReady && status?.configDirReady ? { status: \"pass\", statusText: \"零痕迹\", detail: status.dataRoot || \"data/.hermes\" } : { status: \"warn\", statusText: \"待初始化\", detail: status?.dataRoot || \"首次启动后创建 U 盘数据目录\" });",
    "      updateItem(\"hermes-model\", status?.modelBridgeReady ? { status: \"pass\", statusText: \"已桥接\", detail: status.modelBridge } : { status: \"warn\", statusText: \"未配置\", detail: \"在模型配置页应用模型后，Hermes 自动复用\" });",
    "      updateItem(\"hermes-skills\", status?.skillsReady && (status?.skillVisibleCount || 0) > 0 ? { status: \"pass\", statusText: \"可见\", detail: `镜像 ${status.skillCount || 0} 个；Hermes 官方可见 ${status.skillVisibleCount || 0} 个，slash 命令 ${status.skillCommandCount || 0} 个。报告：${status.skillReportPath || \"未生成\"}` } : { status: \"warn\", statusText: \"待验证\", detail: status?.skillReportPath || status?.skillsRoot || \"请在技能管理页同步并验证\" });",
    "      const ports = [`配置 ${status?.configReady ? \"就绪\" : \"未启动\"}`, `Dashboard ${status?.dashboardReady ? \"就绪\" : \"未启动\"}`, `API ${status?.apiServerReady ? \"就绪\" : \"未启动\"}`].join(\" / \");",
    "      updateItem(\"hermes-ports\", status?.configReady || status?.dashboardReady || status?.apiServerReady ? { status: \"pass\", statusText: \"运行中\", detail: ports } : { status: \"warn\", statusText: \"未启动\", detail: \"首页点击启动 Hermes 后检查端口\" });",
    "    } catch (e) {",
    "      for (const id of [\"hermes-python\", \"hermes-node\", \"hermes-cli\", \"hermes-data\", \"hermes-model\", \"hermes-skills\", \"hermes-ports\"]) {",
    "        updateItem(id, { status: \"fail\", statusText: \"异常\", detail: e.message });",
    "      }",
    "    }",
    "  }"
  ].join("\n");
  if (!source.includes(portAnchor)) {
    throw new Error("Could not find checkPort function in OpenClaw renderer bundle.");
  }
  source = source.replace(portAnchor, portReplacement);

  source = source.replace("  function runAllChecks() {\n", "  async function runAllChecks() {\n");
  source = source.replace("    checkPort();\n", "    checkPort();\n    await checkHermes();\n");
  source = source.replace("    checkPort\n", "    checkPort,\n    checkHermes\n");
  source = source.replaceAll("      runAllChecks();\n      gatewayStore.setEnvCheckResults(JSON.parse(JSON.stringify(checkItems.value)));", "      await runAllChecks();\n      gatewayStore.setEnvCheckResults(JSON.parse(JSON.stringify(checkItems.value)));");
  source = source.replace("    if (gatewayStore.envCheckResults) {\n      checkItems.value = JSON.parse(JSON.stringify(gatewayStore.envCheckResults));\n    }\n    async function handleRecheck() {", "    if (gatewayStore.envCheckResults) {\n      checkItems.value = JSON.parse(JSON.stringify(gatewayStore.envCheckResults));\n      setTimeout(async () => {\n        await runAllChecks();\n        gatewayStore.setEnvCheckResults(JSON.parse(JSON.stringify(checkItems.value)));\n      }, 0);\n    }\n    async function handleRecheck() {");
  fs.writeFileSync(filePath, source, "utf8");
}

function patchHermesModelConfig(filePath) {
  let source = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  if (source.includes("model-unified-hermes-note")) return;
  const tabAnchor = "        createBaseVNode(\"div\", _hoisted_12$d, [";
  const note = [
    "        createBaseVNode(\"div\", { class: \"model-unified-hermes-note\" }, [",
    "          createBaseVNode(\"span\", { class: \"model-unified-hermes-mark\" }, \"H\"),",
    "          createBaseVNode(\"span\", null, \"当前应用的模型会同时供 OpenClaw 与 Hermes 使用；Hermes 会话无需单独配置 Key。\")",
    "        ]),",
    tabAnchor
  ].join("\n");
  if (!source.includes(tabAnchor)) {
    throw new Error("Could not find model tab bar insertion point.");
  }
  source = source.replace(tabAnchor, note);
  fs.writeFileSync(filePath, source, "utf8");
}

function patchHermesSkillManagement(filePath) {
  let source = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  const richSyncMessage = "hermesSyncMessage.value = `OpenClaw ${result.sourceCount ?? result.total ?? 0} 个技能，已镜像 ${result.mirroredCount ?? result.copied ?? 0} 个；Hermes 官方可见 ${result.visibleCount ?? 0} 个，slash 命令 ${result.commandCount ?? 0} 个；调用注入 ${result.invocationLoaded ? \"已通过\" : \"未验证\"}${result.invocationCommand ? \"（\" + result.invocationCommand + \"）\" : \"\"}。报告：${result.reportPath || result.path || \"未生成\"}${result.missingNames?.length ? \"；未显示样例：\" + result.missingNames.slice(0, 5).join(\", \") : \"\"}`;";
  if (source.includes("skill-hermes-sync")) {
    source = source.replace(
      "hermesSyncMessage.value = `已同步 ${result.copied || 0} 个技能到 Hermes`;",
      richSyncMessage
    );
    source = source.replace(
      /hermesSyncMessage\.value = `[^`]*\$\{result\.copied \|\| 0\}[^`]*Hermes`;/,
      richSyncMessage
    );
    fs.writeFileSync(filePath, source, "utf8");
    return;
  }

  const setupAnchor = [
    "    const enabledSkills = computed(() => allSkills.value.filter((s) => s.enabled).length);",
    "    function openSkillStore() {"
  ].join("\n");
  const setupReplacement = [
    "    const enabledSkills = computed(() => allSkills.value.filter((s) => s.enabled).length);",
    "    const hermesSyncing = /* @__PURE__ */ ref(false);",
    "    const hermesSyncMessage = /* @__PURE__ */ ref(\"\");",
    "    async function syncHermesSkills() {",
    "      hermesSyncing.value = true;",
    "      hermesSyncMessage.value = \"正在同步已启用技能到 Hermes...\";",
    "      try {",
    "        const result = await window.uclaw.ipcSyncHermesSkills();",
    "        if (!result?.ok) throw new Error(result?.error || \"同步失败\");",
    `        ${richSyncMessage}`,
    "      } catch (err) {",
    "        hermesSyncMessage.value = \"同步失败: \" + (err?.message || err);",
    "      } finally {",
    "        hermesSyncing.value = false;",
    "      }",
    "    }",
    "    function openSkillStore() {"
  ].join("\n");
  if (!source.includes(setupAnchor)) {
    throw new Error("Could not find Skill setup insertion point.");
  }
  source = source.replace(setupAnchor, setupReplacement);

  const storeButtonAnchor = [
    "            createVNode(TechButton, {",
    "              variant: \"primary\",",
    "              size: \"small\",",
    "              onClick: openSkillStore,",
    "              title: \"技能商店\"",
    "            }, {",
    "              icon: withCtx(() => [..._cache[3] || (_cache[3] = [",
    "                createBaseVNode(\"span\", { class: \"iconfont icon-clawwaibutiaozhuanlianjie\" }, null, -1)",
    "              ])]),",
    "              default: withCtx(() => [",
    "                _cache[4] || (_cache[4] = createTextVNode(\" 技能商店 \", -1))",
    "              ]),",
    "              _: 1",
    "            })"
  ].join("\n");
  const buttonReplacement = [
    "            createBaseVNode(\"div\", { class: \"skill-hermes-actions\" }, [",
    "              createVNode(TechButton, {",
    "                variant: \"secondary\",",
    "                size: \"small\",",
    "                loading: hermesSyncing.value,",
    "                onClick: syncHermesSkills,",
    "                title: \"将当前已启用的 OpenClaw 技能同步到 Hermes 技能目录\"",
    "              }, {",
    "                icon: withCtx(() => [_cache[8] || (_cache[8] = createBaseVNode(\"span\", { class: \"iconfont icon-clawzhongqi\" }, null, -1))]),",
    "                default: withCtx(() => [_cache[9] || (_cache[9] = createTextVNode(\" 同步到 Hermes \", -1))]),",
    "                _: 1",
    "              }, 8, [\"loading\"]),",
    storeButtonAnchor,
    "            ])"
  ].join("\n");
  if (!source.includes(storeButtonAnchor)) {
    throw new Error("Could not find Skill store button block.");
  }
  source = source.replace(storeButtonAnchor, buttonReplacement);

  const searchAnchor = [
    "          createBaseVNode(\"div\", _hoisted_7$l, ["
  ].join("\n");
  const searchReplacement = [
    "          hermesSyncMessage.value ? (openBlock(), createElementBlock(\"div\", { key: 0, class: \"skill-hermes-sync\" }, toDisplayString(hermesSyncMessage.value), 1)) : createCommentVNode(\"\", true),",
    "          createBaseVNode(\"div\", _hoisted_7$l, ["
  ].join("\n");
  if (!source.includes(searchAnchor)) {
    throw new Error("Could not find Skill search insertion point.");
  }
  source = source.replace(searchAnchor, searchReplacement);
  fs.writeFileSync(filePath, source, "utf8");
}

function patchHermesAiChat(filePath) {
  let source = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  if (source.includes("agent-mode-switch")) return;

  const refsAnchor = [
    "    const chatInputRef = /* @__PURE__ */ ref(null);",
    "    const messagesArea = /* @__PURE__ */ ref(null);"
  ].join("\n");
  const refsReplacement = [
    "    const chatInputRef = /* @__PURE__ */ ref(null);",
    "    const agentMode = /* @__PURE__ */ ref(\"openclaw\");",
    "    const hermesMessages = /* @__PURE__ */ ref([]);",
    "    const collabMessages = /* @__PURE__ */ ref([]);",
    "    const hermesSending = /* @__PURE__ */ ref(false);",
    "    const hermesInputText = /* @__PURE__ */ ref(\"\");",
    "    const hermesRunState = /* @__PURE__ */ ref(\"\");",
    "    const collabRunState = /* @__PURE__ */ ref(\"\");",
    "    const messagesArea = /* @__PURE__ */ ref(null);"
  ].join("\n");
  if (!source.includes(refsAnchor)) {
    throw new Error("Could not find AiChat refs insertion point.");
  }
  source = source.replace(refsAnchor, refsReplacement);

  const waitingAnchor = [
    "    const isWaitingForAi = computed(() => {",
    "      if (!store.sending) return false;",
    "      const msgs = store.currentMessages;",
    "      if (!msgs.length) return false;",
    "      const last = msgs[msgs.length - 1];",
    "      return last.role === \"user\";",
    "    });"
  ].join("\n");
  const waitingReplacement = [
    "    const activeMessages = computed(() => agentMode.value === \"openclaw\" ? store.currentMessages : agentMode.value === \"collab\" ? collabMessages.value : hermesMessages.value);",
    "    const activeProfile = computed(() => agentMode.value === \"openclaw\" ? store.profile : {",
    "      ...store.profile,",
    "      aiName: agentMode.value === \"collab\" ? \"OpenClaw + Hermes\" : \"Hermes Agent\",",
    "      aiAvatar: \"H\",",
    "      aiAvatarImg: \"\",",
    "      aiColor: \"#4edea3\"",
    "    });",
    "    const activeSending = computed(() => agentMode.value === \"openclaw\" ? store.sending : hermesSending.value);",
    "    const activeReady = computed(() => agentMode.value === \"openclaw\" ? store.isReady : agentMode.value === \"collab\" ? !hermesSending.value && store.isReady : !hermesSending.value);",
    "    const isWaitingForAi = computed(() => {",
    "      if (agentMode.value !== \"openclaw\") return hermesSending.value;",
    "      if (!store.sending) return false;",
    "      const msgs = store.currentMessages;",
    "      if (!msgs.length) return false;",
    "      const last = msgs[msgs.length - 1];",
    "      return last.role === \"user\";",
    "    });"
  ].join("\n");
  if (!source.includes(waitingAnchor)) {
    throw new Error("Could not find AiChat waiting-state block.");
  }
  source = source.replace(waitingAnchor, waitingReplacement);

  const openWebAnchor = [
    "    async function handleOpenWebUI() {",
    "      try {",
    "        if (window.uclaw?.ipcOpenChatWindow) {",
    "          await window.uclaw.ipcOpenChatWindow();",
    "        } else if (window.uclaw?.ipcOpenExternalUrl) {",
    "          const port = window.uclaw.ipcGetDefaultPort ? await window.uclaw.ipcGetDefaultPort() : 18789;",
    "          let token = \"\";",
    "          try {",
    "            if (window.uclaw?.ipcReadConfig) {",
    "              const config = await window.uclaw.ipcReadConfig();",
    "              token = config?.gateway?.auth?.token || \"\";",
    "            }",
    "          } catch {",
    "          }",
    "          const url = token ? `http://127.0.0.1:${port}/?token=${encodeURIComponent(token)}` : `http://127.0.0.1:${port}/`;",
    "          await window.uclaw.ipcOpenExternalUrl(url);",
    "        } else {",
    "          window.open(\"http://127.0.0.1:18789/\", \"_blank\", \"noopener\");",
    "        }",
    "      } catch (e) {",
    "        console.warn(\"[AiChat] open chat window failed:\", e);",
    "      }",
    "    }"
  ].join("\n");
  const openWebReplacement = [
    openWebAnchor,
    "    function selectAgentMode(mode) {",
    "      agentMode.value = mode;",
    "      localStorage.setItem(\"uclaw_agent_mode\", mode);",
    "      nextTick(() => scrollToBottom(0));",
    "    }",
    "    function saveHermesSession() {",
    "      try {",
    "        const state = { hermesMessages: hermesMessages.value, collabMessages: collabMessages.value, input: hermesInputText.value, mode: agentMode.value, runState: hermesRunState.value, collabRunState: collabRunState.value };",
    "        localStorage.setItem(\"uclaw_hermes_chat_state\", JSON.stringify(state));",
    "        window.__uclawHermesChatState = state;",
    "        window.dispatchEvent(new CustomEvent(\"uclaw-hermes-chat-state\"));",
    "      } catch {",
    "      }",
    "    }",
    "    function loadHermesSession() {",
    "      try {",
    "        const liveState = window.__uclawHermesChatState;",
    "        if (liveState) {",
    "          if (Array.isArray(liveState.hermesMessages)) hermesMessages.value = liveState.hermesMessages;",
    "          else if (Array.isArray(liveState.messages)) hermesMessages.value = liveState.messages;",
    "          if (Array.isArray(liveState.collabMessages)) collabMessages.value = liveState.collabMessages;",
    "          if (typeof liveState.input === \"string\") hermesInputText.value = liveState.input;",
    "          if (typeof liveState.runState === \"string\") hermesRunState.value = liveState.runState;",
    "          if (typeof liveState.collabRunState === \"string\") collabRunState.value = liveState.collabRunState;",
    "          if ([\"openclaw\", \"hermes\", \"collab\"].includes(liveState.mode)) agentMode.value = liveState.mode;",
    "        }",
    "        const raw = localStorage.getItem(\"uclaw_hermes_chat_state\");",
    "        if (raw) {",
    "          const state = JSON.parse(raw);",
    "          if (Array.isArray(state.hermesMessages)) hermesMessages.value = state.hermesMessages;",
    "          else if (Array.isArray(state.messages)) hermesMessages.value = state.messages;",
    "          if (Array.isArray(state.collabMessages)) collabMessages.value = state.collabMessages;",
    "          if (typeof state.input === \"string\") hermesInputText.value = state.input;",
    "          if (typeof state.runState === \"string\") hermesRunState.value = state.runState;",
    "          if (typeof state.collabRunState === \"string\") collabRunState.value = state.collabRunState;",
    "        }",
    "        const mode = localStorage.getItem(\"uclaw_agent_mode\");",
    "        if ([\"openclaw\", \"hermes\", \"collab\"].includes(mode)) agentMode.value = mode;",
    "      } catch {",
    "      }",
    "    }",
    "    function handleHermesStateEvent() {",
    "      loadHermesSession();",
    "      nextTick(() => scrollToBottom(0));",
    "    }",
    "    function getHermesReply(result) {",
    "      if (!result) return \"\";",
    "      return result.reply || result.content || result.message || result.text || result.raw || \"Hermes 已返回空响应。\";",
    "    }",
    "    function appendHermesAssistant(content, model = \"Hermes Agent\", status = \"done\") {",
    "      hermesMessages.value = [...hermesMessages.value, {",
    "        id: `hermes-assistant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,",
    "        role: \"assistant\",",
    "        content,",
    "        model,",
    "        timestamp: Date.now(),",
    "        status",
    "      }];",
    "      saveHermesSession();",
    "    }",
    "    function appendCollabAssistant(content, model = \"协同结果\", status = \"done\", meta = {}) {",
    "      collabMessages.value = [...collabMessages.value, {",
    "        id: `collab-assistant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,",
    "        role: \"assistant\",",
    "        content,",
    "        model,",
    "        timestamp: Date.now(),",
    "        status,",
    "        ...meta",
    "      }];",
    "      saveHermesSession();",
    "    }",
    "    function getLatestOpenClawAssistant(afterLength) {",
    "      const messages = store.currentMessages || [];",
    "      const candidates = messages.slice(afterLength).filter((m) => m.role === \"assistant\" && (m.content || m.status === \"error\"));",
    "      return candidates[candidates.length - 1] || null;",
    "    }",
    "    function waitForOpenClawDraft(afterLength, timeoutMs = 13e4) {",
    "      return new Promise((resolve, reject) => {",
    "        const start = Date.now();",
    "        const timer = window.setInterval(() => {",
    "          const draft = getLatestOpenClawAssistant(afterLength);",
    "          if (draft && !draft._streaming && draft.status !== \"streaming\" && !store.sending) {",
    "            window.clearInterval(timer);",
    "            resolve(draft);",
    "            return;",
    "          }",
    "          if (Date.now() - start > timeoutMs) {",
    "            window.clearInterval(timer);",
    "            reject(new Error(\"OpenClaw 草案生成超时\"));",
    "          }",
    "        }, 600);",
    "      });",
    "    }",
    "    async function sendHermesMessage(text2, attachments = []) {",
    "      const content = (text2 || \"\").trim();",
    "      if (!content || hermesSending.value) return;",
    "      const now = Date.now();",
    "      const userMessage = {",
    "        id: `hermes-user-${now}`,",
    "        role: \"user\",",
    "        content,",
    "        attachments,",
    "        timestamp: now,",
    "        status: \"done\"",
    "      };",
    "      hermesMessages.value = [...hermesMessages.value, userMessage];",
    "      hermesSending.value = true;",
    "      hermesRunState.value = \"Hermes 正在调用模型，切换页面不会中断显示记录。\";",
    "      saveHermesSession();",
    "      scrollToBottom();",
    "      try {",
    "        let statusBeforeChat = null;",
    "        try {",
    "          statusBeforeChat = window.uclaw.ipcGetHermesStatus ? await window.uclaw.ipcGetHermesStatus() : null;",
    "        } catch {",
    "          statusBeforeChat = null;",
    "        }",
    "        const hermesWasRunning = statusBeforeChat?.status === \"running\" || statusBeforeChat?.configReady || statusBeforeChat?.dashboardReady || statusBeforeChat?.apiServerReady;",
    "        if (!hermesWasRunning) {",
    "          appendHermesAssistant(\"Hermes 未在首页手动启动，本次发送已自动启动后台服务；首页状态会在刷新后同步。\", \"Hermes 系统\", \"done\");",
    "          hermesRunState.value = \"Hermes 已按需自动启动，正在生成回复。\";",
    "        }",
    "        const result = await window.uclaw.ipcHermesChat({",
    "          message: content,",
    "          messages: hermesMessages.value.map((m) => ({ role: m.role, content: m.content })).filter((m) => m.content),",
    "          sessionId: \"hermes-ai-chat\"",
    "        });",
    "        const ok = result?.ok !== false;",
    "        hermesMessages.value = [...hermesMessages.value, {",
    "          id: `hermes-assistant-${Date.now()}`,",
    "          role: \"assistant\",",
    "          content: ok ? getHermesReply(result) : `Hermes 调用失败: ${result?.error || \"unknown error\"}`,",
    "          model: agentMode.value === \"collab\" ? \"OpenClaw / Hermes 协同\" : \"Hermes Agent\",",
    "          timestamp: Date.now(),",
    "          status: ok ? \"done\" : \"error\"",
    "        }];",
    "        hermesRunState.value = ok ? \"Hermes 已完成回复。\" : \"Hermes 调用失败。\";",
    "      } catch (e) {",
    "        hermesMessages.value = [...hermesMessages.value, {",
    "          id: `hermes-error-${Date.now()}`,",
    "          role: \"assistant\",",
    "          content: \"Hermes 调用失败: \" + (e?.message || e),",
    "          model: \"Hermes Agent\",",
    "          timestamp: Date.now(),",
    "          status: \"error\"",
    "        }];",
    "        hermesRunState.value = \"Hermes 调用失败。\";",
    "      } finally {",
    "        hermesSending.value = false;",
    "        saveHermesSession();",
    "        scrollToBottom();",
    "      }",
    "    }",
    "    async function sendCollaborativeMessage(text2, attachments = []) {",
    "      const content = (text2 || \"\").trim();",
    "      if (!content || hermesSending.value) return;",
    "      if (!store.isReady) {",
    "        appendHermesAssistant(\"协同模式需要先启动 OpenClaw Gateway。请在首页启动 Gateway 后再发送。\", \"协同编排\", \"error\");",
    "        return;",
    "      }",
    "      const now = Date.now();",
    "      hermesMessages.value = [...hermesMessages.value, {",
    "        id: `collab-user-${now}`,",
    "        role: \"user\",",
    "        content,",
    "        attachments,",
    "        timestamp: now,",
    "        status: \"done\"",
    "      }];",
    "      hermesSending.value = true;",
    "      hermesRunState.value = \"协同执行中：OpenClaw 先出草案，Hermes 再复核整理。\";",
    "      saveHermesSession();",
    "      scrollToBottom();",
    "      const beforeLength = store.currentMessages.length;",
    "      try {",
    "        appendHermesAssistant(\"阶段 1/2：OpenClaw 正在生成执行草案...\", \"协同编排\", \"done\");",
    "        await store.sendMessage(content, attachments);",
    "        const draft = await waitForOpenClawDraft(beforeLength);",
    "        const draftText = draft?.content || \"OpenClaw 未返回可用草案。\";",
    "        appendHermesAssistant(draftText, \"OpenClaw 草案\", draft?.status === \"error\" ? \"error\" : \"done\");",
    "        appendHermesAssistant(\"阶段 2/2：Hermes 正在基于 OpenClaw 草案进行复核、补充记忆和技能视角...\", \"协同编排\", \"done\");",
    "        const hermesPrompt = [",
    "          \"你正在作为 Hermes Agent 与 OpenClaw 协同。\",",
    "          \"请基于用户原始问题和 OpenClaw 草案进行复核、补充、纠错和最终整理。\",",
    "          \"要求：保留 OpenClaw 已完成的有效内容；指出必要风险；输出最终可执行答案。\",",
    "          \"\",",
    "          \"用户原始问题：\",",
    "          content,",
    "          \"\",",
    "          \"OpenClaw 草案：\",",
    "          draftText",
    "        ].join(\"\\n\");",
    "        const result = await window.uclaw.ipcHermesChat({",
    "          message: hermesPrompt,",
    "          messages: hermesMessages.value.map((m) => ({ role: m.role, content: m.content })).filter((m) => m.content),",
    "          sessionId: \"openclaw-hermes-collab\"",
    "        });",
    "        const ok = result?.ok !== false;",
    "        appendHermesAssistant(ok ? getHermesReply(result) : `Hermes 协同复核失败: ${result?.error || \"unknown error\"}`, \"Hermes 协同复核\", ok ? \"done\" : \"error\");",
    "        hermesRunState.value = ok ? \"协同流程已完成。\" : \"协同流程失败。\";",
    "      } catch (e) {",
    "        appendHermesAssistant(\"协同流程失败: \" + (e?.message || e), \"协同编排\", \"error\");",
    "        hermesRunState.value = \"协同流程失败。\";",
    "      } finally {",
    "        hermesSending.value = false;",
    "        saveHermesSession();",
    "        scrollToBottom();",
    "      }",
    "    }",
    "    async function sendCollaborativeMessageV2(text2, attachments = []) {",
    "      const content = (text2 || \"\").trim();",
    "      if (!content || hermesSending.value) return;",
    "      if (!store.isReady) {",
    "        appendCollabAssistant(\"协同模式需要先启动 OpenClaw Gateway。请在首页启动 Gateway 后再发送。\", \"协同编排\", \"error\");",
    "        return;",
    "      }",
    "      const now = Date.now();",
    "      collabMessages.value = [...collabMessages.value, {",
    "        id: `collab-user-${now}`,",
    "        role: \"user\",",
    "        content,",
    "        attachments,",
    "        timestamp: now,",
    "        status: \"done\"",
    "      }];",
    "      hermesSending.value = true;",
    "      collabRunState.value = \"协同执行中：OpenClaw 生成内部草案，Hermes 输出统一最终答案。\";",
    "      saveHermesSession();",
    "      scrollToBottom();",
    "      const beforeLength = store.currentMessages.length;",
    "      try {",
    "        appendCollabAssistant(\"阶段 1/2：OpenClaw 正在生成内部草案。\", \"协同编排\", \"done\");",
    "        await store.sendMessage(content, attachments);",
    "        const draft = await waitForOpenClawDraft(beforeLength);",
    "        const draftText = draft?.content || \"OpenClaw 未返回可用草案。\";",
    "        collabMessages.value = collabMessages.value.filter((m) => !(m.model === \"协同编排\" && String(m.content || \"\").startsWith(\"阶段 1/2\")));",
    "        appendCollabAssistant(\"阶段 2/2：Hermes 正在复核内部草案并整理最终答复。\", \"协同编排\", \"done\", { internalDraft: draftText });",
    "        const hermesPrompt = [",
    "          \"你是 OpenClaw + Hermes 协同助手的最终整理者。\",",
    "          \"用户只需要看到一个统一答案，不要分别介绍 OpenClaw 和 Hermes，除非用户明确要求比较两者。\",",
    "          \"OpenClaw 草案仅作为内部参考；如果草案把身份、角色或问题理解错了，请直接纠正，不要重复草案错误。\",",
    "          \"如果用户问‘介绍一下你’或‘你是谁’，请介绍本客户端中的协同助手能力：OpenClaw 负责本地 Gateway、工具和渠道，Hermes 负责记忆、技能、复核与子代理能力。\",",
    "          \"输出最终答案即可，不要写复核报告、不要列草案质量表，除非用户要求审稿。\",",
    "          \"\",",
    "          \"用户问题：\",",
    "          content,",
    "          \"\",",
    "          \"OpenClaw 内部草案：\",",
    "          draftText",
    "        ].join(\"\\n\");",
    "        const result = await window.uclaw.ipcHermesChat({",
    "          message: hermesPrompt,",
    "          messages: collabMessages.value.map((m) => ({ role: m.role, content: m.content })).filter((m) => m.content),",
    "          sessionId: \"openclaw-hermes-collab\"",
    "        });",
    "        const ok = result?.ok !== false;",
    "        collabMessages.value = collabMessages.value.filter((m) => !(m.model === \"协同编排\" && String(m.content || \"\").startsWith(\"阶段 2/2\")));",
    "        appendCollabAssistant(ok ? getHermesReply(result) : `Hermes 协同整理失败: ${result?.error || \"unknown error\"}`, \"协同结果\", ok ? \"done\" : \"error\");",
    "        collabRunState.value = ok ? \"协同流程已完成。\" : \"协同流程失败。\";",
    "      } catch (e) {",
    "        appendCollabAssistant(\"协同流程失败: \" + (e?.message || e), \"协同编排\", \"error\");",
    "        collabRunState.value = \"协同流程失败。\";",
    "      } finally {",
    "        hermesSending.value = false;",
    "        saveHermesSession();",
    "        scrollToBottom();",
    "      }",
    "    }",
    "    async function handleHermesChatConfig() {",
    "      try {",
    "        await window.uclaw.ipcOpenHermesConfig();",
    "        showToast(\"Hermes 配置中心已打开\");",
    "      } catch (e) {",
    "        showToast(\"Hermes 配置中心打开失败: \" + e.message, true);",
    "      }",
    "    }",
    "    async function handleHermesChatApi() {",
    "      try {",
    "        await window.uclaw.ipcOpenHermesApiServer();",
    "        showToast(\"Hermes Agent API 已启动\");",
    "      } catch (e) {",
    "        showToast(\"Hermes Agent API 启动失败: \" + e.message, true);",
    "      }",
    "    }"
  ].join("\n");
  if (!source.includes(openWebAnchor)) {
    throw new Error("Could not find AiChat open-web handler.");
  }
  source = source.replace(openWebAnchor, openWebReplacement);

  const mountedAnchor = [
    "    onMounted(() => {",
    "      nextTick(() => scrollToBottom());",
    "    });"
  ].join("\n");
  const mountedReplacement = [
    "    onMounted(() => {",
    "      loadHermesSession();",
    "      window.addEventListener(\"uclaw-hermes-chat-state\", handleHermesStateEvent);",
    "      nextTick(() => scrollToBottom());",
    "    });"
  ].join("\n");
  if (!source.includes(mountedAnchor)) {
    throw new Error("Could not find AiChat mounted scroll block.");
  }
  source = source.replace(mountedAnchor, mountedReplacement);

  const sendAnchor = [
    "    function handleSend(text2, attachments) {",
    "      store.sendMessage(text2, attachments);",
    "      scrollToBottom();",
    "    }",
    "    function handleCommand(cmd) {",
    "      store.handleCommand(cmd);",
    "      if (cmd === \"/new\" || cmd === \"/reset\") scrollToBottom();",
    "    }"
  ].join("\n");
  const sendReplacement = [
    "    function handleSend(text2, attachments) {",
    "      if (agentMode.value === \"openclaw\") {",
    "        store.sendMessage(text2, attachments);",
    "        scrollToBottom();",
    "        return;",
    "      }",
    "      hermesInputText.value = \"\";",
    "      if (agentMode.value === \"collab\") {",
    "        sendCollaborativeMessageV2(text2, attachments);",
    "        return;",
    "      }",
    "      sendHermesMessage(text2, attachments);",
    "    }",
    "    function handleCommand(cmd) {",
    "      if (agentMode.value === \"openclaw\") {",
    "        store.handleCommand(cmd);",
    "        if (cmd === \"/new\" || cmd === \"/reset\") scrollToBottom();",
    "        return;",
    "      }",
    "      if (cmd === \"/new\" || cmd === \"/reset\") {",
    "        if (agentMode.value === \"collab\") {",
    "          collabMessages.value = [];",
    "          collabRunState.value = \"协同会话已重置。\";",
    "        } else {",
    "          hermesMessages.value = [];",
    "          hermesRunState.value = \"Hermes 会话已重置。\";",
    "        }",
    "        saveHermesSession();",
    "        showToast(\"Hermes 会话已重置\");",
    "        return;",
    "      }",
    "      if (cmd === \"/stop\") {",
    "        showToast(\"Hermes 当前调用会在本轮完成后结束\");",
    "      }",
    "    }",
    "    function handleStop() {",
    "      if (agentMode.value === \"openclaw\") {",
    "        store.abortMessage();",
    "        return;",
    "      }",
    "      showToast(\"Hermes 当前调用会在本轮完成后结束\");",
    "    }"
  ].join("\n");
  if (!source.includes(sendAnchor)) {
    throw new Error("Could not find AiChat send handler.");
  }
  source = source.replace(sendAnchor, sendReplacement);

  const clearAnchor = [
    "    function handleClearSession() {",
    "      if (!store.activeSessionKey) return;",
    "      showClearDialog.value = true;",
    "    }",
    "    async function confirmClear() {",
    "      if (store.activeSessionKey) {",
    "        await store.resetSession(store.activeSessionKey);",
    "        showToast(\"对话已清空\");",
    "      }",
    "      showClearDialog.value = false;",
    "    }"
  ].join("\n");
  const clearReplacement = [
    "    function handleClearSession() {",
    "      if (agentMode.value !== \"openclaw\") {",
    "        if (!(agentMode.value === \"collab\" ? collabMessages.value.length : hermesMessages.value.length)) return;",
    "        showClearDialog.value = true;",
    "        return;",
    "      }",
    "      if (!store.activeSessionKey) return;",
    "      showClearDialog.value = true;",
    "    }",
    "    async function confirmClear() {",
    "      if (agentMode.value !== \"openclaw\") {",
    "        if (agentMode.value === \"collab\") {",
    "          collabMessages.value = [];",
    "          collabRunState.value = \"协同会话已清空。\";",
    "        } else {",
    "          hermesMessages.value = [];",
    "          hermesRunState.value = \"Hermes 会话已清空。\";",
    "        }",
    "        saveHermesSession();",
    "        showToast(\"Hermes 会话已清空\");",
    "        showClearDialog.value = false;",
    "        return;",
    "      }",
    "      if (store.activeSessionKey) {",
    "        await store.resetSession(store.activeSessionKey);",
    "        showToast(\"对话已清空\");",
    "      }",
    "      showClearDialog.value = false;",
    "    }"
  ].join("\n");
  if (!source.includes(clearAnchor)) {
    throw new Error("Could not find AiChat clear handler.");
  }
  source = source.replace(clearAnchor, clearReplacement);

  const gatewayAnchor = [
    "        !unref(gatewayStore).running ? (openBlock(), createElementBlock(\"div\", _hoisted_2$9, [..._cache[14] || (_cache[14] = [",
    "          createBaseVNode(\"div\", { class: \"hint-icon\" }, [",
    "            createBaseVNode(\"span\", { class: \"iconfont icon-clawhuanjingjiancha\" })",
    "          ], -1),",
    "          createBaseVNode(\"h2\", null, \"Gateway 未运行\", -1),",
    "          createBaseVNode(\"p\", null, \"请先在首页启动 Gateway，然后开始对话\", -1)",
    "        ])])) : (openBlock(), createElementBlock(\"div\", _hoisted_3$8, ["
  ].join("\n");
  const gatewayReplacement = [
    "        !unref(gatewayStore).running && agentMode.value === \"openclaw\" ? (openBlock(), createElementBlock(\"div\", _hoisted_2$9, [",
    "          createBaseVNode(\"div\", { class: \"hint-icon\" }, [",
    "            createBaseVNode(\"span\", { class: \"iconfont icon-clawhuanjingjiancha\" })",
    "          ]),",
    "          createBaseVNode(\"h2\", null, \"Gateway 未运行\"),",
    "          createBaseVNode(\"p\", null, \"请先在首页启动 Gateway，或切换到 Hermes Agent 独立会话。\"),",
    "          createBaseVNode(\"div\", { class: \"agent-mode-switch gateway-mode-switch\" }, [",
    "            createBaseVNode(\"button\", { class: \"active\", onClick: ($event) => selectAgentMode(\"openclaw\") }, \"OpenClaw\"),",
    "            createBaseVNode(\"button\", { onClick: ($event) => selectAgentMode(\"hermes\") }, \"Hermes\"),",
    "            createBaseVNode(\"button\", { onClick: ($event) => selectAgentMode(\"collab\") }, \"协同\")",
    "          ])",
    "        ])) : (openBlock(), createElementBlock(\"div\", _hoisted_3$8, ["
  ].join("\n");
  if (!source.includes(gatewayAnchor)) {
    throw new Error("Could not find AiChat gateway hint block.");
  }
  source = source.replace(gatewayAnchor, gatewayReplacement);

  const titleAnchor = [
    "              createBaseVNode(\"span\", _hoisted_11$1, toDisplayString(currentSessionTitle.value), 1),",
    "              createBaseVNode(\"div\", _hoisted_12, ["
  ].join("\n");
  const titleReplacement = [
    "              createBaseVNode(\"span\", _hoisted_11$1, toDisplayString(agentMode.value === \"openclaw\" ? currentSessionTitle.value : agentMode.value === \"collab\" ? \"OpenClaw / Hermes 协同会话\" : \"Hermes Agent 会话\"), 1),",
    "              createBaseVNode(\"div\", { class: \"agent-mode-switch\" }, [",
    "                createBaseVNode(\"button\", {",
    "                  class: normalizeClass({ active: agentMode.value === \"openclaw\" }),",
    "                  onClick: ($event) => selectAgentMode(\"openclaw\")",
    "                }, \"OpenClaw\", 2),",
    "                createBaseVNode(\"button\", {",
    "                  class: normalizeClass({ active: agentMode.value === \"hermes\" }),",
    "                  onClick: ($event) => selectAgentMode(\"hermes\")",
    "                }, \"Hermes\", 2),",
    "                createBaseVNode(\"button\", {",
    "                  class: normalizeClass({ active: agentMode.value === \"collab\" }),",
    "                  onClick: ($event) => selectAgentMode(\"collab\")",
    "                }, \"协同\", 2)",
    "              ]),",
    "              createBaseVNode(\"div\", _hoisted_12, ["
  ].join("\n");
  if (!source.includes(titleAnchor)) {
    throw new Error("Could not find AiChat topbar title insertion point.");
  }
  source = source.replace(titleAnchor, titleReplacement);

  const selectorAnchor = [
    "                createVNode(ModelSelector, {",
    "                  models: sessionModels.value,",
    "                  currentModel: sessionCurrentModelId.value,",
    "                  isReady: unref(store).isReady,",
    "                  loadingModels: loadingModels.value,",
    "                  onSelect: handleModelSelect,",
    "                  onRefresh: handleRefreshModels",
    "                }, null, 8, [\"models\", \"currentModel\", \"isReady\", \"loadingModels\"]),"
  ].join("\n");
  const selectorReplacement = [
    "                agentMode.value === \"openclaw\" ? (openBlock(), createBlock(ModelSelector, {",
    "                  key: 0,",
    "                  models: sessionModels.value,",
    "                  currentModel: sessionCurrentModelId.value,",
    "                  isReady: unref(store).isReady,",
    "                  loadingModels: loadingModels.value,",
    "                  onSelect: handleModelSelect,",
    "                  onRefresh: handleRefreshModels",
    "                }, null, 8, [\"models\", \"currentModel\", \"isReady\", \"loadingModels\"])) : (openBlock(), createElementBlock(\"div\", { key: 1, class: \"hermes-chat-status\" }, toDisplayString(agentMode.value === \"collab\" ? store.isReady ? collabRunState.value || \"协同：OpenClaw 内部草案 -> Hermes 统一答复\" : \"协同需要先启动 Gateway\" : hermesRunState.value || \"Hermes 独立会话；未启动时发送会自动启动后台服务\"), 1)),",
    "                agentMode.value !== \"openclaw\" ? (openBlock(), createElementBlock(\"button\", {",
    "                  key: 2,",
    "                  class: \"icon-btn hermes-open-btn\",",
    "                  onClick: handleHermesChatConfig,",
    "                  title: \"打开 Hermes 配置中心\"",
    "                }, \"配置\")) : createCommentVNode(\"\", true),",
    "                agentMode.value !== \"openclaw\" ? (openBlock(), createElementBlock(\"button\", {",
    "                  key: 3,",
    "                  class: \"icon-btn hermes-open-btn\",",
    "                  onClick: handleHermesChatApi,",
    "                  title: \"启动 Hermes Agent API\"",
    "                }, \"API\")) : createCommentVNode(\"\", true),"
  ].join("\n");
  if (!source.includes(selectorAnchor)) {
    throw new Error("Could not find AiChat model selector block.");
  }
  source = source.replace(selectorAnchor, selectorReplacement);

  source = source.replace(
    "              unref(store).currentMessages.length === 0 ? (openBlock(), createElementBlock(\"div\", _hoisted_13, [..._cache[20] || (_cache[20] = [",
    "              activeMessages.value.length === 0 ? (openBlock(), createElementBlock(\"div\", _hoisted_13, [..._cache[20] || (_cache[20] = ["
  );
  source = source.replace(
    "            }, [\n              activeMessages.value.length === 0 ?",
    "            }, [\n              agentMode.value === \"collab\" ? (openBlock(), createElementBlock(\"div\", { key: \"collab-note\", class: \"hermes-collab-note\" }, \"协作模式：OpenClaw 先生成草案，Hermes 再复核、补充记忆和技能视角，最后输出整理结果。\")) : createCommentVNode(\"\", true),\n              agentMode.value === \"hermes\" ? (openBlock(), createElementBlock(\"div\", { key: \"hermes-note\", class: \"hermes-collab-note\" }, \"Hermes 独立会话会复用模型配置页当前模型，并保存对话状态；切换页面回来仍可继续查看。\")) : createCommentVNode(\"\", true),\n              activeMessages.value.length === 0 ?"
  );
  source = source.replace(
    "              (openBlock(true), createElementBlock(Fragment, null, renderList(unref(store).currentMessages, (msg, idx) => {",
    "              (openBlock(true), createElementBlock(Fragment, null, renderList(activeMessages.value, (msg, idx) => {"
  );
  source = source.replace(
    "                  profile: unref(store).profile",
    "                  profile: activeProfile.value"
  );
  source = source.replace(
    "                }, null, 8, [\"message\", \"profile\"]);",
    "                }, null, 8, [\"message\", \"profile\"]);"
  );
  source = source.replaceAll("unref(store).profile.aiColor", "activeProfile.value.aiColor");
  source = source.replaceAll("unref(store).profile.aiAvatarImg", "activeProfile.value.aiAvatarImg");
  source = source.replaceAll("unref(store).profile.aiAvatar", "activeProfile.value.aiAvatar");

  const unmountedAnchor = [
    "    function handleProfileSave(p2) {",
    "      store.saveProfile(p2);",
    "      showProfile.value = false;",
    "    }",
    "    onUnmounted(() => {",
    "    });"
  ].join("\n");
  const unmountedReplacement = [
    "    function handleProfileSave(p2) {",
    "      store.saveProfile(p2);",
    "      showProfile.value = false;",
    "    }",
    "    onUnmounted(() => {",
    "      window.removeEventListener(\"uclaw-hermes-chat-state\", handleHermesStateEvent);",
    "    });"
  ].join("\n");
  if (!source.includes(unmountedAnchor)) {
    throw new Error("Could not find AiChat unmounted cleanup block.");
  }
  source = source.replace(unmountedAnchor, unmountedReplacement);

  const inputAnchor = [
    "                modelValue: unref(store).inputText,",
    "                \"onUpdate:modelValue\": _cache[3] || (_cache[3] = ($event) => unref(store).inputText = $event),",
    "                isReady: unref(store).isReady,",
    "                sending: unref(store).sending,",
    "                onSend: handleSend,",
    "                onStop: _cache[4] || (_cache[4] = ($event) => unref(store).abortMessage()),",
    "                onCommand: handleCommand",
    "              }, null, 8, [\"modelValue\", \"isReady\", \"sending\"])"
  ].join("\n");
  const inputReplacement = [
    "                modelValue: agentMode.value === \"openclaw\" ? unref(store).inputText : hermesInputText.value,",
    "                \"onUpdate:modelValue\": ($event) => agentMode.value === \"openclaw\" ? unref(store).inputText = $event : hermesInputText.value = $event,",
    "                isReady: activeReady.value,",
    "                sending: activeSending.value,",
    "                onSend: handleSend,",
    "                onStop: handleStop,",
    "                onCommand: handleCommand",
    "              }, null, 8, [\"modelValue\", \"isReady\", \"sending\"])"
  ].join("\n");
  if (!source.includes(inputAnchor)) {
    throw new Error("Could not find AiChat input binding block.");
  }
  source = source.replace(inputAnchor, inputReplacement);

  fs.writeFileSync(filePath, source, "utf8");
}

function patchHermesHomeStyles(filePath) {
  let source = fs.readFileSync(filePath, "utf8");
  if (source.includes(".home-hermes-card")) return;
  source += `

.home-hermes-card {
  margin: 16px 0;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid rgba(173, 198, 255, 0.22);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(34, 42, 61, 0.95), rgba(19, 27, 46, 0.95));
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
}

.home-hermes-main {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.home-hermes-icon {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #4edea3;
  color: #002113;
  font-weight: 800;
}

.home-hermes-copy {
  min-width: 0;
}

.home-hermes-title {
  color: #dae2fd;
  font-size: 16px;
  font-weight: 700;
}

.home-hermes-desc {
  margin-top: 4px;
  color: #c2c6d6;
  font-size: 13px;
  line-height: 1.45;
}

.home-hermes-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.home-hermes-btn {
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(173, 198, 255, 0.28);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #dae2fd;
  cursor: pointer;
}

.home-hermes-btn.primary {
  border-color: #4edea3;
  background: #4edea3;
  color: #002113;
  font-weight: 700;
}

.home-hermes-btn.danger {
  border-color: rgba(255, 179, 173, 0.45);
  color: #ffb3ad;
}

.home-hermes-btn:hover {
  filter: brightness(1.08);
}

.home-hermes-panel {
  margin: -8px 0 16px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
}

.home-hermes-panel-head {
  min-height: 46px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.home-hermes-panel-head strong {
  display: block;
  color: #1f2937;
  font-size: 14px;
}

.home-hermes-panel-head span {
  display: block;
  margin-top: 2px;
  color: #64748b;
  font-size: 12px;
}

.home-hermes-panel-close {
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(100, 116, 139, 0.22);
  border-radius: 7px;
  background: #f8fafc;
  color: #334155;
  cursor: pointer;
}

.home-hermes-frame {
  display: block;
  width: 100%;
  height: min(620px, 68vh);
  border: 0;
  background: #fff;
}

.home-hermes-loading {
  padding: 28px;
  color: #64748b;
  text-align: center;
}

.home-hermes-api-info {
  padding: 14px;
  display: grid;
  gap: 10px;
}

.home-hermes-api-info div {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.home-hermes-api-info span {
  color: #64748b;
  font-size: 13px;
}

.home-hermes-api-info code {
  padding: 5px 7px;
  border-radius: 6px;
  background: #eef2ff;
  color: #1e3a8a;
  word-break: break-all;
}

.home-hermes-api-info p {
  margin: 0;
  color: #334155;
  line-height: 1.5;
  font-size: 13px;
}

@media (max-width: 900px) {
  .home-hermes-card {
    display: grid;
  }

  .home-hermes-actions {
    justify-content: flex-start;
  }
}
`;
  fs.writeFileSync(filePath, source, "utf8");
}

function patchHermesModelStyles(filePath) {
  let source = fs.readFileSync(filePath, "utf8");
  if (source.includes(".model-hermes-panel")) return;
  source += `

.model-hermes-panel {
  padding: 18px;
  border: 1px solid rgba(173, 198, 255, 0.22);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(34, 42, 61, 0.95), rgba(19, 27, 46, 0.95));
}

.model-hermes-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.model-hermes-mark {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #4edea3;
  color: #002113;
  font-weight: 800;
}

.model-hermes-copy h3 {
  margin: 0;
  color: #dae2fd;
  font-size: 18px;
}

.model-hermes-copy p {
  margin: 6px 0 0;
  color: #c2c6d6;
  font-size: 13px;
  line-height: 1.55;
}

.model-hermes-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.model-hermes-btn {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid rgba(173, 198, 255, 0.28);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #dae2fd;
  cursor: pointer;
}

.model-hermes-btn.primary {
  border-color: #4edea3;
  background: #4edea3;
  color: #002113;
  font-weight: 700;
}

.model-hermes-btn:hover {
  filter: brightness(1.08);
}

.model-hermes-notes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.model-hermes-notes span {
  border: 1px solid rgba(173, 198, 255, 0.16);
  border-radius: 8px;
  padding: 6px 8px;
  color: #c2c6d6;
  background: rgba(255, 255, 255, 0.04);
  font-size: 12px;
}
`;
  fs.writeFileSync(filePath, source, "utf8");
}

function patchHermesAiChatStyles(filePath) {
  let source = fs.readFileSync(filePath, "utf8");
  if (source.includes(".agent-mode-switch")) return;
  source += `

.agent-mode-switch {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 29px;
  padding: 2px;
  border: 1px solid rgba(173, 198, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  flex: 0 0 auto;
}

.agent-mode-switch button {
  height: 23px;
  padding: 0 9px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.agent-mode-switch button.active,
.agent-mode-switch button:hover {
  background: #4edea3;
  color: #002113;
}

.gateway-mode-switch {
  margin-top: 16px;
}

.hermes-chat-status {
  height: 29px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  border: 1px solid rgba(78, 222, 163, 0.36);
  border-radius: 8px;
  background: rgba(78, 222, 163, 0.12);
  color: #4edea3;
  font-size: 12px;
  white-space: nowrap;
}

.hermes-open-btn {
  color: #4edea3 !important;
}

@media (max-width: 900px) {
  .chat-topbar[data-v-f16be7f3] {
    flex-wrap: wrap;
  }

  .session-title[data-v-f16be7f3] {
    flex-basis: calc(100% - 42px);
  }

  .agent-mode-switch {
    order: 3;
  }

  .topbar-right[data-v-f16be7f3] {
    order: 4;
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

.hermes-collab-note {
  margin: 10px auto 12px;
  max-width: 760px;
  padding: 9px 12px;
  border: 1px solid rgba(79, 131, 255, 0.2);
  border-radius: 8px;
  background: rgba(79, 131, 255, 0.08);
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.45;
}
`;
  fs.writeFileSync(filePath, source, "utf8");
}

function patchHermesUxStyles(filePath) {
  let source = fs.readFileSync(filePath, "utf8");
  if (source.includes(".model-unified-hermes-note")) return;
  source += `

.home-hermes-status-row {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: #c2c6d6;
  font-size: 12px;
}

.home-hermes-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.home-hermes-status::before {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #94a3b8;
}

.home-hermes-status.running {
  color: #4edea3;
}

.home-hermes-status.running::before {
  background: #4edea3;
}

.home-hermes-status.error {
  color: #ffb3ad;
}

.home-hermes-status.error::before {
  background: #ff6b6b;
}

.home-terminal-title-row,
.home-log-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.home-log-tabs {
  padding: 2px;
  border: 1px solid rgba(100, 116, 139, 0.18);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.04);
}

.home-log-tabs button {
  height: 24px;
  padding: 0 9px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
}

.home-log-tabs button.active {
  background: #4f83ff;
  color: #fff;
}

.model-unified-hermes-note {
  margin: 0 0 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(79, 131, 255, 0.22);
  border-radius: 8px;
  background: rgba(79, 131, 255, 0.08);
  color: #334155;
  font-size: 13px;
}

.model-unified-hermes-mark {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  background: #4edea3;
  color: #002113;
  font-weight: 800;
  flex: 0 0 auto;
}

.skill-hermes-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.skill-hermes-sync {
  margin-top: 10px;
  padding: 9px 12px;
  border: 1px solid rgba(79, 131, 255, 0.22);
  border-radius: 8px;
  background: rgba(79, 131, 255, 0.08);
  color: #334155;
  font-size: 13px;
}
`;
  fs.writeFileSync(filePath, source, "utf8");
}

function patchInstalledWeixinPlugin(usbRootPath) {
  const pluginRoot = path.join(usbRootPath, "data", ".openclaw", "extensions", "openclaw-weixin");
  const apiPath = path.join(pluginRoot, "src", "api", "api.ts");
  if (!fs.existsSync(apiPath)) {
    console.log(`Weixin plugin not installed, skip patch: ${apiPath}`);
    return;
  }
  let source = fs.readFileSync(apiPath, "utf8").replace(/\r\n/g, "\n");
  source = source.replace(
    "    \"Content-Length\": String(Buffer.byteLength(opts.body, \"utf-8\")),\n",
    ""
  );
  if (!source.includes("import https from \"node:https\";")) {
    source = source.replace(
      "import fs from \"node:fs\";\n",
      "import fs from \"node:fs\";\nimport https from \"node:https\";\n"
    );
  }
  const fallbackMarker = "function describeApiFetchError";
  if (!source.includes(fallbackMarker)) {
    const anchor = [
      "function buildHeaders(opts: { token?: string; body: string }): Record<string, string> {",
      "  const headers: Record<string, string> = {"
    ].join("\n");
    const helper = [
      "function describeApiFetchError(err: unknown): string {",
      "  const anyErr = err as { name?: string; message?: string; cause?: { code?: string; name?: string; message?: string } };",
      "  const parts = [anyErr?.name, anyErr?.message].filter(Boolean).join(\": \") || String(err);",
      "  const cause = anyErr?.cause;",
      "  if (!cause) return parts;",
      "  return `${parts}; cause=${[cause.name, cause.code, cause.message].filter(Boolean).join(\"/\")}`;",
      "}",
      "",
      "function postWithHttps(url: URL, headers: Record<string, string>, body: string, timeoutMs: number): Promise<{ status: number; statusText: string; text: string }> {",
      "  return new Promise((resolve, reject) => {",
      "    const req = https.request(url, {",
      "      method: \"POST\",",
      "      headers,",
      "      timeout: timeoutMs,",
      "    }, (res) => {",
      "      const chunks: Buffer[] = [];",
      "      res.on(\"data\", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));",
      "      res.on(\"end\", () => {",
      "        resolve({",
      "          status: res.statusCode ?? 0,",
      "          statusText: res.statusMessage ?? \"\",",
      "          text: Buffer.concat(chunks).toString(\"utf8\"),",
      "        });",
      "      });",
      "    });",
      "    req.on(\"timeout\", () => {",
      "      req.destroy(Object.assign(new Error(`https timeout after ${timeoutMs}ms`), { name: \"AbortError\" }));",
      "    });",
      "    req.on(\"error\", reject);",
      "    req.write(body);",
      "    req.end();",
      "  });",
      "}",
      ""
    ].join("\n");
    if (!source.includes(anchor)) {
      throw new Error("Could not find Weixin api.ts helper insertion point.");
    }
    source = source.replace(anchor, helper + anchor);
  }
  const oldCatch = [
    "  } catch (err) {",
    "    clearTimeout(t);",
    "    throw err;",
    "  }"
  ].join("\n");
  const newCatch = [
    "  } catch (err) {",
    "    clearTimeout(t);",
    "    logger.warn(`${params.label} fetch failed, retrying with node:https: ${describeApiFetchError(err)}`);",
    "    try {",
    "      const fallback = await postWithHttps(url, hdrs, params.body, params.timeoutMs);",
    "      logger.debug(`${params.label} https-fallback status=${fallback.status} raw=${redactBody(fallback.text)}`);",
    "      if (fallback.status < 200 || fallback.status >= 300) {",
    "        throw new Error(`${params.label} ${fallback.status}: ${fallback.text}`);",
    "      }",
    "      return fallback.text;",
    "    } catch (fallbackErr) {",
    "      logger.error(`${params.label} https-fallback failed: ${describeApiFetchError(fallbackErr)}`);",
    "      throw err;",
    "    }",
    "  }"
  ].join("\n");
  if (source.includes(oldCatch) && !source.includes("retrying with node:https")) {
    source = source.replace(oldCatch, newCatch);
  }
  fs.writeFileSync(apiPath, source, "utf8");
  console.log(`Patched Weixin plugin fetch fallback: ${apiPath}`);
}

if (!fs.existsSync(backupRoot)) {
  console.error(`Baseline app is missing: ${backupRoot}`);
  process.exit(1);
}

const baselineHtml = path.join(backupRoot, "dist", "assets", "main", "index.html.bak-hermes-20260616163709");
const baselineHermesFrame = path.join(backupRoot, "dist", "assets", "hermes-frame.html");
for (const required of [
  path.join(backupRoot, "dist", "main", "index.js"),
  path.join(backupRoot, "dist", "preload", "index.js"),
  path.join(backupRoot, "dist", "assets", "assets", "main-DIeui7ZO.js"),
  path.join(backupRoot, "dist", "assets", "main-CAx6YYDG.css"),
  baselineHtml,
  baselineHermesFrame
]) {
  if (!fs.existsSync(required)) {
    console.error(`Required baseline file is missing: ${required}`);
    process.exit(1);
  }
}

fs.mkdirSync(backupsRoot, { recursive: true });
if (fs.existsSync(targetApp)) {
  const backup = path.join(backupsRoot, `app-before-openclaw-shell-restore-${timestamp()}`);
  fs.cpSync(targetApp, backup, { recursive: true });
  console.log(`Backed up current app to ${backup}`);
  fs.rmSync(targetApp, { recursive: true, force: true });
}

fs.mkdirSync(targetApp, { recursive: true });
copyFile(path.join(backupRoot, "package.json"), path.join(targetApp, "package.json"));
copyDir(path.join(backupRoot, "assets"), path.join(targetApp, "assets"));

const mainProcessTarget = path.join(targetApp, "dist", "main", "index.js");
copyFile(path.join(backupRoot, "dist", "main", "index.js"), mainProcessTarget);
patchHermesRuntimeEnv(mainProcessTarget);
patchHermesSkillBridge(mainProcessTarget);
patchHermesLogAndWechatDiagnostics(mainProcessTarget);
patchHermesTrayMenu(mainProcessTarget);
const preloadTarget = path.join(targetApp, "dist", "preload", "index.js");
copyFile(path.join(backupRoot, "dist", "preload", "index.js"), preloadTarget);
patchHermesPreload(preloadTarget);
const rendererTarget = path.join(targetApp, "dist", "assets", "assets", "main-DIeui7ZO.js");
copyFile(path.join(backupRoot, "dist", "assets", "assets", "main-DIeui7ZO.js"), rendererTarget);
patchHermesEnvCheck(rendererTarget);
patchHermesHomeDashboard(rendererTarget);
patchHermesModelConfig(rendererTarget);
patchHermesAiChat(rendererTarget);
patchWeChatDiagnosticsUi(rendererTarget);
patchHermesSkillManagement(rendererTarget);
copyDir(path.join(backupRoot, "dist", "assets", "assets", "styles"), path.join(targetApp, "dist", "assets", "assets", "styles"));
const rendererStyleTarget = path.join(targetApp, "dist", "assets", "main-CAx6YYDG.css");
copyFile(path.join(backupRoot, "dist", "assets", "main-CAx6YYDG.css"), rendererStyleTarget);
patchHermesHomeStyles(rendererStyleTarget);
patchHermesAiChatStyles(rendererStyleTarget);
patchHermesUxStyles(rendererStyleTarget);
copyFile(baselineHtml, path.join(targetApp, "dist", "assets", "main", "index.html"));
copyFile(baselineHermesFrame, path.join(targetApp, "dist", "assets", "hermes-frame.html"));

for (const asset of ["icon.ico", "icon.png", "logo.png"]) {
  const source = path.join(backupRoot, "dist", "assets", asset);
  if (fs.existsSync(source)) copyFile(source, path.join(targetApp, "dist", "assets", asset));
}

patchInstalledWeixinPlugin(usbRoot);

console.log(`Restored original OpenClaw shell to ${targetApp}`);
console.log("Added non-invasive Hermes tray menu entries.");
console.log("Added Hermes controls to the original OpenClaw home console.");
console.log("Added Hermes runtime status to the original environment checks.");
console.log("Unified model configuration for OpenClaw and Hermes.");
console.log("Added OpenClaw / Hermes / collaborative modes to the original AI chat page.");
console.log("Added Hermes skill sync to the original skill management page.");
console.log("Hermes dist-injected patch assets were intentionally not copied.");
