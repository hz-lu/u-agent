# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心。以上能力需要和现有程序前端界面无缝融合，让用户在首页、AI 会话、模型配置、环境检查、技能管理等模块获得一致且可理解的体验。

## 当前目标
修复最近一次改动引入的核心状态回归：OpenClaw 启动成功后 AI 会话仍显示未启动、返回首页状态变成未启动、再次启动失败、模型配置页已配置模型消失、AI 会话无法选择模型。

## 已完成
- 选择基于当前版本做源码级修复，未整体回滚，保留便携运行时和零痕迹相关修复。
- 新增 Gateway 真实状态查询 IPC：主进程提供 `get-gateway-status`，preload 暴露 `ipcGetGatewayStatus`。
- Gateway 启动成功时补发 `gateway-status(true)`，启动 IPC 返回运行状态、端口和失败详情。
- 渲染端 Gateway store 初始化时主动同步真实 Gateway 状态，减少事件遗漏导致的“首页成功、AI 会话未启动”错位。
- 模型配置初始化改为优先从 `data/.openclaw/openclaw.json` 恢复已配置模型，Electron localStorage 只作为兜底。
- 阻止空模型列表在启动时通过 immediate watch 覆盖主配置。
- 重新生成 `E:\win-unpacked\resources\app`，当前 app 备份在 `E:\backups\app-before-openclaw-shell-restore-20260621223850`。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-21-gateway-model-state-recovery.md`

## 关键决策
- 不整体回滚最近提交，因为整体回滚会丢失 U 盘运行时、零痕迹和解压卡死修复。
- OpenClaw 主配置 `data/.openclaw/openclaw.json` 是模型配置的真实来源，前端缓存不能覆盖它。
- Gateway UI 状态不能只依赖启动事件，必须支持主动查询主进程真实状态。

## 待继续
- 请用户重新打开 `E:\win-unpacked\OpenClawPro.exe`，验证首页启动 OpenClaw 后 AI 会话状态一致。
- 验证模型配置页能显示已配置模型，AI 会话能选择当前模型。
- 若仍有闪退或未响应，继续查看 `E:\data\.openclaw\logs\desktop-crash.log`，重点排查 Renderer 异常和 Hermes 后台任务事件。
- 稳定后继续 Hermes 官方能力闭环：真实 skill 调用、执行过程流式反馈、微信回复链路、正式 release 清洁包。

## 验证结果
- `node --check scripts\restore-openclaw-shell.mjs` 通过。
- `npm.cmd run restore:openclaw-shell` 通过，并重新生成桌面 app。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\preload\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- 生成产物包含 `codex-gateway-status-query`、`ipcGetGatewayStatus`、`codex-gateway-status-query-ui`、`codex-model-config-hydration`。
- 用当前 `E:\data\.openclaw\openclaw.json` 验证，可恢复 5 个已配置模型，当前模型为 `qwen/qwen3.5-plus-2026-04-20`。

## 如果需要下一台 Codex 接手，提示词
继续在 `E:\source\openclawpro-agent-hub` 开发。用户反馈最近改动导致 OpenClaw 启动状态和模型配置异常，本阶段已在 `scripts/restore-openclaw-shell.mjs` 增加 Gateway 真实状态查询和模型配置从 `data/.openclaw/openclaw.json` 恢复的源码级修复，并重新生成 `E:\win-unpacked\resources\app`。请先让用户验证：启动 OpenClaw、进入 AI 会话、模型配置页和会话模型选择是否恢复。如果仍异常，检查 `E:\data\.openclaw\logs\desktop-crash.log` 和 Gateway 进程状态；不要用禁用标签页或阻塞并发对话的方式规避问题。
