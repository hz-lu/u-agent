# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

在恢复原 OpenClaw UI 后，对当前源码交付状态做全面审计，并把 bug、优化项、Windows 性能瓶颈纳入下一阶段工作队列。

## 已完成

- 确认当前正确 UI 基线已在 `src/openclaw-shell-app/`，构建输出同步到 `dist/`。
- 确认本地 `main` 与 `origin/main` 一致，最新提交为 `17400ec Restore original OpenClaw shell UI`。
- 执行 `npm run audit:openclaw-shell`，24/24 功能标记通过。
- 执行 `npm run typecheck`，通过。
- 执行 `npm run build`，通过。
- 执行 `npm run audit:portable`，确认 GitHub 源码状态尚不能直接作为 Windows U 盘开箱即用包。
- 修正 `scripts/audit-portable-release.mjs` 中 Universal zip 状态硬编码为 false 的问题，改为检查 Universal manifest 与 Universal zip 包。
- 更新 `README.md`，区分“GitHub 源码构建可用”和“正式 release 需要完整 runtime 资产”。

## 改动文件

- `README.md`
- `scripts/audit-portable-release.mjs`
- `docs/codex-handoff/2026-06-22-delivery-audit-next-actions.md`

## 关键决策

- 不再把本地 `src/win-unpacked/`、`runtime/`、`data/`、`node_modules/` 视为源码交付内容。
- GitHub 源码目标是可构建、可审计、可生成 release；Windows U 盘开箱即用必须通过 release 资产闭环完成。
- Portable audit 必须由真实文件和 manifest 判断，不能靠硬编码状态。

## 待继续

1. Windows release/runtime 闭环。
   - 涉及 `scripts/build-windows-release.mjs`
   - 涉及 `scripts/audit-portable-release.mjs`
   - 涉及 `scripts/verify-openclaw-runtime.mjs`
   - 目标：补齐 `win-unpacked/`、`runtime/openclaw.cmd`、`runtime/node.exe`、完整 OpenClaw dist、`runtime/HermesPortable/` 后生成可复测 zip。

2. Runtime manifest 与完整性检查。
   - 建议新增或扩展 release manifest。
   - 检查 OpenClaw dist 引用完整性、Hermes Python/Node/CLI、launcher、data 初始化模板。

3. 修复当前确认 bug。
   - `README.md` 曾把 release 目标写成当前 GitHub 已内置能力，已先修正描述。
   - `scripts/audit-portable-release.mjs` 曾硬编码 `universalZipReady: false`，已改为真实检查。
   - 后续仍需让 Universal manifest 记录三平台 runtime 和 launcher 文件清单。

4. Windows 性能瓶颈专项。
   - `src/openclaw-shell-app/dist/main/index.js` 仍包含多处 `execSync`、`spawnSync`、同步读写、运行期解压、`taskkill`、`netstat`。
   - 需要把启动路径上的大体积解压和慢 I/O 移出主进程，改为 release 预置 runtime + 启动前快速校验。
   - 环境检查、Hermes 技能扫描、日志读取要保持显式触发或后台异步，避免 UI 自动刷新卡死。

5. 源码可维护性。
   - 当前正确 UI 主要在 `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`，属于构建后 bundle。
   - 后续应逐步拆回 Vue/TS 源码模块，避免继续在 bundle 上堆叠补丁。

6. Windows U 盘端到端测试。
   - 测试启动、授权、模型配置、OpenClaw 对话、Hermes 对话、协同对话、技能同步、微信扫码、日志、环境检查。

## 验证结果

- `npm run audit:openclaw-shell`：通过，24/24。
- `npm run typecheck`：通过。
- `npm run build`：通过。
- `npm run audit:portable`：当前仍显示 Windows portable 不可直接使用，因为当前源码工作区不内置 release runtime 资产。

## 如果需要下一台 Codex 接手，提示词

请在 `/Users/ly/data/codex/u-agent` 接手。当前正确 UI 是原 OpenClaw shell，源码基线在 `src/openclaw-shell-app/`，不要回到旧的 Agent Hub UI。先运行 `git status`、`npm run audit:openclaw-shell`、`npm run typecheck`、`npm run build`、`npm run audit:portable`。下一阶段优先做 Windows release/runtime 闭环：完善 `scripts/build-windows-release.mjs`、`scripts/audit-portable-release.mjs`、`scripts/verify-openclaw-runtime.mjs`，补 runtime manifest，并处理主进程同步 I/O、运行期解压、Windows 慢盘卡顿等性能问题。
