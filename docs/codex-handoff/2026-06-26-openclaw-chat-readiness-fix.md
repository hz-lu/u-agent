# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并和现有前端界面无缝融合，提供良好的 OpenClaw / Hermes / 协同体验。

## 当前目标
修复 Windows 便携壳中 OpenClaw 已在首页启动、网页版网关可用，但 AI 会话 OpenClaw Tab 仍显示“等待 Gateway 就绪”、发送消息不显示且未到达网关的问题；同时修复协同会话 `CHAT_DEBUG is not defined`。

## 已完成
- 将 `CHAT_DEBUG` 从 `useChatWs()` 闭包内移到 renderer bundle 模块级，避免协同流程引用时报 `CHAT_DEBUG is not defined`。
- OpenClaw Tab 的输入就绪判定改为认可首页网关状态：`gatewayAvailable || store.isReady`，避免网关已运行时输入框仍被禁用。
- OpenClaw `sendMessage()` 保持原始链路：先写入当前会话 `messagesMap` 并持久化，再等待最多 10 秒的 WebSocket 握手，然后调用原始 `_ws.chatSend(...)`。
- 移除了发送路径里“WS 刚就绪后立即 `loadSessionMessages(sk)`”的覆盖隐患，避免本地刚显示的用户消息被远端旧历史刷掉。
- 重新执行 `npm run build`，并将构建后的 `dist` 部署到 `F:\win-unpacked\resources\app\dist`。
- 部署前备份了 F 盘旧产物：`F:\win-unpacked\resources\app\dist.backup-20260626-160803`。
- 清理了旧的临时 Gateway lock：`F:\data\.openclaw\tmp\openclaw\gateway.af4b9863.lock`。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/assets/assets/main-DIeui7ZO.js`

## 关键决策
- 不再用额外 UI mirror 层修 OpenClaw，会话发送继续走原始 OpenClaw WebSocket/Gateway 链路。
- UI 是否允许发送与 Gateway 是否运行对齐，实际发送前再等待内部 WebSocket ready，避免“首页已连接但聊天页禁用”的割裂体验。
- 用户消息必须先进入本地会话列表，这是防止“点击发送后什么都没有”的底线。
- 当前仓库中 OpenClaw shell 的可维护前端源码实际是已打包 bundle，因此修复直接落在受版本控制的 shell bundle，并通过现有构建脚本复制到根 `dist`。

## 待继续
- 用户需要重新启动 `F:\win-unpacked\OpenClawPro.exe` 手动验证：
  - 首页启动 OpenClaw 后，AI 会话 OpenClaw Tab 不再显示“等待 Gateway 就绪”。
  - 发送消息后用户消息立即出现在对话框。
  - OpenClaw 网页网关能收到桌面端发送的消息并回复。
  - 协同会话不再报 `CHAT_DEBUG is not defined`。
- 若仍存在 OpenClaw 回复慢或微信连接慢，应继续从 Gateway 日志和 WeChat 适配层排查，不要再改 OpenClaw 会话 UI 的发送基础链路。

## 验证结果
- `npm run build` 通过。
- `node --check dist/main/index.cjs` 通过。
- `node --check dist/preload/index.cjs` 通过。
- F 盘部署后 `node --check F:\win-unpacked\resources\app\dist\main\index.cjs` 通过。
- F 盘部署后 `node --check F:\win-unpacked\resources\app\dist\preload\index.cjs` 通过。
- F 盘产物确认包含：
  - `const CHAT_DEBUG = false;`
  - `_waitForReadyConnection(...)`
  - OpenClaw `activeReady` 使用 `gatewayAvailable.value || store.isReady`
- 冒烟启动 `F:\win-unpacked\OpenClawPro.exe` 8 秒，进程存活，`desktop-crash.log` 未更新；随后已关闭 F 盘相关进程。

## 如果需要下一台 Codex 接手，提示词
继续开发 `D:\github\u-agent`。当前重点是 Windows 便携版 OpenClaw / Hermes 集成稳定性。最近一次修复已提交：OpenClaw AI 会话输入就绪不再只依赖 `store.isReady`，发送路径先写入本地消息再等待 WS ready，并修复协同 `CHAT_DEBUG is not defined`。请先验证 `F:\win-unpacked\OpenClawPro.exe`：首页启动 OpenClaw 后，AI 会话 OpenClaw Tab 能否立即输入，发送消息是否立即显示，网页网关是否收到消息，协同是否不再报 `CHAT_DEBUG`。若仍有问题，优先对照 `E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 的原始 OpenClaw 链路，不要引入 UI mirror 或阻塞式状态机。每次阶段性工作后执行 `git status`、`git diff`、`git add`、`git commit`、`git push`，并更新 `docs/codex-handoff/`。
