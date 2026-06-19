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

function patchHermesHomeDashboard(filePath) {
  const marker = "home-hermes-card";
  let source = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  if (source.includes(marker)) return;

  const openAnchor = [
    "    function handleOpen() {",
    "      window.uclaw.ipcOpenDashboard();",
    "    }"
  ].join("\n");
  const openReplacement = [
    openAnchor,
    "    async function handleHermesConfig() {",
    "      try {",
    "        await window.uclaw.ipcOpenHermesConfig();",
    "        showToast(\"Hermes 配置中心已打开\");",
    "      } catch (e) {",
    "        showToast(\"Hermes 配置中心打开失败: \" + e.message, true);",
    "      }",
    "    }",
    "    async function handleHermesDashboard() {",
    "      try {",
    "        await window.uclaw.ipcOpenHermesDashboard();",
    "        showToast(\"Hermes Dashboard 已打开\");",
    "      } catch (e) {",
    "        showToast(\"Hermes Dashboard 打开失败: \" + e.message, true);",
    "      }",
    "    }",
    "    async function handleHermesApi() {",
    "      try {",
    "        await window.uclaw.ipcOpenHermesApiServer();",
    "        showToast(\"Hermes Agent API 已启动\");",
    "      } catch (e) {",
    "        showToast(\"Hermes Agent API 启动失败: \" + e.message, true);",
    "      }",
    "    }",
    "    async function handleHermesStop() {",
    "      try {",
    "        await window.uclaw.ipcStopHermes();",
    "        showToast(\"Hermes 已停止\");",
    "      } catch (e) {",
    "        showToast(\"Hermes 停止失败: \" + e.message, true);",
    "      }",
    "    }"
  ].join("\n");
  if (!source.includes(openAnchor)) {
    throw new Error("Could not find Home open-dashboard handler in OpenClaw renderer bundle.");
  }
  source = source.replace(openAnchor, openReplacement);

  const panelAnchor = [
    "        ]),",
    "        createBaseVNode(\"div\", _hoisted_10$h, ["
  ].join("\n");
  const hermesPanel = [
    "        ]),",
    "        createBaseVNode(\"div\", { class: \"home-hermes-card\" }, [",
    "          createBaseVNode(\"div\", { class: \"home-hermes-main\" }, [",
    "            createBaseVNode(\"div\", { class: \"home-hermes-icon\" }, \"H\"),",
    "            createBaseVNode(\"div\", { class: \"home-hermes-copy\" }, [",
    "              createBaseVNode(\"div\", { class: \"home-hermes-title\" }, \"Hermes Agent 协同控制台\"),",
    "              createBaseVNode(\"div\", { class: \"home-hermes-desc\" }, \"在保留 OpenClaw Gateway 的同时，可启动 Hermes 配置中心、Dashboard 与 Agent API，实现双 Agent 协同。\")",
    "            ])",
    "          ]),",
    "          createBaseVNode(\"div\", { class: \"home-hermes-actions\" }, [",
    "            createBaseVNode(\"button\", { class: \"home-hermes-btn primary\", onClick: handleHermesConfig }, \"配置中心\"),",
    "            createBaseVNode(\"button\", { class: \"home-hermes-btn\", onClick: handleHermesDashboard }, \"Dashboard\"),",
    "            createBaseVNode(\"button\", { class: \"home-hermes-btn\", onClick: handleHermesApi }, \"Agent API\"),",
    "            createBaseVNode(\"button\", { class: \"home-hermes-btn danger\", onClick: handleHermesStop }, \"停止 Hermes\")",
    "          ])",
    "        ]),",
    "        createBaseVNode(\"div\", _hoisted_10$h, ["
  ].join("\n");
  if (!source.includes(panelAnchor)) {
    throw new Error("Could not find Home dashboard insertion point in OpenClaw renderer bundle.");
  }
  source = source.replace(panelAnchor, hermesPanel);
  fs.writeFileSync(filePath, source, "utf8");
}

function patchHermesHomeStyles(filePath) {
  let source = fs.readFileSync(filePath, "utf8");
  if (source.includes(".home-hermes-card")) return;
  source += `

.home-hermes-card {
  margin: 16px 0;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid rgba(173, 198, 255, 0.22);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(34, 42, 61, 0.95), rgba(19, 27, 46, 0.95));
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
}

.home-hermes-main {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.home-hermes-icon {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #4edea3;
  color: #002113;
  font-weight: 800;
}

.home-hermes-copy {
  min-width: 0;
}

.home-hermes-title {
  color: #dae2fd;
  font-size: 16px;
  font-weight: 700;
}

.home-hermes-desc {
  margin-top: 4px;
  color: #c2c6d6;
  font-size: 13px;
  line-height: 1.45;
}

.home-hermes-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.home-hermes-btn {
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(173, 198, 255, 0.28);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #dae2fd;
  cursor: pointer;
}

.home-hermes-btn.primary {
  border-color: #4edea3;
  background: #4edea3;
  color: #002113;
  font-weight: 700;
}

.home-hermes-btn.danger {
  border-color: rgba(255, 179, 173, 0.45);
  color: #ffb3ad;
}

.home-hermes-btn:hover {
  filter: brightness(1.08);
}

@media (max-width: 900px) {
  .home-hermes-card {
    display: grid;
  }

  .home-hermes-actions {
    justify-content: flex-start;
  }
}
`;
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
const rendererTarget = path.join(targetApp, "dist", "assets", "assets", "main-DIeui7ZO.js");
copyFile(path.join(backupRoot, "dist", "assets", "assets", "main-DIeui7ZO.js"), rendererTarget);
patchHermesHomeDashboard(rendererTarget);
copyDir(path.join(backupRoot, "dist", "assets", "assets", "styles"), path.join(targetApp, "dist", "assets", "assets", "styles"));
const rendererStyleTarget = path.join(targetApp, "dist", "assets", "main-CAx6YYDG.css");
copyFile(path.join(backupRoot, "dist", "assets", "main-CAx6YYDG.css"), rendererStyleTarget);
patchHermesHomeStyles(rendererStyleTarget);
copyFile(baselineHtml, path.join(targetApp, "dist", "assets", "main", "index.html"));

for (const asset of ["icon.ico", "icon.png", "logo.png"]) {
  const source = path.join(backupRoot, "dist", "assets", asset);
  if (fs.existsSync(source)) copyFile(source, path.join(targetApp, "dist", "assets", asset));
}

console.log(`Restored original OpenClaw shell to ${targetApp}`);
console.log("Added non-invasive Hermes tray menu entries.");
console.log("Added Hermes controls to the original OpenClaw home console.");
console.log("Hermes dist-injected patch assets were intentionally not copied.");
