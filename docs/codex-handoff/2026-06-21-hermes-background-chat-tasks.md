# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且所有 Hermes 能力都要和现有程序前端界面无缝融合，前端操作体验自然、稳定、可理解。

## 当前目标
修复 Hermes 对话一发送就可能导致桌面程序未响应或闪退的问题，同时恢复用户期望的并发体验：Hermes 生成中不能阻塞 OpenClaw 对话、Hermes 对话、协同对话之间的切换与使用。

## 已完成
- 将 Hermes 对话从 renderer 等待式 `ipcHermesChat` 改为主进程后台任务 `hermes:chatTaskStart`。
- preload 新增 `ipcHermesChatStart` 和 `ipcOnHermesChatResult`，前端通过事件接收 Hermes 结果。
- Hermes 独立会话发送后立即显示用户消息和后台执行占位消息，结果按 `clientTaskId/taskId` 精准回填。
- 协同会话的 Hermes 复核阶段改为后台任务，OpenClaw 内部草稿完成后立即进入后台回填，不再拖住整个 AI 会话界面。
- 非 OpenClaw 模式不再把 `sending` 传给输入组件作为全局阻塞状态；OpenClaw、Hermes、协同窗口可以继续切换。
- 修复快速失败/快速返回竞态：前端生成 `clientTaskId` 并传给主进程，主进程用同一个 taskId 发结果事件，避免 UI 丢回填。
- 已重新运行 `scripts/restore-openclaw-shell.mjs`，当前 `E:\win-unpacked\resources\app` 已同步更新。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-21-hermes-background-chat-tasks.md`

## 关键决策
- 不通过禁用 OpenClaw/协同窗口来规避 Hermes 崩溃或卡顿，而是把 Hermes 长任务移到主进程后台执行。
- 保留旧的 `hermes:chat` IPC 作为兼容路径，新增后台任务接口用于前端正常对话。
- Hermes 输出仍由既有主进程 chat 方法写入 `data/.hermes/runs`，UI 只显示可控长度结果，避免大输出挤压渲染进程。
- 前端状态以消息级 taskId 回填，不再让 Hermes 独立会话和协同会话共享等待结果。

## 待继续
- 用户需要重启桌面程序后验证：Hermes 发送“你好”、同时切换 OpenClaw 发送消息、再切到协同窗口，观察是否还有未响应或闪退。
- 如仍闪退，需要检查新的 `data/.hermes/runs/*`、`data/.hermes/logs/*`、`data/.openclaw/logs/desktop-crash.log` 和 Windows 应用程序事件日志。
- 后续可以继续优化：为 Hermes/协同后台任务增加任务列表、取消按钮、失败重试按钮和更明确的顶部状态提示。

## 验证结果
- `node --check scripts/restore-openclaw-shell.mjs` 通过。
- 已执行 `node scripts/restore-openclaw-shell.mjs`，成功恢复并注入当前桌面程序包。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\preload\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- 关键字符串检查确认当前包包含 `hermes:chatTaskStart`、`ipcHermesChatStart`、`ipcOnHermesChatResult`、`clientTaskId` 和 `codex-hermes-background-chat-renderer`。

## 如果需要下一台 Codex 接手，提示词
请继续在 `E:\source\openclawpro-agent-hub` 上开发。当前目标是 U 盘便携版 OpenClaw + Hermes 的完整融合。最近一次修复把 Hermes 对话改为后台任务：主进程新增 `hermes:chatTaskStart`，preload 暴露 `ipcHermesChatStart/ipcOnHermesChatResult`，renderer 用 `clientTaskId` 回填消息，避免 Hermes 对话卡死渲染进程，并允许 OpenClaw/Hermes/协同窗口并发使用。请先确认用户重启桌面程序后的实际验证结果；如果仍闪退，优先读取 `E:\data\.hermes\runs`、`E:\data\.hermes\logs`、`E:\data\.openclaw\logs\desktop-crash.log` 和 Windows 事件日志，不要通过禁用 UI 或终止长任务来规避问题。
