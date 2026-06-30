import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const platformId = process.env.MACOS_PORTABLE_PLATFORM || (process.arch === "arm64" ? "macos-arm64" : "macos-x64");
const targetArch = platformId.endsWith("arm64") ? "arm64" : "x64";
const runtimeRoot = path.join(projectRoot, "runtime", platformId);
const cacheRoot = path.join(projectRoot, "release", "runtime-download-cache", platformId);
const buildRoot = path.join(projectRoot, "release", "runtime-build", platformId);
const force = process.env.FORCE_RUNTIME_REBUILD === "1";

const nodeVersion = process.env.NODE_RUNTIME_VERSION || "24.15.0";
const openclawVersion = process.env.OPENCLAW_RUNTIME_VERSION || "2026.6.10";
const hermesRepo = process.env.HERMES_REPO || "https://github.com/NousResearch/hermes-agent.git";
const pythonVersion = process.env.PYTHON_STANDALONE_VERSION || "3.12.13";
const pythonStandaloneTag = process.env.PYTHON_STANDALONE_TAG || "20260623";
const hermesConfigServerUrl = process.env.HERMES_CONFIG_SERVER_URL || "https://raw.githubusercontent.com/yuluyangguang1/hermes-portable/main/lib/config_server.py";
const openclawTemplateNames = ["AGENTS.md", "BOOT.md", "BOOTSTRAP.md", "HEARTBEAT.md", "IDENTITY.md", "SOUL.md", "TOOLS.md", "USER.md"];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || projectRoot,
    env: options.env || process.env,
    stdio: options.capture ? "pipe" : "inherit",
    encoding: options.capture ? "utf8" : undefined,
    windowsHide: true
  });
  if (result.status !== 0) {
    const details = options.capture ? `\n${result.stdout || ""}${result.stderr || ""}` : "";
    fail(`${command} ${args.join(" ")} failed${details}`);
  }
  return result;
}

function commandOutput(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || projectRoot,
    env: options.env || process.env,
    encoding: "utf8",
    stdio: "pipe",
    windowsHide: true
  });
  if (result.status !== 0) return "";
  return `${result.stdout || ""}${result.stderr || ""}`.trim();
}

function envWithPathPrefix(...dirs) {
  const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") || "PATH";
  return {
    ...process.env,
    [pathKey]: [...dirs.filter(Boolean), process.env[pathKey] || ""].join(path.delimiter)
  };
}

function ensureDarwin() {
  if (process.platform !== "darwin") {
    fail("build:runtime:macos must be run on macOS.");
  }
  if (!["macos-arm64", "macos-x64"].includes(platformId)) {
    fail(`Unsupported macOS runtime platform: ${platformId}`);
  }
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function resetDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  mkdirp(dir);
}

function download(url, target) {
  if (!force && fs.existsSync(target) && fs.statSync(target).size > 0) return;
  mkdirp(path.dirname(target));
  console.log(`[download] ${url}`);
  run("curl", ["-L", "--fail", "--retry", "3", "--connect-timeout", "20", "-o", target, url]);
}

function copyDir(source, target, filter = () => true) {
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true, verbatimSymlinks: true, filter });
}

function pathExists(filePath) {
  return fs.existsSync(filePath);
}

