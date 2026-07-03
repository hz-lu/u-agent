# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并与现有程序前端界面无缝融合，让用户在前端界面上获得良好体验。

## 当前目标
纠正 OpenClaw 会话处理中体验：不要把发送按钮改成停止按钮或禁发，而是像 Hermes 一样，用户再次发送时在对话中提示“正在处理上一条消息，本条暂未发送”。

## 已完成
- 恢复 ChatInput 在 `sending` 状态下仍显示普通发送按钮。
- 恢复发送按钮只在输入为空时禁用，不因 `sending` 禁用。
- 保留 OpenClaw store 层防轰炸逻辑：正在回复或已有待启动消息时，不向 Gateway 发送第二个任务，而是在对话里插入中文系统提示。
- 已同步最新前端运行文件到 `F:` 和 `G:` 的 Electron 壳中，未触碰原始 `E:` 盘。

## 改动文件
- `dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `docs/codex-handoff/2026-07-02-openclaw-hermes-like-busy-notice.md`

## 关键决策
- 防止任务轰炸应该发生在会话适配器/发送 handler 层，而不是用禁用按钮剥夺用户反馈入口。
- 用户再次点击发送时，输入内容会被清空并产生系统提示；这与 Hermes 当前体验一致。
- 暂不改通用 ChatInput 组件为带 agent-specific 禁用策略，避免影响 Hermes 和协作窗口。

## 待继续
- 用户需完全退出并重新打开 Electron 程序，前端 bundle 覆盖不会热加载。
- 若觉得“本条暂未发送”提示过多，后续可做节流：同一处理周期内只保留最近一条提示。

## 验证结果
- `node --check dist/assets/assets/main-DIeui7ZO.js` 通过。
- `node --check src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js` 通过。
- `git diff --check` 通过。
- 已覆盖 `F:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js`。
- 已覆盖 `G:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js`。

## 如果需要下一台 Codex 接手，提示词
继续开发 `D:\github\u-agent`。本轮纠正了上一轮 OpenClaw 发送中 UI 行为：不要在 `sending` 时显示停止按钮或禁用发送按钮；发送按钮保持可点，重复发送由 OpenClaw store 层拦截并插入“OpenClaw 正在处理上一条消息，本条暂未发送...”的系统提示，保持和 Hermes 类似的体验。复测前完全退出并重开 Electron。
