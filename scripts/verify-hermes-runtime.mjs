import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import net from "node:net";

const usbRoot = process.env.AGENT_HUB_ROOT || "E:\\";
const hermesRoot = path.join(usbRoot, "runtime", "HermesPortable");
const hermesExe = path.join(hermesRoot, "venv", "Scripts", "hermes.exe");
const pythonExe = path.join(hermesRoot, "venv", "Scripts", "python.exe");
const nodeExe = path.join(hermesRoot, "node", "node.exe");
const configServer = path.join(hermesRoot, "lib", "config_server.py");

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
    nodeExe: fs.existsSync(nodeExe),
    configServer: fs.existsSync(configServer),
    source: fs.existsSync(path.join(hermesRoot, "hermes-agent", "pyproject.toml"))
  },
  versions: {
    hermes: run(hermesExe, ["--version"]),
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
