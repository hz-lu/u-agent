# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并与现有程序前端界面无缝融合，让用户在前端界面上获得良好的 OpenClaw + Hermes 协作体验。

## 当前目标
修复在 Hermes 对话中请求安装 GitHub skill 时，桌面程序卡死并闪退的问题。

## 已完成
- 增加 Hermes chat 中的 skill 安装请求识别：当用户消息包含“安装/同步 skill/技能”与 GitHub 仓库 URL 时，不再把任务交给 Hermes oneshot 自由执行。
- 增加主进程受控 skill 安装器 `installPortableSkillFromGit`：
  - 支持 GitHub `.git` 仓库地址。
  - 优先复用已下载到 `data/.hermes/tmp/<repo>` 的仓库。
  - 可用 Git 时使用 `git clone --depth 1`。
  - Git 不可用时使用便携 Python 下载 GitHub archive zip 并解压，保持零安装目标。
  - 扫描仓库中的 `SKILL.md`，支持一个仓库包含多个 skill。
  - 安装到 U 盘统一 `skills/` 目录。
  - 更新 OpenClaw skills 配置并启用新安装 skill。
  - 安装后调用现有 Hermes skill 同步逻辑，让 OpenClaw 与 Hermes 共用 skill。
- Hermes 对话收到安装请求后会返回受控安装结果，而不是长时间无反馈。
- 重新生成 `E:\win-unpacked\resources\app` 部署包。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-21-safe-skill-install-from-hermes-chat.md`

## 关键决策
- skill 安装属于高风险长任务，不能放在 Hermes 对话子进程里自由执行，否则容易卡 UI、刷大量输出或导致桌面进程退出。
- 统一安装入口仍然是 U 盘根目录 `skills/`，Hermes 通过同步镜像使用同一批技能。
- 支持 Git 但不依赖 Git；没有系统 Git 时用便携 Python 下载 GitHub zip，保持零安装设计。

## 待继续
- 可以在 UI 上增加更明确的“正在安装 skill...”进度状态，目前对话会等待安装器返回。
- 可以增加安装来源白名单或二次确认，避免用户误装未知仓库。
- 可继续验证更多 GitHub skill 仓库结构。

## 验证结果
- `node --check scripts\restore-openclaw-shell.mjs` 通过。
- `node scripts\restore-openclaw-shell.mjs` 成功重新生成部署包。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- 部署包中已确认包含 `detectPortableSkillInstallRequest`、`installPortableSkillFromGit`、`downloadArchiveFallback`。
- 手动验证 `https://github.com/KKKKhazix/khazix-skills.git` 仓库可解析出并安装 5 个 skill 到 `E:\skills`：`aihot`、`hv-analysis`、`khazix-writer`、`neat-freak`、`storage-analyzer`。
- 启动 `E:\win-unpacked\OpenClawPro.exe` 后，`OpenClawPro` 进程 `Responding=True`。

## 如果需要下一台 Codex 接手，提示词
请在 `E:\source\openclawpro-agent-hub` 继续开发。刚修复了 Hermes 对话中安装 GitHub skill 导致程序卡死/闪退的问题：安装请求现在由主进程受控安装器处理，安装到 U 盘 `skills/` 后同步给 Hermes。后续可继续做 UI 进度提示、安装确认、安全白名单和更多仓库结构验证。
