# Codex Handoff

## 总体目标

基于已开发的 U 盘便携版 OpenClaw 集成 Hermes，实现零安装、零痕迹、Windows/macOS/Linux 三平台原生运行、Universal 单包自动识别平台、持久记忆与自动生成技能、多平台消息接入、自然语言定时自动化、子代理委派、本地/Docker/SSH/Singularity/Modal 沙箱，以及统一的可视化配置中心。所有能力需要与现有 OpenClaw 客户端界面和功能无缝融合，保证良好的用户体验。

## 当前目标

基于 `main` 最新源码生成 Windows 壳替换包，包含完整 `win-unpacked/` 和根目录 `OpenClawPro U盘便携版.exe`，其余便携目录保持为空，供用户手工替换 runtime、数据、技能和插件后复制到 U 盘测试。

## 已完成

- 执行 `npm.cmd run package:windows-shell`，重新构建源码 `dist` 和 Electron 35.7.5 Windows x64 壳。
- Windows 主程序图标与版本资源写入成功。
- 生成根目录启动器 `OpenClawPro U盘便携版.exe`。
- 创建独立替换包目录 `D:\share\1\o\windows-shell-replacement-20260722`。
- 包内只放置完整 `win-unpacked/`、根启动器，以及空的 `runtime/`、`data/`、`skills/`、`extensions/`。

## 改动文件

- `docs/codex-handoff/2026-07-22-windows-shell-replacement-package.md`
- 外部构建产物：`D:\share\1\o\windows-shell-replacement-20260722`

## 关键决策

- 不覆盖已有 `D:\share\1\o\1`，避免损坏其中的完整 runtime 和测试数据。
- 不把 runtime、用户配置、技能或插件复制进替换包，四个目录保持真正空目录。
- 不生成 zip，用户可以直接替换目录内容并整体复制到 U 盘。
- 外部构建产物不提交 Git，只提交构建记录。

## 待继续

- 用户手工放入 Windows 完整 runtime、初始化 data、skills 和 extensions。
- 将完整目录复制到新 U 盘，在新电脑测试授权、OpenClaw/Hermes 启停、模型、会话、技能和微信。
- 测试通过后再生成正式初始化 release；若出现问题，优先采集 U 盘 `data/` 中日志并回到源码修复。

## 验证结果

- `win-unpacked/OpenClawPro.exe`：存在。
- `OpenClawPro U盘便携版.exe`：存在。
- `win-unpacked`：95 个文件，共 300,753,574 字节。
- `runtime/`、`data/`、`skills/`、`extensions/`：均存在且子项数量为 0。
- 壳内 main、renderer、preload 与仓库最新 `dist` SHA-256：全部一致。
- 壳内 main 和 preload `node --check`：通过。
- Hermes 日志脱敏、轻量环境检查、OpenClaw 最终消息刷新标识：均存在。

## 如果需要下一台 Codex 接手，提示词

请先阅读 `docs/codex-handoff/2026-07-22-macos-shared-fixes-backport.md` 和 `docs/codex-handoff/2026-07-22-windows-shell-replacement-package.md`。Windows 壳替换包位于 `D:\share\1\o\windows-shell-replacement-20260722`，其中 `runtime`、`data`、`skills`、`extensions` 有意保持为空。用户会手工补齐后复制到 U 盘测试。不要直接修改 U 盘产物来修 bug；问题必须回到 `D:\github\u-agent` 的 `src/openclaw-shell-app` 修改并重新构建。
