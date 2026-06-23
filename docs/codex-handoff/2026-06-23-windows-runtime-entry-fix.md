# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

修复 Windows 端测试截图中 OpenClaw Gateway 与 Hermes 同时启动失败的问题，并重新生成只包含必需 runtime 的 Windows 测试包。

## 已完成

- 根据 Windows 截图定位 OpenClaw Gateway 启动失败原因：
  - `runtime/openclaw.cmd` 固定执行 `runtime/node_modules/openclaw/openclaw.mjs`。
  - Windows 端实际缺少 `F:\u-agent\runtime\node_modules\openclaw\openclaw.mjs`，所以 Gateway 必然 `MODULE_NOT_FOUND`。
- 明确 Hermes CLI 卡片缺失判断条件：
  - `runtime/HermesPortable/venv/Scripts/hermes.exe`
  - `runtime/HermesPortable/hermes-agent/pyproject.toml`
  - 两者都必须存在，Hermes 才会显示 CLI/source ready。
- 更新 `runtime/PORTABLE-RUNTIME-MANIFEST.json`，把以下入口列为 Windows 必需项：
  - `runtime/node_modules/openclaw/openclaw.mjs`
  - `runtime/node_modules/openclaw/package.json`
  - `runtime/HermesPortable/hermes-agent/pyproject.toml`
- 增强 portable audit：
  - 单独检查 OpenClaw package entry/package.json/dist。
  - 单独检查 Hermes Windows source。
  - `windowsPortableUsable` 与 `zeroInstallWindowsMostlyReady` 纳入这些真实启动条件。
- 增强 runtime 校验：
  - `scripts/verify-openclaw-runtime.mjs` 缺 `openclaw.mjs` 时返回非 0。
  - `scripts/verify-hermes-runtime.mjs` 缺 Hermes 必需文件时返回非 0。
- 新增 `scripts/package-windows-runtime-required.mjs` 与 `npm run package:windows-runtime`：
  - 从 `src/runtime/` 生成 `release/OpenClawPro-AgentHub-Windows-Runtime-Required.zip`。
  - 只抽取 Windows runtime 必需内容。
  - 排除 Hermes 用户数据、缓存、日志、临时目录、测试目录和 benchmark。
  - 使用压缩 zip，避免无压缩包过大。
- 已重新生成 runtime 包：
  - `release/OpenClawPro-AgentHub-Windows-Runtime-Required.zip`
  - 大小：368.2MB
  - 文件数：47912
  - SHA256：`6fd20e7042fb93a7d0ee2e308ad8d5271d982fcaf6dcda85fec123c8ece61463`

## 改动文件

- `package.json`
- `runtime/PORTABLE-RUNTIME-MANIFEST.json`
- `scripts/audit-portable-release.mjs`
- `scripts/package-windows-runtime-required.mjs`
- `scripts/verify-hermes-runtime.mjs`
- `scripts/verify-openclaw-runtime.mjs`
- `docs/codex-handoff/2026-06-23-windows-runtime-entry-fix.md`

## 关键决策

- Windows 截图中的 Gateway 失败不是 UI/模型/端口问题，而是 runtime 缺 OpenClaw CLI 入口文件。
- runtime 包仍然不提交 Git，只提交生成脚本和 manifest 规则。
- Hermes runtime 本体可以放入 `runtime/HermesPortable/`；用户数据、记忆、缓存、日志仍必须进入 `data/.hermes/`。
- `release/OpenClawPro-AgentHub-Windows-Runtime-Required.zip` 只补 runtime，不包含 `win-unpacked/` 程序壳。

## 待继续

1. 在 Windows 端删除旧的 `runtime/`，重新解压新的 `OpenClawPro-AgentHub-Windows-Runtime-Required.zip` 到项目根目录。
2. 确认 Windows 端存在：
   - `runtime\node_modules\openclaw\openclaw.mjs`
   - `runtime\HermesPortable\hermes-agent\pyproject.toml`
3. 继续补齐或复用 `win-unpacked/` 程序壳，并用最新 `dist/` 覆盖 `win-unpacked\resources\app\dist\`。
4. 在 Windows 上运行：
   - `npm run audit:portable`
   - `node scripts\verify-openclaw-runtime.mjs`
   - `npm run verify:hermes`
5. 再启动桌面程序，验证 Gateway、Hermes、OpenClaw 会话、Hermes 会话、协同会话。

## 验证结果

- `npm run package:windows-runtime`：通过，生成 368.2MB runtime 包。
- `AGENT_HUB_ROOT=release/windows-runtime-required-staging npm run audit:portable`：
  - OpenClaw runtime 必需项全部为 true。
  - Hermes Windows runtime/source 必需项全部为 true。
  - 仍缺 `win-unpacked` 和初始化数据模板，符合 runtime-only staging 预期。
- `AGENT_HUB_ROOT=release/windows-runtime-required-staging node scripts/verify-openclaw-runtime.mjs`：
  - `runtimeIntegrity.ok: true`
  - `openclawPackageEntry: true`
  - `openclawEntry: true`
- `AGENT_HUB_ROOT=release/windows-runtime-required-staging node scripts/verify-hermes-runtime.mjs`：
  - `hermesExe: true`
  - `pythonExe: true`
  - `nodeExe: true`
  - `source: true`
  - 版本命令在 Mac 上不能执行 Windows exe，符合预期。
- `unzip -l release/OpenClawPro-AgentHub-Windows-Runtime-Required.zip` 确认包含：
  - `runtime/node_modules/openclaw/openclaw.mjs`
  - `runtime/node_modules/openclaw/package.json`
  - `runtime/node_modules/openclaw/dist/entry.js`
  - `runtime/HermesPortable/hermes-agent/pyproject.toml`
  - `runtime/HermesPortable/venv/Scripts/hermes.exe`
  - `runtime/HermesPortable/venv/Scripts/python.exe`
  - `runtime/HermesPortable/node/node.exe`
- `node --check` 关键脚本：通过。
- `npm run build`：通过。

## 如果需要下一台 Codex 接手，提示词

请在 `/Users/ly/data/codex/u-agent` 接手。用户 Windows 截图显示 Gateway 报 `Cannot find module 'F:\u-agent\runtime\node_modules\openclaw\openclaw.mjs'`，Hermes CLI 也显示缺失。本阶段已修复 manifest/audit/verify 规则，并新增 `npm run package:windows-runtime` 从 `src/runtime/` 生成干净 runtime 包。最新包在 `release/OpenClawPro-AgentHub-Windows-Runtime-Required.zip`，SHA256 为 `6fd20e7042fb93a7d0ee2e308ad8d5271d982fcaf6dcda85fec123c8ece61463`。下一步让用户在 Windows 删除旧 `runtime/` 后重新解压此包，再补 `win-unpacked/` 程序壳、覆盖最新 `dist/`，运行 `npm run audit:portable`、`node scripts\verify-openclaw-runtime.mjs`、`npm run verify:hermes` 后继续端到端测试。
