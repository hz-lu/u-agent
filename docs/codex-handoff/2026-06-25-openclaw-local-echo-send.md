# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw 实现集成 Hermes，形成零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心的一体化 Agent Hub，并与现有 OpenClaw 前端界面无缝融合，保持良好的用户体验。

## 当前目标
修复 AI 会话中 OpenClaw 标签页发送消息后用户消息不显示、桌面端没有反馈、Gateway 未完全 ready 时发送链路容易静默失败的问题，并重新生成 Windows Electron 壳。

## 已完成
- 对 OpenClaw 会话增加页面级本地消息镜像 `openclawUiMessages`，发送后立即显示用户气泡。
- 本地用户消息同时写入 OpenClaw store 的 `messagesMap`，避免页面切换、历史刷新或发送异步卡住时 UI 空白。
- 为本地回显消息增加 `_uiEchoKey`，并在 `store.sendMessage` 正式写入用户消息时识别并替换本地回显，避免重复消息。
- OpenClaw 页面层发送改为 fire-and-forget，不再 `await store.sendMessage` 阻塞界面；失败时追加中文错误气泡。
- 清空会话、`/new`、`/reset` 时同步清理 OpenClaw 本地消息镜像。
- 重新构建并刷新 `D:\github\u-agent\win-unpacked`，最终 Electron 包内已经包含本次修复。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `docs/codex-handoff/2026-06-25-openclaw-local-echo-send.md`

## 关键决策
- 用户点击发送后，消息必须立即出现在对话框里，这是 UI 层硬保障，不能依赖 Gateway 是否 ready 或后端是否返回。
- Gateway 发送链路仍由 `store.sendMessage` 负责；页面层只负责即时反馈和错误提示，避免长任务或连接等待拖死渲染交互。
- 本地回显和正式发送消息用 `_uiEchoKey` 合并，保证既不空白，也不重复。

## 待继续
- 用户需要将 `D:\github\u-agent\win-unpacked` 复制到 `F:\win-unpacked` 后实际测试 OpenClaw 标签页：发送后是否立刻显示用户消息、Gateway 网页端是否收到、AI 回复是否回流。
- 如果 Gateway 仍收不到，下一步不要再改输入框，直接抓主进程 `gateway-chat-send`、renderer WebSocket、Gateway `chat.send` 请求和 `chat.message` 广播事件。
- 仍需继续优化 Windows 端未响应/卡顿、微信扫码消息通道稳定性、Hermes 长任务过程反馈与协同会话体验。

## 验证结果
- `npm.cmd run build`：通过。
- `npm.cmd run package:windows-shell`：通过；Electron 下载超时后复用已有 shell，并成功刷新 `win-unpacked/resources/app/dist`。
- `node --check D:\github\u-agent\win-unpacked\resources\app\dist\main\index.cjs`：通过。
- `node --check D:\github\u-agent\win-unpacked\resources\app\dist\preload\index.cjs`：通过。
- 静态核验 `D:\github\u-agent\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js`：确认包含 `_uiEchoKey`、`appendOpenClawUiMessage`、`Promise.resolve(store.sendMessage(...))`、Gateway IPC fallback 相关逻辑。

## 如果需要下一台 Codex 接手，提示词
你接手的是 `D:\github\u-agent` 的 OpenClawPro + Hermes 便携 Agent Hub。用户当前最关注 Windows 端 OpenClaw 聊天闭环和程序稳定性。请先阅读 `docs/codex-handoff/2026-06-25-openclaw-local-echo-send.md`。如果用户复制新 `win-unpacked` 到 F 盘后 OpenClaw 仍无法聊天，重点验证：页面发送事件是否触发、本地 `_uiEchoKey` 气泡是否出现、主进程 `gateway-chat-send` 是否被调用、Gateway 是否收到 `chat.send`、Gateway 是否广播 `chat.message`、renderer WebSocket 是否接收到事件、sessionKey 是否一致。不要在 F 盘临时补丁，必须改 `D:\github\u-agent` 源码并重新 `npm run build` / `npm run package:windows-shell`。每个阶段按 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push` 流程提交。
