# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

让 macOS arm64 U 盘版像 Windows 版一样直接运行已复制到 `skills/` 的 34 个股票技能。

## 已完成

- 新增独立 `runtime/macos-arm64/python3` 构建链路，不复用 Hermes Python。
- 安装并验证 `pydantic`、`requests`、`PyYAML`、`pytz`、`numpy`、`pandas`、`pyarrow`、`akshare`。
- OpenClaw Gateway 的 PATH 优先使用便携 Python，并设置 portable root、UTF-8 和禁止用户 site-packages。
- macOS staging 会复制并处理 `runtime/python3` 的 exFAT 可执行权限。
- manifest 增加 arm64/x64 Python 和依赖完整性契约。
- 使用 U 盘 `openclaw-data-china-stock/tool_runner.py` 真实执行 `tool_check_trading_status` 成功。

## 改动文件

- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/build-macos-runtime.mjs`
- `scripts/stage-macos-portable-test.mjs`
- `scripts/verify-macos-stock-skill-runtime.mjs`
- `runtime/PORTABLE-RUNTIME-MANIFEST.json`
- `runtime/macos-arm64/python3/bin/.gitkeep`
- `package.json`

## 关键决策

- 股票技能 Python 与 Hermes runtime 隔离，避免 Hermes 损坏拖累 OpenClaw。
- runtime 二进制不提交 Git，只提交目录骨架、manifest 和可复现构建脚本。
- 验证不仅 import 依赖，还真实执行一个股票工具。

## 待继续

- 修复 Hermes runtime import 校验和并发启动。
- 生成最终 macOS exFAT release 并在 staged 布局再次执行股票工具探针。

## 验证结果

- `npm run build:runtime:macos` 通过。
- `npm run verify:stock-skills:macos` 八个模块 import 通过。
- U 盘股票工具返回 `success: true`，状态为 `lunch_break`。
- `npm run build:renderer` 通过。

## 如果需要下一台 Codex 接手，提示词

继续执行 `docs/superpowers/plans/2026-07-28-macos-skills-hermes-runtime.md` 的 Hermes 阶段；本机已生成但未提交 `runtime/macos-arm64/python3`，不要把二进制加入 Git。
