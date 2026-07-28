# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

修复 macOS exFAT U 盘版启动后长时间卡顿、点击应用图标没有响应的问题。

## 已完成

- 使用 `ps`、`lsof`、`sample` 和 `iostat` 定位启动卡顿根因。
- 确认技能 repository worker 在短时间内完成并进入空闲，不是持续卡顿主因。
- 确认 Chromium 将 GPUCache、WebGPUCache、HTTP Cache、DIPS、SharedStorage 等高频小文件写入 exFAT，造成持续 600–1000 IOPS。
- macOS 正式版关闭不必要的 HTTP、媒体、GPU shader/program 磁盘缓存，并禁用 DIPS 和 SharedStorageAPI。
- Electron 用户目录、Local Storage、日志和配置仍保留在 U 盘，没有迁移到宿主机。
- 新增 macOS exFAT 缓存策略回归门禁。
- 重新生成 release，并只增量更新测试 U 盘的 `OpenClawPro.app`，未覆盖 runtime、用户数据、技能或授权文件。

## 改动文件

- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/verify-macos-exfat-cache-policy.mjs`
- `package.json`

## 关键决策

- 不把 Electron 用户数据迁移到宿主机，继续满足便携和零痕迹原则。
- 不删除技能同步功能；现场证据显示 worker 已空闲，持续卡顿来自 Chromium 随机磁盘写入。
- 不关闭 GPU 加速，只关闭 GPU 磁盘缓存，避免为了减少 I/O 损害界面渲染性能。
- 不修改 UI、模型、聊天、OpenClaw 或 Hermes 业务逻辑。

## 待继续

- 在另一台 Apple Silicon Mac 和另一块 exFAT U 盘复测冷启动。
- 如仍需进一步缩短 5–7 秒冷启动，应瘦身约 770MB 的 Electron 程序壳；这与本次持续卡死问题不同。

## 验证结果

- 修复前稳定运行时 U 盘约 600–1000 IOPS，主进程采样持续阻塞在 exFAT `lstat/unlink`。
- 修复后本机程序壳指向 U 盘数据运行，连续 4 秒 U 盘 IOPS 为 0。
- 从 U 盘本体冷启动约 5–7 秒显示窗口，稳定后连续采样 IOPS 为 0。
- 重复点击应用图标耗时 0.11–0.14 秒。
- `npm run build`、`npm run typecheck`、`npm run audit:openclaw-shell`、`npm run verify:macos:exfat-cache`、`npm run verify:chat-skills`、`npm run verify:skill-repository`、`npm run verify:hermes:start-single-flight` 全部通过。
- 最终 staging runtime 23/23，Hermes runtime 校验通过，符号链接和 `__pycache__` 均为 0。

## 如果需要下一台 Codex 接手，提示词

从 `feat/macos-portable-app` 最新提交继续。macOS exFAT 持续卡顿已通过关闭 Chromium 不必要的磁盘缓存修复，用户数据仍在 U 盘。不要恢复这些缓存，也不要把用户 profile 迁移到宿主机。下一步优先在另一台 Apple Silicon Mac 做冷启动和完整对话回归。
