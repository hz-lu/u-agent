# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

修复 macOS Hermes 长时间启动失败、重复启动多个配置服务以及实际未 ready 却显示启动成功的问题。

## 已完成

- Hermes `start()` 增加 generation-aware single-flight，同一轮并发启动复用同一 Promise。
- `stop()` 串行执行并使旧启动 generation 失效。
- config server 退出只清理对应 child，旧 child 不会覆盖新状态。
- config/API spawn 后保持 `starting`，不再立即显示 `running`。
- Hermes 完整启动要求配置服务 `17520` 和 API `8642` 同时 ready。
- runtime 构建和 release 校验真实 import `typing_extensions`、`pydantic`、`fastapi`、`uvicorn`。
- 修复 macOS Hermes 技能验证脚本遗漏 `PYTHONHOME` 导致的假阴性。

## 改动文件

- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/build-macos-runtime.mjs`
- `scripts/verify-macos-hermes-runtime.mjs`
- `scripts/verify-hermes-start-single-flight.mjs`
- `scripts/verify-hermes-skills.mjs`
- `package.json`

## 关键决策

- 不通过延长等待时间掩盖 runtime 损坏。
- 不允许 config server 单独 ready 就显示 Hermes 已启动。
- 不直接搬运主干聊天 single-flight；本次针对 lifecycle 根因独立实现。

## 待继续

- 重新生成 `release/macos-usb-root-exfat`。
- 在最终 staged 布局检查 OpenClaw、Hermes、股票技能和 exFAT 兼容性。

## 验证结果

- `npm run verify:hermes:start-single-flight` 通过。
- `npm run verify:hermes:macos -- release/macos-usb-root-exfat arm64` 通过。
- `npm run verify:hermes-skills` 通过。
- `npm run verify:chat-skills` 通过。
- `npm run audit:openclaw-shell` 24/24 通过。

## 如果需要下一台 Codex 接手，提示词

从最终 macOS staging 开始，必须使用本机新构建的 `runtime/macos-arm64`，不要复用 U 盘旧备份 Hermes runtime；完成后记录 release 大小和用户需要复制的范围。
