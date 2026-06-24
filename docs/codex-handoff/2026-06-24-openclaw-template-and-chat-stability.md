# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心；所有能力都要和现有前端界面无缝融合，保留 OpenClaw 原有体验，同时让 Hermes 在前端可操作、可理解、可诊断。

## 当前目标
处理 Windows F 盘测试包中 OpenClaw 对话报错、Hermes/协同对话导致程序未响应或闪退的问题，并把修复落实到源码和打包/校验链路。

## 已完成
- 定位 OpenClaw 对话报错的直接原因：便携 runtime 缺少完整 workspace templates，日志报 `Missing workspace template: SOUL.md`。
- 将 OpenClaw runtime 修复从只补 `AGENTS.md` 扩展为补齐 `AGENTS.md`、`BOOT.md`、`BOOTSTRAP.md`、`HEARTBEAT.md`、`IDENTITY.md`、`SOUL.md`、`TOOLS.md`、`USER.md`。
- 更新 Windows runtime 打包脚本和 OpenClaw runtime 校验脚本，防止未来 release 包再次漏掉这些模板。
- 优化 Hermes 聊天稳定性：Hermes 进度事件限频，AI 会话里 Hermes 状态从立即同步写 `localStorage` 改为延迟写入，降低 UI 卡死风险。
- 已把最新构建产物同步到 `F:\win-unpacked\resources\app\dist`，当前 F 盘测试程序已包含本次修复。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `dist/assets/assets/main-DIeui7ZO.js`
- `scripts/package-windows-runtime-required.mjs`
- `scripts/verify-openclaw-runtime.mjs`
- `scripts/restore-openclaw-shell.mjs`
- `runtime/PORTABLE-RUNTIME-MANIFEST.json`

## 关键决策
- 不通过禁用切换 OpenClaw/Hermes/协同窗口来规避稳定性问题；保留并发使用体验，转而减少主进程到渲染进程的高频事件和同步存储压力。
- OpenClaw 模板缺失属于 runtime 完整性问题，必须在打包、启动修复、校验三处同时兜底。
- Hermes 配置/Dashboard/API 端口未启动时，环境检查显示待验证是当前真实状态；Hermes oneshot 对话仍可工作。

## 待继续
- 继续观察和复现用户的未响应/闪退，如果再次发生，优先读取 `F:\data\.openclaw\logs\desktop-crash.log`、Windows 事件日志和最新 Hermes/OpenClaw run 日志。
- `scripts/restore-openclaw-shell.mjs` 仍是历史补丁型恢复脚本，已补入延迟保存修复，但仍需要系统整理，确保能完整恢复最新 Hermes UI/运行时逻辑。
- Hermes skills 当前 `sourceCount=80`、`commandCount=77`，仍有 2 个中文技能名未映射成 Hermes slash command：`电商价格比较`、`铁路工务工程师专家`。
- Hermes 长任务仍需要更细粒度的真实执行过程反馈，目前是阶段性状态和日志落盘提示。

## 验证结果
- `npm.cmd run build` 通过。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-openclaw-runtime.mjs` 通过：OpenClaw 模板完整、CLI smoke 通过、gateway ready。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-hermes-runtime.mjs` 通过：Hermes CLI、Python、Node 均可用；配置/Dashboard/API 端口未启动。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-hermes-memory.mjs` 通过。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-hermes-skills.mjs` 通过：`sourceCount=80`、`visibleCount=77`、`commandCount=77`。

## 如果需要下一台 Codex 接手，提示词
请在 `D:\github\u-agent` 继续开发 U 盘便携版 OpenClaw + Hermes 集成项目。当前 F 盘测试包在 `F:\`，启动程序是 `F:\win-unpacked\OpenClawPro.exe`。上一阶段已修复 OpenClaw runtime 缺完整 workspace templates 导致 `SOUL.md` 缺失的问题，并对 Hermes 聊天进度事件和 `localStorage` 会话保存做了节流，降低 UI 未响应风险。请先运行 `git status`、`npm.cmd run build`、`AGENT_HUB_ROOT=F:\ node scripts\verify-openclaw-runtime.mjs`、`verify-hermes-runtime/memory/skills`，然后重点继续复现和定位用户报告的多 Agent 对话未响应/闪退。不要通过禁用窗口切换或阻塞并发来规避问题，要保持 OpenClaw、Hermes、协同窗口可同时操作。
