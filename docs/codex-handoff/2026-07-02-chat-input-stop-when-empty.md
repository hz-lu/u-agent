# Codex Handoff

## 总体目标
基于已开发的 U盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并与现有程序前端界面无缝融合，让用户在前端界面上获得良好体验。

## 当前目标
调整 AI 会话输入按钮：AI 正在回复且输入框为空时显示停止按钮；用户输入新内容后恢复发送按钮，发送后仍走 Hermes 式“正在处理上一条消息，本条暂未发送”提示。

## 已完成
- 将 ChatInput 停止按钮显示条件从永久关闭改为 `sending && !canSend`。
- 保持输入框可输入；只要有文本或附件，按钮显示发送。
- 没有改动 OpenClaw/Hermes 的发送 handler，重复发送仍由会话层提示并阻止真实第二任务。
- 已同步最新前端文件到 `F:` 和 `G:` 的运行壳，未触碰原始 `E:` 盘。

## 改动文件
- `dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `docs/codex-handoff/2026-07-02-chat-input-stop-when-empty.md`

## 关键决策
- 停止按钮只在“正在回复且用户没有新输入”时出现，避免占用发送入口。
- 用户有新输入时仍显示发送按钮，让重复发送产生明确系统提示，而不是沉默禁用。

## 待继续
- 复测前需要完全退出并重开 Electron。
- 若后续希望停止按钮只对 OpenClaw 生效，需要给 ChatInput 增加 agent-specific props；本轮先保持通用组件行为一致。

## 验证结果
- `node --check dist/assets/assets/main-DIeui7ZO.js` 通过。
- `node --check src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js` 通过。
- `git diff --check` 通过。
- 已覆盖 `F:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js`。
- 已覆盖 `G:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js`。

## 如果需要下一台 Codex 接手，提示词
继续开发 `D:\github\u-agent`。本轮只调整 ChatInput 按钮显示：`sending && !canSend` 时显示停止按钮；用户输入文本/附件后显示发送按钮。OpenClaw/Hermes 重复发送仍在发送 handler 中插入“正在处理上一条消息，本条暂未发送”的提示，不发送第二个真实任务。复测必须完全退出 Electron 后重开。
