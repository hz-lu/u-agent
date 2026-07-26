# Codex Handoff

## 总体目标

基于已开发的 U 盘便携版 OpenClaw 集成 Hermes，实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离和可视化配置中心，并与现有前端界面无缝融合，保证用户体验和运行稳定性。

## 当前目标

参考 macOS 分支最近 20 次提交中的技能修复思路，修复 Windows 主干中技能管理数量不完整、OpenClaw 会话技能被截断、Hermes 无法读取 U 盘共享技能的问题。macOS 分支仅作问题对照，没有合并或照抄提交。

## 已完成

- 确认 `E:\skills` 的 283 个目录中，281 个包含 `SKILL.md`，另外 2 个是辅助目录。
- 技能管理改为按安装包路径标识，不再按 frontmatter `name` 覆盖同名安装包；可展示全部 281 个有效技能包。
- 保留 Agent 的名称级启用语义；同名包在 UI 中独立展示，但启用/禁用状态保持一致。
- 为 OpenClaw 配置正式的技能容量上限，解除默认每来源 200 个、提示词 150 个和 18,000 字符造成的截断。
- Hermes `external_dirs` 改为便携相对路径 `../../skills`，直接读取 U 盘根目录共享技能；Hermes 自生成技能仍写入 `data/.hermes/skills`。
- 移除显式同步时的大规模镜像复制，原生扫描改为异步子进程，避免阻塞 Electron 主进程。
- Hermes 启动和对话前都会校正共享技能配置，现有 U 盘数据可自动迁移。
- 干净 Windows release 初始化配置已同步采用新的共享目录和 OpenClaw 容量参数。
- 新增真实 runtime 隔离验证脚本，不修改 U 盘用户配置。

## 改动文件

- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `dist/assets/assets/main-DIeui7ZO.js`
- `scripts/stage-windows-release-dir.mjs`
- `scripts/audit-openclaw-shell-features.mjs`
- `scripts/verify-windows-shared-skill-closure.mjs`
- `package.json`
- `docs/codex-handoff/2026-07-26-windows-shared-skills-closure.md`

## 关键决策

- 目录数量、安装包数量和 Agent 可调用技能数量是三个不同指标，不能把辅助目录或不合格技能虚报为可用技能。
- UI 的唯一身份使用技能包标识，Agent 调用身份继续使用 frontmatter 名称，解决同名包展示与运行语义冲突。
- `skills/` 是 OpenClaw 与 Hermes 的共享事实源，不再复制 281 份文件到 Hermes 数据目录。
- OpenClaw 使用官方 `skills.limits` 配置扩容，不修改便携 runtime 内部代码。
- 技能提示目录采用 OpenClaw 官方紧凑格式；实测 211 个合格技能占 27,012 字符，在 65,536 字符上限内完整注入。
- 不强行启用平台不兼容、缺少标准 frontmatter 或环境依赖不满足的技能。

## 待继续

- 在新的 Windows U 盘运行壳中确认技能管理显示 281 个有效技能包。
- 重启 OpenClaw 后新建或刷新会话，确认模型不再报告 `134 of 171`。
- 启动 Hermes 后进行技能查询和实际技能调用，确认 252 个 Windows 可调用技能可见。
- 后续可在技能管理页增加“281 个安装包 / 260 个唯一名称 / 2 个无效目录”的诊断详情入口。
- 本轮只构建仓库 `dist`，尚未覆盖用户正在运行的 U 盘壳或 release 目录。

## 验证结果

- `npm.cmd run build`：通过。
- `npm.cmd run verify:shared-backports`：通过。
- `npm.cmd run audit:openclaw-shell`：24/24 通过。
- `PORTABLE_ROOT=E:\ npm.cmd run verify:windows-shared-skills`：通过。
- E 盘发现结果：283 个目录，281 个技能包，260 个唯一声明名称，2 个辅助目录。
- OpenClaw：288 个总技能（231 自定义 + 57 内置），211 个当前 Windows 环境合格技能；会话提示完整注入 211/211，无截断。
- Hermes：252 个技能和 252 个 slash 命令，官方解析的外部目录为 `E:\skills`。
- `git diff --check`：通过。

## 如果需要下一台 Codex 接手，提示词

请在 `D:\github\u-agent` 的 `main` 分支继续。先阅读 `docs/codex-handoff/2026-07-26-windows-shared-skills-closure.md`，确认工作区状态和最新提交。不要直接合并 macOS 分支。使用新的 Windows U 盘运行壳验证技能管理、OpenClaw 新会话技能注入和 Hermes 实际技能调用；若发现差异，先运行 `PORTABLE_ROOT=<盘符> npm.cmd run verify:windows-shared-skills` 区分安装包数、合格技能数和提示注入数，再从源码修复。不要修改 runtime 内部文件，不要把用户数据写入仓库或 release 初始化包。
