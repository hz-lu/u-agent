# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
补齐本机 macOS arm64 便携 runtime，使 `release/macos-portable-staging` 可以直接做 Mac 端 UI、OpenClaw runtime、Hermes runtime 的基础端到端测试。

## 已完成
- 新增 `npm run build:runtime:macos`，可在 macOS 上重建 `runtime/macos-arm64` 或 `runtime/macos-x64` 的 Node、OpenClaw、Python standalone、Hermes venv、Hermes 配置服务。
- 本机已补齐 `runtime/macos-arm64`：
  - Node.js v24.15.0
  - OpenClaw 2026.6.10
  - Python 3.12.13
  - Hermes Agent v0.17.0
  - `HermesPortable/lib/config_server.py`
- Hermes config server 模板被补丁为优先使用 `HERMES_HOME`，用户配置、缓存、日志继续写入便携根目录 `data/.hermes`，不写回 runtime。
- OpenClaw workspace templates 已纳入 macOS runtime 构建修复流程，避免启动时出现 `AGENTS.md/BOOT.md/...` 缺失。
- 主进程 OpenClaw runtime package root 解析已适配平台化 runtime：非 Windows 使用 `runtime/<platform>/openclaw/node_modules/openclaw`。
- `runtime/PORTABLE-RUNTIME-MANIFEST.json` 已把 Hermes config server 和 OpenClaw templates 列为 Windows/macOS/Linux runtime 必需项。
- `.gitignore` 已收紧 runtime 下第三方 `node_modules` 的忽略规则，避免补齐 runtime 后 Git 误显示包内部 `.gitkeep` 或依赖文件。

## 改动文件
- `.gitignore`
- `package.json`
- `scripts/build-macos-runtime.mjs`
- `runtime/PORTABLE-RUNTIME-MANIFEST.json`
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.cjs`
- `dist/main/index.js`
- `docs/codex-handoff/2026-06-30-macos-runtime-complete.md`

## 关键决策
- runtime 大文件和 venv 不提交 Git，只提交可复现脚本、manifest 和源码路径修复。
- macOS 运行时采用平台化目录 `runtime/macos-arm64` / `runtime/macos-x64`，不复用 Windows 根目录 layout。
- 配置服务可从本地旧 `src/runtime/HermesPortable/lib/config_server.py`、旧 release runtime 或上游 `yuluyangguang1/hermes-portable` 下载模板生成；生成时应用零痕迹路径补丁。
- 继续保留原 OpenClaw UI，不新建替代界面。

## 待继续
- 用户可在 Mac 上直接测试 `release/macos-portable-staging/OpenClawPro.command` 或 `.app`。
- 若要发布给其他 Mac，下一步需要把 `release/macos-portable-staging` 压成分发包，并决定是否同时构建 `macos-x64` runtime。
- 继续做 macOS 端 OpenClaw Gateway 启动、模型配置、AI 会话、Hermes 对话、协同对话、技能同步的人工端到端验证。
- Windows runtime 仍需独立在 Windows/U盘环境验证；本轮没有改 Windows 二进制 runtime。

## 验证结果
- `npm run build:runtime:macos`：通过，manifest required paths 全部命中。
- `npm run stage:macos-portable`：通过，`runtime.ok=true`，缺失清单为空。
- `release/macos-portable-staging/runtime/macos-arm64/node/bin/node --version`：`v24.15.0`。
- `release/macos-portable-staging/runtime/macos-arm64/openclaw/bin/openclaw --version`：`OpenClaw 2026.6.10 (aa69b12)`。
- `release/macos-portable-staging/runtime/macos-arm64/HermesPortable/venv/bin/python --version`：`Python 3.12.13`。
- `release/macos-portable-staging/runtime/macos-arm64/HermesPortable/venv/bin/hermes --version`：`Hermes Agent v0.17.0 (2026.6.19)`。
- Hermes config server smoke：`GET http://127.0.0.1:17520/api/heartbeat` 返回 `{"alive": true}`。
- macOS `.app` smoke：`AGENT_HUB_ROOT=... OPENCLAW_DEV_SKIP_LICENSE=1 .../OpenClawPro` 可加载主界面；修复后不再出现 OpenClaw template missing 日志。
- `npm run build`：通过。
- `node --check scripts/build-macos-runtime.mjs`、`node --check src/openclaw-shell-app/dist/main/index.js`：通过。

## 如果需要下一台 Codex 接手，提示词
请继续在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支开发。先阅读 `docs/codex-handoff/2026-06-30-macos-runtime-complete.md`。当前 Mac arm64 runtime 已可通过 `npm run build:runtime:macos` 补齐，`npm run stage:macos-portable` 可生成 `release/macos-portable-staging`，并已通过基础 UI/OpenClaw/Hermes/config server smoke。下一步优先在 Mac 上人工验证 OpenClaw Gateway、模型配置、OpenClaw 对话、Hermes 对话、协同对话和技能同步；如果要扩展到 Intel Mac，设置 `MACOS_PORTABLE_PLATFORM=macos-x64 npm run build:runtime:macos`。不要提交 runtime 二进制、release、macos、data、node_modules 或 `uclaw/`。
