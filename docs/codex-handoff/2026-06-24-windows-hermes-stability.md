# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且与现有程序前端界面无缝融合，让用户在前端获得良好体验。

## 当前目标
修复 Windows 测试包中协同对话误判 Gateway 未就绪、Hermes 长时间无反馈、协同报错、环境检查待验证，以及 OpenClaw/Hermes 启动后明显卡顿的问题。

## 已完成
- 协同对话就绪判断改为同时参考 OpenClaw WebSocket、Gateway ready 和 Gateway running，避免 Gateway 已启动时仍显示“等待 Gateway 就绪”。
- 协同发送前如果 Gateway 已启动但 WebSocket 尚未握手，会显示“正在连接 OpenClaw 会话”，等待短时间后再发送。
- Hermes chat progress 事件统一追加动态耗时信息，用户可以看到任务仍在执行。
- OpenClaw 启动前自动清理 `data/.openclaw/plugin-skills/browser-automation` 这个错误的普通目录，避免 OpenClaw 反复创建 plugin skill symlink 时触发 `EISDIR` 并拖慢请求。
- Hermes 环境检查的自我成长状态会结合 skill 可见性报告判断，避免在已具备技能闭环时长期显示“待验证”。
- 已重新构建并同步到 `F:\win-unpacked\resources\app\dist`。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `docs/codex-handoff/2026-06-24-windows-hermes-stability.md`

## 关键决策
- 不阻止用户在 Hermes、OpenClaw、协同之间切换；修复连接和状态判断本身。
- 不清空用户数据，只对已知冲突的 OpenClaw plugin skill 自动目录做定点规范化。
- Hermes 官方 oneshot 目前不能像 OpenClaw 一样稳定流式展示 token，因此先在主进程 progress 出口统一增加动态耗时和阶段反馈。
- 对“自我成长”环境项采用两层判断：优先使用官方 growth 验证报告；没有报告时，若 Hermes 已能看到同步技能和 slash command，则显示能力已具备。

## 待继续
- 用户需要重启 `F:\win-unpacked\OpenClawPro.exe` 后验证协同对话、Hermes 对话和首页状态。
- 如果仍有卡顿，需要抓取 `F:\data\.openclaw\logs\desktop-crash.log`、`gateway-launcher.log`、最新 OpenClaw 日志和 `F:\data\.hermes\logs\*.log`。
- 可继续优化 OpenClaw chat.history/sessions.list 的重复刷新节流，但这次没有触碰核心 OpenClaw store，避免再次引入聊天主流程回归。
- 后续需要把本轮 Windows 验证后的正式包重新打包。

## 验证结果
- `npm.cmd run build` 通过。
- `node --check src/openclaw-shell-app/dist/main/index.js` 通过。
- `node --check src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js` 通过。
- `node --check dist/main/index.cjs` 通过。
- `node --check dist/assets/assets/main-DIeui7ZO.js` 通过。
- `AGENT_HUB_ROOT=F:\ node scripts/verify-openclaw-runtime.mjs` 通过，CLI smoke 通过；Gateway 端口未运行是验证时未启动服务导致。
- `AGENT_HUB_ROOT=F:\ node scripts/verify-hermes-runtime.mjs` 通过，Hermes/Python/Node 均可用；端口未运行是验证时未启动服务导致。
- `AGENT_HUB_ROOT=F:\ node scripts/verify-hermes-memory.mjs` 通过。
- `AGENT_HUB_ROOT=F:\ node scripts/verify-hermes-skills.mjs` 通过，80 个 source skill、77 个 Hermes 可见命令。
- `AGENT_HUB_ROOT=F:\ node scripts/verify-hermes-skill-growth.mjs` 通过，官方创建、可见、同步 OpenClaw、清理闭环均成功。

## 如果需要下一台 Codex 接手，提示词
你现在接手 `D:\github\u-agent`。总体目标是把 U 盘便携版 OpenClaw 客户端完整集成 Hermes Agent，做到零安装、零痕迹、Windows/macOS/Linux 原生、Universal 包、共享技能、自我成长、可视化配置和良好前端体验。当前 Windows 测试目录是 `F:\`，测试程序是 `F:\win-unpacked\OpenClawPro.exe`。先阅读 `docs/codex-handoff/2026-06-24-windows-hermes-stability.md`，然后重点验证：协同对话不再误判 Gateway 未就绪，Hermes 请求有动态进度，环境检查 Hermes 自我成长显示已闭环，OpenClaw 启动和切换页面不卡死。不要用运行时补丁，必须改源码基线 `src/openclaw-shell-app/dist` 并重新 `npm.cmd run build`，再同步到 `F:\win-unpacked\resources\app\dist`。每次阶段性完成后执行 `git status`、`git diff`、`git add`、`git commit -m "..."`、`git push`，并新增 handoff 文档。
