# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心；所有能力要和现有前端界面无缝融合，让用户能在首页、AI 会话、模型配置、环境检查、技能管理等模块中自然使用 OpenClaw、Hermes 和协同能力。

## 当前目标
修复 Windows 测试包中 AI 会话未响应、OpenClaw 消息发送后不显示、Hermes 对话长等待造成窗口卡顿的问题，并把修复同步到源码、构建产物和 F 盘测试程序。

## 已完成
- OpenClaw 对话发送前增加 `ensureActiveSession()` 兜底：如果当前没有 active session，会自动选中 main 或创建会话，避免用户消息被静默丢弃。
- OpenClaw 用户消息改为先写入本地消息列表，再调用 Gateway；即使 Gateway 慢或重连中，用户也能立即看到自己发送的内容。
- Gateway session/history 读取增加 in-flight 和节流保护，减少 Gateway 正忙时反复 `sessions.list` / `chat.history` 导致的 CPU 压力。
- Hermes 进度渲染改为轻量状态更新：运行中不再反复改写复杂 tool 消息，完成后才把最近进度折叠成一条执行过程消息。
- Hermes 主进程进度和 stderr 日志进一步限流，降低 IPC 和渲染层压力。
- 已重新构建 `dist` 并同步到 `F:\win-unpacked\resources\app\dist`。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `docs/codex-handoff/2026-06-25-chat-responsiveness-stabilizer.md`

## 关键决策
- 不通过禁止切换窗口、禁用并发使用来规避问题；继续允许用户在 OpenClaw、Hermes、协同模式之间切换。
- OpenClaw 后端仍按单轮任务执行；本轮先修复“无 active session 时消息静默消失”和重复 history/session 拉取造成的压力，连续发送队列后续再做。
- Hermes 长任务的过程反馈保留，但运行中只做轻量状态栏更新，完成后折叠成一条过程记录，减少 Windows 渲染卡顿。
- 当前仍保留运行时的 Gateway/OpenClaw 本体，不改变 `F:\runtime` 内容。

## 待继续
- 用户需要重新打开 `F:\win-unpacked\OpenClawPro.exe` 实测：Hermes 对话是否还触发未响应、OpenClaw 消息是否立即入框并最终回复。
- 如果仍有明显卡顿，下一步应抓取崩溃/卡顿时的进程 CPU、`F:\data\.openclaw\logs\gateway-launcher.log`、`F:\data\.hermes\logs\launcher.log`，继续定位 Gateway 嵌入式 run 或 WeChat bridge 是否仍占用事件循环。
- Hermes Dashboard 端口在本轮验证中仍为 `false`，需后续单独修 Dashboard 生命周期和环境检查状态。
- 本轮没有修改 `scripts/restore-openclaw-shell.mjs`，避免在混合编码脚本上引入风险；后续如果继续依赖 restore 脚本重放 baseline，需要把会话兜底、历史节流、Hermes 轻量进度补进脚本模板。

## 验证结果
- `node --check src\openclaw-shell-app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- `node --check src\openclaw-shell-app\dist\main\index.js` 通过。
- `node --check scripts\restore-openclaw-shell.mjs` 通过。
- `npm.cmd run build` 通过。
- `node --check dist\main\index.js`、`dist\main\index.cjs`、`dist\preload\index.js`、`dist\preload\index.cjs` 通过。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-openclaw-runtime.mjs` 通过，Gateway ready。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-hermes-runtime.mjs` 通过；Hermes config/api ready，dashboard 仍未 ready。
- 已确认 `F:\win-unpacked\resources\app\dist` 包含本轮关键修复标记。

## 如果需要下一台 Codex 接手，提示词
请在 `D:\github\u-agent` 继续开发 U 盘便携版 OpenClaw + Hermes 集成项目。当前测试程序在 `F:\win-unpacked\OpenClawPro.exe`，运行时在 `F:\runtime`，数据在 `F:\data`。最新目标是继续修复 Windows 稳定性和用户体验：重点实测 AI 会话中 OpenClaw 发送是否立即显示、Hermes 长任务是否还导致未响应。如果仍卡顿，请先抓进程 CPU、Gateway/Hermes 日志，再改源码，不要用禁用切换或阻断用户操作的方式规避。每阶段完成后运行 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`，并新增 `docs/codex-handoff/YYYY-MM-DD-xxx.md`，且在 `## 当前目标` 前保留 `## 总体目标`。
