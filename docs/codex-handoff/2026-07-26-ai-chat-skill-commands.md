# Codex Handoff

## 总体目标

基于已开发的 U 盘便携版 OpenClaw 完整集成 Hermes，实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离和可视化配置中心，并与现有前端和 OpenClaw 功能自然融合。

## 当前目标

在 AI 会话中增加 `/skill` 技能选择和直接调用能力；OpenClaw 与 Hermes 分别复用各自官方技能命令，不复制或修改 Agent runtime 官方实现。

## 已完成

- AI 会话输入 `/ski`、`/skil` 或 `/skill` 时按需加载技能命令并显示可搜索列表。
- OpenClaw 优先通过 Gateway 官方 `commands.list` 获取当前 Agent 可调用技能，选择后发送官方 slash alias；Gateway 未就绪时异步调用官方 `skills list --json`，最后才回退便携技能目录。
- Hermes 通过官方 `agent.skill_commands.reload_skills()` 获取 slash 命令，选择后发送官方 `/<skill-name>` 命令。
- Hermes 桌面会话使用 `--oneshot`，而官方 oneshot 会绕过交互式 slash dispatcher；主进程因此调用官方 `resolve_skill_command_key()` 和 `build_skill_invocation_message()` 生成技能注入消息，再进入原有 oneshot 模型链路。
- 技能目录只在用户触发 `/skill` 时扫描；Hermes 命令缓存 60 秒，并在共享技能仓库变化时失效，避免进入 AI 会话就增加 U 盘 I/O。
- 协同模式隐藏 `/skill` 入口，避免无法判断技能应只由 OpenClaw、只由 Hermes，还是由两者共同执行。

## 改动文件

- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/preload/index.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css`
- `scripts/verify-chat-skill-commands.mjs`
- `scripts/audit-openclaw-shell-features.mjs`
- `package.json`
- 上述源码构建生成的 `dist/` 对应文件

## 关键决策

- OpenClaw 使用官方 `/skill <name> [input]` 与动态 slash alias，不由客户端读取 `SKILL.md` 后自行拼提示词。
- Hermes 官方支持 `/<skill-name>`，但当前桌面 oneshot 链路不会经过 `cli.py`；桥接只调用 Hermes 官方 Python API，不修改 Hermes runtime 文件。
- 技能列表必须异步、按需加载。任何 Node/Python 技能扫描都在子进程执行，不阻塞 Electron 主线程。
- 当前版本点击技能会直接调用；如果技能需要参数，Agent 会依据技能内容继续处理或询问用户。

## 待继续

- 将最新 `dist/` 部署到测试壳后，在 OpenClaw 和 Hermes Tab 分别输入 `/skill`，选择一个无外部密钥依赖的技能完成端到端对话测试。
- OpenClaw Gateway 当前 E 盘实例在命令 RPC 黑盒测试时返回 1006 异常关闭；源码已覆盖 Gateway 未就绪的官方 CLI 回退，但应在稳定 Gateway 上再验证在线 `commands.list` 返回的技能数量。
- 后续如需在协同模式调用技能，应先设计明确的执行归属选择，不应默认同时发送给两个 Agent。

## 验证结果

- `npm.cmd run verify:chat-skill-commands`：通过。
- `npm.cmd run build`：通过。
- `npm.cmd run audit:openclaw-shell`：35/35 通过。
- `npm.cmd run verify:skill-metadata`：通过。
- `npm.cmd run verify:portable-skill-repository`：通过。
- `npm.cmd run verify:shared-backports`：通过。
- `PORTABLE_ROOT=E:\\ npm.cmd run verify:windows-shared-skills`：通过；OpenClaw 211 个技能进入会话提示，Hermes 252 个技能命令可解析。
- 主进程、preload 和 renderer 的 `node --check` 及 `git diff --check`：通过。
- E 盘 Hermes 官方黑盒验证：252 个 slash 命令；官方 resolver 命中；官方 invocation message 成功包含用户指令。
- E 盘 OpenClaw 官方 CLI 黑盒验证：288 个发现项、211 个 eligible、210 个 userInvocable/commandVisible。

## 如果需要下一台 Codex 接手，提示词

请在 `D:\github\u-agent` 的 `main` 分支继续。先阅读 `docs/codex-handoff/2026-07-26-ai-chat-skill-commands.md`。AI 会话 `/skill` 已分别接入 OpenClaw 官方 `commands.list`/`skills list --json` 和 Hermes 官方 `agent.skill_commands`。不要修改 runtime 中 OpenClaw/Hermes 官方文件，不要把技能扫描移回 Electron 主线程。部署测试时关闭目标壳后同步完整最新 `dist/main`、`dist/preload`、renderer JS 与 CSS，再分别验证 OpenClaw/Hermes 的技能调用。
