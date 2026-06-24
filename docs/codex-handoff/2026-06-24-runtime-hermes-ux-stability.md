# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 Windows 测试盘 `F:\` 上 OpenClaw 对话缺模板、Hermes 长时间无反馈、环境检查待验证、以及频繁切换页面导致 UI 卡顿的问题，并把修复落实到 `D:\github\u-agent` 源码和构建脚本中。

## 已完成
- 定位 OpenClaw 对话报错根因：展开后的 `F:\runtime\node_modules\openclaw` 缺少运行时实际读取的 `src/agents/templates/AGENTS.md`。
- 在主进程启动路径加入 OpenClaw 模板修复：优先从展开目录 `docs/reference/templates/AGENTS.md` 复制，若展开目录也缺失，则从 `runtime/openclaw.zip` 单独抽取该模板。
- 在 Windows runtime 打包脚本加入同样的 AGENTS 模板修复；`PORTABLE-RUNTIME-MANIFEST.json` 和 `verify-openclaw-runtime.mjs` 也把该模板列为必需项。
- 修复 Hermes 验证脚本跨盘符问题：`verify-hermes-runtime/memory/skills/skill-growth` 不再直接使用硬编码旧盘符的 venv wrapper，而是寻找真正的便携 Python，并设置 `PYTHONPATH` 到 `venv/Lib/site-packages` 与 `hermes-agent`。
- 修复 Hermes 状态轮询性能热点：状态快照优先使用技能验证报告中的数量，最多 60 秒才递归补扫技能目录，减少切页面和环境检查时的 UI 卡顿。
- 改造 Hermes skill 同步：不再删除整个 `data/.hermes/skills/openclaw` 根目录，改为逐个技能目录覆盖，避免 Windows 运行中目录锁导致 `EPERM`。
- 增加 Hermes 对话进度事件：后端在启动、调用模型、等待、收到输出、执行工具/插件、完成或错误时发 `hermes-chat-progress`，前端 Hermes/协同窗口实时显示当前阶段。
- 同步构建产物到 `F:\win-unpacked\resources\app\dist`，方便当前测试盘立即验证。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/preload/index.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `dist/preload/index.js`
- `dist/preload/index.cjs`
- `dist/assets/assets/main-DIeui7ZO.js`
- `scripts/package-windows-runtime-required.mjs`
- `scripts/verify-openclaw-runtime.mjs`
- `scripts/verify-hermes-runtime.mjs`
- `scripts/verify-hermes-memory.mjs`
- `scripts/verify-hermes-skills.mjs`
- `scripts/verify-hermes-skill-growth.mjs`
- `runtime/PORTABLE-RUNTIME-MANIFEST.json`
- `docs/codex-handoff/2026-06-24-runtime-hermes-ux-stability.md`

## 关键决策
- OpenClaw 的 `openclaw.zip` 不能被当成“完整展开即可恢复”的唯一保证；构建和启动都必须修复并校验运行时代码期望的模板路径。
- Hermes Windows venv 里的 `hermes.exe/python.exe` wrapper 会保留旧盘符，跨 U 盘盘符不可靠；所有验证和应用运行都应优先使用 `runtime/HermesPortable/python/.../python.exe` 加 `PYTHONPATH`。
- Hermes 长任务不应通过阻止用户切换窗口来规避问题；应允许用户继续操作，同时用进度事件和日志反馈告诉用户任务仍在执行。
- 环境检查不应在普通状态轮询中做重型递归扫描或删除重建技能镜像；重验证应通过报告和显式验证动作闭环。

## 待继续
- 在 UI 中继续观察 Hermes 对话进度反馈是否足够清晰，必要时把阶段提示渲染成更像 OpenClaw 的执行过程列表。
- 继续优化 Hermes 技能可见性：当前 80 个 OpenClaw skills 已镜像，Hermes 官方可见 77 个 slash command，仍有 2 个中文技能名未映射成可见命令。
- 检查 `restore-openclaw-shell.mjs` 是否需要同步本轮 AGENTS 修复、进度事件和技能非破坏式同步，避免以后从原始 shell 重新生成时丢失。
- 做一次完整 Windows release/staging 构建，确认新 runtime 包从干净目录解压后也自带 AGENTS 模板，不依赖当前 F 盘手工修复。
- 让环境检查页面对“未验证”和“验证失败”做更清晰区分，并提供一键验证记忆/技能/自我成长的入口。

## 验证结果
- `npm.cmd run build`：通过。
- 已同步 `D:\github\u-agent\dist` 到 `F:\win-unpacked\resources\app\dist`。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-openclaw-runtime.mjs`：`runtimeIntegrity.ok=true`，OpenClaw CLI smoke 通过，`openclawAgentsTemplate=true`。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-hermes-runtime.mjs`：Python、Node、Hermes CLI 均通过；config/api 端口就绪，dashboard 未启动不阻断。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-hermes-memory.mjs`：`ok=true`，持久记忆文件可写，报告已生成。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-hermes-skills.mjs`：`ok=true`，sourceCount=80，mirroredCount=80，visibleCount=77，commandCount=77。

## 如果需要下一台 Codex 接手，提示词
你接手的是 `D:\github\u-agent`，当前 Windows 测试盘是 `F:\`，用户从 `F:\win-unpacked\OpenClawPro.exe` 启动程序。上一轮已修复 OpenClaw 缺 `src/agents/templates/AGENTS.md` 导致对话失败的问题：主进程会从展开目录或 `runtime/openclaw.zip` 抽取模板，打包脚本和校验脚本也已纳入该必需项。Hermes 验证脚本已改用真正便携 Python，并设置 `PYTHONPATH`，避免 venv wrapper 硬编码旧盘符；`verify-hermes-runtime/memory/skills` 在 `AGENT_HUB_ROOT=F:\` 下已通过。前端已接入 `hermes-chat-progress` 事件，Hermes 长对话会持续更新状态。下一步优先检查 `restore-openclaw-shell.mjs` 是否需要同步这些改动，继续优化环境检查 UI 的“未验证/失败”区分，并处理剩余 2 个中文技能未映射为 Hermes slash command 的问题。开始前先跑 `git status`、`npm.cmd run build`、`$env:AGENT_HUB_ROOT='F:\'; node scripts\verify-openclaw-runtime.mjs`、`$env:AGENT_HUB_ROOT='F:\'; node scripts\verify-hermes-runtime.mjs`。
