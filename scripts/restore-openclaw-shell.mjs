import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const usbRoot = process.env.AGENT_HUB_ROOT || "E:\\";
const backupRoot = process.env.OPENCLAW_BASELINE_APP || path.join(usbRoot, "backups", "app-before-full-source-20260618164815");
const targetApp = path.join(usbRoot, "win-unpacked", "resources", "app");
const backupsRoot = path.join(usbRoot, "backups");

function timestamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("");
}

function copyFile(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyDir(source, target) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(target, { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

function patchHermesTrayMenu(filePath) {
  const marker = "label: \"🧠 Hermes Agent\"";
  let source = fs.readFileSync(filePath, "utf8");
  if (source.includes(marker)) return;

  const anchor = "        { type: \"separator\" },\r\n        {\r\n          label: \"❌ 完全退出\",";
  const normalizedAnchor = "        { type: \"separator\" },\n        {\n          label: \"❌ 完全退出\",";
  const insert = [
    "        { type: \"separator\" },",
    "        {",
    "          label: \"🧠 Hermes Agent\",",
    "          submenu: [",
    "            {",
    "              label: \"打开配置中心\",",
    "              click: async () => {",
    "                await getHermesManager().openConfig();",
    "              }",
    "            },",
    "            {",
    "              label: \"打开 Dashboard\",",
    "              click: async () => {",
    "                await getHermesManager().openDashboard();",
    "              }",
    "            },",
    "            {",
    "              label: \"启动 Agent API\",",
    "              click: async () => {",
    "                await getHermesManager().openApiServer();",
    "              }",
    "            },",
    "            { type: \"separator\" },",
    "            {",
    "              label: \"停止 Hermes\",",
    "              click: async () => {",
    "                await getHermesManager().stop();",
    "              }",
    "            }",
    "          ]",
    "        },"
  ].join("\n");

  if (source.includes(anchor)) {
    source = source.replace(anchor, insert.replace(/\n/g, "\r\n") + "\r\n" + anchor);
  } else if (source.includes(normalizedAnchor)) {
    source = source.replace(normalizedAnchor, insert + "\n" + normalizedAnchor);
  } else {
    throw new Error("Could not find tray menu insertion point in OpenClaw main process.");
  }

  fs.writeFileSync(filePath, source, "utf8");
}

if (!fs.existsSync(backupRoot)) {
  console.error(`Baseline app is missing: ${backupRoot}`);
  process.exit(1);
}

const baselineHtml = path.join(backupRoot, "dist", "assets", "main", "index.html.bak-hermes-20260616163709");
for (const required of [
  path.join(backupRoot, "dist", "main", "index.js"),
  path.join(backupRoot, "dist", "preload", "index.js"),
  path.join(backupRoot, "dist", "assets", "assets", "main-DIeui7ZO.js"),
  path.join(backupRoot, "dist", "assets", "main-CAx6YYDG.css"),
  baselineHtml
]) {
  if (!fs.existsSync(required)) {
    console.error(`Required baseline file is missing: ${required}`);
    process.exit(1);
  }
}

fs.mkdirSync(backupsRoot, { recursive: true });
if (fs.existsSync(targetApp)) {
  const backup = path.join(backupsRoot, `app-before-openclaw-shell-restore-${timestamp()}`);
  fs.cpSync(targetApp, backup, { recursive: true });
  console.log(`Backed up current app to ${backup}`);
  fs.rmSync(targetApp, { recursive: true, force: true });
}

fs.mkdirSync(targetApp, { recursive: true });
copyFile(path.join(backupRoot, "package.json"), path.join(targetApp, "package.json"));
copyDir(path.join(backupRoot, "assets"), path.join(targetApp, "assets"));

const mainProcessTarget = path.join(targetApp, "dist", "main", "index.js");
copyFile(path.join(backupRoot, "dist", "main", "index.js"), mainProcessTarget);
patchHermesTrayMenu(mainProcessTarget);
copyFile(path.join(backupRoot, "dist", "preload", "index.js"), path.join(targetApp, "dist", "preload", "index.js"));
copyFile(path.join(backupRoot, "dist", "assets", "assets", "main-DIeui7ZO.js"), path.join(targetApp, "dist", "assets", "assets", "main-DIeui7ZO.js"));
copyDir(path.join(backupRoot, "dist", "assets", "assets", "styles"), path.join(targetApp, "dist", "assets", "assets", "styles"));
copyFile(path.join(backupRoot, "dist", "assets", "main-CAx6YYDG.css"), path.join(targetApp, "dist", "assets", "main-CAx6YYDG.css"));
copyFile(baselineHtml, path.join(targetApp, "dist", "assets", "main", "index.html"));

for (const asset of ["icon.ico", "icon.png", "logo.png"]) {
  const source = path.join(backupRoot, "dist", "assets", asset);
  if (fs.existsSync(source)) copyFile(source, path.join(targetApp, "dist", "assets", asset));
}

console.log(`Restored original OpenClaw shell to ${targetApp}`);
console.log("Added non-invasive Hermes tray menu entries.");
console.log("Hermes dist-injected patch assets were intentionally not copied.");
