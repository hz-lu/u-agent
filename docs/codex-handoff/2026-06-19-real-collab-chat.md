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

以上任务均要和现有程序前端界面无缝融合，融合 Hermes 到这个项目里，前端界面上操作就要给用户良好的体验。

## 当前目标
把 AI 会话页的“协同”模式从单纯入口升级为第一版真实 OpenClaw + Hermes 串联编排：OpenClaw 先生成草案，Hermes 再基于草案复核、补充和整理最终答案。

## 已完成
- 更新 `scripts/restore-openclaw-shell.mjs` 中的 `patchHermesAiChat()`。
- 协同模式现在会检查 OpenClaw Gateway 是否就绪：
  - 就绪时顶部状态显示 `协同就绪`。
  - 未就绪时显示 `需启动 Gateway`，发送后会提示先启动 Gateway。
- 新增协同发送流程：
  - 用户消息写入协同会话。
  - 阶段 1：调用原 OpenClaw `store.sendMessage()`，等待原 OpenClaw Gateway WebSocket 返回助手草案。
  - 将 OpenClaw 草案作为独立消息展示，模型标记为 `OpenClaw 草案`。
  - 阶段 2：把用户原始问题和 OpenClaw 草案拼成 Hermes 复核 prompt，调用 `window.uclaw.ipcHermesChat()`。
  - 将 Hermes 结果作为 `Hermes 协同复核` 展示。
- 保持 OpenClaw 原会话 store、原 WebSocket 逻辑、原消息气泡和原输入框不变。
- 已重新部署到 `E:\win-unpacked\resources\app`。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-19-real-collab-chat.md`

## 关键决策
- 第一版真实协同采用前端编排，因为 OpenClaw 当前聊天能力在原前端 store 内通过 Gateway WebSocket 实现，没有现成主进程 OpenClaw chat IPC。
- 不把 OpenClaw 草案写入 Hermes 独立消息之外的持久结构，避免污染 OpenClaw 原会话。
- 协同模式保留阶段提示，用户能看到 OpenClaw 和 Hermes 分别做了什么。
- Hermes 复核 prompt 明确要求保留 OpenClaw 有效内容、指出风险、输出最终可执行答案。

## 待继续
- 实机启动 Gateway 和 Hermes 后，在 AI 会话页完整测试协同链路。
- 后续可把协同编排下沉到主进程，统一管理超时、取消、持久化和日志。
- 为协同模式补充“只用 Hermes 复核 / OpenClaw 执行 / Hermes 规划”策略切换。
- 把协同过程写入 U 盘 `data/.hermes/logs` 或 `data/.openclaw/chat-history` 的专门协同日志。
- 继续补 Hermes provider/model/key-present 状态展示。

## 验证结果
- 已执行 `node scripts\restore-openclaw-shell.mjs`，部署成功。
- 部署前当前 app 已备份到 `E:\backups\app-before-openclaw-shell-restore-20260619125112`。
- `node --check scripts\restore-openclaw-shell.mjs` 通过。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- 部署后的 renderer bundle 可检索到 `sendCollaborativeMessage`、`waitForOpenClawDraft`、`OpenClaw 草案`、`Hermes 协同复核`、`协同就绪`、`需启动 Gateway`。
- `scripts\verify-hermes-runtime.mjs` 通过：Hermes Agent `v0.15.1`，Python `3.12.13`，Node `v24.15.0`，零痕迹环境指向 `E:\data\.hermes`。
- `scripts\verify-openclaw-runtime.mjs` 通过：OpenClaw 数据目录为 `E:\data\.openclaw`，当前模型配置存在，Gateway 当前未运行。
- 部署后的 `dist/assets` 未发现旧 Hermes patch/enhance 资产。

## 如果需要下一台 Codex 接手，提示词
请在 `E:\source\openclawpro-agent-hub` 继续开发。当前方向是保留 OpenClaw 原 UI/功能体系，并把 Hermes 融入原首页、AI 会话、模型配置、环境检查等模块。当前 `scripts/restore-openclaw-shell.mjs` 会从 `E:\backups\app-before-full-source-20260618164815` 恢复原 OpenClaw shell，再加入 Hermes 首页控制卡片、环境检查状态、模型配置 Hermes Tab、托盘入口，以及 AI 会话页 OpenClaw/Hermes/协同模式。协同模式已实现第一版真实串联：OpenClaw 生成草案，Hermes 基于草案复核输出。下一步建议实机启动 Gateway/Hermes 测试协同链路，并继续把协同策略、日志和配置可视化。每个阶段完成后按 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push` 流程提交，并新增包含“总体目标”的 handoff。
