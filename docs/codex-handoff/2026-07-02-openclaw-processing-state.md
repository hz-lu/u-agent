# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并与现有程序前端界面无缝融合，让用户在前端界面上获得良好体验。

## 当前目标
修复 AI 会话中 OpenClaw 可被连续轰炸、等待期没有明确 loading、以及模型选择框配置后仍显示“选择模型”的体验问题。

## 已完成
- OpenClaw 未完全启动时只允许保留一条待发送消息，并进入等待态。
- OpenClaw 正在回复时不再把新消息加入待发送队列，而是给出中文提示，要求等待当前回复完成或点击停止。
- ChatInput 在发送中会显示停止按钮，并禁用发送按钮，避免用户连续点击造成任务堆积和卡顿。
- OpenClaw loading 判断改为同时覆盖 `sending` 和 `hasPendingOpenClawMessage`，待启动消息也会显示加载反馈。
- 会话模型列表过滤掉默认置顶占位项 `cifu-tech-default / 请填写模型名称`。
- 新建会话、OpenClaw、Hermes、协作会话的模型选择都会优先回退到第一个真实可用模型。
- 已将最新前端运行文件同步到 `F:` 和 `G:` 的 Electron 壳中，未触碰原始 `E:` 盘。

## 改动文件
- `dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `docs/codex-handoff/2026-07-02-openclaw-processing-state.md`

## 关键决策
- 队列只用于 OpenClaw 尚未完全 ready 的启动窗口，而且只保留一条待发送消息。
- OpenClaw 已经开始处理回复时，不再接受新的 OpenClaw 发送请求，防止 UI 层和 Gateway 层出现多任务堆积。
- 文本输入框保持可输入，但发送动作在处理期被阻止；这能保留用户草稿输入体验，同时避免消息轰炸。
- 默认置顶词符科技配置项是编辑入口，不是可运行模型；只有填写真实模型名的配置才进入 AI 会话模型选择。

## 待继续
- 用户需要完全退出并重新打开 U 盘程序，Electron 不会热加载覆盖后的前端 JS。
- 如果模型选择框仍显示“选择模型”，优先检查 `<U盘>:\data\.openclaw\openclaw.json` 是否仍保存了占位模型，或是否运行了未覆盖的旧壳。
- 如果 OpenClaw 仍长时间无回复，继续查 Gateway 日志和模型 provider 返回，不再从前端队列逻辑方向重复修。

## 验证结果
- `node --check dist/assets/assets/main-DIeui7ZO.js` 通过。
- `node --check src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js` 通过。
- `git diff --check` 通过。
- 已覆盖 `F:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js`。
- 已覆盖 `G:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js`。

## 如果需要下一台 Codex 接手，提示词
继续开发 `D:\github\u-agent`。本轮修复 OpenClaw 会话状态机：OpenClaw 未完全 ready 时只保留一条待发送消息并显示 loading；OpenClaw 正在回复时发送按钮禁用并显示停止按钮，handler 也会拒绝重复发送。模型选择器过滤 `cifu-tech-default / 请填写模型名称` 占位项，并优先选择第一个真实模型。复测前请完全退出 Electron 后重开，避免旧 JS 缓存。若仍无回复，下一步查 Gateway 日志和 provider/model 配置，不要再把问题归为前端队列。
