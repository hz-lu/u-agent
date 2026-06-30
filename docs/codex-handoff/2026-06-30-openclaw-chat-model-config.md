# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并与现有前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 F 盘测试中 OpenClaw 已启动但 AI 会话仍提示等待就绪、消息长时间无回复的问题；调整模型配置中词符科技默认项的展示和编辑体验。

## 已完成
- OpenClaw AI 会话发送链路增加主进程 Gateway IPC 兜底：WebSocket ready 时仍走原链路，Gateway ready 但页面 WebSocket 未完成 startup 时可通过主进程发送。
- 增加 `gateway-chat-history` IPC，发送后按时间点主动回拉 `chat.history`，避免回复只停留在 Gateway、桌面端不展示。
- OpenClaw 发送放行条件收紧为 WebSocket ready 或 Gateway ready，不再仅凭进程 running 提前发送。
- 词符科技默认模型项展示为“推荐模型 / 词符科技 / 模型名称”的组合效果。
- 词符科技默认项允许编辑 API Key 和模型名称，不允许删除的约束保持不变。
- F 盘测试壳 `F:\win-unpacked\resources\app\dist` 已同步最新构建产物。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/preload/index.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `dist/preload/index.js`
- `dist/preload/index.cjs`
- `docs/codex-handoff/2026-06-30-openclaw-chat-model-config.md`

## 关键决策
- 不改 Hermes 会话链路，只修 OpenClaw ready 状态分裂和模型配置显示。
- 保持 OpenClaw 原 WebSocket 协议语义，未改动 `chat.send` 的 `deliver: false` 参数；兜底通道与原通道保持一致。
- Gateway 未 ready 时继续排队；Gateway ready 但 WebSocket startup 较慢时通过主进程 IPC 发送，降低“已启动但不能聊”的割裂感。
- 词符科技项的 UI 仍使用推荐模型卡片样式，模型名作为第三段信息展示。

## 待继续
- 需要用户在 F 盘壳中实际启动后验证：OpenClaw 首页 ready 后，AI 会话发送消息是否立即显示用户消息并进入发送流程。
- 如果仍出现回复不回流，需要抓取 `F:\data\.openclaw\logs\gateway-launcher.log` 中对应时间段的 `chat.send` 和 `chat.history` 记录。
- 后续再整理 release 版本，当前轮未做 release 包重整。

## 验证结果
- `node --check src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js` 通过。
- `node --check src/openclaw-shell-app/dist/main/index.js` 通过。
- `node --check src/openclaw-shell-app/dist/preload/index.js` 通过。
- `npm.cmd run build` 通过，已生成顶层 `dist`。
- `F:\runtime\openclaw.cmd config validate --json` 返回 `{"valid":true,"path":"F:\\data\\.openclaw\\openclaw.json"}`。
- 已确认 F 盘壳内 `dist` 包含 `gatewayChatHistory`、`词符科技 /`、OpenClaw 同步回复提示和 `_isOpenClawSendPathAvailable`。

## 如果需要下一台 Codex 接手，提示词
请在 `D:\github\u-agent` 继续开发。当前刚修复 OpenClaw AI 会话 ready 状态分裂：源码在 `src/openclaw-shell-app/dist`，构建后同步到顶层 `dist`，并已拷贝到 `F:\win-unpacked\resources\app\dist`。重点验证：OpenClaw 首页显示 ready 后，AI 会话发送消息是否显示用户消息、是否通过 WebSocket 或 `gateway-chat-send` IPC 到达 Gateway、是否通过 `gateway-chat-history` 回拉回复。不要改 Hermes 链路，除非有明确 Hermes 复现问题。模型配置中词符科技默认项应展示为“推荐模型 / 词符科技 / 模型名称”，只能编辑 API Key 和模型名称，不能删除。
