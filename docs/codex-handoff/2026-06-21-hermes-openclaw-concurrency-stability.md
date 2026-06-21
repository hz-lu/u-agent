# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心。所有 Hermes 能力都要和现有前端界面无缝融合，让用户能在原 OpenClaw 体验中自然使用 Hermes，并获得清晰、稳定、友好的操作反馈。

## 当前目标
修复 Hermes 长任务或技能调用进行中，用户切换到 OpenClaw 会话继续发送消息时，桌面程序未响应并闪退的问题。

## 已完成
- 将 Hermes oneshot 的 stdout/stderr 落盘从同步 `appendFileSync` 改为队列化异步写入，避免技能任务输出较多时阻塞 Electron 主进程。
- Hermes 日志推送到渲染层前做长度精简，完整内容仍保存在 U 盘 `data/.hermes/runs` 或 `data/.hermes/logs`。
- 去掉 AI 会话中对 OpenClaw 流式消息的深度 `JSON.stringify` 调试监听，避免 OpenClaw 回复过程中反复深拷贝整段消息。
- Hermes/协同会话保存增加消息数量和单条内容上限，并对 `localStorage` 写入做短延迟，降低切换页面和并发会话时的渲染层压力。
- 增加桌面崩溃诊断日志，记录主进程未捕获异常、未处理 Promise、渲染进程崩溃和子进程异常退出。
- 重新运行恢复脚本，将修复同步到 `E:\win-unpacked\resources\app` 当前可运行程序。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-21-hermes-openclaw-concurrency-stability.md`

## 关键决策
- 不采用“输出过大就终止 Hermes 任务”的策略。任务继续执行，完整输出写入 U 盘数据目录，界面只展示精简内容。
- 稳定性修复写入恢复脚本，而不是只改打包产物，保证后续重新打包或换 U 盘时不会丢失。
- 崩溃诊断写入 `data/.openclaw/logs/desktop-crash.log`，继续满足零痕迹原则。

## 待继续
- 用户需要重新打开桌面程序，再复现一次“Hermes 查询天气技能 + 切到 OpenClaw 发送你好”的场景。
- 如果仍然闪退，优先查看 `E:\data\.openclaw\logs\desktop-crash.log` 和对应 `E:\data\.hermes\runs\hermes-chat-*` 目录。
- 后续可以继续把 Hermes 长任务改造成真正后台任务队列，让 UI 显示任务进度、允许查看历史运行和取消任务。

## 验证结果
- `node --check scripts/restore-openclaw-shell.mjs` 通过。
- 已执行 `node scripts/restore-openclaw-shell.mjs`，成功同步到当前 `E:\win-unpacked\resources\app`。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- 已确认产物包含 `codex-hermes-chat-async-spool`、`codex-safe-send-log-trim`、`codex-desktop-crash-diagnostics` 和渲染层会话压缩逻辑。

## 如果需要下一台 Codex 接手，提示词
请继续基于 `E:\source\openclawpro-agent-hub` 开发 U 盘便携版 OpenClaw + Hermes 集成。当前重点是验证 Hermes 长任务与 OpenClaw 会话并发时的桌面稳定性。先查看 `docs/codex-handoff/2026-06-21-hermes-openclaw-concurrency-stability.md`，再检查 `scripts/restore-openclaw-shell.mjs` 中 `patchMainProcessStability` 和 `patchHermesAiChat` 的实现。如果用户仍反馈闪退，请读取 `E:\data\.openclaw\logs\desktop-crash.log`、`E:\data\.hermes\runs\hermes-chat-*` 和 `E:\data\.hermes\logs\agent.log`，定位是主进程、渲染进程还是 Hermes 子进程问题。每完成阶段性工作后按用户要求执行 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`。
