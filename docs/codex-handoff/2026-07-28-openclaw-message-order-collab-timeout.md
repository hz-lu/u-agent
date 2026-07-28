# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

修复 OpenClaw 多工具任务在桌面会话中重复、顺序错乱，以及协同模式在 OpenClaw 已返回结果时仍提示草案生成超时的问题。

## 已完成

- 对照 U 盘 Gateway 原始 session、桌面本地 history 和截图，确认 Gateway 原始 11 段 assistant 消息顺序正确，问题位于桌面端归并逻辑。
- assistant 阶段不再因为“包含文字或工具”而跨消息合并，只允许相同 `id` 或 `runId` 的同一 turn 合并。
- `toolResult` 依据 `toolCallId` 向前查找真正所属的 assistant 阶段，不再只回填最后一条消息。
- `state=delta + message` 按完整快照替换，不再拼接旧内容，消除“好，让我拉取……”指数式重复。
- 最终消息使用完成时间并标记 `_final`，不再占用最早流式消息时间戳，因此最终报告保持在执行过程之后。
- 协同草案等待从数组长度判断改为按发送时间和 `_final` 状态定位当前请求；OpenClaw 完成后强制同步 Gateway 权威历史。
- 协同等待上限由 130 秒改为 30 分钟。本次现场任务实际耗时约 130 秒，原超时与完成发生在同一临界点。
- 技能协同会话键统一为 `openclawpro-collab`，避免发送缓存和标准化接收事件落入不同消息桶。
- 从源码重新生成 macOS arm64 app，并仅更新 `release/macos-usb-root-exfat/OpenClawPro.app`。

## 改动文件

- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `scripts/verify-openclaw-chat-reconciliation.mjs`
- `scripts/verify-collab-openclaw-draft.mjs`
- `scripts/verify-chat-skill-commands.mjs`
- `package.json`
- `docs/codex-handoff/2026-07-28-openclaw-message-order-collab-timeout.md`

## 关键决策

- Gateway session 是消息顺序和阶段边界的权威来源，不在桌面端根据消息形态猜测跨阶段合并。
- 区分完整消息快照与字符增量；仅真正的 `payload.delta` 继续追加字符。
- 不通过关闭协同模式或限制长任务掩盖超时；协同等待真实任务完成并重新同步历史。
- 不修改 runtime、skills、用户 data 或 OpenClaw 官方任务执行逻辑。

## 待继续

- 完全退出 U 盘旧 app，只替换新的 `OpenClawPro.app` 后重启。
- 在 OpenClaw 模式重复同一股票复盘任务，确认每个过程阶段只显示一次，最终报告位于最后。
- 在协同模式重复该任务，确认超过 130 秒仍继续等待，并在 OpenClaw 完成后进入 Hermes 第二阶段。
- 测试通过 `/skill` 选择两个技能后的协同调用，确认独立协同会话能正常接收 OpenClaw 结果。

## 验证结果

- 新增测试先按预期失败，命中跨阶段合并、快照追加、130 秒超时和会话键不一致。
- `npm run verify:openclaw-chat-reconciliation`：通过，并执行生产归并函数验证阶段边界、顺序和工具归属。
- 使用现场 Gateway session 离线重放：46 条原始记录保留为 11 个有序 assistant 阶段，最终报告位于最后。
- `npm run verify:collab-openclaw-draft`：通过。
- `npm run verify:chat-scroll-control`：通过。
- `npm run verify:hermes-chat-single-flight`：通过。
- `npm run verify:chat-skills`：通过。
- `npm run verify:hermes:macos`：通过。
- `npm run verify:stock-skills:macos`：通过。
- `npm run build` 与 `npm run package:macos-shell`：通过。
- 尚需在 U 盘 GUI 中重新执行长任务完成端到端确认。

## 如果需要下一台 Codex 接手，提示词

继续 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支，先读取本 handoff。源码基准为 `src/openclaw-shell-app/dist/`。已修复 OpenClaw 多工具消息跨阶段合并、完整快照重复拼接、最终消息时间戳错序，以及协同 130 秒临界超时和技能协同会话键不一致。不要提交或覆盖 runtime、release、用户 data、`mac_release_07_22/`、`uclaw/`。下一步只替换 app，在 U 盘 GUI 复测 OpenClaw 与协同长任务。
