# 2026-07-27 Hermes 会话单飞与消息可靠性修复

## 总体目标

在保留 OpenClaw、Hermes 和协同模式独立运行能力的同时，让 Windows U 盘便携版具备稳定、可恢复、不会吞消息或因后台进程失控而卡死的生产级会话体验。

## 当前目标

修复 Hermes 长任务期间再次发送消息后用户消息消失、同一 Hermes 会话并发启动多个 Python oneshot、旧任务进度污染新任务，以及长时间执行过程产生大量重复 waiting 行的问题。

## 根因证据

- F 盘 `data/.hermes/runs` 同时存在两个 `status=running` 的 Hermes 会话任务。
- 系统进程中同时存在两个由同一 Electron 主进程启动的 Hermes oneshot Python 进程。
- Renderer 只保存一个 `hermesActiveTaskId`，第二次发送会覆盖第一次任务的 UI 管理句柄。
- Hermes adapter 在确认消息是否被任务系统接纳前清空输入；忙碌分支发生在用户消息写入之前。
- 后台结果监听器在 IPC 接纳任务之前创建，任务被拒绝时会留下最长 30 分钟的无效监听器。

## 本轮完成

- 主进程增加按 `sessionId` 的原子单飞锁，同一 Hermes 会话只允许一个后台任务；Hermes 与协同模式仍使用不同 session，可独立运行。
- 用户消息在任何异步状态检查之前立即加入对话并持久化，不再因忙碌判断或页面切换消失。
- 忙碌时最多保留 3 条待处理消息，每条显示明确 loading；当前任务完成或停止后自动依次执行。
- 主进程进度事件携带 `taskId`，Renderer 丢弃不属于当前任务的旧进度。
- waiting 心跳在同一行更新等待时间，阶段变化时才新增过程记录。
- 只有主进程接纳任务后才创建结果监听器，避免无效轮询和计时器泄漏。
- 恢复脚本、Shell 审计和专用 `verify:hermes-chat-single-flight` 回归检查同步更新。

## 验证结果

- 主进程和 Renderer `node --check`：通过。
- `npm.cmd run verify:hermes-chat-single-flight`：通过。
- `npm.cmd run audit:openclaw-shell`：57/57 通过。
- `npm.cmd run build`：通过。
- `npm.cmd run package:windows-shell`：通过。
- 最新 `win-unpacked` 已生成，F 盘 main/renderer 文件与构建产物 SHA-256 一致。

## 运行目录同步

最新应用代码已同步到 `F:\win-unpacked\resources\app\dist`。同步时旧程序仍在运行，旧内存中的两个并发 Hermes 任务不会被新版代码接管；需要完全退出旧程序并重新打开后测试。runtime、模型配置和历史数据未覆盖。

## 预期行为

- 第一条 Hermes 消息立即显示并出现单一执行过程 loading。
- 第一条处理期间发送第二条，第二条用户消息立即显示，并出现“等待上一条完成”的 loading。
- 同一 Hermes 会话不会再启动第二个 Python oneshot；第一条结束或停止后第二条自动执行。
- 连续发送超过 3 条待处理消息时明确提示上限，不静默吞掉消息。
