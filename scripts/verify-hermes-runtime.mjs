import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import net from "node:net";
import { resolvePortableRoot } from "./portable-root.mjs";

const usbRoot = resolvePortableRoot();
const hermesRoot = path.join(usbRoot, "runtime", "HermesPortable");
const hermesExe = path.join(hermesRoot, "venv", "Scripts", "hermes.exe");
const venvPythonExe = path.join(hermesRoot, "venv", "Scripts", "python.exe");
const pythonExe = findPortablePython();
const nodeExe = path.join(hermesRoot, "node", "node.exe");
const configServer = path.join(hermesRoot, "lib", "config_server.py");
const hermesSource = path.join(hermesRoot, "hermes-agent", "pyproject.toml");
const venvSitePackages = path.join(hermesRoot, "venv", "Lib", "site-packages");

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

function run(command, args, cwd = hermesRoot) {
  if (!fs.existsSync(command)) return { ok: false, error: `missing: ${command}` };
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    timeout: 30000,
    env: buildHermesEnv()
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim()
  };
}

function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(false));
    socket.connect(port, "127.0.0.1");
  });
}

function buildHermesEnv() {
  const dataRoot = path.join(usbRoot, "data", ".hermes");
  const home = path.join(dataRoot, "home");
  const cache = path.join(dataRoot, "cache");
  const config = path.join(dataRoot, "config");
  const logs = path.join(dataRoot, "logs");
  const temp = path.join(dataRoot, "tmp");
  for (const dir of [dataRoot, home, cache, config, logs, temp]) {
    fs.mkdirSync(dir, { recursive: true });
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
    HERMES_SKILLS_PATH: path.join(dataRoot, "skills"),
    HERMES_BROWSER_OPENED: "1",
    PYTHONIOENCODING: "utf-8",
    PYTHONUTF8: "1",
    PYTHONPATH: [venvSitePackages, path.join(hermesRoot, "hermes-agent"), process.env.PYTHONPATH || ""].filter(Boolean).join(path.delimiter),
    PIP_CACHE_DIR: path.join(cache, "pip"),
    npm_config_cache: path.join(cache, "npm"),
    TMP: temp,
    TEMP: temp,
    [pathKey]: [
      path.join(hermesRoot, "venv", "Scripts"),
      path.join(hermesRoot, "node"),
      path.dirname(pythonExe),
      process.env[pathKey] || ""
    ].join(path.delimiter)
  };
}

const report = {
  checkedAt: new Date().toISOString(),
  hermesRoot,
  files: {
    hermesExe: fs.existsSync(hermesExe),
    pythonExe: fs.existsSync(pythonExe),
    venvPythonExe: fs.existsSync(venvPythonExe),
    nodeExe: fs.existsSync(nodeExe),
    configServer: fs.existsSync(configServer),
    source: fs.existsSync(hermesSource)
  },
  versions: {
    hermes: run(pythonExe, ["-m", "hermes_cli.main", "--version"]),
    python: run(pythonExe, ["--version"]),
    node: run(nodeExe, ["--version"])
  },
  ports: {
    config: await checkPort(17520),
    dashboard: await checkPort(9119),
    api: await checkPort(8642)
  },
  zeroTraceEnv: {
    HERMES_HOME: buildHermesEnv().HERMES_HOME,
    HOME: buildHermesEnv().HOME,
    XDG_CONFIG_HOME: buildHermesEnv().XDG_CONFIG_HOME,
    XDG_CACHE_HOME: buildHermesEnv().XDG_CACHE_HOME
  }
};

console.log(JSON.stringify(report, null, 2));

const requiredMissing = Object.entries(report.files)
  .filter(([, present]) => !present)
  .map(([name]) => name);

if (requiredMissing.length) {
  console.error(`Hermes runtime is incomplete. Missing: ${requiredMissing.join(", ")}`);
  process.exitCode = 1;
}
