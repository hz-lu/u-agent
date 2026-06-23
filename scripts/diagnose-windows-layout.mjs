import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const driveRoot = path.parse(path.resolve(cwd)).root || cwd;
const candidates = [
  cwd,
  driveRoot,
  path.join(cwd, "runtime"),
  path.join(driveRoot, "runtime"),
  path.join(driveRoot, "u-agent"),
  path.join(driveRoot, "u-agent", "runtime"),
  path.join(driveRoot, "runtime", "runtime"),
  path.join(cwd, "release", "windows-shell-e2e-slim-staging"),
  path.join(cwd, "release", "windows-shell-e2e-slim-staging", "runtime")
];

function exists(relPath, root) {
  return fs.existsSync(path.join(root, relPath));
}

function list(root) {
  try {
    return fs.readdirSync(root).slice(0, 40);
  } catch {
    return [];
  }
}

function inspect(root) {
  return {
    root,
    exists: fs.existsSync(root),
    hasRuntimeDir: exists("runtime", root),
    hasDataDir: exists("data", root),
    hasSkillsDir: exists("skills", root),
    hasExtensionsDir: exists("extensions", root),
    hasWinUnpackedExe: exists(path.join("win-unpacked", "OpenClawPro.exe"), root),
    openclawCmd: exists(path.join("runtime", "openclaw.cmd"), root),
    nodeExe: exists(path.join("runtime", "node.exe"), root),
    openclawMjs: exists(path.join("runtime", "node_modules", "openclaw", "openclaw.mjs"), root),
    openclawDist: exists(path.join("runtime", "node_modules", "openclaw", "dist"), root),
    hermesExe: exists(path.join("runtime", "HermesPortable", "venv", "Scripts", "hermes.exe"), root),
    hermesConfigServer: exists(path.join("runtime", "HermesPortable", "lib", "config_server.py"), root),
    entries: list(root)
  };
}

const uniqueCandidates = [...new Set(candidates.map((item) => path.resolve(item)))];
const report = {
  checkedAt: new Date().toISOString(),
  platform: process.platform,
  cwd,
  driveRoot,
  candidates: uniqueCandidates.map(inspect)
};

const usableRoots = report.candidates.filter((item) => item.openclawMjs && item.hermesExe && item.hasWinUnpackedExe);
const runtimeOnlyRoots = report.candidates.filter((item) => item.openclawMjs || item.hermesExe);
report.summary = {
  usablePortableRoots: usableRoots.map((item) => item.root),
  runtimeOnlyRoots: runtimeOnlyRoots.map((item) => item.root),
  recommendedCopyRule: "复制 release/windows-shell-e2e-slim-staging 目录里面的内容到 U 盘根目录；不要把 u-agent 或 staging 目录整体套在 U 盘根目录下。"
};

console.log(JSON.stringify(report, null, 2));

if (!usableRoots.length) {
  console.error("No complete portable root found. Check the candidates above for missing runtime/openclaw or win-unpacked files.");
  process.exitCode = 1;
}
