# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并与现有程序前端界面无缝融合，让用户在前端界面上获得良好的 OpenClaw + Hermes 协作体验。

## 当前目标
修正 Hermes 复杂任务输出过大时“自动终止任务”的不良体验，改为任务继续执行、完整输出落盘、桌面仅显示尾部与摘要。

## 已完成
- 移除前端传入的保守输出阈值，不再主动压低复杂任务输出空间。
- Hermes chat 子进程 stdout/stderr 现在写入：
  - `data/.hermes/runs/<runId>/stdout.txt`
  - `data/.hermes/runs/<runId>/stderr.txt`
  - `data/.hermes/runs/<runId>/request.json`
- Electron 主进程内存中只保留 stdout/stderr 尾部内容，避免无限累积。
- UI 日志仍做限流，但不再因为输出大而 kill 任务。
- 输出较大时通过 Hermes 日志提示“完整输出已写入文件，桌面仅保留尾部，任务会继续执行”。
- 将 Hermes chat 默认超时从 5 分钟放宽到 30 分钟，避免复杂任务被过早终止。
- 重新生成 `E:\win-unpacked\resources\app` 部署包。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-21-hermes-chat-spool-output.md`

## 关键决策
- 复杂任务不应该因为输出量大而被终止；正确策略是输出落盘、UI 轻量展示、任务继续执行。
- 当前仍保持同步 chat 返回模式，但把大输出压力从内存/IPC 转移到 U 盘文件。
- 如果后续仍出现桌面崩溃，下一步应实现真正异步 task runner：前端提交任务后立即返回 taskId，后台独立进程执行，UI 轮询状态和最终结果。

## 待继续
- 真实 UI 复测复杂 Hermes 任务，确认桌面不再闪退。
- 给 UI 增加“查看完整输出/打开运行目录”的按钮。
- 后续实现独立 Hermes task runner，彻底隔离长任务。

## 验证结果
- `node --check scripts\restore-openclaw-shell.mjs` 通过。
- `node scripts\restore-openclaw-shell.mjs` 成功重新生成部署包。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- 已确认部署包包含 `data/.hermes/runs` 输出落盘逻辑、`stdoutPath`、`stderrPath`、`chat-output-spool`。
- 已确认渲染 bundle 不再传 `maxStdoutBytes` / `maxStderrBytes`。
- 重启 `E:\win-unpacked\OpenClawPro.exe` 后，`OpenClawPro` 进程 `Responding=True`。

## 如果需要下一台 Codex 接手，提示词
请在 `E:\source\openclawpro-agent-hub` 继续开发。刚把 Hermes 复杂任务输出策略从“输出过大就终止”改成“完整输出落盘，UI 只保留尾部，任务继续执行”。如果用户复测仍闪退，下一步应实现真正的异步 Hermes task runner，让 Electron 主进程只负责提交任务/轮询状态/展示结果。
