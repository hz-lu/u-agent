# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw 实现集成 Hermes，达到零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并与现有 OpenClaw 前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复本轮实机反馈：启动后短时间未响应、启动遮罩停留过久、AI 会话模型选择为空、模型配置页已配置模型为空。要求不破坏当前已经可用的 OpenClaw/Hermes 主链路。

## 已完成
- 确认模型配置没有丢失，真实配置仍在 `F:\data\.openclaw\openclaw.json`。
- 修复模型数据源迁移问题：当 Electron localStorage 中 `uclaw_selected_models` 为空或损坏时，前端会从 U 盘 `openclaw.json` 的 `models.providers` 和 `agents.defaults.model.primary` 反推出已配置模型。
- AI 会话模型下拉与模型配置页已配置模型共用同一个 models store，因此该回填同时修复两个页面。
- 启动体验优化：Gateway 端口打开后主进程先返回 `pendingReady`，前端释放启动遮罩；health/WebSocket readiness 继续后台轮询，AI 会话仍只在真实 ready 后可用。
- 首屏初始化性能优化：模型/技能/历史数据先加载，环境检查延后 800ms 后后台执行，减少进入主界面时未响应概率。
- 已构建并部署到 `F:\win-unpacked\resources\app\dist`。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `docs/codex-handoff/2026-06-29-model-restore-startup-perf.md`

## 关键决策
- 模型列表的事实源应是 U 盘 `data/.openclaw/openclaw.json`；localStorage 只作为 UI 缓存，不能作为唯一数据源。
- 启动遮罩不应该等待完整 health/WS ready；端口打开说明服务已经进入启动后段，遮罩释放，真实可用状态仍由顶部状态与 AI 会话 ready 控制。
- 环境检查属于后台状态刷新，不应阻塞主界面首屏进入。

## 待继续
- 用户实机重新打开 `F:\win-unpacked\OpenClawPro.exe`，观察启动遮罩是否更快释放、窗口标题是否还出现未响应。
- 进入 AI 会话确认模型下拉是否显示从 `openclaw.json` 回填出的模型。
- 进入模型配置页确认“已配置模型”是否恢复。
- 如仍未响应，下一步应抓 Electron 主进程 CPU/renderer console/`F:\data\.openclaw\logs\gateway-launcher.log`，重点看启动期间是否还有同步 I/O 或日志洪泛。

## 验证结果
- `node --check src/openclaw-shell-app/dist/main/index.js` 通过。
- renderer bundle 复制为 `.mjs` 后 `node --check` 通过。
- 使用 `F:\data\.openclaw\openclaw.json` 做反序列化验证，成功识别 4 个模型，当前模型为 `qwen-qwen3.6-plus-2026-04-02`。
- `npm run build` 通过。
- 已部署到 `F:\win-unpacked\resources\app\dist`。
- 部署后 `node --check F:\win-unpacked\resources\app\dist\main\index.cjs` 通过。
- 部署后 renderer bundle 复制为 `.mjs` 后 `node --check` 通过。
- `npm run audit:openclaw-shell` 通过，24/24。

## 如果需要下一台 Codex 接手，提示词
你正在继续开发 `D:\github\u-agent`，测试 U 盘壳在 `F:\win-unpacked`。请先阅读 `docs/codex-handoff/2026-06-29-gateway-hermes-lifecycle.md` 和 `docs/codex-handoff/2026-06-29-model-restore-startup-perf.md`。不要把 `running` 当成 `gatewayReady`；模型 UI 需要能从 `data/.openclaw/openclaw.json` 回填；首屏不要同步等待环境检查。下一步重点实机验证启动响应、模型下拉、模型配置页、OpenClaw/Hermes/协同对话，不要通过禁用用户交互来掩盖后台问题。每次阶段性工作后执行 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`，并新增 handoff 文档且在 `## 当前目标` 前保留 `## 总体目标`。
