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

function patchHermesRuntimeEnv(filePath) {
  let source = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  const envAnchor = [
    "  getHermesEnv() {",
    "    const root = this.getPortableRoot();",
    "    const home = path$1.join(root, \"_home\");",
    "    const data = path$1.join(root, \"data\");"
  ].join("\n");
  const envReplacement = [
    "  getHermesEnv() {",
    "    const root = this.getPortableRoot();",
    "    const usbRoot = getAppRoot();",
    "    const data = path$1.join(usbRoot, \"data\", \".hermes\");",
    "    const home = path$1.join(data, \"home\");"
  ].join("\n");
  if (source.includes(envAnchor)) {
    source = source.replace(envAnchor, envReplacement);
  }
  const mkdirAnchor = [
    "    if (!fs$1.existsSync(home)) fs$1.mkdirSync(home, { recursive: true });",
    "    if (!fs$1.existsSync(data)) fs$1.mkdirSync(data, { recursive: true });"
  ].join("\n");
  const mkdirReplacement = [
    "    for (const dir of [data, home, path$1.join(data, \"config\"), path$1.join(data, \"cache\"), path$1.join(data, \"logs\"), path$1.join(data, \"memories\"), path$1.join(data, \"skills\"), path$1.join(data, \"tmp\")]) {",
    "      if (!fs$1.existsSync(dir)) fs$1.mkdirSync(dir, { recursive: true });",
    "    }"
  ].join("\n");
  if (source.includes(mkdirAnchor)) {
    source = source.replace(mkdirAnchor, mkdirReplacement);
  }
  const homeEnvAnchor = [
    "      HOME: home,",
    "      USERPROFILE: home,",
    "      HERMES_HOME: data,",
    "      HERMES_BROWSER_OPENED: \"1\","
  ].join("\n");
  const homeEnvReplacement = [
    "      HOME: home,",
    "      USERPROFILE: home,",
    "      XDG_CONFIG_HOME: path$1.join(data, \"config\"),",
    "      XDG_CACHE_HOME: path$1.join(data, \"cache\"),",
    "      HERMES_HOME: data,",
    "      HERMES_LOG_DIR: path$1.join(data, \"logs\"),",
    "      HERMES_MEMORY_PATH: path$1.join(data, \"memories\"),",
    "      HERMES_SKILLS_PATH: path$1.join(data, \"skills\"),",
    "      TMP: path$1.join(data, \"tmp\"),",
    "      TEMP: path$1.join(data, \"tmp\"),",
    "      HERMES_BROWSER_OPENED: \"1\","
  ].join("\n");
  if (source.includes(homeEnvAnchor)) {
    source = source.replace(homeEnvAnchor, homeEnvReplacement);
  }

  const snapshotAnchor = [
    "    return {",
    "      status: this.status,",
    "      pid: this.proc?.pid ?? null,",
    "      memoryMb: this.memoryMb,",
    "      iterations: this.iterations,",
    "      memoryPath: this.memoryPath,",
    "      model: this.model,",
    "      lastError: this.lastError",
    "    };"
  ].join("\n");
  const snapshotReplacement = [
    "    const root = this.getPortableRoot();",
    "    const hermesBin = this.getHermesBin();",
    "    const python = this.getPortablePython();",
    "    const data = path$1.join(getAppRoot(), \"data\", \".hermes\");",
    "    return {",
    "      status: this.status,",
    "      pid: this.proc?.pid ?? this.dashboardProc?.pid ?? this.apiProc?.pid ?? null,",
    "      memoryMb: this.memoryMb,",
    "      iterations: this.iterations,",
    "      memoryPath: path$1.join(data, \"memories\"),",
    "      model: this.model,",
    "      runtimeRoot: root,",
    "      dataRoot: data,",
    "      hermesReady: fs$1.existsSync(hermesBin),",
    "      pythonReady: fs$1.existsSync(python),",
    "      sourceReady: fs$1.existsSync(path$1.join(root, \"hermes-agent\", \"pyproject.toml\")),",
    "      lastError: this.lastError",
    "    };"
  ].join("\n");
  if (source.includes(snapshotAnchor)) {
    source = source.replace(snapshotAnchor, snapshotReplacement);
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

function patchHermesEnvCheck(filePath) {
  let source = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  if (source.includes("id: \"hermes\"")) return;

  const listAnchor = "    { id: \"port\", title: \"端口状态\", icon: \"icon-clawzhandianduankouhao\", status: \"checking\", statusText: \"检测中\", detail: \"\" }\n";
  const listReplacement = "    { id: \"port\", title: \"端口状态\", icon: \"icon-clawzhandianduankouhao\", status: \"checking\", statusText: \"检测中\", detail: \"\" },\n    { id: \"hermes\", title: \"Hermes Agent\", icon: \"icon-clawopenclaw\", status: \"checking\", statusText: \"检测中\", detail: \"\" }\n";
  if (!source.includes(listAnchor)) {
    throw new Error("Could not find env check item insertion point in OpenClaw renderer bundle.");
  }
  source = source.replace(listAnchor, listReplacement);

  const portAnchor = [
    "  function checkPort() {",
    "    updateItem(\"port\", { status: \"checking\", statusText: \"检测中\", detail: \"\" });",
    "    try {",
    "      updateItem(\"port\", { status: \"pass\", statusText: \"正常\", detail: `端口可用` });",
    "    } catch (e) {",
    "      updateItem(\"port\", { status: \"fail\", statusText: \"异常\", detail: e.message });",
    "    }",
    "  }"
  ].join("\n");
  const portReplacement = [
    portAnchor,
    "  async function checkHermes() {",
    "    updateItem(\"hermes\", { status: \"checking\", statusText: \"检测中\", detail: \"\" });",
    "    try {",
    "      const status = await window.uclaw.ipcGetHermesStatus();",
    "      if (status?.hermesReady && status?.pythonReady) {",
    "        updateItem(\"hermes\", { status: \"pass\", statusText: status.status === \"running\" ? \"运行中\" : \"已就绪\", detail: status.dataRoot || \"Hermes runtime ready\" });",
    "      } else {",
    "        updateItem(\"hermes\", { status: \"warn\", statusText: \"未完整\", detail: status?.lastError || \"Hermes runtime 待补齐\" });",
    "      }",
    "    } catch (e) {",
    "      updateItem(\"hermes\", { status: \"fail\", statusText: \"异常\", detail: e.message });",
    "    }",
    "  }"
  ].join("\n");
  if (!source.includes(portAnchor)) {
    throw new Error("Could not find checkPort function in OpenClaw renderer bundle.");
  }
  source = source.replace(portAnchor, portReplacement);

  source = source.replace("    checkPort();\n", "    checkPort();\n    checkHermes();\n");
  source = source.replace("    checkPort\n", "    checkPort,\n    checkHermes\n");
  fs.writeFileSync(filePath, source, "utf8");
}

function patchHermesModelConfig(filePath) {
  let source = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  if (source.includes("model-hermes-tab")) return;

  const saveCustomAnchor = [
    "    function saveCustomModel() {",
    "      if (!customUrl.value) {",
    "        showToast(\"请填写 API URL，不可为空\", true);",
    "        return;",
    "      }",
    "      if (!customKey.value) {",
    "        showToast(\"请填写 API Key，不可为空\", true);",
    "        return;",
    "      }",
    "      if (!customModelName.value) {",
    "        showToast(\"请填写自定义模型名称\", true);",
    "        return;",
    "      }",
    "      const modelValue2 = `custom-${customModelName.value}`;",
    "      const exists = modelsStore.selectedModels.some((m) => m.value === modelValue2);",
    "      if (exists) {",
    "        showToast(\"不可重复添加模型\", true);",
    "        return;",
    "      }",
    "      const modelInfo = {",
    "        label: customModelName.value,",
    "        value: modelValue2,",
    "        source: \"custom\",",
    "        base: customUrl.value,",
    "        key: customKey.value,",
    "        model: customModelName.value,",
    "        provider: \"custom\",",
    "        api: customApiType.value",
    "      };",
    "      const updatedModels = [...modelsStore.selectedModels];",
    "      updatedModels.push({ ...modelInfo, isCurrent: updatedModels.length === 0 });",
    "      modelsStore.setSelectedModels(updatedModels);",
    "      showToast(\"模型添加成功\");",
    "      customUrl.value = \"\";",
    "      customKey.value = \"\";",
    "      customModelName.value = \"\";",
    "      customApiType.value = \"openai-completions\";",
    "    }"
  ].join("\n");
  const saveCustomReplacement = [
    saveCustomAnchor,
    "    async function handleHermesModelConfig() {",
    "      try {",
    "        await window.uclaw.ipcOpenHermesConfig();",
    "        showToast(\"Hermes 配置中心已打开\");",
    "      } catch (e) {",
    "        showToast(\"Hermes 配置中心打开失败: \" + e.message, true);",
    "      }",
    "    }",
    "    async function handleHermesModelDashboard() {",
    "      try {",
    "        await window.uclaw.ipcOpenHermesDashboard();",
    "        showToast(\"Hermes Dashboard 已打开\");",
    "      } catch (e) {",
    "        showToast(\"Hermes Dashboard 打开失败: \" + e.message, true);",
    "      }",
    "    }",
    "    async function handleHermesModelApi() {",
    "      try {",
    "        await window.uclaw.ipcOpenHermesApiServer();",
    "        showToast(\"Hermes Agent API 已启动\");",
    "      } catch (e) {",
    "        showToast(\"Hermes Agent API 启动失败: \" + e.message, true);",
    "      }",
    "    }"
  ].join("\n");
  if (!source.includes(saveCustomAnchor)) {
    throw new Error("Could not find custom model save function in OpenClaw renderer bundle.");
  }
  source = source.replace(saveCustomAnchor, saveCustomReplacement);

  const customTabAnchor = [
    "          createBaseVNode(\"button\", {",
    "            class: normalizeClass([\"model-model-tab\", { \"model-active\": activeTab.value === \"custom\" }]),",
    "            onClick: _cache[3] || (_cache[3] = ($event) => activeTab.value = \"custom\")",
    "          }, \" 自定义模型 \", 2)"
  ].join("\n");
  const customTabReplacement = [
    customTabAnchor + ",",
    "          createBaseVNode(\"button\", {",
    "            class: normalizeClass([\"model-model-tab\", { \"model-active\": activeTab.value === \"hermes\" }]),",
    "            onClick: ($event) => activeTab.value = \"hermes\"",
    "          }, \" Hermes Agent \", 2)"
  ].join("\n");
  if (!source.includes(customTabAnchor)) {
    throw new Error("Could not find model tab insertion point in OpenClaw renderer bundle.");
  }
  source = source.replace(customTabAnchor, customTabReplacement);

  const customCloseAnchor = [
    "        withDirectives(createBaseVNode(\"div\", _hoisted_44$2, [",
    "          _cache[42] || (_cache[42] = createBaseVNode(\"div\", { class: \"model-custom-intro\" }, ["
  ].join("\n");
  const hermesPanel = [
    "        withDirectives(createBaseVNode(\"div\", { class: \"model-tab-content model-hermes-tab\" }, [",
    "          createBaseVNode(\"div\", { class: \"model-hermes-panel\" }, [",
    "            createBaseVNode(\"div\", { class: \"model-hermes-head\" }, [",
    "              createBaseVNode(\"div\", { class: \"model-hermes-mark\" }, \"H\"),",
    "              createBaseVNode(\"div\", { class: \"model-hermes-copy\" }, [",
    "                createBaseVNode(\"h3\", null, \"Hermes Agent 模型配置\"),",
    "                createBaseVNode(\"p\", null, \"Hermes 使用独立配置中心管理 provider、模型、Key、记忆、技能和沙箱。OpenClaw 模型继续用于原 Gateway，Hermes 可作为独立 Agent 或协同 Agent 调用。\")",
    "              ])",
    "            ]),",
    "            createBaseVNode(\"div\", { class: \"model-hermes-actions\" }, [",
    "              createBaseVNode(\"button\", { class: \"model-hermes-btn primary\", onClick: handleHermesModelConfig }, \"打开配置中心\"),",
    "              createBaseVNode(\"button\", { class: \"model-hermes-btn\", onClick: handleHermesModelDashboard }, \"Dashboard\"),",
    "              createBaseVNode(\"button\", { class: \"model-hermes-btn\", onClick: handleHermesModelApi }, \"启动 Agent API\")",
    "            ]),",
    "            createBaseVNode(\"div\", { class: \"model-hermes-notes\" }, [",
    "              createBaseVNode(\"span\", null, \"配置保存到 U 盘 data/.hermes\"),",
    "              createBaseVNode(\"span\", null, \"不会覆盖 OpenClaw 当前模型\"),",
    "              createBaseVNode(\"span\", null, \"后续会在 AI 会话中加入 OpenClaw / Hermes / 协同模式切换\")",
    "            ])",
    "          ])",
    "        ], 512), [",
    "          [vShow, activeTab.value === \"hermes\"]",
    "        ]),",
    customCloseAnchor
  ].join("\n");
  if (!source.includes(customCloseAnchor)) {
    throw new Error("Could not find custom model tab content insertion point in OpenClaw renderer bundle.");
  }
  source = source.replace(customCloseAnchor, hermesPanel);
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

function patchHermesModelStyles(filePath) {
  let source = fs.readFileSync(filePath, "utf8");
  if (source.includes(".model-hermes-panel")) return;
  source += `

.model-hermes-panel {
  padding: 18px;
  border: 1px solid rgba(173, 198, 255, 0.22);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(34, 42, 61, 0.95), rgba(19, 27, 46, 0.95));
}

.model-hermes-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.model-hermes-mark {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #4edea3;
  color: #002113;
  font-weight: 800;
}

.model-hermes-copy h3 {
  margin: 0;
  color: #dae2fd;
  font-size: 18px;
}

.model-hermes-copy p {
  margin: 6px 0 0;
  color: #c2c6d6;
  font-size: 13px;
  line-height: 1.55;
}

.model-hermes-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.model-hermes-btn {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid rgba(173, 198, 255, 0.28);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #dae2fd;
  cursor: pointer;
}

.model-hermes-btn.primary {
  border-color: #4edea3;
  background: #4edea3;
  color: #002113;
  font-weight: 700;
}

.model-hermes-btn:hover {
  filter: brightness(1.08);
}

.model-hermes-notes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.model-hermes-notes span {
  border: 1px solid rgba(173, 198, 255, 0.16);
  border-radius: 8px;
  padding: 6px 8px;
  color: #c2c6d6;
  background: rgba(255, 255, 255, 0.04);
  font-size: 12px;
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
patchHermesRuntimeEnv(mainProcessTarget);
patchHermesTrayMenu(mainProcessTarget);
copyFile(path.join(backupRoot, "dist", "preload", "index.js"), path.join(targetApp, "dist", "preload", "index.js"));
const rendererTarget = path.join(targetApp, "dist", "assets", "assets", "main-DIeui7ZO.js");
copyFile(path.join(backupRoot, "dist", "assets", "assets", "main-DIeui7ZO.js"), rendererTarget);
patchHermesEnvCheck(rendererTarget);
patchHermesHomeDashboard(rendererTarget);
patchHermesModelConfig(rendererTarget);
copyDir(path.join(backupRoot, "dist", "assets", "assets", "styles"), path.join(targetApp, "dist", "assets", "assets", "styles"));
const rendererStyleTarget = path.join(targetApp, "dist", "assets", "main-CAx6YYDG.css");
copyFile(path.join(backupRoot, "dist", "assets", "main-CAx6YYDG.css"), rendererStyleTarget);
patchHermesHomeStyles(rendererStyleTarget);
patchHermesModelStyles(rendererStyleTarget);
copyFile(baselineHtml, path.join(targetApp, "dist", "assets", "main", "index.html"));

for (const asset of ["icon.ico", "icon.png", "logo.png"]) {
  const source = path.join(backupRoot, "dist", "assets", asset);
  if (fs.existsSync(source)) copyFile(source, path.join(targetApp, "dist", "assets", asset));
}

console.log(`Restored original OpenClaw shell to ${targetApp}`);
console.log("Added non-invasive Hermes tray menu entries.");
console.log("Added Hermes controls to the original OpenClaw home console.");
console.log("Added Hermes runtime status to the original environment checks.");
console.log("Added Hermes Agent tab to the original model configuration page.");
console.log("Hermes dist-injected patch assets were intentionally not copied.");
