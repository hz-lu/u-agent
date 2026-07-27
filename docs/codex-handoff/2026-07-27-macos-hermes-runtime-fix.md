# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

修复 macOS U 盘版首页误报 Hermes Python 正常但 Hermes CLI 缺失，以及点击启动出现 `spawn Unknown system error -8` 的问题。

## 已完成

- 确认错误 release 和 U 盘中实际放入的是 Windows Hermes runtime，缺少 macOS `venv/bin/python` 与 `venv/bin/hermes`。
- macOS staging 现在把 venv Python 链接改写为包内相对路径，并在 exFAT 输出时物化为 arm64 Mach-O 文件。
- 新增 macOS Hermes runtime 平台校验，禁止 Windows Python/venv 混入，检查 CLI shebang、可执行权限和 arm64 架构。
- staging 完成前真实执行 `hermes --version`，CLI 无法运行时直接中止打包。
- macOS Hermes 子进程环境补充便携 Python 所需的 `PYTHONHOME`。
- macOS 查找不到 `venv/bin/python` 时不再继续扫描 Windows `python.exe`，避免环境检查误判。
- 已重新生成 `release/macos-usb-root-exfat`。

## 改动文件

- `src/openclaw-shell-app/dist/main/index.js`
- `scripts/stage-macos-portable-test.mjs`
- `scripts/verify-macos-hermes-runtime.mjs`
- `package.json`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `docs/codex-handoff/2026-07-27-macos-hermes-runtime-fix.md`

## 关键决策

- 从 staging 根因修复，不手工修补单个 U 盘。
- macOS release 必须通过二进制平台检查和真实 CLI smoke test，不能只以路径存在作为完整性依据。
- 保持 OpenClaw、对话、模型、技能和 UI 逻辑不变，本轮只处理 Hermes runtime 构建与识别。

## 待继续

- 将新 release 中的 `OpenClawPro.app` 和 `runtime/HermesPortable` 替换到测试 U 盘；旧 U 盘里的 Windows Hermes runtime 不能继续使用。
- 在实际 exFAT U 盘上验证首页环境检查、手动启动 Hermes、AI 会话自动启动和日志输出。
- Intel Mac 尚未适配和验证。

## 验证结果

- `npm run build` 通过。
- `npm run stage:macos-usb-root:final` 通过。
- `npm run verify:hermes:macos` 通过。
- release 中 `venv/bin/python` 和 `python/bin/python3.12` 均为 macOS arm64 Mach-O。
- release 中无 `venv/Scripts` 和 `cpython-*-windows-*`。
- release 中 Hermes CLI shebang 为 `#!/usr/bin/env python3`。
- 使用便携环境执行 `hermes --version` 成功，返回 Hermes Agent v0.17.0、Python 3.12.13。

## 如果需要下一台 Codex 接手，提示词

读取本 handoff 和最新提交。先把 `release/macos-usb-root-exfat/OpenClawPro.app` 与 `release/macos-usb-root-exfat/runtime/HermesPortable` 同步到 exFAT U 盘，再在 U 盘实机验证 Hermes 环境检查、启动、日志和 AI 对话。若失败，优先读取 U 盘根目录 `.OpenClawPro-launch.log` 与 `data/.hermes/logs/launcher.log`，不要回退平台校验，也不要改动 OpenClaw 主流程。
