# 2026-07-27 AI 会话滚动位置修复

## 总体目标

保证 Windows U 盘便携版在 OpenClaw、Hermes 和协同会话中具备稳定、可预测的消息浏览体验，后台流式回复和任务心跳不能抢夺用户的滚动位置。

## 当前目标

修复用户向上滚动查看历史消息后，被 OpenClaw 流式内容、Hermes 心跳、会话持久化事件或任务完成事件反复拉回底部的问题。

## 根因

- `handleScroll` 虽然会把 `autoScroll` 设为 false，但滚动权限只在两个 OpenClaw watcher 中检查。
- Hermes 每次保存心跳都会触发 `uclaw-hermes-chat-state`，事件处理器无条件滚到底部。
- 多个任务完成分支直接调用无条件 `scrollToBottom()`。
- 已排入 `nextTick` 的滚动回调不会在执行前重新确认用户是否已经向上滚动。

## 本轮完成

- `scrollToBottom(force=false)` 内部统一检查 `autoScroll`，所有普通更新自动受控。
- 调度前和 `nextTick` 执行前各检查一次，消除排队回调造成的延迟抢滚动。
- Hermes 状态持久化、心跳、流式回复和任务完成只在用户仍位于底部时跟随。
- 用户主动发送、切换 Tab、切换会话、清空/重置会话时才显式恢复自动跟随并强制到底部。
- 移除旧的 `scrollToBottom(0)` 调用语义。
- 恢复脚本和 `verify:chat-scroll-control` 专项回归检查同步更新。

## 验证结果

- `npm.cmd run verify:chat-scroll-control`：通过。
- `npm.cmd run verify:hermes-chat-single-flight`：通过。
- `npm.cmd run audit:openclaw-shell`：58/58 通过。
- `npm.cmd run build`：通过。
- `npm.cmd run package:windows-shell`：通过。
- 最新 renderer 已同步到 `F:\win-unpacked\resources\app\dist`，SHA-256 与构建产物一致。

## 预期行为

- 用户停留在底部时，新消息和流式回复继续自动跟随。
- 用户向上滚动超过底部 100px 后，任何心跳、流式更新和任务完成都不再改变当前位置。
- 用户再次滚回底部后，自动跟随恢复。
- 用户主动发送新消息或切换会话时，界面回到底部展示对应最新内容。
