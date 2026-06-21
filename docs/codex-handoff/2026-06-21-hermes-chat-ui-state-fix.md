# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心。所有 Hermes 能力都要和现有前端界面无缝融合，让用户能在原 OpenClaw 体验中自然使用 Hermes，并获得清晰、稳定、友好的操作反馈。

## 当前目标
修复 AI 会话中 Hermes 独立窗口和协同窗口状态串台的问题：Hermes 回复被标记为协同、切到协同窗口也显示等待、用户消息消失、Hermes 已返回但界面没有显示回复。

## 已完成
- 将 Hermes 独立会话和协同会话的发送中状态拆开：`hermesSending` 与 `collabSending` 独立控制。
- Hermes 独立会话请求开始时固定 `requestMode = "hermes"`，避免用户中途切到协同 tab 后，Hermes 回复被错误标记为“OpenClaw / Hermes 协同”。
- `activeSending`、`activeReady`、`isWaitingForAi` 改为按当前 tab 使用独立状态，避免 Hermes 请求让协同窗口也卡在等待中。
- `saveHermesSession()` 增加 `savedAt` 并同步写入 `localStorage`，防止旧的延迟保存覆盖刚发送的用户消息。
- `loadHermesSession()` 不再用旧磁盘状态覆盖更新的内存状态，并在启动加载旧会话时清理历史残留的 sending 状态。
- `handleHermesStateEvent()` 不再重新读取 localStorage，只负责滚动到底，避免保存事件触发读取后把当前消息覆盖。
- 已运行恢复脚本，同步到当前 `E:\win-unpacked\resources\app` 可运行程序。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-21-hermes-chat-ui-state-fix.md`

## 关键决策
- 这次修复针对用户截图中的原 OpenClaw 壳融合界面，所以改在 `scripts/restore-openclaw-shell.mjs` 这条实际生成当前桌面程序的集成源码中，并已同步到当前打包目录。
- 不把 Hermes 和协同视为同一个“非 OpenClaw 状态”，而是分别维护状态，避免前端 tab 之间互相污染。
- 会话持久化保留，但避免旧 localStorage 回灌覆盖新消息。

## 待继续
- 用户需要完全关闭并重新打开桌面程序，再测试 Hermes 发送“你好”、切换协同窗口、再回 Hermes。
- 如果仍出现“没有回复内容”，查看最新 `E:\data\.hermes\runs\hermes-chat-*` 是否有 `stdout.txt`，并检查界面 localStorage 是否残留旧状态。
- 后续可以把 Hermes/协同会话进一步改成任务队列视图，显示每个后台任务的状态和日志入口。

## 验证结果
- `node --check scripts/restore-openclaw-shell.mjs` 通过。
- 已执行 `node scripts/restore-openclaw-shell.mjs`，成功同步到当前 `E:\win-unpacked\resources\app`。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- 已确认当前渲染 bundle 包含 `collabSending`、`savedAt`、`diskSavedAt`、`requestMode` 等修复点。
- 最新 Hermes run 目录中最近两次请求均已有 `stdout.txt`，说明 Hermes 实际返回过内容，问题主要在前端状态覆盖/串台。

## 如果需要下一台 Codex 接手，提示词
请继续基于 `E:\source\openclawpro-agent-hub` 开发 U 盘便携版 OpenClaw + Hermes 集成。用户反馈 AI 会话中 Hermes 和协同状态串台，已在 `scripts/restore-openclaw-shell.mjs` 的 `patchHermesAiChat` 中拆分 `hermesSending/collabSending`，修复 localStorage 覆盖和回复标签错误，并同步到 `E:\win-unpacked\resources\app`。下一步如用户仍反馈问题，请先让用户完全重启桌面程序，再检查 `E:\data\.hermes\runs\hermes-chat-*`、渲染 bundle 中 `collabSending` 是否存在，以及 localStorage `uclaw_hermes_chat_state`。每完成阶段性工作后按用户要求执行 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`。
