# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

保留 OpenClaw 离线修复能力的同时，新增 Windows runtime 瘦身候选包生成能力，减少 U 盘复制和解压时间，并让完整 Windows 测试目录可以从源码脚本重新生成。

## 已完成

- 新增 `WINDOWS_RUNTIME_PROFILE=slim` runtime 打包 profile。
- 新增 npm 命令：
  - `npm run package:windows-runtime:slim`
  - `npm run stage:windows-portable:slim`
- slim profile 继续保留关键运行文件：
  - `runtime/openclaw.zip`
  - `runtime/openclaw.cmd`
  - `runtime/node.exe`
  - `runtime/node_modules/openclaw/`
  - `runtime/HermesPortable/venv/`
  - `runtime/HermesPortable/node/`
  - `runtime/HermesPortable/hermes-agent/pyproject.toml`
- slim profile 移除当前判断为非 Windows 运行必需或重复的内容：
  - Hermes 重复 CPython 目录 `python/cpython-3.12-windows-x86_64-none`
  - Hermes 源码树中的 `apps`、`build`、`docs`、`nix`、`packaging`、`ui-tui`、`web`、`website`
  - Hermes 源码树中的重复 `skills`、`optional-skills`
  - 已知备份文件 `lib/config_server.py.bak-frame-20260617082246`
  - OpenClaw 依赖包中的测试、文档、示例、benchmark、`.map`、Markdown 文件
- `stage:windows-portable:slim` 会生成完整测试目录：
  - `release/windows-shell-e2e-slim-staging/`
  - 包含 `win-unpacked/`、`runtime/`、`data/`、`skills/`、`extensions/`

## 改动文件

- `package.json`
- `scripts/package-windows-runtime-required.mjs`
- `scripts/stage-windows-portable-test.mjs`
- `docs/codex-handoff/2026-06-23-windows-runtime-slim-candidate.md`

## 关键决策

- slim 是候选 profile，不替代默认 `required` profile；默认命令仍生成完整 required runtime。
- 离线修复能力必须保留，所以 `runtime/openclaw.zip` 明确保留在 slim 包中。
- 用户数据、缓存、日志、临时目录不进入 runtime 包；运行期仍写入 `data/.openclaw` 和 `data/.hermes`。
- runtime zip 和 staging 目录仍是本地生成产物，不提交 Git。

## 待继续

1. 在 Windows 上运行 `npm run stage:windows-portable:slim`，确认 exe 图标会通过 rcedit patch 为原 OpenClaw 图标。
2. 在 Windows U 盘上运行 `release/windows-shell-e2e-slim-staging/win-unpacked/OpenClawPro.exe`。
3. 端到端验证 OpenClaw 启动、模型配置、OpenClaw 对话、Hermes 对话、协同对话、skills 同步和日志。
4. 若 Windows 端通过，再考虑把 slim profile 纳入正式 release 选项；若发现缺依赖，回补到 slim 保留名单。

## 验证结果

- `node --check scripts/package-windows-runtime-required.mjs`：通过。
- `node --check scripts/stage-windows-portable-test.mjs`：通过。
- `npm run package:windows-runtime:slim`：通过。
  - 生成 `release/OpenClawPro-AgentHub-Windows-Runtime-Slim-Candidate.zip`
  - 大小约 `299.8MB`
  - 文件数 `38614`
  - `runtime/openclaw.zip` 保留，约 `78MB`
- `npm run stage:windows-portable:slim`：通过。
  - 生成 `release/windows-shell-e2e-slim-staging/`
  - 完整目录约 `1.1GB`
  - runtime 约 `854MB`
- `AGENT_HUB_ROOT=release/windows-shell-e2e-slim-staging npm run audit:portable`：
  - `windowsPortableUsable: true`
  - `zeroInstallWindowsMostlyReady: true`
  - `strictZeroTraceReady: true`
  - `windows-x64.missingRequired: []`
- `AGENT_HUB_ROOT=release/windows-shell-e2e-slim-staging npm run verify:openclaw`：
  - `runtimeIntegrity.ok: true`
  - `openClawZip: true`
- `AGENT_HUB_ROOT=release/windows-shell-e2e-slim-staging npm run verify:hermes`：
  - Hermes 必需文件全部存在。
  - Windows exe 版本命令在 Mac 上不可执行，`versions.*.ok: false` 是预期限制。
- 检查 `runtime/HermesPortable/data`、`_home`、`cache`、`logs`、`tmp`：均不存在于 slim staging。

## 如果需要下一台 Codex 接手，提示词

请在 `/Users/ly/data/codex/u-agent` 接手。当前新增了 Windows slim runtime 候选 profile：`npm run package:windows-runtime:slim` 会生成 `release/OpenClawPro-AgentHub-Windows-Runtime-Slim-Candidate.zip`，`npm run stage:windows-portable:slim` 会生成完整测试目录 `release/windows-shell-e2e-slim-staging/`。slim 包保留 `runtime/openclaw.zip` 离线修复能力，不包含 Hermes 用户数据/cache/logs。下一步必须在 Windows U 盘环境实际运行 slim staging，验证 OpenClaw、Hermes、协同对话、skills 和模型配置完整可用；通过后再把 slim profile 纳入正式 release 流程。
