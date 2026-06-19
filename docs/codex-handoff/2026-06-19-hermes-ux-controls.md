# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心。所有能力都要和现有程序前端界面无缝融合，在保留 OpenClaw 原有 UI 与功能的基础上把 Hermes 融进去，让用户在前端界面上获得清晰、自然、可靠的操作体验。

## 当前目标
修复用户截图反馈的 Hermes 集成 UX 断点：首页按钮含义不清、没有 Hermes 启动/停止/重启、没有 Hermes 日志、模型配置里 Hermes Agent Tab 造成重复配置误解、环境检查只有一个 Hermes 黑盒项、技能管理无法把已安装技能直接给 Hermes 使用。

## 已完成
- 首页 Hermes 控制台改为明确的服务控制：启动 Hermes、配置中心、Dashboard、Agent API、重启、停止。
- 首页 Hermes 控制台显示运行状态、PID、API 就绪状态，并在点击后刷新状态和给出 toast 反馈。
- 首页实时日志增加 OpenClaw / Hermes 分段切换，Hermes 日志接入 `hermes-log` 事件。
- 模型配置页移除独立 Hermes Agent Tab，改为统一模型提示：当前应用模型同时供 OpenClaw 与 Hermes 使用。
- 环境检查从单个 Hermes Agent 黑盒项拆为 Hermes Python、Node.js、CLI、数据目录、模型桥接、技能、端口七项。
- 技能管理页新增“同步到 Hermes”按钮，将 OpenClaw 已启用技能复制到 `E:\data\.hermes\skills`。
- 主进程 Hermes 状态快照扩展 Python/Node/npm/CLI/数据目录/技能目录/模型桥接等字段。
- 预加载层新增 `ipcSyncHermesSkills`，主进程新增 `sync-hermes-skills` IPC。
- 已重新部署到 `E:\win-unpacked\resources\app`，部署前自动备份到 `E:\backups\app-before-openclaw-shell-restore-20260619135632`。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-19-hermes-ux-controls.md`

## 关键决策
- Hermes 不再在模型配置页暴露独立模型配置 Tab，避免用户重复理解 provider/Key；Hermes 会话继续复用 OpenClaw 当前模型配置。
- 首页把 Hermes 设计为和 OpenClaw Gateway 同级的可启动服务，而不是一组不解释用途的外部入口。
- 环境检查必须暴露 Hermes 运行所依赖的关键组件，方便用户知道到底是 Python、Node、CLI、数据目录、模型还是端口没就绪。
- 技能同步采用复制已启用 OpenClaw 技能到 Hermes 技能目录的方式，保持零痕迹数据全部落在 U 盘 `data/.hermes`。

## 待继续
- 实机重启 `E:\win-unpacked\OpenClawPro.exe`，查看首页、模型配置、环境检查、技能管理四个页面的视觉细节。
- 测试首页 Hermes 启动、停止、重启、Dashboard、Agent API 按钮在用户实际点击时的反馈。
- 点击技能管理“同步到 Hermes”，确认技能数量和 `E:\data\.hermes\skills` 内容符合预期。
- 继续优化 AI 会话中 OpenClaw / Hermes / 协同模式的状态说明和错误提示。

## 验证结果
- `node --check scripts\restore-openclaw-shell.mjs` 通过。
- `node scripts\restore-openclaw-shell.mjs` 成功部署。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\preload\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- 部署后 bundle 可检索到 `home-hermes-card`、`启动 Hermes`、`model-unified-hermes-note`、`skill-hermes-sync`、`hermes-cli`。
- 部署后 bundle 未检索到旧的 `Hermes Agent 模型配置`。
- `node scripts\verify-hermes-runtime.mjs` 通过：Hermes v0.15.1、Python 3.12.13、Node v24.15.0 可用，config/dashboard/api 三个端口 ready，零痕迹环境指向 `E:\data\.hermes`。
- `node scripts\verify-openclaw-runtime.mjs` 通过：Gateway ready，当前模型 `qwen/deepseek-v4-flash`，API Key present。

## 如果需要下一台 Codex 接手，提示词
请在 `E:\source\openclawpro-agent-hub` 继续开发。当前总体目标是基于 U 盘便携版 OpenClaw 集成 Hermes，并保持原 OpenClaw UI/功能体系不被替换。最近阶段已经修复 Hermes 首页 UX：新增启动/停止/重启和日志切换；模型配置页移除了 Hermes Agent Tab，改为统一模型配置提示；环境检查拆为 Hermes Python/Node/CLI/数据/模型/技能/端口；技能管理新增同步到 Hermes。请先重启 `E:\win-unpacked\OpenClawPro.exe` 实机检查四个页面，再继续优化 AI 会话协同体验和技能同步后的 Hermes 调用链。每个阶段完成后按 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push` 流程提交，并新增包含“总体目标”的 handoff。
