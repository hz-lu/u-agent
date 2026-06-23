# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

不再依赖手工拷贝旧版 `win-unpacked/`，改为从当前源码生成新的 Windows Electron 程序壳，并拼出一个完整 Windows 便携测试目录。

## 已完成

- 新增 `npm run package:windows-shell`：
  - 运行当前源码构建。
  - 使用 `@electron/get` 下载 Electron `win32-x64` runtime。
  - 解压生成完整根目录 `win-unpacked/`。
  - 将 `electron.exe` 重命名为 `OpenClawPro.exe`。
  - 写入 `win-unpacked/resources/app/dist` 和 `win-unpacked/resources/app/package.json`。
  - 写入 `win-unpacked/BUILD-MANIFEST.json`。
  - 自动恢复仓库跟踪的 `.gitkeep` 占位文件，避免生成产物污染 Git 删除状态。
- 新增 `npm run stage:windows-portable`：
  - 生成新的 `win-unpacked/`。
  - 生成 Windows 必需 runtime 包和 staging runtime。
  - 拼出完整测试目录 `release/windows-shell-e2e-staging/`。
  - 写入干净 `data/.openclaw/openclaw.json` 与 `data/.hermes/config.yaml`。
  - 复制 `skills/` 与 `extensions/`。
- 将 `@electron/get`、`extract-zip` 显式加入 devDependencies，避免依赖 Electron 的传递依赖。

## 改动文件

- `package.json`
- `package-lock.json`
- `scripts/package-windows-shell.mjs`
- `scripts/stage-windows-portable-test.mjs`
- `docs/codex-handoff/2026-06-23-source-built-windows-shell.md`

## 关键决策

- `win-unpacked/` 仍然是生成产物，不提交 Git。
- 源码仓库只提交生成脚本和 manifest 规则。
- 当前 Windows 壳生成使用 Electron 官方 `win32-x64` zip，不引入 electron-builder 的额外打包配置。
- 完整 Windows 测试目录放在 `release/windows-shell-e2e-staging/`，用于复制到 Windows/U 盘测试，不作为源码提交。

## 待继续

1. 在 Windows 或 U 盘上复制 `release/windows-shell-e2e-staging/` 内容进行真实端到端测试。
2. 双击 `win-unpacked/OpenClawPro.exe`，验证：
   - UI 是否为原 OpenClaw UI。
   - Gateway 启动。
   - 模型配置保存/编辑。
   - OpenClaw 对话。
   - Hermes 状态、日志、启动、对话。
   - 协同对话。
   - skills 目录共用。
3. 若 Windows 真实运行通过，再把 `stage:windows-portable` 输出升级为正式 release zip。

## 验证结果

- `node --check scripts/package-windows-shell.mjs`：通过。
- `node --check scripts/stage-windows-portable-test.mjs`：通过。
- `npm run package:windows-shell`：通过，生成：
  - `win-unpacked/OpenClawPro.exe`
  - Electron version：`35.7.5`
  - platform：`win32`
  - arch：`x64`
  - fileCount：`90`
- `npm run stage:windows-portable`：通过，生成：
  - `release/windows-shell-e2e-staging/win-unpacked/OpenClawPro.exe`
  - `release/windows-shell-e2e-staging/runtime`
  - `release/windows-shell-e2e-staging/data`
- `AGENT_HUB_ROOT=release/windows-shell-e2e-staging npm run audit:portable`：
  - `windowsPortableUsable: true`
  - `zeroInstallWindowsMostlyReady: true`
  - `strictZeroTraceReady: true`
  - `windows-x64.missingRequired: []`
- `AGENT_HUB_ROOT=release/windows-shell-e2e-staging node scripts/verify-openclaw-runtime.mjs`：
  - `runtimeIntegrity.ok: true`
  - `openclawPackageEntry: true`
  - `openclawEntry: true`
- `AGENT_HUB_ROOT=release/windows-shell-e2e-staging node scripts/verify-hermes-runtime.mjs`：
  - `hermesExe: true`
  - `pythonExe: true`
  - `nodeExe: true`
  - `source: true`
  - Windows exe 在 Mac 上无法执行版本命令，版本字段 false 属于预期。

## 如果需要下一台 Codex 接手，提示词

请在 `/Users/ly/data/codex/u-agent` 接手。当前已经新增源码级 Windows 壳生成流程：`npm run package:windows-shell` 会从当前源码生成完整 `win-unpacked/`；`npm run stage:windows-portable` 会生成新壳、新 runtime staging，并拼出 `release/windows-shell-e2e-staging/`。该 staging 已通过 `audit:portable`，Windows 必需项完整。下一步请让用户把 `release/windows-shell-e2e-staging/` 内容复制到 Windows/U 盘，双击 `win-unpacked/OpenClawPro.exe` 做真实端到端测试；若通过，再把 staging 流程升级为正式 release zip。
