import fs from "node:fs";
import path from "node:path";

const usbRoot = process.env.AGENT_HUB_ROOT || "E:\\";

const paths = {
  usbRoot,
  app: path.join(usbRoot, "win-unpacked", "resources", "app"),
  dist: path.join(usbRoot, "win-unpacked", "resources", "app", "dist"),
  runtime: path.join(usbRoot, "runtime"),
  hermesPortable: path.join(usbRoot, "runtime", "HermesPortable"),
  openclawData: path.join(usbRoot, "data", ".openclaw"),
  hermesData: path.join(usbRoot, "data", ".hermes"),
  legacyHermesData: path.join(usbRoot, "runtime", "HermesPortable", "data")
};

function exists(target) {
  return fs.existsSync(target);
}

function fileInfo(target) {
  if (!exists(target)) return null;
  const stat = fs.statSync(target);
  return {
    path: target,
    type: stat.isDirectory() ? "dir" : "file",
    bytes: stat.isFile() ? stat.size : undefined,
    modifiedAt: stat.mtime.toISOString()
  };
}

const report = {
  scannedAt: new Date().toISOString(),
  paths: Object.fromEntries(Object.entries(paths).map(([key, value]) => [key, fileInfo(value)])),
  packagedFiles: [
    "package.json",
    "dist/main/index.js",
    "dist/preload/index.js",
    "dist/assets/main/index.html",
    "dist/assets/real-hermes-ui.js",
    "dist/assets/hermes-enhance.js",
    "dist/assets/hermes-chat-enhance.js",
    "dist/assets/hermes-env-enhance.js"
  ].map((relative) => fileInfo(path.join(paths.app, relative))),
  hermesRuntime: {
    hermesExe: fileInfo(path.join(paths.hermesPortable, "venv", "Scripts", "hermes.exe")),
    pythonExe: fileInfo(path.join(paths.hermesPortable, "venv", "Scripts", "python.exe")),
    portablePythonDir: fileInfo(path.join(paths.hermesPortable, "python")),
    nodeExe: fileInfo(path.join(paths.hermesPortable, "node", "node.exe")),
    configServer: fileInfo(path.join(paths.hermesPortable, "lib", "config_server.py")),
    source: fileInfo(path.join(paths.hermesPortable, "hermes-agent"))
  }
};

console.log(JSON.stringify(report, null, 2));
