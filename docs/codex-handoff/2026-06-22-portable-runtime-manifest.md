# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

补上 portable runtime manifest 的源码级契约，让 Windows、macOS、Linux 的 runtime 缺失项能被审计脚本明确列出，并避免大体积 runtime 二进制被误提交到 Git。

## 已完成

- 新增 `runtime/PORTABLE-RUNTIME-MANIFEST.json`。
- manifest 明确记录：
  - Windows x64 launcher、OpenClaw、Node、Hermes、Python 必备路径。
  - macOS arm64/x64 launcher、Node、OpenClaw、Hermes、Python 必备路径。
  - Linux x64/arm64 launcher、Node、OpenClaw、Hermes、Python 必备路径。
  - release 应生成的数据模板路径。
  - runtime 中禁止携带的 Hermes 用户数据路径。
- `scripts/audit-portable-release.mjs` 已读取 manifest 并输出每个平台的 `missingRequired`、launcher 状态、shared/data template 缺失项和 forbidden runtime 路径。
- `scripts/build-windows-release.mjs` 已把 manifest 作为 Windows release 必需文件并包含进 release manifest。
- `.gitignore` 已忽略 `runtime/**`，只允许提交 `runtime/PORTABLE-RUNTIME-MANIFEST.json`。
- `README.md` 已补充 runtime manifest 的说明。

## 改动文件

- `.gitignore`
- `README.md`
- `runtime/PORTABLE-RUNTIME-MANIFEST.json`
- `scripts/audit-portable-release.mjs`
- `scripts/build-windows-release.mjs`
- `docs/codex-handoff/2026-06-22-portable-runtime-manifest.md`

## 关键决策

- runtime 大文件不进入 Git；Git 只保存 manifest 契约。
- `npm run audit:portable` 现在既检查当前实际文件，也检查 manifest 契约，方便后续逐项补齐 Windows release 资产。
- Windows release 包必须带上 `runtime/PORTABLE-RUNTIME-MANIFEST.json`，便于用户或下一台 Codex 追踪运行时完整性。

## 待继续

1. 在 Windows U 盘环境补齐 manifest 中 `windows-x64` 的 9 个 required path。
2. 生成或复制完整展开后的 `runtime/node_modules/openclaw/dist`，避免启动时依赖大体积解压。
3. 准备 `runtime/HermesPortable/`，确保 `venv/Scripts/hermes.exe`、`python.exe`、`node/node.exe` 可用。
4. 生成顶层 launcher 或确认 `win-unpacked/OpenClawPro.exe` 可作为启动入口。
5. 重新运行 `npm run audit:portable`，让 `windows-x64` 缺失项清零。
6. 继续处理主进程中的同步 I/O、`execSync`、运行期解压、Windows 慢盘卡顿等性能问题。

## 验证结果

- `node --check scripts/audit-portable-release.mjs`：通过。
- `node --check scripts/build-windows-release.mjs`：通过。
- `npm run audit:portable`：通过执行，并按 manifest 输出各平台缺失项。
- `npm run audit:openclaw-shell`：通过，24/24。
- `npm run typecheck`：通过。
- `npm run build`：通过。

## 如果需要下一台 Codex 接手，提示词

请在 `/Users/ly/data/codex/u-agent` 接手。当前正确 UI 是原 OpenClaw shell。先运行 `npm run audit:portable`，查看 `runtimeManifest.platforms.windows-x64.missingRequired`。下一步优先在 Windows U 盘环境补齐 `runtime/PORTABLE-RUNTIME-MANIFEST.json` 中的 Windows required paths，然后运行 `scripts/build-windows-release.mjs` 生成干净 release zip。不要提交大体积 runtime，Git 只提交源码和 manifest。
