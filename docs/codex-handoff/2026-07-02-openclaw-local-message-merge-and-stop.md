# Codex Handoff

## 总体目标
基于已开发的 U盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并与现有程序前端界面无缝融合，让用户在前端界面上获得良好体验。

## 当前目标
修复 OpenClaw 连续发送时用户消息短暂消失/延迟出现，以及点击停止后没有可见反馈的问题。

## 已完成
- OpenClaw 本地新发消息和系统提示增加 `_localOnly` 临时标记，用于历史同步时保护前端已显示内容。
- `loadSessionMessages` 从 Gateway 或本地 JSONL 刷新历史时，不再粗暴替换当前消息，而是合并远端历史与本地未确认消息。
- 合并时按内容、角色和时间窗口去重，避免同一条消息在远端回写后重复出现。
- 持久化聊天记录前会删除 `_localOnly`，避免前端临时标记写入用户数据。
- OpenClaw 停止生成时会标记当前流式回复结束，并追加“已停止当前 OpenClaw 任务。”系统记录，交互向 Hermes 看齐。
- 已同步最新前端文件到 `F:` 和 `G:` 的运行壳，未触碰原始 `E:` 盘。

## 改动文件
- `dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `docs/codex-handoff/2026-07-02-openclaw-local-message-merge-and-stop.md`

## 关键决策
- 用户消息必须先在前端稳定显示，不能等 Gateway 历史回写后才出现。
- 历史同步应是 merge，不是 replace；replace 会覆盖本地刚发送但远端还没入库的消息。
- OpenClaw stop 至少要有一条用户可见的停止记录，否则用户无法判断是否生效。

## 待继续
- 复测前需完全退出并重开 Electron。
- 如果后续仍出现重复消息，可缩短或调整 `_isSameOpenClawMessage` 的时间窗口，或引入发送端 idempotencyKey 与消息 id 的关联。

## 验证结果
- `node --check dist/assets/assets/main-DIeui7ZO.js` 通过。
- `node --check src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js` 通过。
- `git diff --check` 通过。
- 已覆盖 `F:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js`。
- 已覆盖 `G:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js`。

## 如果需要下一台 Codex 接手，提示词
继续开发 `D:\github\u-agent`。本轮修复 OpenClaw 用户消息短暂消失：本地插入的用户消息/系统提示带 `_localOnly`，历史同步用 `mergeOpenClawHistoryMessages` 合并远端历史与本地未确认消息，而不是直接替换；保存前会删除 `_localOnly`。同时 `abortMessage` 会标记当前流式消息结束并追加“已停止当前 OpenClaw 任务。”复测前完全退出 Electron 后重开。
