import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const sourceApp = path.join(projectRoot, "src", "openclaw-shell-app");
const sourceDist = path.join(sourceApp, "dist");
const targetDist = path.join(projectRoot, "dist");

function assertFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required OpenClaw shell file is missing: ${path.relative(projectRoot, filePath)}`);
  }
}

for (const required of [
  path.join(sourceDist, "main", "index.js"),
  path.join(sourceDist, "preload", "index.js"),
  path.join(sourceDist, "assets", "assets", "main-DIeui7ZO.js"),
  path.join(sourceDist, "assets", "main-CAx6YYDG.css"),
  path.join(sourceDist, "assets", "main", "index.html"),
  path.join(sourceDist, "assets", "hermes-frame.html")
]) {
  assertFile(required);
}

fs.rmSync(targetDist, { recursive: true, force: true });
fs.mkdirSync(targetDist, { recursive: true });
fs.cpSync(sourceDist, targetDist, { recursive: true });

const mainProcess = path.join(targetDist, "main", "index.js");
const mainProcessCjs = path.join(targetDist, "main", "index.cjs");
const preload = path.join(targetDist, "preload", "index.js");
const preloadCjs = path.join(targetDist, "preload", "index.cjs");
let mainSource = fs.readFileSync(mainProcess, "utf8");
mainSource = mainSource.replace(
  "const IS_DEV = !electron.app.isPackaged;",
  "const IS_DEV = process.env.NODE_ENV === \"development\";"
);
if (!mainSource.includes('if (!IS_DEV) return path$1.join(getDataRoot(), ".openclaw", "electron");')) {
  throw new Error("Portable zero-trace Electron data path is missing from main process source.");
}
mainSource = mainSource.replace(
  "function loadActivationPage() {\n  if (!mainWindow$1) {",
  "function loadActivationPage() {\n  if (process.env.OPENCLAW_DEV_SKIP_LICENSE === \"1\") {\n    const indexPath = path$1.join(__dirname, \"..\", \"assets\", \"main\", \"index.html\");\n    console.log(\"[loadActivationPage] DEV license skip: loading\", indexPath);\n    mainWindow$1?.loadFile(indexPath);\n    return;\n  }\n  if (!mainWindow$1) {"
);
mainSource = mainSource.replace(
  "async function getAppDriveInfo() {\n  let targetPath = process.execPath;",
  "async function getAppDriveInfo() {\n  let targetPath = process.env.AGENT_HUB_USB_ROOT?.trim() || process.execPath;"
);
mainSource = mainSource.replace(
  "function getAppRoot() {\n  if (_appRoot) return _appRoot;",
  "function getAppRoot() {\n  if (_appRoot) return _appRoot;\n  const envRoot = process.env.AGENT_HUB_ROOT?.trim();\n  if (envRoot) {\n    _appRoot = path$1.resolve(envRoot);\n    return _appRoot;\n  }"
);
mainSource = mainSource.replace(
  "function getDataRoot() {\n  if (_dataRoot) return _dataRoot;\n  _dataRoot = path$1.join(getAppRoot(), DIR_DATA);\n  return _dataRoot;\n}",
  "function getDataRoot() {\n  if (_dataRoot) return _dataRoot;\n  const envDataRoot = process.env.AGENT_HUB_DATA_ROOT?.trim();\n  _dataRoot = envDataRoot ? path$1.resolve(envDataRoot) : path$1.join(getAppRoot(), DIR_DATA);\n  return _dataRoot;\n}"
);
mainSource = mainSource.replace(
  "function getLicensePath() {\n  return path$1.join(getAppRoot(), FILE_LICENSE);\n}",
  "function getLicensePath() {\n  const usbRoot = process.env.AGENT_HUB_USB_ROOT?.trim();\n  const licenseRoot = usbRoot ? path$1.resolve(usbRoot) : getAppRoot();\n  return path$1.join(licenseRoot, FILE_LICENSE);\n}"
);
mainSource = mainSource.replaceAll(
  'path$1.join(__dirname, "..", "preload", "index.js")',
  'path$1.join(__dirname, "..", "preload", "index.cjs")'
);
fs.writeFileSync(mainProcess, mainSource, "utf8");
fs.writeFileSync(mainProcessCjs, mainSource, "utf8");
fs.copyFileSync(preload, preloadCjs);

console.log(`Built OpenClaw shell app from ${path.relative(projectRoot, sourceApp)} to dist/.`);
