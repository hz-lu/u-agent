# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心。以上能力要与现有程序前端界面无缝融合，让用户在 OpenClaw、Hermes 和协同模式之间获得稳定、清晰、性能良好的体验。

## 当前目标
恢复 OpenClaw 从启动到 AI 会话的完整链路，使其与 E 盘原始可用程序一致；保留 Hermes 与协同会话现有逻辑，但 OpenClaw 必须回到原始 direct flow，并优先保证性能和状态一致性。

## 已完成
- 对比了 E 盘原始程序和当前源码中的 OpenClaw 启动、ready、AI 会话发送链路。
- 将 `start-gateway` IPC 恢复为等待 `await gateway.startGateway()` 完成后返回，避免首页显示启动但 Gateway 尚未真正可用。
- 将 OpenClaw 对话发送恢复为原始链路：`handleSend -> store.sendMessage -> messagesMap 写入用户消息 -> _ws?.chatSend(...)`。
- 删除 OpenClaw 对话本地 UI 镜像层和消息合并 watcher，避免用户消息不显示、重复显示、状态错乱和渲染压力。
- 删除 renderer 侧 `gatewayChatSend` fallback 与额外重连逻辑，OpenClaw 回到 WebSocket 原链路。
- 删除 AI 会话页 Gateway readiness 轮询，减少无意义 IPC 和状态抖动。
- 用 adapter-like dispatch 分离 OpenClaw、Hermes、Collaborative 三个 Tab 的交互行为。
- 已按用户要求只构建 `dist`，未重新打新的 Electron 壳。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `dist/preload/index.cjs`
- `docs/codex-handoff/2026-06-26-openclaw-chain-restore.md`

## 关键决策
- OpenClaw 的 ready 状态只看 `store.isReady`，不再把首页 `running` 当作 AI 会话可发送状态。
- OpenClaw 发送不再使用 UI echo、消息镜像或 IPC fallback，避免把“消息显示”和“消息发送”拆成两条互相竞争的链路。
- Hermes 与协同模式继续通过独立 adapter 保持现有逻辑，后续优化不应再影响 OpenClaw 原始链路。
- 本阶段只构建 `dist`，用户会把新的 `dist` 放进当前 U 盘壳中测试。

## 待继续
- 用户将把本次构建好的 `dist` 覆盖到 U 盘壳中测试。
- 重点验证：
  - 首页启动 OpenClaw 后，AI 会话不再长期等待 Gateway 就绪。
  - OpenClaw 对话发送后，用户消息立即显示在对话框。
  - OpenClaw 网页端 Gateway 能收到消息并返回回复。
  - 微信扫码连接后发消息不会导致 OpenClaw 自动停止。
  - 多次切换页面和点击功能时不再出现明显未响应。
- 如果仍有性能问题，下一步优先做主进程/renderer 阻塞点定位，不要再改 OpenClaw 发送链路。

## 验证结果
- `npm.cmd run build` 通过。
- `node --check dist/main/index.cjs` 通过。
- `node --check dist/preload/index.cjs` 通过。
- 构建后 marker 校验通过：
  - OpenClaw `handleSend` 调用 `store.sendMessage(text2, attachments);`
  - OpenClaw `activeMessages` 使用 `store.currentMessages`
  - OpenClaw `activeReady` 使用 `store.isReady`
  - OpenClaw store 使用 `_ws?.chatSend(sk, sendText, sendAtts)`
- 构建后确认无残留：
  - `openclawUiMessages`
  - `_gatewayStatusPollTimer`
  - `_uiEchoKey`
  - `appendOpenClaw`
  - `Promise.resolve(store.sendMessage`
  - `refreshGatewayReadinessForChat`
  - `startGatewayReadinessPoll`
  - `_lastGatewayConnectKickAt`

## 如果需要下一台 Codex 接手，提示词
继续开发 `D:\github\u-agent`。当前阶段刚把 OpenClaw 启动到 AI 会话的链路恢复为 E 盘原始 direct flow，并已构建 `dist`，未打新 Electron 壳。不要恢复 `openclawUiMessages`、UI echo、`gatewayChatSend` fallback 或 AI 会话页 Gateway 轮询。若用户测试仍有卡顿或微信问题，先定位主进程和 renderer 的阻塞点、日志和 Gateway 进程状态，不要再次改坏 OpenClaw 原始发送链路。
