# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并与现有前端界面无缝融合，保证 OpenClaw 原有体验稳定。

## 当前目标
修复新 U 盘首次无模型配置时给 OpenClaw 发消息进入队列，后续配置模型并重启 OpenClaw 后仍一直卡在“上一条消息仍在等待回复/待发送队列”的问题。

## 已完成
- OpenClaw 停止或 Gateway 未 ready 时，立即释放 AI 会话里的 `sending` 锁和 `currentRunId`，避免后续消息永久被“上一条仍在处理”拦截。
- WebSocket 关闭原因包含 token/auth/unauthorized 时，自动重新读取 `openclaw.json` 的当前 token 并重连。
- 模型配置写入 OpenClaw 配置成功后，派发 `uclaw-openclaw-config-updated` 事件，OpenClaw 会话适配器会重连并刷新 token。
- OpenClaw 发送 45 秒无回复时，不再显示“已收到请求”的成功提示，而是明确释放队列并提示用户确认模型配置或重启 Gateway。
- IPC fallback 发送成功但前端 WebSocket 尚未 ready 时，会释放 `sending` 锁并通过历史同步拉取回复，避免卡死。
- 主进程打开 OpenClaw 网页端不再硬编码 `token=newToken`，统一读取当前配置 token 生成 URL，减少 `gateway token mismatch`。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `docs/codex-handoff/2026-07-02-openclaw-queue-token-recovery.md`

## 关键决策
- Gateway 端口可用不等于前端 WebSocket 已可接收回复；IPC fallback 可以用于发送，但不能长期占用前端 `sending` 状态。
- token mismatch 属于可恢复连接错误，应自动刷新配置 token 并重连，而不是让队列一直等待。
- 超时提示必须面向用户明确说明失败和下一步，不再使用“已收到请求”这种会造成误解的状态。

## 待继续
- 在新 U 盘上覆盖本次两个运行文件后，复测“无模型配置发送 -> 配置模型 -> 重启 Gateway -> 再发送消息”的完整链路。
- 若仍出现 token mismatch，需要抓取 `data/.openclaw/openclaw.json` 里的 gateway token 与日志中的连接 URL，确认是否有旧 Gateway 进程未退出。

## 验证结果
- `node --check src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js` 通过。
- `node --check dist/assets/assets/main-DIeui7ZO.js` 通过。
- `node --check src/openclaw-shell-app/dist/main/index.js` 通过。
- `node --check dist/main/index.js` 通过。
- `git diff --check` 通过。
- 搜索确认没有残留硬编码 `token=newToken`。

## 如果需要下一台 Codex 接手，提示词
请继续在 `D:\github\u-agent` 开发。当前刚修复 OpenClaw AI 会话队列和 token mismatch 恢复问题，重点文件是 `dist/assets/assets/main-DIeui7ZO.js`、`src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`、`dist/main/index.js`、`src/openclaw-shell-app/dist/main/index.js`。继续工作前先复测 OpenClaw 新 U 盘首次配置模型后的队列 flush 和 WebSocket ready 状态，避免改坏 Hermes 会话。
