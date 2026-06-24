import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { resolvePortableRoot } from "./portable-root.mjs";

const usbRoot = resolvePortableRoot();
const hermesRoot = path.join(usbRoot, "runtime", "HermesPortable");
const dataRoot = path.join(usbRoot, "data", ".hermes");
const sourceRoot = path.join(hermesRoot, "hermes-agent");
const venvPythonExe = path.join(hermesRoot, "venv", "Scripts", "python.exe");
const pythonExe = findPortablePython();
const venvSitePackages = path.join(hermesRoot, "venv", "Lib", "site-packages");
const memoryDir = path.join(dataRoot, "memories");
const configPath = path.join(dataRoot, "config.yaml");
const reportPath = path.join(dataRoot, "reports", "memory", "persistence-last.json");

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, value) {
  mkdirp(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function findPortablePython() {
  const exact = path.join(hermesRoot, "python", "cpython-3.12.13-windows-x86_64-none", "python.exe");
  if (fs.existsSync(exact)) return exact;
  const pyRoot = path.join(hermesRoot, "python");
  const stack = fs.existsSync(pyRoot) ? [pyRoot] : [];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && entry.name.toLowerCase() === "python.exe") return full;
    }
  }
  return venvPythonExe;
}

function writeMemoryConfig() {
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
    `    - ${JSON.stringify(path.join(usbRoot, "skills"))}`,
    "paths:",
    `  home: ${JSON.stringify(path.join(dataRoot, "home"))}`,
    `  logs: ${JSON.stringify(path.join(dataRoot, "logs"))}`,
    `  memories: ${JSON.stringify(memoryDir)}`,
    `  skills: ${JSON.stringify(path.join(dataRoot, "skills"))}`,
    ""
  ].join("\n");
  fs.writeFileSync(configPath, yaml, "utf8");
}

function buildHermesEnv() {
  const home = path.join(dataRoot, "home");
  const cache = path.join(dataRoot, "cache");
  const config = path.join(dataRoot, "config");
  const logs = path.join(dataRoot, "logs");
  const tmp = path.join(dataRoot, "tmp");
  for (const dir of [dataRoot, home, cache, config, logs, tmp, memoryDir, path.join(dataRoot, "reports", "memory")]) {
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
    HERMES_MEMORY_PATH: memoryDir,
    HERMES_SKILLS_PATH: path.join(dataRoot, "skills"),
    HERMES_BROWSER_OPENED: "1",
    PYTHONIOENCODING: "utf-8",
    PYTHONUTF8: "1",
    PYTHONPATH: [venvSitePackages, sourceRoot, process.env.PYTHONPATH || ""].filter(Boolean).join(path.delimiter),
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

function verifyOfficialMemory() {
  if (!fs.existsSync(pythonExe)) throw new Error(`missing Python: ${pythonExe}`);
  if (!fs.existsSync(path.join(sourceRoot, "tools", "memory_tool.py"))) {
    throw new Error(`missing Hermes memory tool: ${sourceRoot}`);
  }
  const marker = `openclaw-hermes-memory-verify-${Date.now()}`;
  const script = [
    "import json, sys",
    `sys.path.insert(0, ${JSON.stringify(sourceRoot)})`,
    "from tools.memory_tool import MemoryStore, get_memory_dir",
    "store = MemoryStore(memory_char_limit=2200, user_char_limit=1375)",
    "store.load_from_disk()",
    `marker = ${JSON.stringify(marker)}`,
    "memory_content = f'{marker} memory persistence probe'",
    "user_content = f'{marker} user profile probe'",
    "memory_add = store.add('memory', memory_content)",
    "user_add = store.add('user', user_content)",
    "store.load_from_disk()",
    "memory_seen = memory_content in store.memory_entries",
    "user_seen = user_content in store.user_entries",
    "memory_remove = store.remove('memory', marker)",
    "user_remove = store.remove('user', marker)",
    "store.load_from_disk()",
    "memory_dir = get_memory_dir()",
    "payload = {",
    "  'ok': bool(memory_seen and user_seen and memory_add.get('success') and user_add.get('success')),",
    "  'memoryDir': str(memory_dir),",
    "  'memoryFile': str(memory_dir / 'MEMORY.md'),",
    "  'userFile': str(memory_dir / 'USER.md'),",
    "  'memoryEntryCount': len(store.memory_entries),",
    "  'userEntryCount': len(store.user_entries),",
    "  'memoryFileExists': (memory_dir / 'MEMORY.md').exists(),",
    "  'userFileExists': (memory_dir / 'USER.md').exists(),",
    "  'memoryWritable': bool(memory_add.get('success') and memory_seen),",
    "  'userWritable': bool(user_add.get('success') and user_seen),",
    "  'memorySnapshotReady': store.format_for_system_prompt('memory') is not None,",
    "  'userSnapshotReady': store.format_for_system_prompt('user') is not None,",
    "  'testEntryRemoved': bool(memory_remove.get('success') and user_remove.get('success'))",
    "}",
    "print(json.dumps(payload, ensure_ascii=False))"
  ].join("\n");
  const result = spawnSync(pythonExe, ["-c", script], {
    cwd: dataRoot,
    env: buildHermesEnv(),
    encoding: "utf8",
    windowsHide: true,
    timeout: 45000
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `memory verification failed: ${result.status}`).trim());
  }
  return JSON.parse(result.stdout.trim());
}

let report;
try {
  writeMemoryConfig();
  const official = verifyOfficialMemory();
  report = {
    ok: !!official.ok,
    checkedAt: new Date().toISOString(),
    memoryEnabled: true,
    userProfileEnabled: true,
    memoryDir,
    memoryFile: path.join(memoryDir, "MEMORY.md"),
    userFile: path.join(memoryDir, "USER.md"),
    configPath,
    reportPath,
    memoryEntryCount: official.memoryEntryCount || 0,
    userEntryCount: official.userEntryCount || 0,
    memoryFileExists: !!official.memoryFileExists,
    userFileExists: !!official.userFileExists,
    memoryWritable: !!official.memoryWritable,
    userWritable: !!official.userWritable,
    memorySnapshotReady: !!official.memorySnapshotReady,
    userSnapshotReady: !!official.userSnapshotReady,
    testEntryRemoved: !!official.testEntryRemoved
  };
} catch (error) {
  report = {
    ok: false,
    checkedAt: new Date().toISOString(),
    memoryEnabled: true,
    userProfileEnabled: true,
    memoryDir,
    memoryFile: path.join(memoryDir, "MEMORY.md"),
    userFile: path.join(memoryDir, "USER.md"),
    configPath,
    reportPath,
    memoryEntryCount: 0,
    userEntryCount: 0,
    memoryFileExists: fs.existsSync(path.join(memoryDir, "MEMORY.md")),
    userFileExists: fs.existsSync(path.join(memoryDir, "USER.md")),
    memoryWritable: false,
    userWritable: false,
    memorySnapshotReady: false,
    userSnapshotReady: false,
    testEntryRemoved: false,
    error: error instanceof Error ? error.message : String(error)
  };
}

writeJson(reportPath, report);
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
