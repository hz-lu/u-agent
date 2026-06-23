# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
处理 Windows 实机使用新程序壳和 runtime 后仍报 `Cannot find module 'F:\runtime\node_modules\openclaw\openclaw.mjs'`，以及 Hermes 仍缺少可定位日志的问题。

## 已完成
- OpenClaw Gateway 启动前增加 runtime 完整性预检：
  - 检查 `runtime/openclaw.cmd`
  - 检查 `runtime/node.exe`
  - 检查 `runtime/node_modules/openclaw/openclaw.mjs`
  - 检查 `runtime/node_modules/openclaw/dist`
- 如果 runtime 不完整：
  - 不再继续 spawn Gateway。
  - 不再进入反复崩溃/自动重启循环。
  - UI 显示 `OpenClaw 运行时不完整`。
  - `data/.openclaw/logs/gateway-launcher.log` 写入完整诊断，包括：
    - 当前程序根目录
    - 当前 runtime 目录
    - 期望入口文件
    - 缺失项
    - U 盘根目录前 40 项
    - runtime 目录前 40 项
    - 复制层级错误提示
- 新增 `npm run diagnose:windows-layout`：
  - 输出当前目录、盘根目录、多个候选 portable root 是否完整。
  - 检查 `win-unpacked/OpenClawPro.exe`、OpenClaw runtime、Hermes runtime。
  - 给出推荐复制规则：复制 `release/windows-shell-e2e-slim-staging` 目录里面的内容到 U 盘根目录，不要把 `u-agent` 或 staging 目录整体套进去。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/diagnose-windows-layout.mjs`
- `package.json`
- `docs/codex-handoff/2026-06-23-runtime-layout-diagnostics.md`

## 关键决策
- 当前本地 staging 中 `runtime/node_modules/openclaw/openclaw.mjs` 是存在的，Windows 报 `F:\runtime\...` 缺失，更像是 U 盘复制层级错误或复制内容不完整。
- 运行时缺失时不应该让 Gateway 无限重启，因为这只会刷屏并掩盖真实问题。
- 诊断信息必须落盘，避免 UI 里日志滚动后无法排查。

## 待继续
1. 用户 Windows 端 `git pull` 后重新运行：
   - `npm.cmd run stage:windows-portable:slim`
2. 把 `release\windows-shell-e2e-slim-staging\` 里面的内容复制到 U 盘根目录。
   - 正确结构应为 `F:\win-unpacked\OpenClawPro.exe`
   - `F:\runtime\node_modules\openclaw\openclaw.mjs`
   - `F:\runtime\HermesPortable\venv\Scripts\hermes.exe`
   - `F:\data`
   - `F:\skills`
   - `F:\extensions`
3. 如果仍失败，在 Windows 项目目录运行：
   - `npm.cmd run diagnose:windows-layout`
4. 如果程序已启动但失败，收集：
   - `data\.openclaw\logs\gateway-launcher.log`
   - `data\.hermes\logs\launcher.log`
   - `data\.hermes\logs\startup-diagnose.json`

## 验证结果
- `node --check src/openclaw-shell-app/dist/main/index.js`：通过。
- `node --check scripts/diagnose-windows-layout.mjs`：通过。
- `npm run build`：通过。
- `npm run stage:windows-portable:slim`：通过。
- `AGENT_HUB_ROOT=release/windows-shell-e2e-slim-staging npm run audit:portable`：
  - `windowsPortableUsable: true`
  - `zeroInstallWindowsMostlyReady: true`
  - `windows-x64.missingRequired: []`
- `AGENT_HUB_ROOT=release/windows-shell-e2e-slim-staging npm run verify:openclaw`：
  - `runtimeIntegrity.ok: true`
  - `cliSmoke.ok: true`
- `AGENT_HUB_ROOT=release/windows-shell-e2e-slim-staging npm run verify:hermes`：
  - Hermes 必需文件存在。
  - Windows `.exe` 在 Mac 上不能执行，版本检查 false 为预期限制。
- 已确认新生成程序壳 `release/windows-shell-e2e-slim-staging/win-unpacked/resources/app/dist/main/index.cjs` 包含 `gateway-launcher.log` 和 `OpenClaw 运行时不完整` 预检逻辑。

## 如果需要下一台 Codex 接手，提示词
请继续在 `/Users/ly/data/codex/u-agent` 开发。用户 Windows 实机报 `Cannot find module 'F:\runtime\node_modules\openclaw\openclaw.mjs'`。本地 staging 验证该文件存在，因此更可能是 U 盘复制层级错误。本阶段已在 OpenClaw Gateway 启动前加入 runtime 完整性预检，缺失时不再反复重启，而是写入 `data/.openclaw/logs/gateway-launcher.log`；新增 `npm run diagnose:windows-layout` 检查 Windows 目录布局。下一步让用户重新拉取、重新生成 staging，并把 `release/windows-shell-e2e-slim-staging` 里面的内容复制到 U 盘根目录。如果仍失败，先要 `diagnose:windows-layout` 输出和 `gateway-launcher.log`。
