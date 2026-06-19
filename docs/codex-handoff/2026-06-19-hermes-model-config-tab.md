# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：

- 零安装：Python / Node 运行时自带，不依赖系统任何东西。
- 零痕迹：所有读写劫持到 U 盘 `data/` 目录，宿主机零接触。
- 三平台原生：macOS arm64/x64、Linux x64/arm64、Windows x64。
- Universal 包：单个 zip 带齐三平台 venv，启动器自动识别。
- 自我成长：持久记忆 + 自动生成技能，运行越久越强。
- 多平台接入：Telegram/Discord/Slack/WhatsApp/Signal/Email/CLI，一处启动多处可达。
- 定时自动化：自然语言 cron 调度，无人值守执行报告/备份/简报。
- 子代理委派：隔离子对话 + 独立终端 + Python RPC，零上下文成本流水线。
- 沙箱隔离：本地/Docker/SSH/Singularity/Modal 五种后端。
- 可视化配置中心：选模型/填 Key/测试连接/换模型/查看日志/导入导出。

以上任务均要和现有程序前端界面无缝融合，让用户在前端界面上获得良好操作体验。

## 当前目标
继续把 Hermes 融入原 OpenClaw 模块体系：在原“模型配置”页中新增 Hermes Agent 标签页，让用户在配置 OpenClaw 模型的同一上下文里进入 Hermes 模型与 Agent 配置。

## 已完成
- 更新 `scripts/restore-openclaw-shell.mjs`。
- 在原模型配置页 Tab 中新增 `Hermes Agent`。
- 新增 `Hermes Agent 模型配置` 面板。
- 面板提供：
  - 打开配置中心：调用 `window.uclaw.ipcOpenHermesConfig()`。
  - Dashboard：调用 `window.uclaw.ipcOpenHermesDashboard()`。
  - 启动 Agent API：调用 `window.uclaw.ipcOpenHermesApiServer()`。
- 面板说明 Hermes 配置保存到 U 盘 `data/.hermes`，不会覆盖 OpenClaw 当前模型。
- 新增与原模型配置页风格一致的 `model-hermes-*` 样式。
- 继续保留首页 Hermes 控制卡片、首页环境检查 Hermes 状态、托盘 Hermes 入口。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-19-hermes-model-config-tab.md`

## 关键决策
- Hermes 模型配置入口放在原“模型配置”页，而不是独立新页面，符合用户对“在原 UI 基础上融合”的要求。
- OpenClaw 当前模型列表、推荐模型、自定义模型逻辑不变。
- Hermes 模型配置不直接写 OpenClaw 模型配置，避免覆盖用户现有 OpenClaw provider/API Key。
- 继续不使用旧 Hermes JS/CSS 注入补丁资产。

## 待继续
- 实机查看模型配置页 Hermes Tab 的视觉效果。
- 在 AI 会话页增加 OpenClaw / Hermes / 协同模式切换。
- 在 Hermes Tab 中进一步显示当前 Hermes provider/model/key-present 状态。
- 将 Hermes 配置中心中的导入/导出、连接器、沙箱配置逐步用原模型页/设置页风格重做。
- 继续推进原前端源码化，降低打包 bundle 变换维护成本。

## 验证结果
- 已执行 `node scripts/restore-openclaw-shell.mjs`。
- 恢复前备份当前 app 到 `E:\backups\app-before-openclaw-shell-restore-20260619120936`。
- 部署后的 renderer bundle 中可检索到 `model-hermes-tab`、`Hermes Agent 模型配置`、`handleHermesModelConfig`、`handleHermesModelDashboard`、`handleHermesModelApi`。
- 部署后的 CSS 中可检索到 `model-hermes-panel`、`model-hermes-btn`、`model-hermes-notes`。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- 部署后的 `dist/assets` 中未发现旧 Hermes patch/enhance 资产。
- `scripts\verify-hermes-runtime.mjs` 通过。
- `scripts\verify-openclaw-runtime.mjs` 通过。

## 如果需要下一台 Codex 接手，提示词
请在 `E:\source\openclawpro-agent-hub` 继续开发。当前方向是保留 OpenClaw 原 UI/功能体系，并把 Hermes 融入原首页、AI 会话、模型配置、环境检查等模块。当前 `scripts/restore-openclaw-shell.mjs` 会恢复原 OpenClaw shell，并在首页控制台加入 Hermes 控制卡片、环境检查加入 Hermes Agent、模型配置页加入 Hermes Agent Tab、托盘加入 Hermes 入口，同时修正 Hermes 可变数据到 `E:\data\.hermes`。下一步建议做 AI 会话页的 OpenClaw/Hermes/协同模式切换。每个阶段完成后按 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push` 流程提交，并新增包含“总体目标”的 handoff。
