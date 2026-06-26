# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心。以上能力要与现有程序前端界面无缝融合，让用户在 OpenClaw、Hermes 和协同模式之间获得稳定、清晰、性能良好的体验。

## 当前目标
修复恢复 OpenClaw 原始链路后出现的空会话发送断点：AI 会话中给 OpenClaw 发送消息必须立即显示用户消息，不能因为 active session 为空或 Gateway 未 ready 而静默无反馈。同时降低模型配置启动期自动写配置导致 Gateway 热加载和闪退的风险。

## 已完成
- 修复 OpenClaw 初始化时没有 active session 的问题：
  - 如果已有 `main` 会话但没有 active key，自动选中 `main`。
  - 如果发送时 active key 为空，恢复调用 `ensureActiveSession()`，只恢复会话兜底，不恢复 UI 镜像层。
- 修复 OpenClaw Gateway 未 ready 时静默丢消息的问题：
  - 用户消息先写入 `messagesMap`，因此对话框会立即显示发送内容。
  - 如果 WebSocket 未 ready，会尝试连接 Gateway，并在当前会话显示明确错误提示，释放发送链路，不再卡死。
- 修复模型配置 watcher 在软件启动时立即写 OpenClaw 配置的问题：
  - 首次加载已有模型只记录快照，不写配置。
  - 只有用户真实变更模型配置时才调用 `ipcWriteOpenClawConfig`。
  - 写配置失败时捕获错误并打印 warning，避免未处理 Promise 影响 renderer。
- 已构建 `dist` 并部署到 F 盘当前 U 盘壳。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `docs/codex-handoff/2026-06-26-openclaw-session-send-fix.md`

## 关键决策
- 保留 OpenClaw 原始 direct flow，不恢复此前导致重复/错乱的 `openclawUiMessages` 本地镜像层。
- 发送前只增加必要的 active session 兜底，这是让原始链路在脏数据/空状态下可用的最小修复。
- Gateway 未 ready 时不再假装发送成功，也不再静默 return，而是让用户消息可见并给出明确中文反馈。
- 模型配置不应在应用启动读取本地模型时自动写回 OpenClaw 配置，避免重启后触发 Gateway 热加载。

## 待继续
- 用户需要重新运行 `F:\win-unpacked\OpenClawPro.exe` 验证：
  - AI 会话打开后是否恢复历史会话。
  - 给 OpenClaw 发消息后，用户消息是否立即显示。
  - Gateway 未 ready 时是否显示明确错误，而不是空白。
  - Gateway ready 后消息是否能到网页端并正常回复。
  - 改模型配置后重启是否还会闪退。
- Hermes 自动启动慢暂未改核心启动逻辑。日志显示 Hermes 冷启动主要耗时来自插件发现和 Gateway 启动，本次没有改 Hermes 启动路径。后续如果继续优化，应做 Hermes 预热/启动状态流式反馈，而不是阻塞 AI 会话。

## 验证结果
- `node --check src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js` 通过。
- `npm.cmd run build` 通过。
- `node --check dist/main/index.cjs` 通过。
- `node --check dist/preload/index.cjs` 通过。
- 已部署到 `F:\win-unpacked\resources\app\dist`。
- F 盘实际产物校验通过：
  - `const sk = ensureActiveSession();`
  - `if (!_ws || _ws.status?.value !== "ready")`
  - `modelsConfigWatchReady`
  - `lastModelsConfigJson`
- 本次 F 盘旧版备份：
  - `F:\win-unpacked\resources\app\dist.backup-20260626-154020`

## 如果需要下一台 Codex 接手，提示词
继续开发 `D:\github\u-agent`。当前刚修复 OpenClaw AI 会话发送空白问题：发送前恢复 `ensureActiveSession()`，初始化时兜底选中 main session，Gateway 未 ready 时用户消息仍显示并给中文错误提示。不要恢复 `openclawUiMessages`、UI echo、`gatewayChatSend` fallback 或 AI 会话页 Gateway 轮询。若用户仍反馈 OpenClaw 无回复，下一步检查 WebSocket 连接事件、`store.isReady`、Gateway 日志中的 `chat.send` 是否收到请求。若反馈 Hermes 慢，优先做预热和进度反馈，不要改 OpenClaw 链路。
