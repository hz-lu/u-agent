# Codex Handoff

## 总体目标

基于已开发的 U 盘便携版 OpenClaw 集成 Hermes，实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离和可视化配置中心，并与现有前端界面无缝融合，保证用户体验和运行稳定性。

## 当前目标

基于提交 `0eb2c8e` 重新生成完整 Windows x64 Electron `win-unpacked` 和 U 盘根目录启动器，供用户复制后完整测试技能路由、Hermes 布局和 Windows 稳定性修复。

## 已完成

- 使用 Electron 35.7.5 Windows x64 重新下载并生成完整 `win-unpacked`。
- 将仓库最新 `dist` 写入 `win-unpacked/resources/app/dist`。
- 成功写入 OpenClawPro 图标和版本资源。
- 重新生成根目录 `OpenClawPro U盘便携版.exe`。
- 校验壳内 main、worker、renderer 和 CSS 与仓库最新构建 SHA-256 一致。

## 改动文件

- `docs/codex-handoff/2026-07-26-windows-shell-skill-routing.md`
- 外部/忽略构建产物：`D:/github/u-agent/win-unpacked/`
- 外部/忽略构建产物：`D:/github/u-agent/OpenClawPro U盘便携版.exe`

## 关键决策

- 本轮完整重建 Electron 壳，不覆盖 E 盘、F 盘或 release 目录。
- 根目录启动器虽未修改逻辑，仍重新生成，确保用户可以整套复制。
- runtime、skills、data 和 extensions 不打入 `win-unpacked`；测试时应保留 U 盘根目录对应内容，只替换完整壳和根启动器。

## 待继续

- 用户复制完整 `win-unpacked` 和根启动器到测试 U 盘。
- 在真实便携 runtime 下验证启动、OpenClaw/Hermes/协同会话、`/skill` 多选、协同回退和退出清理。
- 出现异常时读取测试 U 盘 `data/.openclaw/logs/desktop-crash.log` 和 Agent 日志，不直接修改壳内构建产物。

## 验证结果

- Electron：35.7.5，Windows x64。
- `win-unpacked`：96 个文件。
- `win-unpacked/OpenClawPro.exe`：201,217,024 字节。
- `OpenClawPro U盘便携版.exe`：26,112 字节。
- 壳内 main、worker、renderer、CSS 与仓库 `dist` SHA-256 全部一致。
- 壳内 main、preload、worker `node --check` 全部通过。
- `selectedSkills.value`、`sendCollaborativeSkillMessage`、`uclaw_skill_count_session_v2` 和 10 分钟 worker 兜底标记均存在。

## 如果需要下一台 Codex 接手，提示词

请在 `D:/github/u-agent` 的 `main` 分支继续，先阅读 `docs/codex-handoff/2026-07-26-skill-routing-performance.md` 和 `docs/codex-handoff/2026-07-26-windows-shell-skill-routing.md`。最新 Windows 壳位于仓库工作目录的 `win-unpacked/`，根启动器为 `OpenClawPro U盘便携版.exe`。等待用户实机测试反馈；问题必须回到 `src/openclaw-shell-app/dist` 修改并重新构建，不要修改官方 runtime 或只热改 U 盘产物。
