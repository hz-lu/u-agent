# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心。所有能力都要和现有程序前端界面无缝融合，在保留 OpenClaw 原有 UI 与功能的基础上把 Hermes 融进去，让用户在前端界面上获得清晰、自然、可靠的操作体验。

## 当前目标
修复用户反馈的三类体验问题：Hermes 首页按钮点击后只有延迟 toast、没有可见界面；Hermes 对话切换页面后消息丢失；AI 会话协作模式缺少产品逻辑说明且同样丢消息。

## 已完成
- 首页 Hermes 的配置中心、Dashboard、Agent API 按钮改为立即展开可见操作面板。
- 配置中心和 Dashboard 会在首页内嵌 iframe 打开，不再只显示“已打开”toast。
- Agent API 按钮会显示 Base URL、Bearer Key、用途说明，避免用户误以为它是聊天窗口。
- 首页按钮点击后先提示“正在打开/启动”，服务准备完成后再显示面板。
- AI 会话中的 Hermes 独立会话新增本地状态持久化，保存消息、输入、模式和运行状态。
- AI 会话中的协作模式同样复用 Hermes 会话状态持久化，切换页面回来可继续看到之前的消息和结果。
- Hermes/协作模式顶部增加说明：Hermes 独立会话复用模型配置页当前模型；协作模式是 OpenClaw 先生成草案，Hermes 再复核、补充记忆和技能视角。
- 切换 OpenClaw/Hermes/协作模式时保存当前模式，下次进入会话页会恢复。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-19-hermes-visible-panels-chat-persistence.md`

## 关键决策
- 首页 Hermes 的 “配置中心 / Dashboard” 是可视化界面，应直接在当前 UI 内嵌显示；“Agent API” 是接口服务，应显示地址和用途，而不是假装打开聊天页面。
- Hermes 会话状态先落在 renderer 的 `localStorage` 和窗口运行态中，解决当前路由切换导致组件销毁后消息丢失的问题。
- 协作模式需要在 UI 中解释为两阶段编排：OpenClaw 草案 -> Hermes 复核，而不是只作为一个切换按钮存在。

## 待继续
- 实机重启 `E:\win-unpacked\OpenClawPro.exe` 后检查首页内嵌配置中心和 Dashboard 的实际加载效果。
- 继续完善 Hermes 后台执行队列：未来如果页面被完全刷新或应用退出，仍能恢复未完成任务状态。
- 继续优化协作模式的可视化步骤条和失败重试。

## 验证结果
- `node --check scripts\restore-openclaw-shell.mjs` 通过。
- `node scripts\restore-openclaw-shell.mjs` 成功部署到 `E:\win-unpacked\resources\app`，部署前备份到 `E:\backups\app-before-openclaw-shell-restore-20260619143336`。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\preload\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- 部署后 bundle 可检索到 `home-hermes-panel`、`home-hermes-frame`、`uclaw_hermes_chat_state`、`uclaw-hermes-chat-state`、`协作模式：OpenClaw`、`Hermes 独立会话会复用`、`OpenClaw 草案 → Hermes 复核`。
- `node scripts\verify-hermes-runtime.mjs` 通过：Hermes CLI/Python/Node/source 可用，config/api 端口 ready；Dashboard 端口未启动，符合按需点击启动逻辑。
- `node scripts\verify-openclaw-runtime.mjs` 通过：Gateway ready，当前模型 `qwen/qwen3.6-35b-a3b`，API Key present。

## 如果需要下一台 Codex 接手，提示词
请在 `E:\source\openclawpro-agent-hub` 继续开发。总体目标是基于 U 盘便携版 OpenClaw 集成 Hermes，并保持原 OpenClaw UI/功能体系不被替换。最近阶段已修复首页 Hermes 按钮只 toast 不显示界面的问题：配置中心和 Dashboard 会在首页内嵌 iframe，Agent API 会显示接口说明；同时 AI 会话中的 Hermes/协作消息已用 localStorage 持久化，切页回来不会丢失。协作模式文案已解释为 OpenClaw 草案 -> Hermes 复核。下一步建议实机重启 `E:\win-unpacked\OpenClawPro.exe` 检查内嵌 iframe 加载和会话切页恢复，再继续做后台执行队列和协作步骤条。每个阶段完成后按 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push` 流程提交，并新增包含“总体目标”的 handoff。
