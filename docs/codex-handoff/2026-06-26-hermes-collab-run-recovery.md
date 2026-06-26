# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw，实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心。所有 Hermes 能力要和现有程序前端界面无缝融合，保留 OpenClaw 原有体验，并在前端界面上提供良好的用户操作体验。

## 当前目标
修复 Hermes 单独对话已经有回复，但协同界面卡在阶段 2、没有显示最终回复的问题。

## 已完成
- 复查 F 盘实际部署包，确认已经包含上一轮 `hermes:chatResult` IPC 结果通道代码。
- 检查 `F:\data\.hermes\runs`，确认 2026-06-26 17:51 的协同请求已经写出 `stdout.txt` 最终回复，说明 Hermes 实际完成了任务，问题在协同 UI 结果消费闭环。
- 修改 Hermes oneshot run 的 `request.json`，新增 `taskId`、`sessionId`、`mode`，让主进程能将后台 run 文件和前端等待任务对应起来。
- 新增 `readHermesChatResultFromRuns(taskId)`，当内存 Map 或事件广播没有被前端消费到时，`hermes:chatResult` 可以从 `data/.hermes/runs/*/stdout.txt` 恢复结果。
- 将后台 Hermes chat 的执行改为 `setTimeout(..., 0)` 后启动，确保 IPC 先把 `pending/taskId` 返回给 renderer，再开始长任务，减少竞态风险。
- 重新构建 `D:\github\u-agent\dist`，并部署到 `F:\win-unpacked\resources\app\dist`。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `docs/codex-handoff/2026-06-26-hermes-collab-run-recovery.md`

## 关键决策
- 这次只改 Hermes 协同结果闭环，不触碰 OpenClaw 对话发送链路和 Hermes 单聊 UI，避免扩大回归风险。
- 采用主进程恢复结果，而不是让 renderer 扫磁盘。renderer 仍只调用 `hermes:chatResult(taskId)`；主进程负责先查内存，再从 run 文件恢复。
- 旧的 17:51 卡住 run 当时没有记录 taskId，不能自动用于验证新逻辑；新发起的协同请求会记录 taskId，可被恢复闭环消费。

## 待继续
- 用户在 F 盘重新打开程序后，发起一轮新的协同对话，验证阶段 2 能否显示最终 `协同结果`。
- 如果仍然卡住，下一步应读取新 run 的 `request.json/stdout.txt/stderr.txt`，确认 `taskId` 是否写入，并检查 `hermes:chatResult` 是否命中新 run 恢复逻辑。
- 继续单独处理 OpenClaw gateway 性能问题。日志中仍能看到 `eventLoopDelayP99Ms` 达到秒级，这解释了部分未响应体验，但不属于本次最小修复范围。

## 验证结果
- `node --check D:\github\u-agent\src\openclaw-shell-app\dist\main\index.js` 通过。
- `npm.cmd run build` 通过。
- `node --check F:\win-unpacked\resources\app\dist\main\index.cjs` 通过。
- `node --check F:\win-unpacked\resources\app\dist\preload\index.cjs` 通过。
- 将 F 盘 renderer bundle 复制为 `.mjs` 后 `node --check` 通过。
- 轻量启动烟测：`F:\win-unpacked\OpenClawPro.exe` 启动 8 秒仍存活，`F:\data\.openclaw\logs\desktop-crash.log` 未新增崩溃记录。

## 如果需要下一台 Codex 接手，提示词
继续在 `D:\github\u-agent` 开发 OpenClawPro U 盘便携版。当前重点是验证和完善 Hermes 协同对话结果闭环：用户反馈 Hermes 单聊能回复，但协同界面卡阶段 2。本轮已在 `src/openclaw-shell-app/dist/main/index.js` 中让 Hermes run 写入 `taskId/sessionId/mode`，并让 `hermes:chatResult` 在内存 Map 查不到时从 `data/.hermes/runs/*/stdout.txt` 恢复结果；已构建并部署到 `F:\win-unpacked\resources\app\dist`。请先让用户或本机发起一轮新的协同对话，然后检查 `F:\data\.hermes\runs` 最新 run 的 `request.json/stdout.txt/stderr.txt`，确认 taskId 是否写入且 UI 是否显示最终协同结果。不要大范围重构 OpenClaw 链路，优先做可验证的最小修复；每个阶段后执行 `git status`、`git diff`、`git add`、`git commit`、`git push`，并更新 `docs/codex-handoff/YYYY-MM-DD-xxx.md`。