function writeFile(filePath, content, mode) {
  mkdirp(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
  if (mode) fs.chmodSync(filePath, mode);
}

function ensureNodeRuntime() {
  const nodeRoot = path.join(runtimeRoot, "node");
  const nodeBin = path.join(nodeRoot, "bin", "node");
  if (!force && commandOutput(nodeBin, ["--version"]) === `v${nodeVersion}`) return nodeBin;

  const nodeDistArch = targetArch === "arm64" ? "arm64" : "x64";
  const archive = path.join(cacheRoot, `node-v${nodeVersion}-darwin-${nodeDistArch}.tar.gz`);
  const extractRoot = path.join(buildRoot, "node-extract");
  download(`https://nodejs.org/dist/v${nodeVersion}/node-v${nodeVersion}-darwin-${nodeDistArch}.tar.gz`, archive);
  resetDir(extractRoot);
  run("tar", ["-xzf", archive, "-C", extractRoot]);
  copyDir(path.join(extractRoot, `node-v${nodeVersion}-darwin-${nodeDistArch}`), nodeRoot);

  const version = commandOutput(nodeBin, ["--version"]);
  if (version !== `v${nodeVersion}`) fail(`Node runtime version mismatch: ${version || "missing"}`);
  return nodeBin;
}

function ensureOpenClawRuntime(nodeBin) {
  const openclawRoot = path.join(runtimeRoot, "openclaw");
  const wrapper = path.join(openclawRoot, "bin", "openclaw");
  const packageRoot = path.join(openclawRoot, "node_modules", "openclaw");
  const packageEntry = path.join(packageRoot, "openclaw.mjs");
  const distRoot = path.join(packageRoot, "dist");
  if (force) fs.rmSync(openclawRoot, { recursive: true, force: true });
  mkdirp(openclawRoot);
  writeFile(path.join(openclawRoot, "package.json"), `${JSON.stringify({
    private: true,
    dependencies: { openclaw: openclawVersion }
  }, null, 2)}\n`);

  const npmBin = path.join(path.dirname(nodeBin), "npm");
  run(npmBin, ["install", "--prefix", openclawRoot, "--omit=dev"], {
    env: envWithPathPrefix(path.dirname(nodeBin))
  });
  writeFile(wrapper, [
    "#!/bin/sh",
    "DIR=\"$(CDPATH= cd -- \"$(dirname -- \"$0\")/..\" && pwd)\"",
    "NODE_DIR=\"$(CDPATH= cd -- \"$DIR/../node/bin\" && pwd)\"",
    "exec \"$NODE_DIR/node\" \"$DIR/node_modules/openclaw/openclaw.mjs\" \"$@\"",
    ""
  ].join("\n"), 0o755);

  if (!pathExists(packageEntry)) fail(`OpenClaw entry is missing: ${packageEntry}`);
  if (!pathExists(distRoot)) fail(`OpenClaw dist is missing: ${distRoot}`);
  repairOpenClawRuntimeTemplates(packageRoot);
  const version = commandOutput(wrapper, ["--version"]);
  if (!version.includes("OpenClaw")) fail(`OpenClaw runtime smoke failed: ${version || "no output"}`);
  return wrapper;
}

function repairOpenClawRuntimeTemplates(packageRoot) {
  const targetRoot = path.join(packageRoot, "src", "agents", "templates");
  const sourceRoot = path.join(packageRoot, "docs", "reference", "templates");
  mkdirp(targetRoot);
  const missing = [];
  for (const name of openclawTemplateNames) {
    const target = path.join(targetRoot, name);
    if (pathExists(target)) continue;
    const source = path.join(sourceRoot, name);
    if (pathExists(source)) {
      fs.copyFileSync(source, target);
      continue;
    }
    missing.push(name);
  }
  if (missing.length) {
    fail(`OpenClaw workspace templates missing: ${missing.join(", ")} under ${sourceRoot}`);
  }
}

function ensurePythonRuntime() {
  const hermesRoot = path.join(runtimeRoot, "HermesPortable");
  const pythonRoot = path.join(hermesRoot, "python");
  const pythonBin = path.join(pythonRoot, "bin", "python3");
  if (!force && commandOutput(pythonBin, ["--version"]).includes(`Python ${pythonVersion}`)) return pythonBin;

  const pythonArch = targetArch === "arm64" ? "aarch64" : "x86_64";
  const asset = `cpython-${pythonVersion}+${pythonStandaloneTag}-${pythonArch}-apple-darwin-install_only_stripped.tar.gz`;
  const archive = path.join(cacheRoot, asset);
  download(`https://github.com/astral-sh/python-build-standalone/releases/download/${pythonStandaloneTag}/${asset}`, archive);

  fs.rmSync(pythonRoot, { recursive: true, force: true });
  mkdirp(pythonRoot);
  run("tar", ["-xzf", archive, "-C", pythonRoot, "--strip-components=1"]);

  const version = commandOutput(pythonBin, ["--version"]);
  if (!version.includes(`Python ${pythonVersion}`)) fail(`Python runtime version mismatch: ${version || "missing"}`);
  return pythonBin;
}

function shouldCopyHermesSource(sourcePath) {
  const blocked = new Set([".git", ".github", "__pycache__", ".pytest_cache", ".ruff_cache", ".mypy_cache", ".venv", "venv", "node_modules"]);
  return !sourcePath.split(path.sep).some((part) => blocked.has(part));
}

function ensureHermesSource() {
  const hermesRoot = path.join(runtimeRoot, "HermesPortable");
  const target = path.join(hermesRoot, "hermes-agent");
  if (!force && pathExists(path.join(target, "pyproject.toml"))) return target;

  const sourceFromEnv = process.env.HERMES_SOURCE_DIR ? path.resolve(process.env.HERMES_SOURCE_DIR) : "";
  const source = sourceFromEnv && pathExists(path.join(sourceFromEnv, "pyproject.toml"))
    ? sourceFromEnv
    : path.join(buildRoot, "hermes-agent-source");

  if (source === path.join(buildRoot, "hermes-agent-source")) {
    fs.rmSync(source, { recursive: true, force: true });
    mkdirp(path.dirname(source));
    run("git", ["clone", "--depth", "1", hermesRepo, source]);
  }

  copyDir(source, target, shouldCopyHermesSource);
  if (!pathExists(path.join(target, "pyproject.toml"))) fail(`Hermes source is missing pyproject.toml: ${target}`);
  return target;
}

function ensureHermesVenv(pythonBin, hermesSource) {
  const hermesRoot = path.join(runtimeRoot, "HermesPortable");
  const venvRoot = path.join(hermesRoot, "venv");
  const venvPython = path.join(venvRoot, "bin", "python");
  const hermesBin = path.join(venvRoot, "bin", "hermes");
  if (force || !pathExists(venvPython)) {
    fs.rmSync(venvRoot, { recursive: true, force: true });
    run(pythonBin, ["-m", "venv", venvRoot]);
  }

  run(venvPython, ["-m", "pip", "install", "--upgrade", "pip", "setuptools", "wheel"]);
  run(venvPython, ["-m", "pip", "install", hermesSource]);

  const version = commandOutput(hermesBin, ["--version"]);
  if (!version.includes("Hermes Agent")) fail(`Hermes CLI smoke failed: ${version || "no output"}`);
  return hermesBin;
}

function readConfigServerTemplate() {
  const candidates = [
    process.env.HERMES_CONFIG_SERVER_SOURCE && path.resolve(process.env.HERMES_CONFIG_SERVER_SOURCE),
    path.join(projectRoot, "src", "runtime", "HermesPortable", "lib", "config_server.py"),
    path.join(projectRoot, "release", "release_runtime", "HermesPortable", "lib", "config_server.py")
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (pathExists(candidate)) return fs.readFileSync(candidate, "utf8");
  }

  const cached = path.join(cacheRoot, "config_server.py");
  download(hermesConfigServerUrl, cached);
  return fs.readFileSync(cached, "utf8");
}

function patchConfigServerTemplate(source) {
  let text = source.replace(/\r\n/g, "\n");
  text = text.replace("import os\n", "import os\nimport shlex\n");
  text = text.replace(
    'DATA_DIR = PORTABLE_ROOT / "data"',
    'DATA_DIR = Path(os.environ.get("HERMES_HOME") or (PORTABLE_ROOT / "data")).expanduser().resolve()'
  );
  text = text.replace(
    'sandbox = PORTABLE_ROOT / "_home"',
    'sandbox = DATA_DIR / "home"'
  );
  text = text.replace(
    [
      '                    \'HERE="$(cd "$(dirname "$0")/.." && pwd)"\\n\'',
      '                    \'cd "$HERE"\\n\'',
      '                    \'export HOME="$HERE/_home"\\n\'',
      '                    \'export HERMES_HOME="$HERE/data"\\n\'',
      '                    \'exec "$HERE/\' + hermes_bin.relative_to(PORTABLE_ROOT).as_posix() + \'" "$@"\\n\''
    ].join("\n"),
    [
      '                    "PORTABLE_ROOT=" + shlex.quote(str(PORTABLE_ROOT)) + "\\n"',
      '                    "HERMES_DATA=" + shlex.quote(str(DATA_DIR)) + "\\n"',
      '                    \'cd "$PORTABLE_ROOT"\\n\'',
      '                    \'export HERMES_HOME="$HERMES_DATA"\\n\'',
      '                    \'export HOME="$HERMES_HOME/home"\\n\'',
      '                    \'exec "$PORTABLE_ROOT/\' + hermes_bin.relative_to(PORTABLE_ROOT).as_posix() + \'" "$@"\\n\''
    ].join("\n")
  );
  return text;
}

function ensureConfigServer(pythonBin) {
  const target = path.join(runtimeRoot, "HermesPortable", "lib", "config_server.py");
  writeFile(target, patchConfigServerTemplate(readConfigServerTemplate()), 0o755);
  const check = commandOutput(pythonBin, ["-m", "py_compile", target]);
  if (check) console.log(check);
  return target;
}

function ensureTrackedPlaceholders() {
  const placeholders = [
    path.join(runtimeRoot, "node", "bin", ".gitkeep"),
    path.join(runtimeRoot, "openclaw", "bin", ".gitkeep"),
    path.join(runtimeRoot, "openclaw", "node_modules", "openclaw", "dist", ".gitkeep"),
    path.join(runtimeRoot, "HermesPortable", "venv", "bin", ".gitkeep")
  ];
  for (const filePath of placeholders) {
    mkdirp(path.dirname(filePath));
    fs.writeFileSync(filePath, "placeholder\n", "utf8");
  }
}

function verifyRequiredPaths() {
  const manifestPath = path.join(projectRoot, "runtime", "PORTABLE-RUNTIME-MANIFEST.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const required = manifest?.platforms?.[platformId]?.requiredPaths || [];
  const missing = required.filter((relPath) => !pathExists(path.join(projectRoot, relPath)));
  if (missing.length) {
    fail(`macOS runtime is still incomplete:\n${missing.map((item) => `- ${item}`).join("\n")}`);
  }
  return required;
}

function main() {
  ensureDarwin();
  mkdirp(cacheRoot);
  mkdirp(buildRoot);
  const nodeBin = ensureNodeRuntime();
  const openclawBin = ensureOpenClawRuntime(nodeBin);
  const pythonBin = ensurePythonRuntime();
  const hermesSource = ensureHermesSource();
  const hermesBin = ensureHermesVenv(pythonBin, hermesSource);
  const configServer = ensureConfigServer(pythonBin);
  ensureTrackedPlaceholders();
  const required = verifyRequiredPaths();
  console.log(JSON.stringify({
    ok: true,
    platformId,
    runtimeRoot,
    node: nodeBin,
    openclaw: openclawBin,
    python: pythonBin,
    hermes: hermesBin,
    configServer,
    requiredPathsChecked: required
  }, null, 2));
}

main();
