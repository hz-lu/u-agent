# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并与现有程序前端界面无缝融合，让用户在前端界面上获得良好体验。

## 当前目标
去掉 OpenClaw 多消息待发送队列，改为“只保留最新一条待发送消息”，并阻止默认置顶词符科技占位模型进入 OpenClaw 运行链路。

## 已完成
- 将 `queuedOpenClawMessages` 多消息队列替换为 `pendingOpenClawMessage` 单槽等待位。
- 删除“最多 3 条待发送队列”逻辑和文案。
- OpenClaw 未完全启动或上一轮仍处理时，只记录最新一条用户消息；用户继续发送会替换上一条待发送内容。
- OpenClaw 完全就绪后只自动发送最新一条，不再按旧队列顺序发送多条历史输入。
- 默认置顶词符科技配置项如果模型名仍为 `请填写模型名称`，不会再被设为当前运行模型。
- 发送前模型解析遇到 `cifu-tech-default` 或占位模型名时，会回退到第一个真实模型。
- 已修复当前 `G:` 盘 `data\.openclaw\openclaw.json` 和 `openclaw.json.last-good`，只保留 `cifu/deepseek-v4-pro`。
- 已同步最新前端运行文件到 `G:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js`。

## 改动文件
- `dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `docs/codex-handoff/2026-07-02-openclaw-latest-pending.md`

## 关键决策
- 队列只适合启动期缓冲，不适合成为多消息积压机制；用户连续发送时应以最新意图为准。
- UI 默认置顶项可以作为编辑入口，但在未填写真实模型名之前不能作为 OpenClaw 当前模型。
- OpenClaw Chat Adapter 发送前仍要做模型兜底选择，避免本地缓存中的旧值写回无效模型。

## 待继续
- 用户需完全退出并重新打开 U 盘程序，Electron 不会热加载已覆盖的前端 JS。
- 复测时建议先清空旧会话或忽略旧错误气泡，新逻辑只影响之后的新发送。
- 如果新消息仍进入等待状态，优先检查 `<U盘>:\data\.openclaw\tmp\openclaw\*.log` 的实际 provider/model 和当前运行进程是否是刚覆盖后的程序。

## 验证结果
- `node --check dist/assets/assets/main-DIeui7ZO.js` 通过。
- `node --check src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js` 通过。
- `git diff --check` 通过。
- 当前 `G:\data\.openclaw\openclaw.json` 已验证为：`primary=cifu/deepseek-v4-pro`，`defaultModels=["cifu/deepseek-v4-pro"]`。

## 如果需要下一台 Codex 接手，提示词
继续开发 `D:\github\u-agent`。本轮将 OpenClaw 待发送队列改为单槽 latest pending：未完全 ready 或正在处理时只保留最新一条消息，继续输入会替换待发送内容；同时修复默认置顶词符科技占位模型 `cifu-tech-default/请填写模型名称` 被当成 OpenClaw 当前模型的问题。复测前请用户完全退出并重启 U 盘程序。如果仍看到 `请填写模型名称`，先查 `<U盘>:\data\.openclaw\openclaw.json`、`openclaw.json.last-good` 和 tmp/openclaw 日志，确认是否旧运行进程或旧配置再次写回。
