import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const platformId = process.env.MACOS_PORTABLE_PLATFORM || (process.arch === "arm64" ? "macos-arm64" : "macos-x64");
const portableRoot = process.env.MACOS_PORTABLE_ROOT
  ? path.resolve(process.env.MACOS_PORTABLE_ROOT)
  : projectRoot;
const runtimeRoot = process.env.MACOS_PORTABLE_ROOT
  ? path.join(portableRoot, "runtime")
  : path.join(projectRoot, "runtime", platformId);
const python = path.join(runtimeRoot, "python3", "bin", "python3");
const requiredModules = ["pydantic", "requests", "yaml", "pytz", "numpy", "pandas", "pyarrow", "akshare"];

function fail(message) {
  throw new Error(message);
}

function runPython(args, options = {}) {
  return spawnSync(python, args, {
    cwd: options.cwd || portableRoot,
    env: {
      ...process.env,
      HOME: path.join(portableRoot, "data", ".openclaw", "home"),
      OPENCLAW_PORTABLE_ROOT: portableRoot,
      PYTHONUTF8: "1",
      PYTHONIOENCODING: "utf-8",
      PYTHONNOUSERSITE: "1"
    },
    encoding: "utf8",
    windowsHide: true,
    timeout: options.timeout || 120000
  });
}

function assertSourceWiring() {
  const main = fs.readFileSync(path.join(projectRoot, "src", "openclaw-shell-app", "dist", "main", "index.js"), "utf8");
  const build = fs.readFileSync(path.join(projectRoot, "scripts", "build-macos-runtime.mjs"), "utf8");
  const stage = fs.readFileSync(path.join(projectRoot, "scripts", "stage-macos-portable-test.mjs"), "utf8");
  for (const marker of ["OPENCLAW_PORTABLE_ROOT", "PYTHONNOUSERSITE", "portablePythonBinDir"]) {
    if (!main.includes(marker)) fail(`Gateway portable Python wiring is missing: ${marker}`);
  }
  if (!build.includes("ensureOpenClawSkillPython")) fail("macOS runtime builder does not create the OpenClaw skill Python");
  if (!stage.includes('path.join(sourcePlatformRoot, "python3")')) fail("macOS staging does not copy runtime/python3");
}

function verifyImports() {
  if (!fs.existsSync(python)) fail(`Portable OpenClaw skill Python is missing: ${python}`);
  const script = [
    "import importlib, json, pathlib, sys",
    `mods = ${JSON.stringify(requiredModules)}`,
    "versions = {}",
    "for name in mods:",
    "    module = importlib.import_module(name)",
    "    versions[name] = str(getattr(module, '__version__', 'unknown'))",
    "print(json.dumps({'ok': True, 'executable': sys.executable, 'prefix': sys.prefix, 'versions': versions}))"
  ].join("\n");
  const result = runPython(["-I", "-c", script]);
  if (result.status !== 0) {
    fail(`Portable stock skill Python dependencies are incomplete:\n${result.stderr || result.stdout}`);
  }
  const report = JSON.parse(result.stdout.trim());
  if (!path.resolve(report.executable).startsWith(path.resolve(path.join(runtimeRoot, "python3")))) {
    fail(`Python probe escaped the portable runtime: ${report.executable}`);
  }
  return report;
}

function findStockToolRunner() {
  const skillsRoot = process.env.MACOS_STOCK_SKILLS_ROOT
    ? path.resolve(process.env.MACOS_STOCK_SKILLS_ROOT)
    : path.join(portableRoot, "skills");
  const direct = path.join(skillsRoot, "openclaw-data-china-stock", "tool_runner.py");
  return fs.existsSync(direct) ? direct : "";
}

function verifyStockTool() {
  const toolRunner = findStockToolRunner();
  if (!toolRunner) return { skipped: true, reason: "openclaw-data-china-stock was not supplied" };
  const result = runPython([toolRunner, "tool_check_trading_status", "{}"], {
    cwd: path.dirname(toolRunner),
    timeout: 120000
  });
  if (result.status !== 0) fail(`Stock skill tool probe failed:\n${result.stderr || result.stdout}`);
  const report = JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1));
  if (report?.success !== true || !report?.data?.status) fail(`Stock skill returned an invalid result: ${result.stdout}`);
  return { skipped: false, toolRunner, status: report.data.status };
}

assertSourceWiring();
const imports = verifyImports();
const stockTool = verifyStockTool();
console.log(JSON.stringify({ ok: true, platformId, runtimeRoot, imports, stockTool }, null, 2));
