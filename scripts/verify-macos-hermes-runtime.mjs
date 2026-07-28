import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(import.meta.dirname, "..");

function isArm64MachO(filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;
  const header = Buffer.alloc(8);
  const fd = fs.openSync(filePath, "r");
  try {
    if (fs.readSync(fd, header, 0, header.length, 0) !== header.length) return false;
  } finally {
    fs.closeSync(fd);
  }
  return header.readUInt32LE(0) === 0xfeedfacf && header.readUInt32LE(4) === 0x0100000c;
}

function isExecutable(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export function verifyMacosHermesRuntime(releaseRoot, expectedArch = "arm64") {
  const hermesRoot = path.join(releaseRoot, "runtime", "HermesPortable");
  const python = path.join(hermesRoot, "venv", "bin", "python");
  const hermes = path.join(hermesRoot, "venv", "bin", "hermes");
  const embeddedPython = path.join(hermesRoot, "python", "bin", "python3.12");
  const pyproject = path.join(hermesRoot, "hermes-agent", "pyproject.toml");
  const errors = [];

  for (const required of [python, hermes, embeddedPython, pyproject]) {
    if (!fs.existsSync(required)) errors.push(`缺少 ${path.relative(releaseRoot, required)}`);
  }

  const pythonRoot = path.join(hermesRoot, "python");
  if (fs.existsSync(pythonRoot)) {
    const windowsPythonDirs = fs.readdirSync(pythonRoot)
      .filter((name) => /windows/i.test(name));
    for (const name of windowsPythonDirs) {
      errors.push(`混入 Windows Python: ${path.relative(releaseRoot, path.join(pythonRoot, name))}`);
    }
  }
  if (fs.existsSync(path.join(hermesRoot, "venv", "Scripts"))) {
    errors.push("混入 Windows venv: runtime/HermesPortable/venv/Scripts");
  }

  if (expectedArch === "arm64") {
    if (fs.existsSync(python) && !isArm64MachO(python)) {
      errors.push("runtime/HermesPortable/venv/bin/python 不是 macOS arm64 Mach-O");
    }
    if (fs.existsSync(embeddedPython) && !isArm64MachO(embeddedPython)) {
      errors.push("runtime/HermesPortable/python/bin/python3.12 不是 macOS arm64 Mach-O");
    }
  }

  for (const executable of [python, hermes, embeddedPython]) {
    if (fs.existsSync(executable) && !isExecutable(executable)) {
      errors.push(`不可执行 ${path.relative(releaseRoot, executable)}`);
    }
  }

  if (fs.existsSync(hermes)) {
    const firstLine = fs.readFileSync(hermes, "utf8").split(/\r?\n/, 1)[0];
    if (firstLine !== "#!/usr/bin/env python3") {
      errors.push(`Hermes CLI shebang 不可移植: ${firstLine || "(空)"}`);
    }
  }

  let version = "";
  let imports = {};
  if (errors.length === 0) {
    const venvBin = path.dirname(python);
    const pythonRoot = path.join(hermesRoot, "python");
    const sitePackages = path.join(hermesRoot, "venv", "lib", "python3.12", "site-packages");
    const result = spawnSync(hermes, ["--version"], {
      cwd: hermesRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        PYTHONHOME: pythonRoot,
        PYTHONPATH: [sitePackages, path.join(hermesRoot, "hermes-agent")].join(path.delimiter),
        PATH: [venvBin, path.join(pythonRoot, "bin"), process.env.PATH || ""].join(path.delimiter)
      }
    });
    version = `${result.stdout || ""}${result.stderr || ""}`.trim();
    if (result.status !== 0 || !version.includes("Hermes Agent")) {
      errors.push(`Hermes CLI smoke 失败: ${version || `exit=${result.status}`}`);
    }
    const requiredImports = ["typing_extensions", "pydantic", "fastapi", "uvicorn"];
    const importProbe = spawnSync(python, ["-c", [
      "import importlib, json",
      `names = ${JSON.stringify(requiredImports)}`,
      "versions = {}",
      "for name in names:",
      "    module = importlib.import_module(name)",
      "    versions[name] = str(getattr(module, '__version__', 'unknown'))",
      "print(json.dumps(versions))"
    ].join("\n")], {
      cwd: hermesRoot,
      encoding: "utf8",
      timeout: 30000,
      env: {
        ...process.env,
        PYTHONHOME: pythonRoot,
        PYTHONPATH: [sitePackages, path.join(hermesRoot, "hermes-agent")].join(path.delimiter),
        PATH: [venvBin, path.join(pythonRoot, "bin"), process.env.PATH || ""].join(path.delimiter)
      }
    });
    if (importProbe.status !== 0) {
      errors.push(`Hermes Python 核心依赖导入失败: ${importProbe.stderr || importProbe.stdout || `exit=${importProbe.status}`}`);
    } else {
      try {
        imports = JSON.parse(importProbe.stdout.trim());
      } catch {
        errors.push(`Hermes Python import probe 输出无效: ${importProbe.stdout}`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    releaseRoot,
    expectedArch,
    hermesRoot,
    python,
    hermes,
    embeddedPython,
    version,
    imports,
    errors
  };
}

function main() {
  const releaseRoot = path.resolve(process.argv[2] || path.join(projectRoot, "release", "macos-usb-root-exfat"));
  const expectedArch = process.argv[3] || "arm64";
  const report = verifyMacosHermesRuntime(releaseRoot, expectedArch);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exit(1);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main();
