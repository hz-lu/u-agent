# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心；所有能力要和现有前端界面无缝融合，让用户能在首页、AI 会话、模型配置、环境检查、技能管理等模块中自然使用 OpenClaw、Hermes 和协同能力。

## 当前目标
修复首页显示 Gateway 已连接，但 AI 会话输入框仍显示“等待 Gateway 就绪”、OpenClaw 发消息无明显反馈、Hermes 发送中误显示 Gateway 未就绪的问题。

## 已完成
- AI 会话输入框的 OpenClaw 可用判断从只看 `store.isReady` 改为看 `gatewayAvailable`，避免首页已确认 Gateway 运行时仍禁用输入框。
- Hermes/Hermes 协同发送中，输入框占位文案改为 `Waiting for reply...`，避免误导用户以为 Gateway 未就绪。
- OpenClaw 发送时如果 `_ws` 通道还没建立，不再静默调用空的 `_ws?.chatSend`，会主动触发连接并返回明确错误。
- `ensureOpenClawChatReady()` 不再只等待 `store.isReady`，Gateway 进程已运行或首页已确认 ready 时会放行，由底层 `chat.send` 等待 WebSocket 握手并返回明确错误。
- 协同模式发送前的 ready 判断同步改为 `store.isReady || gatewayAvailable`，避免首页已启动 Gateway 时协同会话仍长时间显示等待 OpenClaw 会话。
- 已重新构建 `dist` 并同步到 `F:\win-unpacked\resources\app\dist`。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `docs/codex-handoff/2026-06-25-chat-ready-state-fix.md`

## 关键决策
- 这轮先修“错误禁用/错误文案/静默空操作”，不再扩展连续发送队列，避免在打包后的混合编码文件里引入新风险。
- 新增文案使用 ASCII 英文，避免当前 bundled renderer 的编码问题把新中文变成问号。
- OpenClaw 后端仍保持单轮生成模型；如果上一轮仍在生成，后续需要单独设计可见队列或明确的忙碌反馈。

## 待继续
- 用户重新打开 `F:\win-unpacked\OpenClawPro.exe` 实测：OpenClaw 模式输入框是否还显示等待 Gateway，发送消息是否能先显示用户气泡。
- 如果发送仍无气泡，需要继续查 `store.sending` 是否长时间卡住 true，以及 chat input 是否因为 `sending` 禁用了发送按钮。
- Gateway 日志仍显示启动期 event-loop starvation、model warmup、WeChat getUpdates 超时，这些仍是 Windows 卡顿和慢响应的主要后续优化方向。
- Hermes Dashboard 端口仍未 ready，需后续单独修环境检查和 Dashboard 生命周期。

## 验证结果
- `node --check src\openclaw-shell-app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- `npm.cmd run build` 通过。
- `node --check F:\win-unpacked\resources\app\dist\main\index.js`、`index.cjs`、`preload\index.js`、`preload\index.cjs` 通过。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-openclaw-runtime.mjs` 通过，Gateway ready。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-hermes-runtime.mjs` 通过；Hermes config/api ready，dashboard 仍未 ready。
- 已确认 F 盘测试包包含 `activeReady`、`Waiting for reply...`、`Gateway chat channel is connecting...` 修复标记。
- 已确认 F 盘测试包包含 `gatewayAvailable.value) return true` 和 `!store.isReady && !gatewayAvailable.value` 修复标记。

## 如果需要下一台 Codex 接手，提示词
请在 `D:\github\u-agent` 继续开发 U 盘便携版 OpenClaw + Hermes 集成项目。当前测试程序在 `F:\win-unpacked\OpenClawPro.exe`，运行时在 `F:\runtime`，数据在 `F:\data`。最新问题集中在 Windows AI 会话页的 ready 状态、OpenClaw 消息入框、Hermes 长任务反馈和 Gateway 卡顿。先实测本轮修复是否让输入框不再错误显示等待 Gateway；如果仍无消息入框，重点查 `store.sending` 是否长期 true、`ChatInput.canSend` 是否禁用、`sendMessage()` 是否提前 return。不要通过禁止切换窗口或阻断用户操作来规避问题。每阶段完成后运行 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`，并新增 `docs/codex-handoff/YYYY-MM-DD-xxx.md`，且在 `## 当前目标` 前保留 `## 总体目标`。
