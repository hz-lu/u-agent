# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw 实现集成 Hermes，达到零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并与现有 OpenClaw 前端界面无缝融合，提供良好用户体验。

## 当前目标
修复 Windows 测试盘 `F:\` 中 OpenClaw 已启动但 AI 会话仍显示“等待 Gateway 就绪”、微信扫码一直转圈不生成二维码的问题。

## 已完成
- 将 AI 会话 WebSocket 默认端口从错误的 `4444` 修正为 `18789`。
- 新增 `gateway-status-read` IPC，前端进入首页或 AI 会话时主动读取主进程/端口健康状态，不再依赖首页事件是否先初始化。
- 恢复 OpenClaw 默认插件集合：`qwen`、`memory-core`、`browser`、`canvas`、`device-pair`、`file-transfer`、`phone-control`、`talk-voice`。
- 调整微信插件策略：微信插件随包携带，但不再默认进入 Gateway 启动预热链路；用户点击微信扫码时再自动安装/启用 `openclaw-weixin`。
- 修复验证脚本读取 UTF-8 BOM 配置时误判模型为空的问题。
- 同步新构建到 `F:\win-unpacked\resources\app\dist`，并把 `F:\data\.openclaw\openclaw.json` 重写为 UTF-8 无 BOM，同时保留用户模型/API Key。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/preload/index.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `dist/preload/index.js`
- `dist/preload/index.cjs`
- `scripts/restore-openclaw-shell.mjs`
- `scripts/build-windows-release.mjs`
- `scripts/stage-windows-portable-test.mjs`
- `scripts/verify-openclaw-runtime.mjs`
- `src/main/runtime/openclaw-runtime.ts`

## 关键决策
- OpenClaw Gateway 启动不再默认加载微信通道，避免 `openclaw-weixin` 插件预热阻塞基础 AI 会话。微信能力改为按需启用。
- AI 会话 readiness 以 `Gateway 端口健康 + WebSocket 握手` 双层判断：先允许前端识别 Gateway 已运行，再自动重连 WebSocket。
- 当前测试盘配置属于用户数据，只做保留模型配置的迁移，不把 F 盘数据写入仓库。

## 待继续
- 用户需要完全退出并重新打开 `F:\win-unpacked\OpenClawPro.exe`，让新主进程代码生效。
- 实机验证：启动 OpenClaw 后直接进入 AI 会话，确认不再卡“等待 Gateway 就绪”。
- 实机验证：聊天工具里重新扫码，确认插件按需启用后能生成二维码。
- 如果微信扫码仍慢，需要采集 `wechat-log` 和 `F:\data\.openclaw\tmp\openclaw\openclaw-2026-06-24.log` 的最新扫码片段。

## 验证结果
- `npm.cmd run build` 通过。
- `node --check src/openclaw-shell-app/dist/main/index.js`、`src/openclaw-shell-app/dist/preload/index.js`、`dist/main/index.js`、`dist/preload/index.js` 通过。
- `AGENT_HUB_ROOT=F:\ node scripts/verify-openclaw-runtime.mjs` 通过，runtime 完整，模型配置可读，Gateway 当前未运行时 `ready=false` 属正常。
- `AGENT_HUB_ROOT=F:\ node scripts/verify-hermes-runtime.mjs` 通过。

## 如果需要下一台 Codex 接手，提示词
你正在接手 `D:\github\u-agent`，测试盘是 `F:\`。总体目标是把 U 盘便携版 OpenClaw 与 Hermes 深度融合，保持 OpenClaw 原 UI/功能并加入 Hermes。最近修复了 OpenClaw 已启动但 AI 会话等待 Gateway、微信扫码一直转圈的问题：AI 会话端口默认值已从 4444 改为 18789，新增 `gateway-status-read` IPC，OpenClaw 默认插件恢复，微信插件改为扫码时按需启用。请先让用户完全退出并重新打开 `F:\win-unpacked\OpenClawPro.exe`，验证启动 OpenClaw 后 AI 会话是否可对话、微信扫码是否出二维码。若失败，优先读取 `F:\data\.openclaw\logs\gateway-launcher.log`、`F:\data\.openclaw\tmp\openclaw\openclaw-2026-06-24.log` 和前端微信日志；不要回滚 OpenClaw 默认插件策略，不要把微信插件重新设为默认 Gateway 启动插件。
