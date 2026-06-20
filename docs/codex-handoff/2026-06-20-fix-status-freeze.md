# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长（持久记忆 + 自动生成技能）、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并和现有程序前端界面无缝融合，保留 OpenClaw 原有功能与体验，同时让 Hermes 在首页、AI 会话、模型配置、环境检查、技能管理等模块自然协同。

## 当前目标
修复桌面程序打开后未响应的问题。

## 已完成
- 定位根因：当前部署版 Hermes `snapshot()/getStatus()` 每次状态刷新都会同步执行 `verifyHermesMemory()` 和 `syncOpenClawSkillsToHermes()`，这些函数会启动 Python 并扫描 skills，堵塞 Electron 主进程。
- 源码 `HermesRuntime.getStatus()` 改为只读取已有 memory/skills/growth JSON report；没有 report 时返回轻量 snapshot，不执行 Python 或 skills 扫描。
- `scripts/restore-openclaw-shell.mjs` 同步修复当前 U 盘 app 注入逻辑，deployed `snapshot()` 只读 `persistence-last.json`、`visibility-last.json`、`growth-last.json`。
- 已重新部署到 `E:\win-unpacked\resources\app`，部署前备份到 `E:\backups\app-before-openclaw-shell-restore-20260620182124`。

## 改动文件
- `src/main/runtime/hermes/hermes-runtime.ts`
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-20-fix-status-freeze.md`

## 关键决策
- 状态刷新路径必须是轻量、非阻塞的：只能读已有报告和检查端口，不能同步执行 Python、Hermes 官方扫描或技能镜像。
- 重型验证仍保留在手动脚本/启动/同步动作里，例如 `verify-hermes-memory`、`verify-hermes-skills`、`verify-hermes-skill-growth`。

## 待继续
- 后续 UI 如果需要“重新验证 Hermes 记忆/技能/自我成长”，应使用显式按钮并显示进度，不要绑在自动状态刷新上。
- 继续做真实对话生成技能、cron automation、connectors、sandbox/subagent 真实闭环。

## 验证结果
- `node --check scripts/restore-openclaw-shell.mjs` 通过。
- 已确认 deployed `E:\win-unpacked\resources\app\dist\main\index.js` 中 `snapshot()` 只读 report，不再调用 `verifyHermesMemory({ silent: true })` 或 `syncOpenClawSkillsToHermes({ silent: true })`。
- 已启动 `E:\win-unpacked\OpenClawPro.exe` 并等待约 8 秒，多个 `OpenClawPro` 进程均显示 `Responding=True`。

## 如果需要下一台 Codex 接手，提示词
继续在 `E:\source\openclawpro-agent-hub` 开发。注意：不要在 Electron 主进程的自动状态刷新、首页轮询、环境检查初始化中同步执行 Python/Hermes 扫描。重型验证必须放到显式按钮或脚本里。当前未响应问题已通过轻量 snapshot 修复并部署。每阶段结束执行 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`，并新增 handoff，handoff 必须包含“总体目标”。
