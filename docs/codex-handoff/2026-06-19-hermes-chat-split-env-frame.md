# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：

- 零安装：Python / Node 运行时自带，不依赖系统任何东西。
- 零痕迹：所有读写劫持到 U 盘 `data/` 目录，宿主机零接触。
- 三平台原生：macOS arm64/x64、Linux x64/arm64、Windows x64。
- Universal 包：单个 zip 带齐三平台 venv，启动器自动识别。
- 自我成长：持久记忆 + 自动生成技能，运行越久越强。
- 多平台接入：Telegram/Discord/Slack/WhatsApp/Signal/Email/CLI，一处启动多处可达。
- 定时自动化：自然语言 cron 调度，无人值守执行报告/备份/简报。
- 子代理委派：隔离子对话 + 独立终端 + Python RPC，零上下文成本流水线。
- 沙箱隔离：本地/Docker/SSH/Singularity/Modal 五种后端。
- 可视化配置中心：选模型/填 Key/测试连接/换模型/查看日志/导入导出。

以上任务均要和现有程序前端界面无缝融合，让用户在前端界面上获得良好操作体验。

## 当前目标
修复用户在桌面程序中反馈的 Hermes 体验问题：AI 会话中 Hermes 静默自动启动、Hermes 与协同模式会话串线、协同模式重复自我介绍、首页配置中心/Dashboard 空白、环境检查 Hermes 项一直停留在“检测中”。

## 已完成
- 在 AI 会话中将 Hermes 独立会话和 OpenClaw/Hermes 协同会话拆成两套消息状态：`hermesMessages` 与 `collabMessages`。
- localStorage 持久化改为分别保存 Hermes 与协同历史，切换页面或切换模式不会互相覆盖。
- Hermes 独立会话在未手动启动时发送消息，会在聊天流里显示“本次发送已自动启动后台服务”的系统说明，避免静默启动造成误解。
- 协同模式改为新的 `sendCollaborativeMessageV2()` 流程：OpenClaw 只生成内部草案，Hermes 基于草案输出一个统一最终答案。
- 协同提示词明确要求不要分别介绍 OpenClaw 和 Hermes，不要输出复核报告；用户问“你是谁/介绍一下你”时，回答为 OpenClaw + Hermes 协同助手能力。
- 清空会话和 `/new`、`/reset` 命令按当前模式分别清理 Hermes 或协同历史。
- 首页嵌入配置中心/Dashboard 所需的 `hermes-frame.html` 已加入部署复制流程，解决面板空白的文件缺失问题。
- 环境检查中的 `runAllChecks()` 改为 async，并等待 `checkHermes()` 完成后再缓存结果，避免 Hermes 项停留在“检测中”。
- 已重新部署到 `E:\win-unpacked\resources\app`。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-19-hermes-chat-split-env-frame.md`

## 关键决策
- 保留 Hermes “按需自动启动”的便利性，但必须在 AI 会话中显式反馈给用户。
- 协同模式不再把 OpenClaw 草案直接作为正式 assistant 回复展示，草案仅作为 Hermes 的内部上下文。
- Hermes 独立会话和协同会话必须是两个产品概念、两份历史记录，不能共用一个消息窗口。
- 首页配置中心/Dashboard 使用现有 `hermes-frame.html` 代理页嵌入，避免重新引入旧 Hermes patch 产物。
- 环境检查的结果缓存必须等待 Hermes 异步检查完成，不能缓存半成品状态。

## 待继续
- 用户重新打开桌面程序后，实测首页 Hermes 配置中心和 Dashboard 是否能正常嵌入显示。
- 实测 AI 会话中 Hermes 未启动时首次发送是否显示自动启动说明，并确认首页状态刷新后的表现。
- 实测协同模式“介绍一下你”是否只输出统一协同助手介绍。
- 后续可优化协同流程进度显示，例如把“阶段 1/2、阶段 2/2”做成更轻的状态条。
- 继续把这些 bundle 级变换逐步源代码化，减少长期维护成本。

## 验证结果
- `node --check scripts\restore-openclaw-shell.mjs` 通过。
- `node scripts\restore-openclaw-shell.mjs` 已执行，部署到 `E:\win-unpacked\resources\app`，备份目录为 `E:\backups\app-before-openclaw-shell-restore-20260619150550`。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\preload\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- `E:\win-unpacked\resources\app\dist\assets\hermes-frame.html` 存在，大小 1991 bytes。
- 渲染 bundle 中可检索到 `collabMessages`、`sendCollaborativeMessageV2`、`Hermes 未在首页手动启动`、`OpenClaw 内部草案`、`async function runAllChecks`、`await checkHermes`、`await runAllChecks`。
- `node scripts\verify-hermes-runtime.mjs` 通过：Hermes Agent v0.15.1，Python 3.12.13，Node v24.15.0，配置/Dashboard/API 端口均可用，零痕迹环境指向 `E:\data\.hermes`。
- `node scripts\verify-openclaw-runtime.mjs` 通过：Gateway 18789 ready，模型配置和 API Key present；`openclawCmd` 仍为 false，但 zip、Node、配置和 Gateway 可用。

## 如果需要下一台 Codex 接手，提示词
请在 `E:\source\openclawpro-agent-hub` 继续开发。用户当前重点关注 Hermes 融入原 OpenClaw UI 后的真实可用性和反馈清晰度。本阶段已修复 Hermes/协同会话串线、协同重复自我介绍、Hermes 静默自动启动、首页配置中心/Dashboard 空白、环境检查卡“检测中”等问题，并已部署到 `E:\win-unpacked\resources\app`。下一步请先让用户实测桌面程序；若仍有问题，优先看 `scripts/restore-openclaw-shell.mjs` 中 `patchHermesAiChat()`、`patchHermesHomeDashboard()`、`patchHermesEnvCheck()`。每个阶段完成后按 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push` 提交，并新增包含“总体目标”的 handoff。
