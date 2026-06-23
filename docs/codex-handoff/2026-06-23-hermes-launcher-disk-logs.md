# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
处理用户反馈的 Hermes 启动异常：界面曾提示启动成功，但实际没有启动，甚至 `data/.hermes/logs` 中没有足够日志可排查。同时处理 Windows PowerShell 执行 `npm run ...` 时被 `npm.ps1` 执行策略拦截的问题。

## 已完成
- Hermes 主进程启动日志增加磁盘落盘：
  - 启动请求、cwd、命令、pid、stdout、stderr、spawn error、exit code、端口等待失败都会写入 `data/.hermes/logs/launcher.log`。
  - 前端 `hermes:getLogs` 现在会读取 `launcher.log`。
  - Hermes status snapshot 增加 `launcherLogPath`，便于 UI/排障显示真实日志路径。
- 保留前端 `safeSend("hermes-log")` 实时日志体验，同时增加磁盘日志，避免窗口未订阅或子进程瞬时退出时没有证据。
- 新增 Windows 批处理入口：
  - `scripts/windows-stage-slim.cmd` 使用 `npm.cmd run stage:windows-portable:slim`，绕过 PowerShell `npm.ps1` 执行策略。
  - `scripts/windows-diagnose-hermes.cmd` 使用 `npm.cmd run diagnose:hermes-startup`。
- 新增 Hermes 启动诊断脚本：
  - `npm run diagnose:hermes-startup`
  - 检查 `hermes.exe`、`python.exe`、`config_server.py`。
  - 短启动 config server，捕获 stdout/stderr/exit code。
  - 报告写入 `data/.hermes/logs/startup-diagnose.json`，过程日志写入 `data/.hermes/logs/startup-diagnose.log`。
- README 增加 Windows `npm.ps1` 报错说明：可直接使用 `npm.cmd` 或 `.cmd` 批处理入口。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/diagnose-hermes-startup.mjs`
- `scripts/windows-stage-slim.cmd`
- `scripts/windows-diagnose-hermes.cmd`
- `package.json`
- `README.md`
- `docs/codex-handoff/2026-06-23-hermes-launcher-disk-logs.md`

## 关键决策
- 不再只依赖前端 Hermes 日志事件，因为前端没订阅、窗口未打开或 Hermes 子进程瞬时退出时会丢排障证据。
- `launcher.log` 使用小体量同步 append，目的是保证启动失败现场可靠落盘；这只覆盖关键启动事件，不把长任务输出全部同步写入主线程。
- Windows PowerShell 执行策略不是项目脚本错误，推荐使用 `npm.cmd` 或仓库 `.cmd` 入口，而不是要求用户全局修改系统策略。

## 待继续
1. 在 Windows U 盘实机同时替换新的 `win-unpacked/` 和 `runtime/`，启动后测试 Hermes：
   - 成功时应看到 Agent API ready。
   - 失败时应在 UI 日志和 `data/.hermes/logs/launcher.log` 中看到命令、stderr 或 exit code。
2. 如果 Hermes 仍启动失败，立即运行：
   - `scripts\windows-diagnose-hermes.cmd`
   - 收集 `data\.hermes\logs\launcher.log`
   - 收集 `data\.hermes\logs\startup-diagnose.json`
   - 收集 `data\.hermes\logs\startup-diagnose.log`
3. Windows 上用 `scripts\windows-stage-slim.cmd` 重新生成 shell，可同时修复 exe 图标资源 patch；Mac 无 Wine 时生成的 exe 图标仍可能是默认 Electron 图标。
4. 若诊断显示 venv 或 DLL 问题，继续精简/修复 Hermes runtime；若显示 API/model 配置问题，转为友好错误映射。

## 验证结果
- `node --check scripts/diagnose-hermes-startup.mjs`：通过。
- `node --check src/openclaw-shell-app/dist/main/index.js`：通过。
- `npm run build`：通过。
- `npm run stage:windows-portable:slim`：通过，生成 `release/windows-shell-e2e-slim-staging/`。
- `AGENT_HUB_ROOT=release/windows-shell-e2e-slim-staging npm run audit:portable`：通过，`windowsPortableUsable: true`，`zeroInstallWindowsMostlyReady: true`，`windows-x64.missingRequired: []`。
- `AGENT_HUB_ROOT=release/windows-shell-e2e-slim-staging npm run verify:openclaw`：通过，`runtimeIntegrity.ok: true`，`cliSmoke.ok: true`。
- `AGENT_HUB_ROOT=release/windows-shell-e2e-slim-staging npm run verify:hermes`：文件检查通过；版本命令在 Mac 上无法执行 Windows `.exe`，`versions.*.ok: false` 为预期限制，需 Windows 实机验证。

## 如果需要下一台 Codex 接手，提示词
请在 `/Users/ly/data/codex/u-agent` 继续。当前目标仍是稳定 Windows U 盘端到端测试。刚修复 Hermes 启动失败但无日志的问题：主进程现在会把 Hermes 启动请求、stdout/stderr、spawn error、exit code、端口等待失败写入 `data/.hermes/logs/launcher.log`；新增 `npm run diagnose:hermes-startup` 和 `scripts/windows-diagnose-hermes.cmd` 用于 Windows 实机捕获 venv/CLI/config server 启动问题。用户 Windows PowerShell 的 `npm.ps1` 报错不是项目失败，可用 `npm.cmd` 或 `scripts/windows-stage-slim.cmd` 绕过。下一步让用户复制新的 `release/windows-shell-e2e-slim-staging/win-unpacked` 和 `runtime` 到 Windows/U盘实测；如果 Hermes 仍失败，先读 `launcher.log`、`startup-diagnose.json`、`startup-diagnose.log`，不要猜原因。
