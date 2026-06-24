# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw 实现集成 Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且和现有程序前端界面无缝融合，让用户在前端界面上获得良好体验。

## 当前目标
修复 Windows 测试包在 OpenClaw/Hermes 并发使用时出现的未响应、闪退风险、OpenClaw 变慢、Hermes 长时间无反馈、协同阶段消息被覆盖等问题。

## 已完成
- OpenClaw Gateway 启动前会再次修复 runtime 模板，避免 AGENTS.md/SOUL.md 等模板缺失导致对话报错。
- OpenClaw Gateway 启动前会准备 browser-automation plugin skill 的 Windows junction，并通过 NODE_OPTIONS hook 兼容 OpenClaw 内部重复发布同一 junction 时的 EISDIR 误报。
- Hermes 对话进度现在会追加到 Hermes 会话消息流，不再只显示在状态栏。
- 协同对话进度现在会追加到协同会话消息流。
- 协同对话不再删除“阶段 1/2”和“阶段 2/2”提示，阶段消息会作为独立消息保留。
- 协同窗口状态栏改用 gatewayAvailable 判断，避免 Gateway 已启动但仍提示“需先启动 Gateway”。
- 增加窗口 unresponsive/responsive 诊断日志，后续卡死时会写入 data/.openclaw/logs/desktop-crash.log。
- 同步修改 scripts/restore-openclaw-shell.mjs，避免以后恢复 OpenClaw shell 时把本轮修复冲掉。
- 已构建 dist，并同步到 F:\win-unpacked\resources\app\dist。

## 改动文件
- dist/assets/assets/main-DIeui7ZO.js
- dist/main/index.cjs
- dist/main/index.js
- scripts/restore-openclaw-shell.mjs
- src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js
- src/openclaw-shell-app/dist/main/index.js
- docs/codex-handoff/2026-06-24-windows-stability-progress.md

## 关键决策
- 不用阻止用户切换 OpenClaw/Hermes/协同窗口来规避崩溃，改为保留并发使用体验，同时减少后端链接冲突和前端空等。
- 对 Hermes 官方 oneshot 暂未发现可直接复刻 OpenClaw 工具步骤流的稳定接口，因此先把主进程已有进度事件转成可见消息流，至少让用户知道任务仍在执行。
- 对 OpenClaw plugin skill 的 EISDIR 问题采用启动前 junction 准备 + Node hook 容错双层处理，避免 Windows U 盘环境中重复 symlink 造成 Gateway 日志刷错和潜在阻塞。
- 未修改用户数据；F 盘同步只替换 app dist。

## 待继续
- 让 Hermes 真正输出更细粒度的工具执行步骤，需要继续研究 Hermes 官方运行时是否有 event/stream/log tail 可稳定解析。
- OpenClaw Gateway 日志曾出现 eventLoopDelayMaxMs=58284，仍需用户复测新包是否明显改善；如仍卡顿，需要继续分析 data/.openclaw/logs/desktop-crash.log 和 gateway-launcher.log。
- OpenClaw runtime 验证仍提示若干可选依赖缺失：@larksuiteoapi/node-sdk、matrix-js-sdk、@lancedb/lancedb、@a2ui/markdown-it。当前不阻断 Gateway smoke，但启用对应深功能前需补 runtime。
- 需要用户实际打开 F:\win-unpacked\OpenClawPro.exe 复测启动、OpenClaw 对话、Hermes 对话、协同对话和多页面快速切换。

## 验证结果
- node --check src/openclaw-shell-app/dist/main/index.js 通过。
- node --check src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js 通过。
- node --check scripts/restore-openclaw-shell.mjs 通过。
- npm.cmd run build 通过。
- 已同步 dist 到 F:\win-unpacked\resources\app\dist。
- AGENT_HUB_ROOT=F:\ node scripts/verify-openclaw-runtime.mjs 通过，runtimeIntegrity.ok=true，CLI smoke 通过，Gateway 端口检测 ready=true。
- AGENT_HUB_ROOT=F:\ node scripts/verify-hermes-runtime.mjs 通过。
- AGENT_HUB_ROOT=F:\ node scripts/verify-hermes-skills.mjs 通过，sourceCount=80，mirroredCount=80，visibleCount=77，commandCount=77。

## 如果需要下一台 Codex 接手，提示词
继续在 D:\github\u-agent 开发 OpenClawPro Agent Hub。当前目标是 Windows 端稳定性和 Hermes 真实闭环。先查看 docs/codex-handoff/2026-06-24-windows-stability-progress.md，再检查 git status。用户测试包在 F:\，入口是 F:\win-unpacked\OpenClawPro.exe。本轮已修复 OpenClaw runtime 模板自愈、plugin skill junction/EISDIR、Hermes/协同进度消息、协同阶段消息覆盖和窗口未响应诊断。请继续基于源码修复，不要做临时补丁；保留 OpenClaw 原有 UI/功能体验；每个阶段完成后执行 git status、git diff、git add、git commit、git push，并新增 docs/codex-handoff/YYYY-MM-DD-xxx.md。
