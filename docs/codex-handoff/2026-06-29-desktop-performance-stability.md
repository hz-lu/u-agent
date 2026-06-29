# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心。所有能力都要和现有程序前端界面无缝融合，让用户在前端界面获得清晰、稳定、自然的体验。

## 当前目标
针对 Windows 桌面壳在首页启动 OpenClaw/Hermes 后出现“未响应”并闪退的问题，从第一性原理降低 Electron 主进程和渲染进程的启动压力，避免同步状态检查、日志读取和高频日志渲染共同拖垮 UI。

## 已完成
- 分析 F 盘运行日志，确认 OpenClaw Gateway 自身出现 `event-loop starvation`，启动后 `provider auth state pre-warmed` 可阻塞 17-20 秒，`chat.history/sessions.list` 可被拖到 15 秒级。
- 首页挂载改为分帧执行：先注册日志监听，再延迟执行环境检查、Hermes 状态刷新和 Hermes 历史日志加载。
- 首页 Hermes 环境检查改为非阻塞，2.5 秒内未返回时显示“稍后刷新”，不再让所有 Hermes 项长期卡在“检测中”。
- OpenClaw 和 Hermes 首页日志改为批量入队刷新，最多保留 200 条，避免每条日志触发一次 DOM 更新。
- Gateway store 日志增加上限，防止长时间运行后数组无限增长。
- 主进程 Hermes status 增加 fast 快照模式，`hermes:getStatus` 默认走缓存/轻量快照，深度端口探测在后台刷新。
- Hermes 日志读取改为尾部读取，默认最多 100 行、每文件最多读取 192KB，避免一次性同步读取大日志。
- 主进程增加 event-loop delay 诊断，超过阈值会写入 `data/.openclaw/logs/desktop-crash.log`。
- 已构建并部署到 `F:\win-unpacked\resources\app\dist`。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.cjs`
- `dist/assets/assets/main-DIeui7ZO.js`
- `docs/codex-handoff/2026-06-29-desktop-performance-stability.md`

## 关键决策
- 不把问题归因给单一按钮，而是把 UI 卡死视为事件循环阻塞问题处理。
- 首页首屏要优先响应，环境检查和日志加载必须后台化、限流化。
- 状态接口分为快照和深检查：用户界面默认快照，避免 IPC 调用触发端口探测、tasklist、技能目录扫描。
- 日志展示只保留最近少量内容，完整日志仍在 U 盘 `data/` 目录保留。

## 待继续
- 请在 F 盘启动新包，重点测试：打开首页、启动 OpenClaw、启动 Hermes、切换 AI 会话、返回首页、连续点击多个模块。
- 如果仍出现未响应，优先查看 `F:\data\.openclaw\logs\desktop-crash.log` 是否新增 `main-event-loop-delay`、`render-process-gone` 或 `child-process-gone`。
- 下一步可继续把微信/聊天工具页的轮询和安装检查做同样的限流，因为用户多次反馈微信扫码时也会触发卡顿。

## 验证结果
- `node --check src\openclaw-shell-app\dist\main\index.js` 通过。
- renderer bundle `node --check` 通过。
- `npm.cmd run build` 通过。
- 已复制构建产物到 `F:\win-unpacked\resources\app\dist`。
- F 盘部署后的 main/preload/renderer 语法检查通过。
- `npm.cmd run audit:openclaw-shell` 通过，24/24。

## 如果需要下一台 Codex 接手，提示词
请在 `D:\github\u-agent` 继续开发 U 盘便携版 OpenClawPro + Hermes 集成项目。当前重点是 Windows 桌面壳性能稳定性：用户反馈首页启动 OpenClaw/Hermes 后仍可能出现未响应和闪退。请先阅读 `docs/codex-handoff/2026-06-29-desktop-performance-stability.md`，再查看 `src/openclaw-shell-app/dist/main/index.js` 的 Hermes fast status、`readFileTailLines`、`main-event-loop-delay`，以及 `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js` 的首页 `deferUiTask`、日志批量刷新和非阻塞环境检查。下一步优先测试 F 盘 GUI，如果仍卡死，读取 `F:\data\.openclaw\logs\desktop-crash.log` 和 `F:\data\.openclaw\logs\gateway-launcher.log`。不要用禁用功能的方式规避，要继续从事件循环、同步 IPC、日志渲染、轮询频率和大文件读取角度彻底降压。完成阶段性修改后运行 `npm.cmd run build`、部署到 `F:\win-unpacked\resources\app\dist`、运行 `npm.cmd run audit:openclaw-shell`，然后按 git status/diff/add/commit/push 流程提交。
