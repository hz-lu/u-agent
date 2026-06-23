import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { resolvePortableRoot } from "./portable-root.mjs";

const usbRoot = resolvePortableRoot();
const hermesRoot = path.join(usbRoot, "runtime", "HermesPortable");
const dataRoot = path.join(usbRoot, "data", ".hermes");
const logsRoot = path.join(dataRoot, "logs");
const reportPath = path.join(logsRoot, "startup-diagnose.json");
const launcherLog = path.join(logsRoot, "startup-diagnose.log");
const hermesExe = path.join(hermesRoot, "venv", "Scripts", "hermes.exe");
const pythonExe = path.join(hermesRoot, "venv", "Scripts", "python.exe");
const configServer = path.join(hermesRoot, "lib", "config_server.py");

fs.mkdirSync(logsRoot, { recursive: true });

function appendLog(line) {
  fs.appendFileSync(launcherLog, `[${new Date().toISOString()}] ${line}\n`, "utf8");
}

function buildHermesEnv() {
  const home = path.join(dataRoot, "home");
  const cache = path.join(dataRoot, "cache");
  const config = path.join(dataRoot, "config");
  const temp = path.join(dataRoot, "tmp");
  for (const dir of [dataRoot, home, cache, config, logsRoot, temp, path.join(dataRoot, "memories"), path.join(dataRoot, "skills")]) {
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
    HERMES_LOG_DIR: logsRoot,
    HERMES_MEMORY_PATH: path.join(dataRoot, "memories"),
    HERMES_SKILLS_PATH: path.join(dataRoot, "skills"),
    HERMES_BROWSER_OPENED: "1",
    PYTHONIOENCODING: "utf-8",
    PYTHONUTF8: "1",
    TMP: temp,
    TEMP: temp,
    [pathKey]: [
      path.join(hermesRoot, "venv", "Scripts"),
      path.join(hermesRoot, "node"),
      path.dirname(pythonExe),
      process.env[pathKey] || ""
    ].filter(Boolean).join(path.delimiter)
  };
}

function runShort(command, args, cwd = hermesRoot) {
  if (!fs.existsSync(command)) return { ok: false, error: `missing: ${command}` };
  appendLog(`run ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd,
    env: buildHermesEnv(),
    encoding: "utf8",
    windowsHide: true,
    timeout: 20000
  });
  return {
    ok: result.status === 0,
    status: result.status,
    signal: result.signal,
    error: result.error?.message || "",
    stdout: (result.stdout || "").trim().slice(-4000),
    stderr: (result.stderr || "").trim().slice(-4000)
  };
}

function startConfigProbe() {
  if (!fs.existsSync(pythonExe) || !fs.existsSync(configServer)) {
    return Promise.resolve({ ok: false, error: "missing python.exe or config_server.py" });
  }
  appendLog(`spawn config server ${pythonExe} ${configServer}`);
  return new Promise((resolve) => {
    const child = spawn(pythonExe, [configServer], {
      cwd: hermesRoot,
      env: buildHermesEnv(),
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (payload) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        if (!child.killed) child.kill();
      } catch {
      }
      resolve({
        ...payload,
        pid: child.pid || null,
        stdout: stdout.trim().slice(-4000),
        stderr: stderr.trim().slice(-4000)
      });
    };
    const timer = setTimeout(() => finish({ ok: true, stillRunningAfterMs: 5000 }), 5000);
    child.stdout?.on("data", (chunk) => {
      const text = Buffer.from(chunk).toString("utf8");
      stdout += text;
      appendLog(`[config stdout] ${text.trim()}`);
    });
    child.stderr?.on("data", (chunk) => {
      const text = Buffer.from(chunk).toString("utf8");
      stderr += text;
      appendLog(`[config stderr] ${text.trim()}`);
    });
    child.on("error", (err) => finish({ ok: false, error: err.message }));
    child.on("exit", (code, signal) => finish({ ok: code === 0, exitedEarly: true, code, signal }));
  });
}

const report = {
  checkedAt: new Date().toISOString(),
  usbRoot,
  hermesRoot,
  dataRoot,
  logsRoot,
  files: {
    hermesExe: fs.existsSync(hermesExe),
    pythonExe: fs.existsSync(pythonExe),
    configServer: fs.existsSync(configServer)
  },
  versions: {
    python: runShort(pythonExe, ["--version"]),
    hermes: runShort(hermesExe, ["--version"])
  },
  configProbe: await startConfigProbe()
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
console.log(`Hermes startup diagnose report: ${reportPath}`);
console.log(`Hermes startup diagnose log: ${launcherLog}`);

if (!report.files.hermesExe || !report.files.pythonExe || !report.files.configServer || !report.versions.python.ok || !report.versions.hermes.ok || !report.configProbe.ok) {
  process.exitCode = 1;
}
