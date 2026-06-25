# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心；所有能力要和现有前端界面无缝融合，让用户能在首页、AI 会话、模型配置、环境检查、技能管理等模块中自然使用 OpenClaw、Hermes 和协同能力。

## 当前目标
修复 AI 会话中 Hermes 等待回复仍显示英文，以及 OpenClaw 对话窗口发送消息后用户消息没有出现在对话框的问题。

## 已完成
- 对比 `E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 原始 OpenClaw 前端逻辑，确认原版发送链路是 `ChatInput -> handleSend -> store.sendMessage -> messagesMap -> currentMessages -> MessageBubble`。
- 将发送中占位文案从 `Waiting for reply...` 改为运行时显示中文 `等待回复...`，源码使用 Unicode escape，避免 bundled JS 编码污染。
- 为 OpenClaw 会话加入 `_localMessageMutatedAt` 本地消息版本戳。
- 为 `loadSessionMessages()` 加入 `_canReplaceMessagesFromHistory()` 保护：如果历史加载开始后本地已经发送了新消息，则旧的 Gateway/local 历史不能覆盖当前内存消息列表。
- 已重新构建 `dist` 并同步到 `F:\win-unpacked\resources\app\dist`。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `docs/codex-handoff/2026-06-25-openclaw-message-visibility.md`

## 关键决策
- 不通过禁止切换窗口、禁用并发操作或阻断用户点击来规避问题，而是在消息数据流上防止旧历史覆盖刚发送的本地用户消息。
- 这轮没有改 Gateway/OpenClaw runtime 本身，因为 `verify-openclaw-runtime.mjs` 显示 Gateway ready，且问题表现为前端消息已发送但可见列表丢失。
- 中文文案使用 Unicode escape 写入打包 JS，保证运行时是中文，同时避免当前文件的中文编码风险。

## 待继续
- 用户重启 `F:\win-unpacked\OpenClawPro.exe` 后实测：OpenClaw 发送“你好”是否立即出现右侧用户气泡。
- 如果仍无用户气泡，下一步重点查 `agentMode` 是否确实为 `openclaw`、`store.activeSessionKey` 是否在发送瞬间变化、以及 `activeMessages` 是否读取了同一个 key。
- Windows 卡顿/未响应、OpenClaw 回复慢、微信消息触发后 Gateway 停止仍是后续独立性能和 Gateway 稳定性问题。
- Hermes Dashboard 仍为 false，后续需要单独修 Dashboard 生命周期和环境检查展示。

## 验证结果
- `node --check src\openclaw-shell-app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- `npm.cmd run build` 通过。
- `node --check dist\assets\assets\main-DIeui7ZO.js`、`dist\main\index.js`、`dist\main\index.cjs`、`dist\preload\index.js`、`dist\preload\index.cjs` 通过。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-openclaw-runtime.mjs` 通过，Gateway ready。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-hermes-runtime.mjs` 通过；Hermes config/api ready，dashboard 仍未 ready。
- 已确认 F 盘测试包包含 `_localMessageMutatedAt`、`_canReplaceMessagesFromHistory` 和 `\u7b49\u5f85\u56de\u590d...` 修复标记。

## 如果需要下一台 Codex 接手，提示词
请在 `D:\github\u-agent` 继续开发 U 盘便携版 OpenClaw + Hermes 集成项目。当前测试程序在 `F:\win-unpacked\OpenClawPro.exe`，运行时在 `F:\runtime`，数据在 `F:\data`。最新修复针对 AI 会话发送可见性：Hermes/OpenClaw 发送中占位文案应显示中文“等待回复...”，OpenClaw 发送后用户消息应立即进入当前会话消息列表，且历史加载不能覆盖刚发送的本地消息。请先让用户重启 F 盘程序实测；如果仍无用户气泡，重点查 `handleSend()` 是否走 OpenClaw 分支、`store.activeSessionKey` 是否发送前后变化、`messagesMap.value[sk]` 是否被其他 watcher 覆盖、`activeMessages` 是否读取同一个 session key。不要通过禁止切换窗口或阻断用户操作来规避。每阶段完成后运行 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`，并新增 `docs/codex-handoff/YYYY-MM-DD-xxx.md`，且在 `## 当前目标` 前保留 `## 总体目标`。
