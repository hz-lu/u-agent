# Codex Handoff

## 总体目标

基于已开发的 U 盘便携版 OpenClaw 集成 Hermes，实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离和可视化配置中心，并与现有前端界面无缝融合，保证用户体验和运行稳定性。

## 当前目标

修复 Hermes 会话顶栏溢出和 Windows 主进程阻塞风险；将共享技能仓库改为事件触发加低频兜底；修正 OpenClaw 旧会话持续复述 134/137 个技能的问题；为 OpenClaw、Hermes 和协同会话补齐延迟发送的多技能选择，并在协同模式中按兼容性优先 OpenClaw、失败后回退 Hermes。

## 已完成

- Hermes 会话顶栏增加收缩、截断和宽度约束，长状态与模型名不再撑破会话窗口。
- 共享技能 worker 删除每 15 秒全量 fingerprint，改为目录事件触发、防抖处理和 10 分钟低频兜底。
- Windows 避开 Node 24 递归 `fs.watch` 的原生断言问题，使用根目录轻量 stat 事件监听；应用内安装和同步仍通过 IPC 立即触发。
- worker 延迟到界面加载后 12 秒启动，避免首屏与全量技能扫描争抢 U 盘 IO。
- Electron 退出改为阻止默认退出、等待 Agent 停止和便携子进程清理后再结束，减少残留 Node/Python 进程。
- `/skill` 选择后不再立即发送，改为技能标签；可继续输入任务、删除标签并最多组合 5 个技能。
- OpenClaw 单技能继续使用官方 slash 命令；Hermes 单技能和多技能均经过官方 resolver 与 invocation builder。
- 协同模式显示 `/skill`，合并两端兼容性目录；优先 OpenClaw，OpenClaw 不可用或执行失败且技能全部兼容 Hermes 时自动回退。
- 技能目录变化时刷新 OpenClaw 会话技能快照；检测到旧会话中的 134/137 等过期技能回答时，保留历史并自动新建会话。

## 改动文件

- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/main/skill-repository-worker.cjs`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `dist/main/skill-repository-worker.cjs`
- `dist/assets/assets/main-DIeui7ZO.js`
- `dist/assets/main-CAx6YYDG.css`
- `scripts/verify-skill-repository-events.mjs`
- `scripts/verify-chat-skill-commands.mjs`
- `scripts/verify-windows-shared-skill-closure.mjs`
- `scripts/audit-openclaw-shell-features.mjs`
- `package.json`
- `docs/codex-handoff/2026-07-26-skill-routing-performance.md`

## 关键决策

- OpenClaw 和 Hermes 官方命令解析器一次只原生解析一个技能；多技能由客户端编排，但每个 Hermes 技能仍经过官方解析和调用消息构造，不修改官方 runtime。
- 多技能最多 5 个，防止技能说明和用户输入无上限膨胀。
- 134/137 是旧会话历史回答污染，不是当前技能注入上限；不伪造计数，改为切换到加载当前技能快照的新会话。
- 当前 E 盘 OpenClaw 实际发现 288 个技能，其中 211 个符合 Windows 条件并完整进入系统提示；Hermes 官方命令目录为 252 个。
- Windows 性能优先：首屏不扫描、目录变化时触发、10 分钟才做兜底扫描，不恢复高频全量 fingerprint。

## 待继续

- 在重新构建的 Windows Electron 壳中人工检查 Hermes 顶栏、多个技能标签、技能删除和三种会话切换。
- 在真实模型调用中验证协同技能任务的 OpenClaw 成功路径，以及人为制造 OpenClaw 失败后的 Hermes 回退路径。
- 验证旧的 134/137 技能会话会自动保留并切换到新会话，新会话回答与 211 个当前可用技能一致。
- 本轮只更新源码和仓库 `dist`，没有覆盖 E 盘运行壳或 release 目录。

## 验证结果

- `npm.cmd run build`：通过。
- `npm.cmd run audit:openclaw-shell`：42/42 通过。
- `npm.cmd run verify:chat-skill-commands`：通过。
- `npm.cmd run verify:skill-repository-events`：通过，事件触发约 820 ms，兜底间隔 600000 ms。
- `npm.cmd run verify:portable-skill-repository`：通过。
- `npm.cmd run verify:skill-metadata`：通过。
- `npm.cmd run verify:shared-backports`：通过。
- `PORTABLE_ROOT=E:\ npm.cmd run verify:windows-shared-skills`：通过；OpenClaw 211/211 完整注入且未截断，Hermes 252 个命令，两个技能均通过官方 resolver/builder。
- `git diff --check`：通过。

## 如果需要下一台 Codex 接手，提示词

请在 `D:\github\u-agent` 的 `main` 分支继续，先阅读 `docs/codex-handoff/2026-07-26-skill-routing-performance.md` 并检查工作区。不要修改 OpenClaw 或 Hermes 官方 runtime，不要覆盖用户数据。先重新构建 Windows 壳，在真实 Electron 环境验证 Hermes 顶栏、`/skill` 多选、协同 OpenClaw 优先与 Hermes 回退、旧技能数量会话迁移以及退出后子进程清理。遇到技能数量差异时先运行 `PORTABLE_ROOT=<盘符> npm.cmd run verify:windows-shared-skills`，区分安装包数、平台合格数、系统提示注入数和模型历史回答，再从源码修复。
