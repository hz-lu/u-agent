import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import extractZip from "extract-zip";

const projectRoot = path.resolve(import.meta.dirname, "..");
const preferredSourceRuntimeRoot = path.resolve(process.env.RUNTIME_SOURCE_ROOT || path.join(projectRoot, "src", "runtime"));
const releaseRoot = path.join(projectRoot, "release");
const stagingRoot = path.join(releaseRoot, "windows-runtime-required-staging");
const stagingRuntimeRoot = path.join(stagingRoot, "runtime");
const zipPath = path.join(releaseRoot, "OpenClawPro-AgentHub-Windows-Runtime-Required.zip");
const manifestSourcePath = path.join(projectRoot, "runtime", "PORTABLE-RUNTIME-MANIFEST.json");
let sourceRuntimeRoot = preferredSourceRuntimeRoot;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readJsonRequired(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Unable to read JSON: ${filePath}\n${error.message}`);
  }
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(source, target) {
  mkdirp(path.dirname(target));
  fs.copyFileSync(source, target);
  fs.chmodSync(target, fs.statSync(source).mode);
}

function shouldSkipRuntimeRel(relPath, forbiddenRuntimePaths) {
  const rel = relPath.replace(/\\/g, "/");
  const parts = rel.split("/");
  const base = parts[parts.length - 1];
  if (base === ".DS_Store" || base === "Thumbs.db") return true;
  if (base === "__pycache__" || base === ".pytest_cache" || base === ".mypy_cache") return true;
  if (base.endsWith(".pyc") || base.endsWith(".pyo")) return true;
  if (rel.includes("/.git/") || rel.startsWith(".git/")) return true;
  if (rel.includes("/.cache/") || rel.startsWith(".cache/")) return true;
  if (rel.includes("/tests/") || rel.includes("/benchmarks/")) return true;
  return forbiddenRuntimePaths.some((prefix) => rel === prefix || rel.startsWith(`${prefix}/`));
}

function copyRuntimeEntry(sourceRel, targetRel, forbiddenRuntimePaths) {
  const source = path.join(sourceRuntimeRoot, sourceRel);
  const target = path.join(stagingRuntimeRoot, targetRel);
  if (!fs.existsSync(source)) fail(`Missing runtime source: ${source}`);
  const stat = fs.statSync(source);
  if (stat.isFile()) {
    copyFile(source, target);
    return;
  }
  const stack = [source];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const relFromSourceRuntime = path.relative(sourceRuntimeRoot, full).replace(/\\/g, "/");
      if (shouldSkipRuntimeRel(`runtime/${relFromSourceRuntime}`, forbiddenRuntimePaths)) continue;
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        const relFromEntry = path.relative(source, full);
        copyFile(full, path.join(target, relFromEntry));
      }
    }
  }
}

function hasUsableSourceRuntimePath(sourceRoot, runtimeRelPath) {
  const relPath = runtimeRelPath.replace(/^runtime[\\/]/, "");
  const fullPath = path.join(sourceRoot, relPath);
  if (!fs.existsSync(fullPath)) return false;
  const stat = fs.statSync(fullPath);
  if (stat.isFile()) return path.basename(fullPath) !== ".gitkeep";
  if (!stat.isDirectory()) return true;
  const stack = [fullPath];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const child = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(child);
      else if (entry.isFile() && entry.name !== ".gitkeep") return true;
    }
  }
  return false;
}

function findSourceRuntimeRoot(requiredRuntimePaths) {
  const candidates = [
    preferredSourceRuntimeRoot,
    path.join(projectRoot, "runtime")
  ];
  for (const candidate of candidates) {
    if (requiredRuntimePaths.every((relPath) => hasUsableSourceRuntimePath(candidate, relPath))) return candidate;
  }
  return null;
}

function findRuntimeZip() {
  const candidates = [
    process.env.RUNTIME_ZIP,
    path.join(projectRoot, "OpenClawPro-AgentHub-Windows-Runtime-Required.zip"),
    zipPath
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function hasUsablePath(root, relPath) {
  const fullPath = path.join(root, relPath);
  if (!fs.existsSync(fullPath)) return false;
  const stat = fs.statSync(fullPath);
  if (stat.isFile()) return path.basename(fullPath) !== ".gitkeep";
  if (!stat.isDirectory()) return true;
  const stack = [fullPath];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const child = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(child);
      else if (entry.isFile() && entry.name !== ".gitkeep") return true;
    }
  }
  return false;
}

function listFiles(root) {
  const files = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile()) files.push(full);
    }
  }
  return files.sort();
}

function findPython() {
  const candidates = process.platform === "win32"
    ? [
        path.join(sourceRuntimeRoot, "HermesPortable", "venv", "Scripts", "python.exe"),
        "python",
        "py"
      ]
    : ["python3", "python"];

  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ["--version"], { encoding: "utf8", windowsHide: true });
    if (probe.status === 0) return candidate;
  }
  return null;
}

function writeZip(files) {
  const python = findPython();
  if (!python) fail("Unable to find Python for zip creation. Install python3 or run on Windows with src/runtime/HermesPortable present.");

  const fileListPath = path.join(releaseRoot, "windows-runtime-required-files.json");
  fs.writeFileSync(fileListPath, JSON.stringify({
    zipPath,
    stagingRoot,
    files: files.map((file) => ({
      source: file,
      arcname: path.relative(stagingRoot, file).replace(/\\/g, "/")
    }))
  }, null, 2), "utf8");

  const script = [
    "import json, zipfile",
    `spec_path = ${JSON.stringify(fileListPath)}`,
    "spec = json.load(open(spec_path, 'r', encoding='utf-8'))",
    "count = 0",
    "with zipfile.ZipFile(spec['zipPath'], 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6, allowZip64=True) as zf:",
    "    for item in spec['files']:",
    "        zf.write(item['source'], item['arcname'])",
    "        count += 1",
    "        if count % 5000 == 0:",
    "            print(f'[zip] {count} files', flush=True)",
    "print(f'[zip] done {count} files', flush=True)"
  ].join("\n");

  fs.rmSync(zipPath, { force: true });
  const result = spawnSync(python, ["-c", script], {
    encoding: "utf8",
    windowsHide: true,
    timeout: 60 * 60 * 1000
  });
  fs.rmSync(fileListPath, { force: true });
  if (result.status !== 0) fail(`zip failed:\n${result.stdout}\n${result.stderr}`);
  if (result.stdout.trim()) console.log(result.stdout.trim());
}

function sha256(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

const manifest = readJsonRequired(manifestSourcePath);
const windowsSpec = manifest?.platforms?.["windows-x64"];
if (!windowsSpec) fail("runtime manifest is missing platforms.windows-x64");
const requiredRuntimePaths = windowsSpec.requiredPaths.filter((relPath) => relPath.startsWith("runtime/"));
sourceRuntimeRoot = findSourceRuntimeRoot(requiredRuntimePaths);

if (!sourceRuntimeRoot) {
  const runtimeZip = findRuntimeZip();
  if (!runtimeZip) {
    fail([
      "Windows runtime source is missing.",
      `Checked source runtime: ${preferredSourceRuntimeRoot}`,
      `Checked expanded runtime: ${path.join(projectRoot, "runtime")}`,
      "Put OpenClawPro-AgentHub-Windows-Runtime-Required.zip in the project root or release/ directory, or set RUNTIME_ZIP=/path/to/zip.",
      "The Windows app shell was generated successfully; only the portable runtime is missing."
    ].join("\n"));
  }

  fs.rmSync(stagingRoot, { recursive: true, force: true });
  mkdirp(stagingRoot);
  await extractZip(runtimeZip, { dir: stagingRoot });
  if (path.resolve(runtimeZip) !== path.resolve(zipPath)) {
    mkdirp(releaseRoot);
    fs.copyFileSync(runtimeZip, zipPath);
  }

  const missing = requiredRuntimePaths.filter((relPath) => !hasUsablePath(stagingRoot, relPath));
  if (missing.length) fail(`Runtime zip is incomplete:\n${missing.map((relPath) => `- ${relPath}`).join("\n")}`);

  const stats = fs.statSync(zipPath);
  const report = {
    ok: true,
    zipPath,
    sizeBytes: stats.size,
    sizeMb: Math.round(stats.size / 1024 / 1024 * 10) / 10,
    sha256: sha256(zipPath),
    sourceRuntimeRoot: null,
    sourceZip: runtimeZip,
    stagingRuntimeRoot,
    extractedFromZip: true,
    excludesUserData: true,
    requiredRuntimePathsChecked: requiredRuntimePaths
  };
  fs.writeFileSync(`${zipPath}.manifest.json`, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const forbiddenRuntimePaths = Array.isArray(manifest.forbiddenRuntimePaths) ? manifest.forbiddenRuntimePaths : [];
const runtimeEntries = [
  ["node.exe", "node.exe"],
  ["openclaw.cmd", "openclaw.cmd"],
  ["openclaw.zip", "openclaw.zip"],
  [path.join("node_modules", "openclaw"), path.join("node_modules", "openclaw")],
  ["HermesPortable", "HermesPortable"]
];

fs.rmSync(stagingRoot, { recursive: true, force: true });
mkdirp(stagingRuntimeRoot);

copyFile(manifestSourcePath, path.join(stagingRuntimeRoot, "PORTABLE-RUNTIME-MANIFEST.json"));
for (const [sourceRel, targetRel] of runtimeEntries) {
  copyRuntimeEntry(sourceRel, targetRel, forbiddenRuntimePaths);
}

const runtimeOnlyRequired = windowsSpec.requiredPaths
  .filter((relPath) => relPath.startsWith("runtime/"))
  .filter((relPath) => !hasUsablePath(stagingRoot, relPath));
const forbiddenPresent = forbiddenRuntimePaths.filter((relPath) => fs.existsSync(path.join(stagingRoot, relPath)));

if (runtimeOnlyRequired.length || forbiddenPresent.length) {
  fail(JSON.stringify({ ok: false, missing: runtimeOnlyRequired, forbiddenPresent }, null, 2));
}

mkdirp(releaseRoot);
const files = listFiles(stagingRoot);
writeZip(files);

const stats = fs.statSync(zipPath);
const report = {
  ok: true,
  zipPath,
  sizeBytes: stats.size,
  sizeMb: Math.round(stats.size / 1024 / 1024 * 10) / 10,
  fileCount: files.length,
  sha256: sha256(zipPath),
  sourceRuntimeRoot,
  excludesUserData: true,
  requiredRuntimePathsChecked: requiredRuntimePaths
};

fs.writeFileSync(`${zipPath}.manifest.json`, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
