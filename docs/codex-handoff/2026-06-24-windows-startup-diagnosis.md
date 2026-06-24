# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
排查 Windows 测试盘 `F:\` 上 OpenClaw 和 Hermes 都无法启动的问题，并把必要修复落实到 `D:\github\u-agent` 源码中，避免下次重新构建后复发。

## 已完成
- 定位 OpenClaw 启动失败的直接原因：`F:\runtime\node_modules\openclaw\node_modules` 依赖不完整，真实 gateway 启动先后报缺 `@clack/prompts`、`@earendil-works/pi-tui`。
- 从 `F:\runtime\openclaw.zip` 手动抽取了当前 gateway 主链路需要的一批依赖，真实 smoke 启动已出现 `[gateway] ready`，并监听过 `127.0.0.1:18789`。
- 定位 Hermes 启动失败的直接原因：Windows venv 启动器硬编码旧盘符 `E:\runtime\HermesPortable\python\...`，U 盘变成 `F:\` 后报 `No Python at ...`。
- 修改 Hermes 主进程启动逻辑：Windows 下改为使用 `runtime/HermesPortable/python/.../python.exe -m hermes_cli.main ...`，并通过 `PYTHONPATH` 指向 `venv/Lib/site-packages` 和 `hermes-agent` 源码。
- 修改 `diagnose-hermes-startup.mjs`，诊断脚本使用和应用一致的便携 Python 启动方式。
- 修改 `restore-openclaw-shell.mjs`，以后重新恢复/打包 OpenClaw Shell 时也会注入 Hermes 便携 Python 启动逻辑。
- 修改 `verify-openclaw-runtime.mjs`，真实 CLI smoke 作为启动可用性判断；静态扫描缺失的可选/非主链路包作为 warning 暴露。
- 同步修复到当前测试盘 `F:\win-unpacked\resources\app\dist\main\index.js` 与 `index.cjs`，方便立即测试。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `scripts/diagnose-hermes-startup.mjs`
- `scripts/restore-openclaw-shell.mjs`
- `scripts/verify-openclaw-runtime.mjs`
- `docs/codex-handoff/2026-06-24-windows-startup-diagnosis.md`

## 关键决策
- Hermes 不再依赖 Windows venv 生成的 `.exe` 启动器来跨盘符运行；`.exe` 仍可作为存在性信息显示，但实际运行使用便携 Python 模块入口。
- OpenClaw runtime 不应在用户启动时全量解压 `openclaw.zip`，U 盘上 2 万多个文件展开非常慢；正式 release 应预置完整展开的 runtime 或在构建阶段完成修复。
- `F:\OpenClawPro.exe` 是旧的单独 exe，旁边缺少 Electron 资源时会产生 `Invalid file descriptor to ICU data`；正确入口应是 `F:\win-unpacked\OpenClawPro.exe`，或者后续做一个真正的根目录 launcher。

## 待继续
- 正式修复 Windows release 流程：生成包时必须预置完整 OpenClaw runtime 依赖，不能依赖启动时抽取 `openclaw.zip`。
- 检查 `build-windows-release.mjs` / `package-windows-runtime-required.mjs` 的 runtime 来源，确保 `node_modules/openclaw/node_modules` 完整进入 release。
- 处理根目录旧 `OpenClawPro.exe` 误导问题：删除旧单 exe，或替换为真正启动 `win-unpacked/OpenClawPro.exe` 的 launcher。
- 在桌面 UI 中重新测试：首页启动 OpenClaw、启动 Hermes、AI 会话 OpenClaw/Hermes/协同模式。
- 若要支持任意 U 盘盘符，Hermes 的所有子命令、dashboard、api server、chat 都应继续用便携 Python 路径验证。

## 验证结果
- `node --check D:\github\u-agent\scripts\verify-openclaw-runtime.mjs`：通过。
- `node --check D:\github\u-agent\scripts\restore-openclaw-shell.mjs`：通过。
- `node --check D:\github\u-agent\scripts\diagnose-hermes-startup.mjs`：通过。
- `node --check D:\github\u-agent\src\openclaw-shell-app\dist\main\index.js`：通过。
- `npm.cmd run build`：通过。
- `node D:\github\u-agent\scripts\diagnose-hermes-startup.mjs`，工作目录 `F:\`：通过，Python 3.12.13、Hermes Agent v0.15.1、config probe 均正常。
- `node D:\github\u-agent\scripts\verify-openclaw-runtime.mjs`，工作目录 `F:\`：`runtimeIntegrity.ok=true`，CLI smoke 通过；仍有 4 个静态 optional import warning。
- 手动真实启动 `F:\runtime\openclaw.cmd gateway --allow-unconfigured --port 18789`：日志出现 `[gateway] ready`，端口曾监听成功；验证后已停止手动 node 进程，避免占用端口。

## 如果需要下一台 Codex 接手，提示词
你接手的是 `D:\github\u-agent`，Windows 测试盘在 `F:\`。上一轮已定位并修复 Hermes 跨盘符启动问题：Windows 下使用便携 Python `python.exe -m hermes_cli.main`，并设置 `PYTHONPATH` 到 `runtime/HermesPortable/venv/Lib/site-packages` 和 `runtime/HermesPortable/hermes-agent`。OpenClaw 当前测试盘的主 gateway 已能启动，但 runtime 依赖仍不是正式 release 级完整状态，`verify-openclaw-runtime` 会给出 optional/static import warnings。下一步优先修 release/runtime 打包流程，让 `node_modules/openclaw/node_modules` 在构建阶段完整预置，避免启动时解压大量文件；同时处理根目录旧 `OpenClawPro.exe` 误导用户的问题。继续前先阅读本 handoff 和 `git diff`，再跑 `npm.cmd run build`、`node scripts/diagnose-hermes-startup.mjs`（在 `F:\` 工作目录）、`node scripts/verify-openclaw-runtime.mjs`（在 `F:\` 工作目录）。
