# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

把 fresh clone 后需要的工程目录骨架提交到源码仓库，确保后续只需要补 Windows 程序壳和 runtime 环境文件，就能按 manifest 路径运行和打包。

## 已完成

- 调整 `.gitignore`，允许提交必要目录下的 `.gitkeep`，继续忽略真实二进制、用户数据、日志、缓存、release 产物。
- 新增 `win-unpacked/` 目录骨架。
- 新增 `runtime/` 目录骨架，包括 Windows、macOS arm64/x64、Linux x64/arm64 的 Node、OpenClaw、HermesPortable 预期路径。
- 新增 `data/.openclaw/`、`data/.hermes/` 空目录骨架。
- 新增 `skills/`、`extensions/` 空目录骨架。
- 更新 `README.md`，说明 fresh clone 后目录已存在，只需要补 manifest 指定环境文件。

## 改动文件

- `.gitignore`
- `README.md`
- `win-unpacked/**/.gitkeep`
- `runtime/**/.gitkeep`
- `data/.openclaw/.gitkeep`
- `data/.hermes/.gitkeep`
- `skills/.gitkeep`
- `extensions/.gitkeep`
- `docs/codex-handoff/2026-06-22-source-directory-scaffold.md`

## 关键决策

- 只提交空目录骨架，不提交真实 `win-unpacked` 二进制和 runtime 二进制。
- `data/` 只提交空目录，不提交用户配置、账号、模型 Key、聊天记录、Hermes 记忆、日志、缓存。
- 后续补环境时，直接把文件复制到已存在目录；`.gitignore` 会继续防止大体积运行时和用户数据误入 Git。

## 待继续

1. 在 Windows 机器 fresh clone 后，复制旧可用 `win-unpacked/` 的真实文件到根目录 `win-unpacked/`。
2. 运行 `npm run build`，把最新 `dist/` 覆盖到 `win-unpacked/resources/app/dist/`。
3. 补齐 `runtime/PORTABLE-RUNTIME-MANIFEST.json` 中 `windows-x64.requiredPaths` 的真实文件。
4. 运行 `npm run audit:portable`，确认 Windows 缺失项清零。
5. 运行 `node scripts/build-windows-release.mjs` 生成干净 release zip。

## 验证结果

- 已确认目录骨架可被 Git 跟踪。
- `.gitignore` 保留了二进制和用户数据排除规则。
- 下一步仍需在 Windows 上补真实 runtime 后运行完整 portable audit。

## 如果需要下一台 Codex 接手，提示词

请在 `/Users/ly/data/codex/u-agent` 接手。fresh clone 后目录骨架已经存在，不需要再手动创建 `win-unpacked/`、`runtime/`、`data/`、`skills/`、`extensions/`。下一步在 Windows 上补真实 `win-unpacked` 和 runtime 文件，然后运行 `npm run audit:portable` 与 `node scripts/build-windows-release.mjs`。
