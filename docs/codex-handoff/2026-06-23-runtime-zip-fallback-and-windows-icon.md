# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

修复 fresh clone 后 `npm run stage:windows-portable` 因缺少 `src/runtime` 失败的问题，并修正源码生成 Windows 程序壳时 exe 图标仍是 Electron 默认图标的问题。

## 已完成

- `scripts/package-windows-runtime-required.mjs` 支持 runtime fallback：
  - 优先使用 `RUNTIME_SOURCE_ROOT` 或 `src/runtime`。
  - 如果没有 `src/runtime`，检查根目录 `runtime/` 是否已经是完整展开 runtime。
  - 如果仍不完整，自动查找并解压：
    - `OpenClawPro-AgentHub-Windows-Runtime-Required.zip`
    - `release/OpenClawPro-AgentHub-Windows-Runtime-Required.zip`
    - 或 `RUNTIME_ZIP=/path/to/zip`
  - 如果三者都没有，会明确提示只缺 portable runtime，而不是误导为程序壳生成失败。
- `scripts/stage-windows-portable-test.mjs` 的 runtime 缺失提示更明确。
- `scripts/package-windows-shell.mjs` 增加 Windows exe 资源图标 patch：
  - 使用 `dist/assets/icon.ico` 作为原 OpenClaw 图标。
  - 将 icon 复制到 `win-unpacked/resources/app/icon.ico`。
  - 在 Windows 或安装 Wine 的环境中，使用 `rcedit` 写入 `OpenClawPro.exe` 资源图标和版本字符串。
  - 在 macOS 且无 Wine 时，不再静默生成默认图标 exe，会在输出 manifest 中标记 `iconPatched: false` 并提示需要在 Windows 上重新运行。
- 新增 devDependency：
  - `rcedit`

## 改动文件

- `package.json`
- `package-lock.json`
- `scripts/package-windows-runtime-required.mjs`
- `scripts/package-windows-shell.mjs`
- `scripts/stage-windows-portable-test.mjs`
- `docs/codex-handoff/2026-06-23-runtime-zip-fallback-and-windows-icon.md`

## 关键决策

- runtime 二进制仍不进 Git；fresh clone 后必须提供 runtime zip 或完整 runtime 目录。
- Mac 上可以生成 Windows 壳用于结构测试，但没有 Wine 时不能修改 Windows exe 资源图标。
- 最终 Windows 测试/发布前，应在 Windows 上运行 `npm run package:windows-shell` 或 `npm run stage:windows-portable`，这样 `OpenClawPro.exe` 会写入原 OpenClaw 图标。

## 待继续

1. 用户在当前 fresh clone 目录中放回 `OpenClawPro-AgentHub-Windows-Runtime-Required.zip`。
2. 运行：
   - `npm run stage:windows-portable`
3. 若在 macOS 上运行，生成结果可用于结构检查，但 `BUILD-MANIFEST.json` 会显示 `iconPatched: false`。
4. 若要看到正确 exe logo，请在 Windows 上运行同一命令，或在 Mac 安装 Wine 后再运行。
5. 在 Windows 上继续端到端测试：
   - `release/windows-shell-e2e-staging/win-unpacked/OpenClawPro.exe`

## 验证结果

- `node --check scripts/package-windows-runtime-required.mjs`：通过。
- `node --check scripts/package-windows-shell.mjs`：通过。
- `RUNTIME_SOURCE_ROOT=/no-such-dir npm run package:windows-runtime`：
  - 成功从 `release/OpenClawPro-AgentHub-Windows-Runtime-Required.zip` 解压 runtime staging。
  - `extractedFromZip: true`
  - Windows required runtime paths 全部检查通过。
- `RUNTIME_SOURCE_ROOT=/no-such-dir npm run stage:windows-portable`：通过。
- `AGENT_HUB_ROOT=release/windows-shell-e2e-staging npm run audit:portable`：
  - `windowsPortableUsable: true`
  - `zeroInstallWindowsMostlyReady: true`
  - `strictZeroTraceReady: true`
  - `windows-x64.missingRequired: []`
- `AGENT_HUB_ROOT=release/windows-shell-e2e-staging node scripts/verify-openclaw-runtime.mjs`：
  - `runtimeIntegrity.ok: true`
- `AGENT_HUB_ROOT=release/windows-shell-e2e-staging node scripts/verify-hermes-runtime.mjs`：
  - Hermes 必需文件全部存在。
- macOS 无 Wine 环境下 `BUILD-MANIFEST.json`：
  - `icon.iconPatched: false`
  - 原因：`rcedit requires Windows or Wine`

## 如果需要下一台 Codex 接手，提示词

请在 `/Users/ly/data/codex/u-agent` 接手。当前已修复 fresh clone 后 `stage:windows-portable` 缺 `src/runtime` 的问题：只要根目录或 `release/` 下有 `OpenClawPro-AgentHub-Windows-Runtime-Required.zip`，脚本会自动解压生成 runtime staging。Windows 程序壳也新增了 rcedit 图标 patch：在 Windows 上运行 `npm run package:windows-shell` 或 `npm run stage:windows-portable` 会把 `dist/assets/icon.ico` 写入 `OpenClawPro.exe`；macOS 无 Wine 时只能生成默认 exe 图标，并在 manifest 标记 `iconPatched:false`。下一步请用户在 Windows 上重新运行 staging 并检查 exe 图标、启动 Gateway、Hermes 对话和协同模式。
