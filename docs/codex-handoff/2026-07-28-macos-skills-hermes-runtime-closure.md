# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

完成 macOS arm64 技能容量、股票技能运行时、Hermes 启动可靠性和 exFAT 交付目录的闭环验证，不直接合并主干代码。

## 已完成

- OpenClaw 技能容量提高到 400，并在技能仓库真实变化后清除旧 `skillsSnapshot`。
- 增加独立的 macOS arm64 便携 Python 和股票技能依赖，不复用 Hermes Python。
- Hermes 启动使用 generation-aware single-flight，只有配置服务和 API 都 ready 才显示启动成功。
- 定位 Hermes API 未监听的根因是缺少 `aiohttp`，构建脚本固定安装 `aiohttp==3.13.4`。
- Hermes runtime 门禁真实导入 `typing_extensions`、`pydantic`、`fastapi`、`uvicorn`、`aiohttp`。
- OpenClaw runtime 验证优先使用 release 自带 Node，不再误用宿主机 Homebrew Node。
- Python 门禁禁止写入字节码缓存，最终 release 不含 `__pycache__` 和 `.pyc`。
- 重新生成干净的 `release/macos-usb-root-exfat`，没有打入用户日志、数据库或历史数据。

## 改动文件

- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/build-macos-runtime.mjs`
- `scripts/stage-macos-portable-test.mjs`
- `scripts/verify-macos-hermes-runtime.mjs`
- `scripts/verify-macos-stock-skill-runtime.mjs`
- `scripts/verify-hermes-start-single-flight.mjs`
- `scripts/verify-hermes-skills.mjs`
- `scripts/verify-openclaw-runtime.mjs`
- `runtime/PORTABLE-RUNTIME-MANIFEST.json`
- `package.json`

## 关键决策

- 不整体合并主干，只迁移已经分析过且适用于 macOS 分支的行为。
- OpenClaw 主流程优先，Hermes 不允许用假启动状态掩盖 runtime 缺失。
- 股票技能 Python 与 Hermes Python 隔离，避免一个 runtime 损坏拖累另一个 Agent。
- runtime 二进制和 release 不提交 Git，由可复现构建脚本生成。
- 最终 staging 后不再启动服务，避免将测试日志和数据库写入交付目录。

## 待继续

- 将 `release/macos-usb-root-exfat/OpenClawPro.app` 和 `runtime/` 更新到测试 U 盘。
- 保留 U 盘现有 `.license`、`data/`、`skills/` 和 `extensions/`，不要用空白模板覆盖用户内容。
- 在另一台 Apple Silicon Mac 上完成冷启动、OpenClaw 对话、Hermes 对话、`/skill` 多选和股票技能端到端测试。
- macOS Intel、Windows、Linux runtime 仍需分别构建和实机验证。

## 验证结果

- OpenClaw staged Gateway 真实 ready：3511ms，stderr 为空。
- Hermes 配置服务 `17520` 真实 ready：504ms。
- Hermes API `8642` 真实 ready：3012ms，两个进程 stderr 均为空。
- U 盘 `openclaw-data-china-stock` 的 `tool_check_trading_status` 真实调用返回 `success: true`。
- `npm run stage:macos-usb-root:final` 通过，runtime 必需项 23/23，`aiohttp` 版本为 3.13.4。
- exFAT 实体化 33 个符号链接，剩余符号链接 0。
- 最终 release 中 `__pycache__` 和 `.pyc` 均为 0，`data/.hermes` 仅保留模板配置和 `.gitkeep`。
- `npm run build`、`npm run typecheck`、`npm run audit:openclaw-shell`、`npm run verify:skill-repository`、`npm run verify:skill-metadata`、`npm run verify:chat-skills`、`npm run verify:hermes:start-single-flight` 全部通过。
- `codesign --verify --deep --strict release/macos-usb-root-exfat/OpenClawPro.app` 通过。

## 如果需要下一台 Codex 接手，提示词

从 `feat/macos-portable-app` 最新提交继续。不要整体合并主干，不要提交 runtime 二进制、release、用户数据、日志或 `.license`。优先在另一台 Apple Silicon Mac 使用现有 U 盘技能和数据做冷启动端到端测试；更新 U 盘时只替换 `OpenClawPro.app` 和 `runtime/`。
