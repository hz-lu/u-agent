# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
在最新 `origin/main` 基础上创建 Mac 端开发分支，新增 macOS 程序壳打包与便携测试目录生成能力，并让现有 OpenClaw/Hermes 主进程路径逻辑支持 macOS 平台 runtime 布局。

## 已完成
- 已从远端拉取最新代码，基于 `origin/main` 创建分支 `feat/macos-portable-app`。
- 新增 `npm run package:macos-shell`：
  - 从本机 `node_modules/electron/dist/Electron.app` 生成 `macos/OpenClawPro.app`。
  - 写入 `Contents/Resources/app/dist` 和 app `package.json`。
  - 修改 `Info.plist` 的应用名、可执行名和 Bundle ID。
  - 保留 Electron framework 内部相对 symlink，避免 macOS bundle 脱离源码目录后资源缺失。
- 新增 `npm run stage:macos-portable`：
  - 生成 `release/macos-portable-staging/`。
  - 放入 `macos/OpenClawPro.app`、`OpenClawPro.command`、`runtime/`、`skills/`、`extensions/`、初始化 `data/`。
  - 复制微信插件到 `data/.openclaw/extensions/openclaw-weixin`。
  - 生成 `README-MACOS-PORTABLE.md` 和 `RELEASE-MANIFEST.json`，明确 runtime 缺失项。
- 主进程运行时路径已支持：
  - macOS `.app` 中向上发现便携根目录。
  - 非 Windows 优先使用 `runtime/macos-arm64` 或 `runtime/macos-x64`。
  - OpenClaw CLI 使用 `runtime/<platform>/openclaw/bin/openclaw`。
  - OpenClaw Node 使用 `runtime/<platform>/node/bin/node`。
  - Hermes 使用 `runtime/<platform>/HermesPortable/venv/bin/hermes` 与 `venv/bin/python`。
  - 微信/飞书插件 CLI 环境将平台 Node bin 加入 PATH。
  - Gateway `NODE_PATH` 支持平台 OpenClaw 包布局 `runtime/<platform>/openclaw/node_modules`。
- `.gitignore` 已排除本地生成的 `macos/` 目录。

## 改动文件
- `.gitignore`
- `package.json`
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/package-macos-shell.mjs`
- `scripts/stage-macos-portable-test.mjs`
- `docs/codex-handoff/2026-06-30-macos-portable-shell.md`

## 关键决策
- 当前 macOS 阶段先交付可运行的 OpenClawPro `.app` 壳和便携目录生成能力，不把大体积 macOS runtime 二进制提交进 Git。
- runtime 仍遵守 `runtime/PORTABLE-RUNTIME-MANIFEST.json` 契约；macOS 完整端到端测试需要补齐 `runtime/macos-arm64` 或 `runtime/macos-x64` 的 Node、OpenClaw CLI、Hermes venv。
- 程序壳生成与 release/staging 目录均属于本地产物，不提交 `macos/`、`release/`、`runtime` 大文件、`data` 用户数据。
- 保留 Windows 旧布局兼容：Windows 仍使用根 `runtime/openclaw.cmd`、`runtime/node.exe`、`runtime/HermesPortable`。

## 待继续
- 补齐 macOS arm64 runtime：
  - `runtime/macos-arm64/node/bin/node`
  - `runtime/macos-arm64/openclaw/bin/openclaw`
  - `runtime/macos-arm64/openclaw/node_modules/openclaw/dist`
  - `runtime/macos-arm64/HermesPortable/venv/bin/hermes`
  - `runtime/macos-arm64/HermesPortable/venv/bin/python`
- 补齐后重新运行 `npm run stage:macos-portable`，再在 Mac 上测试 OpenClaw Gateway 启动、模型配置、OpenClaw 对话、Hermes 对话、协同对话、技能同步和微信/飞书插件入口。
- 后续可继续做 macOS x64 runtime、Linux runtime 与 Universal zip。

## 验证结果
- `node --check src/openclaw-shell-app/dist/main/index.js`：通过。
- `node --check scripts/package-macos-shell.mjs`：通过。
- `node --check scripts/stage-macos-portable-test.mjs`：通过。
- `npm run stage:macos-portable`：通过，生成 `release/macos-portable-staging/`。
- macOS `.app` smoke test：
  - 命令使用 `AGENT_HUB_ROOT=/Users/ly/data/codex/u-agent/release/macos-portable-staging OPENCLAW_DEV_SKIP_LICENSE=1` 启动 `release/macos-portable-staging/macos/OpenClawPro.app/Contents/MacOS/OpenClawPro`。
  - 主窗口成功加载 UI，日志出现 `Window ready from renderer, closing splash and showing` 与 `Page finished loading`。
  - 已修复 Electron framework symlink 复制问题，最终 smoke test 不再出现 `icudtl.dat not found in bundle`、GPU/Network service 资源崩溃日志。
- `npm run audit:portable`：通过执行；当前仍报告 macOS/Windows/Linux runtime 二进制缺失，这是 Git 仓库不提交大体积 runtime 的预期状态。

## 如果需要下一台 Codex 接手，提示词
请在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支继续开发 Mac 端便携版。当前已新增 `npm run package:macos-shell` 和 `npm run stage:macos-portable`，并修复主进程对 macOS `.app` 便携根目录、`runtime/macos-arm64`、Hermes venv、OpenClaw CLI/Node 的路径识别。`release/macos-portable-staging/` 已能启动 UI 壳，但完整 OpenClaw/Hermes 端到端测试仍需补齐 macOS runtime 二进制。继续时不要提交 `macos/`、`release/`、`runtime` 大文件或 `data` 用户态内容。
