# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

让 Windows release 打包脚本以 `runtime/PORTABLE-RUNTIME-MANIFEST.json` 作为唯一运行时契约，避免脚本中手写 required paths 与 manifest 漂移，并在缺资产时一次性输出清晰 preflight 错误。

## 已完成

- `scripts/build-windows-release.mjs` 改为读取 `runtime/PORTABLE-RUNTIME-MANIFEST.json`。
- Windows release required paths 由 manifest 的 `sharedRequiredPaths` 和 `platforms.windows-x64.requiredPaths` 自动生成。
- Windows launcher 校验由 manifest 的 `platforms.windows-x64.launchers` 自动生成。
- 禁止携带的 runtime 用户数据路径由 manifest 的 `forbiddenRuntimePaths` 自动生成。
- release preflight 现在会一次性汇总：
  - 缺 Windows launcher。
  - 缺 required portable files。
  - runtime 中存在禁止携带的 Hermes 用户数据。
- 保留 OpenClaw dist 引用完整性检查，防止再次出现 `missing dist/entry.(m)js` 或缺少 chunk 文件的问题。

## 改动文件

- `scripts/build-windows-release.mjs`
- `docs/codex-handoff/2026-06-22-windows-release-manifest-preflight.md`

## 关键决策

- Windows release 脚本不再维护第二份 required path 清单。
- 后续新增或调整 runtime 目录结构时，优先修改 `runtime/PORTABLE-RUNTIME-MANIFEST.json`，审计脚本和 release 脚本都从 manifest 读取。
- 在缺少 runtime 资产时，打包脚本应该失败，但失败信息必须一次性列出可执行的修复清单。

## 待继续

1. 在 Windows U 盘环境补齐 `platforms.windows-x64.requiredPaths` 中的所有文件。
2. 重新运行 `node scripts/build-windows-release.mjs`，确认 preflight 从“缺资产”进入 OpenClaw dist 完整性校验。
3. 若 dist 完整性校验失败，优先修复 `runtime/node_modules/openclaw/dist` 缺失 chunk 或 entry 文件。
4. 继续处理主进程同步 I/O 和运行期解压性能问题，尤其是 `src/openclaw-shell-app/dist/main/index.js` 中的 `execSync`、`spawnSync`、`Expand-Archive`、`unzip` 路径。

## 验证结果

- `node --check scripts/build-windows-release.mjs`：通过。
- `node scripts/build-windows-release.mjs`：按预期失败，并一次性列出当前缺失的 Windows launcher 和 required files。
- `npm run audit:portable`：通过执行，manifest 缺失项清晰输出。
- `npm run typecheck`：通过。
- `npm run build`：通过。

## 如果需要下一台 Codex 接手，提示词

请在 `/Users/ly/data/codex/u-agent` 接手。当前 Windows release 打包脚本已经由 `runtime/PORTABLE-RUNTIME-MANIFEST.json` 驱动。先运行 `node scripts/build-windows-release.mjs` 查看 preflight 缺失清单，然后在 Windows U 盘环境补齐这些 runtime 文件。不要再在脚本里手写第二份 runtime required paths。
