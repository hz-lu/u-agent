# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

从用户拷贝到 `src/runtime/` 的完整运行时中筛选 Windows 端到端测试真正需要的 runtime 环境，并打成一个可直接解压到项目根目录的包，避免复制整个 1.7G `src/runtime`。

## 已完成

- 检查 `src/runtime/`，确认 Windows runtime 主体已齐全。
- 仅筛选以下内容进入环境包：
  - `runtime/node.exe`
  - `runtime/openclaw.cmd`
  - `runtime/openclaw.zip`
  - `runtime/node_modules/openclaw/`
  - `runtime/HermesPortable/`
  - `runtime/PORTABLE-RUNTIME-MANIFEST.json`
- 排除以下不必要内容：
  - `src/runtime/.extracted`
  - `src/runtime/HermesPortable-Windows-x64.zip`
  - `src/runtime/HermesPortable-backup-srcsync-*`
  - `src/runtime/python3`
  - `src/runtime/python3.bak-*`
  - `src/runtime/node_modules/npm`
  - `src/runtime/node_modules/corepack`
  - Hermes 用户数据、缓存、日志、临时目录
- 生成环境包：
  - `release/OpenClawPro-AgentHub-Windows-Runtime-Required.zip`
  - 大小约 372MB
  - SHA256: `d7aca3658929ba7d60a061a575f09e9f23ca1c48bc5746d1df85c3743c4f68e4`
- 修正 OpenClaw runtime 引用检查误判：
  - 以前把 bundle 中普通字符串如 `"main": "./dist-cjs/index.js"` 误认为缺文件。
  - 现在只检查真正的 `import` / `export` / `import()` 和 HTML `src` / `href` 静态引用。

## 改动文件

- `scripts/verify-openclaw-runtime.mjs`
- `scripts/build-windows-release.mjs`
- `docs/codex-handoff/2026-06-23-windows-runtime-required-package.md`

## 关键决策

- runtime 环境包只包含运行程序真正需要的 Windows runtime，不包含 Windows 程序壳 `win-unpacked/`。
- `release/*.zip` 是本地生成产物，不提交 Git。
- Hermes 运行时本体可以进入 `runtime/HermesPortable/`，但用户数据、日志、缓存必须继续写入 `data/.hermes/`。

## 待继续

1. 在 Windows fresh clone 后，把 `release/OpenClawPro-AgentHub-Windows-Runtime-Required.zip` 解压到项目根目录。
2. 补 `win-unpacked/` 程序壳，并用最新 `dist/` 覆盖 `win-unpacked/resources/app/dist/`。
3. 在 Windows 上运行：
   - `npm run audit:portable`
   - `node scripts\verify-openclaw-runtime.mjs`
   - `npm run verify:hermes`
   - `node scripts\build-windows-release.mjs`
4. 生成完整 release zip 后，解压到干净 U 盘进行端到端测试。

## 验证结果

- `AGENT_HUB_ROOT=release/runtime-package-staging npm run audit:portable`：Windows runtime 项全部为 true，仅缺 `win-unpacked` 程序壳。
- `AGENT_HUB_ROOT=release/runtime-package-staging node scripts/verify-openclaw-runtime.mjs`：`runtimeIntegrity.ok: true`。
- `node --check scripts/verify-openclaw-runtime.mjs`：通过。
- `node --check scripts/build-windows-release.mjs`：通过。

## 如果需要下一台 Codex 接手，提示词

请在 `/Users/ly/data/codex/u-agent` 接手。Windows runtime 环境包已在 `release/OpenClawPro-AgentHub-Windows-Runtime-Required.zip`，解压后会得到 `runtime/`。这个包只补 runtime，不补 `win-unpacked/`。下一步在 Windows 上补程序壳、覆盖最新 `dist/`，然后运行 portable audit 和 release build。
