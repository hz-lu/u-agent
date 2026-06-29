# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心。所有能力都要和现有程序前端界面无缝融合，让用户在前端界面获得清晰、稳定、自然的体验。

## 当前目标
优化 OpenClaw 未完全就绪时的 AI 会话体验：输入框和发送按钮保持可用，用户发送的消息立即显示；如果 OpenClaw 会话 WebSocket 尚未 ready，则消息进入有界待发送队列，等 ready 后自动串行发送。同时从第一性原理保护性能，防止消息轰炸、超长文本和大附件拖垮界面或 Gateway。

## 已完成
- 在 OpenClaw chat store 中加入有界待发送队列。
- 未 ready 或上一条 OpenClaw 消息仍在生成时，新消息不再丢失，也不再同步等待 10 秒卡 UI，而是立即显示并提示已排队。
- 队列 ready 后由 WebSocket ready 事件触发自动 flush，按顺序串行发送。
- OpenClaw 回复 final/error 后会继续 flush 下一条队列消息。
- `/stop` 或 Gateway 停止时会取消队列并给用户明确中文提示。
- 增加防滥用限制：最多 3 条待发送消息、单条文本最多 12000 字、最多 3 个附件、限制内嵌图片/附件体积。
- 已构建 `dist` 并部署到 `F:\win-unpacked\resources\app\dist`。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `docs/codex-handoff/2026-06-29-openclaw-ready-queue.md`

## 关键决策
- 不再通过禁用输入或阻塞 tab 来“规避问题”，而是在 OpenClaw Adapter 层做队列和背压。
- 队列只作用于 OpenClaw 会话，不改 Hermes 和协同会话发送逻辑。
- 消息必须先出现在 UI，再决定直接发送或入队，避免再次出现“发送后对话框没有文字”的体验问题。
- 队列 flush 使用 ready/final/error 事件触发，不增加高频轮询，降低 UI 卡顿风险。
- 保留旧 `sendMessageLegacy` 作为源码内参考，但实际 UI 导出调用新的 `sendMessage`。

## 待继续
- 在真实 F 盘应用中测试：OpenClaw 启动未 ready 时连续发送 1-3 条短消息，确认 ready 后会自动按顺序发送并收到回复。
- 测试超过 3 条、超长文本、大图片附件时是否立即出现中文提示且程序不卡顿。
- 如果真实测试中“排队提示消息”显得太吵，可以进一步改成用户消息角标/折叠状态，而不是 assistant 提示。

## 验证结果
- `node --check src\openclaw-shell-app\dist\main\index.js` 通过。
- `node --check src\openclaw-shell-app\dist\preload\index.js` 通过。
- renderer bundle `node --check` 通过。
- `npm.cmd run build` 通过。
- 已复制构建产物到 `F:\win-unpacked\resources\app\dist`。
- F 盘部署后的 main/preload/renderer 语法检查通过。
- `npm.cmd run audit:openclaw-shell` 通过，24/24。

## 如果需要下一台 Codex 接手，提示词
请在 `D:\github\u-agent` 继续开发 U 盘便携版 OpenClawPro + Hermes 集成项目。当前重点是验证并打磨 OpenClaw 未 ready 时的待发送队列体验：输入框和发送按钮保持可用，消息立即显示，OpenClaw ready 后自动串行发送；同时要保护性能，防止消息轰炸、超长文本、大附件导致 UI 卡顿。请优先阅读 `docs/codex-handoff/2026-06-29-openclaw-ready-queue.md`、`src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js` 中 OpenClaw chat store 的 `sendMessage` / `queueOpenClawMessage` / `flushOpenClawQueue`。不要改坏 Hermes 和协同会话。完成阶段性修改后运行 `npm.cmd run build`、部署到 `F:\win-unpacked\resources\app\dist`、运行 `npm.cmd run audit:openclaw-shell`，然后按 git status/diff/add/commit/push 流程提交。
