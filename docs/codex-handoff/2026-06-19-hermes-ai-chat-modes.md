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
在保留原 OpenClaw AI 会话页结构和聊天体验的前提下，把 Hermes 融入同一个会话模块，提供 OpenClaw / Hermes / 协同三种模式切换。

## 已完成
- 更新 `scripts/restore-openclaw-shell.mjs`。
- 新增 `patchHermesAiChat()`：
  - 在原 AI 会话顶部栏加入 `OpenClaw`、`Hermes`、`协同` 分段切换。
  - OpenClaw 模式继续使用原 `store.sendMessage()`、原模型选择器、原 Gateway 会话。
  - Hermes 模式使用独立前端消息列表，调用已有 `window.uclaw.ipcHermesChat()`。
  - 协同模式先作为独立会话形态接入 Hermes，并显示为 `OpenClaw / Hermes 协同会话`，后续可继续升级为真实流水线编排。
  - Gateway 未运行时，不再把用户完全挡住，可直接切到 Hermes 或协同模式。
  - Hermes/协同模式顶部提供 `配置` 和 `API` 入口。
- 新增 `patchHermesAiChatStyles()`：
  - 为模式切换、Hermes 状态胶囊、移动端换行布局补充样式。
- 已重新部署到 `E:\win-unpacked\resources\app`。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-19-hermes-ai-chat-modes.md`

## 关键决策
- 不恢复旧的 Hermes dist 注入补丁层。
- 不引入新的 Hub 替代界面。
- AI 会话继续沿用原 OpenClaw 页面、原消息气泡、原输入框组件。
- Hermes 消息先在前端维护独立列表，避免污染 OpenClaw 原会话 store。
- 协同模式本阶段先做入口和会话形态，后续再接真实 OpenClaw/Hermes 双 Agent 编排。

## 待继续
- 实机打开桌面程序检查 AI 会话页视觉和交互。
- 把协同模式升级为真实流水线：
  - OpenClaw 生成初稿，Hermes 复核/补技能/调用工具。
  - 或 Hermes 规划任务，OpenClaw Gateway 执行对话/工具。
- 在 Hermes 模式里显示当前 Hermes provider/model/key-present 状态。
- 继续把设置页、日志页、环境检查页的 Hermes 能力做成更完整的可视化配置中心。
- 长期继续推进原前端源码化，降低 bundle 变换维护成本。

## 验证结果
- 已执行 `node scripts\restore-openclaw-shell.mjs`，部署成功。
- 部署前当前 app 已备份到 `E:\backups\app-before-openclaw-shell-restore-20260619121758`。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check scripts\restore-openclaw-shell.mjs` 通过。
- 部署后的 renderer bundle 可检索到 `agent-mode-switch`、`Hermes Agent 会话`、`OpenClaw / Hermes 协同会话`、`ipcHermesChat`。
- 部署后的 CSS 可检索到 `agent-mode-switch`、`hermes-chat-status`、`gateway-mode-switch`。
- `scripts\verify-hermes-runtime.mjs` 通过：Hermes Agent `v0.15.1`，Python `3.12.13`，Node `v24.15.0`，零痕迹环境指向 `E:\data\.hermes`。
- `scripts\verify-openclaw-runtime.mjs` 通过：OpenClaw 数据目录为 `E:\data\.openclaw`，当前模型配置存在，Gateway 当前未运行。
- 部署后的 `dist/assets` 未发现旧 Hermes patch/enhance 资产。

## 如果需要下一台 Codex 接手，提示词
请在 `E:\source\openclawpro-agent-hub` 继续开发。当前方向是保留 OpenClaw 原 UI/功能体系，并把 Hermes 融入原首页、AI 会话、模型配置、环境检查等模块。当前 `scripts/restore-openclaw-shell.mjs` 会从 `E:\backups\app-before-full-source-20260618164815` 恢复原 OpenClaw shell，再加入 Hermes 首页控制卡片、环境检查状态、模型配置 Hermes Tab、托盘入口，以及 AI 会话页 OpenClaw/Hermes/协同模式。下一步建议实机检查 AI 会话页，然后把协同模式接成真实 OpenClaw/Hermes 双 Agent 流水线。每个阶段完成后按 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push` 流程提交，并新增包含“总体目标”的 handoff。
