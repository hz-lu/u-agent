# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

修复 Windows 端使用 `release/release_runtime` 后 OpenClaw Gateway 启动失败的问题，错误为 `Cannot find package '@clack/prompts' imported from .../runtime/node_modules/openclaw/dist/progress-*.js`。

## 已完成

- 定位原因：
  - `release/release_runtime/node_modules/openclaw/node_modules/@clack` 是空目录。
  - `runtime/openclaw.zip` 内实际包含完整 `@clack/core` 和 `@clack/prompts`。
  - 旧 runtime 展开目录不完整，但离线修复包是完整的。
- 修改 Windows runtime 打包脚本：
  - 生成 runtime staging 后，从 `runtime/openclaw.zip` 临时解压出完整 `node_modules/openclaw`。
  - 用 zip 内完整 OpenClaw 包覆盖 staging 的展开包。
  - slim profile 覆盖后继续执行瘦身规则。
  - 该修复发生在构建/打包阶段，不在应用启动阶段做大体积解压。
- 增强 OpenClaw runtime 校验：
  - 扫描 `dist` 中真实静态包导入，输出 `missingPackageImports` 诊断。
  - 增加 `openclaw gateway run --help` CLI 冒烟测试，用于捕获 `@clack/prompts` 这类 Gateway 启动路径缺包。
  - 可选扩展缺包只作为诊断，不阻断主 Gateway 启动校验。
- 已重新生成本地修复版：
  - `release/OpenClawPro-AgentHub-Windows-Runtime-Slim-Candidate.zip`
  - `release/windows-shell-e2e-slim-staging/`
  - `release/release_runtime/`

## 改动文件

- `scripts/package-windows-runtime-required.mjs`
- `scripts/verify-openclaw-runtime.mjs`
- `docs/codex-handoff/2026-06-23-openclaw-runtime-dependency-repair.md`

## 关键决策

- 保留离线修复能力：`runtime/openclaw.zip` 不删除。
- 不在 UI 启动路径解压 `openclaw.zip`，避免 Windows U 盘慢盘卡顿。
- `release/release_runtime` 是本地生成产物，不提交 Git；源码脚本负责以后重新生成正确 runtime。
- `@larksuiteoapi/node-sdk`、`matrix-js-sdk`、`@lancedb/lancedb`、`@a2ui/markdown-it` 目前只在可选扩展路径中被静态扫描到，暂不作为 Gateway 主流程阻断项。

## 待继续

1. 用户在 Windows 上重新复制修复后的 `release/release_runtime` 到 U 盘 `runtime/`，或解压新的 `release/OpenClawPro-AgentHub-Windows-Runtime-Slim-Candidate.zip`。
2. Windows 上重启 `win-unpacked/OpenClawPro.exe`。
3. 验证 OpenClaw Gateway 不再报 `@clack/prompts` 缺包。
4. 如果 Hermes 仍显示异常，查看 Hermes 日志中的具体 stderr；当前 Mac 只能确认 Hermes 必需文件存在，不能执行 Windows `hermes.exe/python.exe`。
5. 后续如需要 Feishu/Matrix/LanceDB/A2UI 等可选扩展完整可用，需要补齐对应可选依赖或把这些扩展从 slim 包中明确标记为未启用。

## 验证结果

- `node --check scripts/package-windows-runtime-required.mjs`：通过。
- `node --check scripts/verify-openclaw-runtime.mjs`：通过。
- 旧坏 runtime 验证：
  - `AGENT_HUB_ROOT=release/release-runtime-check-root npm run verify:openclaw`
  - 复现失败：`Cannot find package '@clack/prompts' imported from .../progress-CN3xUiCO.js`
- 新 slim runtime 验证：
  - `npm run package:windows-runtime:slim`：通过。
  - `npm run stage:windows-portable:slim`：通过。
  - `AGENT_HUB_ROOT=release/windows-shell-e2e-slim-staging npm run audit:portable`：
    - `windowsPortableUsable: true`
    - `zeroInstallWindowsMostlyReady: true`
    - `strictZeroTraceReady: true`
    - `windows-x64.missingRequired: []`
  - `AGENT_HUB_ROOT=release/windows-shell-e2e-slim-staging npm run verify:openclaw`：
    - `runtimeIntegrity.ok: true`
    - `cliSmoke.ok: true`
    - `openclawZip: true`
  - `AGENT_HUB_ROOT=release/windows-shell-e2e-slim-staging npm run verify:hermes`：
    - Hermes 必需文件存在。
    - Windows exe 版本检测在 Mac 上不可执行，仍需 Windows 端验证。
- 本地 `/Users/ly/data/codex/u-agent/release/release_runtime` 已替换为修复版，并通过 `verify:openclaw`。

## 如果需要下一台 Codex 接手，提示词

请在 `/Users/ly/data/codex/u-agent` 接手。用户在 Windows 上用旧 `release/release_runtime` 复制到 U 盘后，OpenClaw Gateway 报 `Cannot find package '@clack/prompts' imported from F:\runtime\node_modules\openclaw\dist\progress-*.js`。已修复源码打包脚本：现在会用 `runtime/openclaw.zip` 中完整的 `node_modules/openclaw` 覆盖 staging 展开包，再生成 slim runtime；并增强 `verify-openclaw-runtime` 执行 `openclaw gateway run --help` 冒烟测试。新的本地 `release/release_runtime`、`release/windows-shell-e2e-slim-staging`、`OpenClawPro-AgentHub-Windows-Runtime-Slim-Candidate.zip` 已重新生成。下一步让用户在 Windows 重新复制新的 runtime 后验证；若 Hermes 仍异常，收集 Hermes 日志 stderr 继续定位。
