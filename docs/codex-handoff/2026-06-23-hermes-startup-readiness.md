# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

修复 Hermes 启动时 UI 提示“已启动”，但实际端口/API 未就绪且没有日志闭环的问题。

## 已完成

- 修改当前实际进包的 OpenClaw 壳源码：
  - `src/openclaw-shell-app/dist/main/index.js`
  - `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- Hermes 首页启动逻辑改为真实就绪闭环：
  - 先启动配置服务并等待 `127.0.0.1:17520`。
  - 配置服务 ready 后自动启动 Agent API 并等待 `127.0.0.1:8642`。
  - 如果端口未就绪，状态置为 `error` 并写入 Hermes 日志。
  - 如果子进程提前退出，等待端口会提前失败，不再假装 `running`。
- UI toast 改为根据返回状态判断：
  - `apiServerReady` 时显示 `Hermes 已启动，Agent API 已就绪`。
  - 只有 config/dashboard ready 时显示部分启动并提示看日志。
  - 三个端口都未 ready 时显示失败和 `lastError`。
- `getStatus()` 不再因为有进程句柄就直接标记 `running`：
  - 至少一个端口 ready 才是 `running`。
  - 有进程但端口未 ready 时是 `starting`。

## 改动文件

- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `dist/assets/assets/main-DIeui7ZO.js`
- `docs/codex-handoff/2026-06-23-hermes-startup-readiness.md`

## 关键决策

- 这次问题属于程序壳主进程/UI 状态闭环问题，不是单纯 runtime 文件问题。
- Windows 端必须替换新生成的 `win-unpacked/`，只替换 `runtime/` 无法修复“提示启动成功但实际未启动”。
- Hermes 启动成功的标准从“spawn 调用成功”改为“端口/API 真实 ready”。

## 待继续

1. 用户把新的 `release/windows-shell-e2e-slim-staging/win-unpacked` 和 `runtime` 一起复制到 Windows U 盘测试。
2. Windows 上启动后点击 Hermes：
   - 若 API 成功，应看到 `Hermes 已启动，Agent API 已就绪`。
   - 若失败，应看到明确错误 toast，并在 Hermes 日志 tab 里看到 `[config]` 或 `[api-server]` 错误。
3. 如果 Hermes 仍没有日志，需要继续检查 Windows 上 `hermes.exe` 是否瞬时退出、是否被安全软件拦截、或者 `venv` 路径是否不可执行。

## 验证结果

- `node --check src/openclaw-shell-app/dist/main/index.js`：通过。
- `node --check src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`：通过。
- `npm run build`：通过。
- `npm run stage:windows-portable:slim`：通过。
- `AGENT_HUB_ROOT=release/windows-shell-e2e-slim-staging npm run audit:portable`：
  - `windowsPortableUsable: true`
  - `zeroInstallWindowsMostlyReady: true`
  - `strictZeroTraceReady: true`
  - `windows-x64.missingRequired: []`
- `AGENT_HUB_ROOT=release/windows-shell-e2e-slim-staging npm run verify:openclaw`：
  - `runtimeIntegrity.ok: true`
  - `cliSmoke.ok: true`
- `AGENT_HUB_ROOT=release/windows-shell-e2e-slim-staging npm run verify:hermes`：
  - Hermes 必需文件存在。
  - Windows exe 版本检测仍需 Windows 端验证。
- 已确认新生成的 `release/windows-shell-e2e-slim-staging/win-unpacked/resources/app/dist/main/index.cjs` 包含端口就绪判断和新 toast 文案。

## 如果需要下一台 Codex 接手，提示词

请在 `/Users/ly/data/codex/u-agent` 接手。用户反馈 Hermes 点击启动时 UI 提示启动成功，但实际没有启动且没有日志。已修复当前实际进包的 OpenClaw 壳源码：Hermes 启动现在必须等待 config 端口 `17520` 和 Agent API 端口 `8642`，失败时写 Hermes 日志并返回 error；前端 toast 按 `apiServerReady/configReady/dashboardReady/lastError` 显示，不再无条件提示成功。已重新生成 `release/windows-shell-e2e-slim-staging/`，下一步让用户在 Windows 上同时替换新的 `win-unpacked/` 和 `runtime/` 后测试；若 Hermes 仍失败，收集 Hermes 日志 tab 和 `data/.hermes/logs` 继续定位。
