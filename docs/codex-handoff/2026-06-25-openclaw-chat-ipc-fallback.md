# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，做到零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且与现有 OpenClaw 前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 Windows 便携包中 OpenClaw AI 会话发送消息后无本地气泡、Gateway 收不到 `chat.send`、网页端/微信端也无法收到桌面消息的问题。

## 已完成
- 定位到核心断点：桌面端 renderer 运行在 `file://`，Gateway 日志出现 `origin=file:// ... closed before connect`，导致 renderer WebSocket 通道不可靠。
- 在主进程新增 Gateway RPC 兜底通道：主进程临时建立 WebSocket、完成 `connect.challenge` 签名握手、发送 `chat.send`，绕开 renderer `file://` 握手不稳定问题。
- preload 暴露 `window.uclaw.gatewayChatSend(payload)` 给 renderer。
- OpenClaw AI 会话发送逻辑改为先本地显示用户消息，再优先走原 WebSocket；如果 WebSocket 未 ready 或发送失败，自动走主进程 IPC 兜底。
- 移除 `sending.value` 残留时静默 `return` 的逻辑，避免输入框已清空但消息没有进入对话框。
- 错误消息追加改为读取当前消息数组，避免使用旧数组覆盖新消息。
- F 盘测试包已同步最新 `dist`。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/preload/index.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `dist/preload/index.js`
- `dist/preload/index.cjs`
- `dist/assets/assets/main-DIeui7ZO.js`
- `docs/codex-handoff/2026-06-25-openclaw-chat-ipc-fallback.md`

## 关键决策
- 不再继续只修“历史覆盖消息”的方向；最新证据表明发送请求没有到达 Gateway。
- 不改变原有 OpenClaw UI 主体和实时事件订阅，只给发送动作增加可靠 IPC 兜底。
- 不新增 npm 依赖，使用 Node/Electron 当前运行时自带 WebSocket 能力，符合便携零安装目标。
- 用户输入不能被静默吞掉：即使正在发送，也不能直接丢弃新消息。

## 待继续
- 用户需要重新打开 `F:\win-unpacked\OpenClawPro.exe`，因为 preload/main 的 IPC 改动需要重启桌面程序才会生效。
- 继续观察 Hermes 对话长时间等待和执行过程反馈体验。
- 微信侧仍有公网请求超时/AbortError 日志，需要单独检查 `ilinkai.weixin.qq.com` 网络连通性与插件 outbound 发送逻辑。
- 性能卡顿仍需继续从 Gateway event-loop starvation、频繁健康检查、微信轮询超时和 renderer 渲染压力四条线排查。

## 验证结果
- `npm.cmd run build` 通过。
- `node --check dist/main/index.cjs` 和 `node --check dist/preload/index.cjs` 通过。
- 已同步最新构建到 `F:\win-unpacked\resources\app\dist`。
- 从 `F:\runtime` 启动 Gateway 后，使用同一套主进程握手逻辑发送 `chat.send`，Gateway 返回：
  `ok: true`, `status: started`, `runId: codex-test-1782357286162`。
- 验证后已停止本次测试启动的 Gateway 进程 PID `30864`。

## 如果需要下一台 Codex 接手，提示词
请在 `D:\github\u-agent` 继续开发 U 盘便携版 OpenClawPro + Hermes 集成项目。当前重点是 Windows 便携包稳定性和 OpenClaw/Hermes 会话体验。请先阅读 `docs/codex-handoff/2026-06-25-openclaw-chat-ipc-fallback.md`、`2026-06-25-openclaw-message-visibility.md` 和 `2026-06-25-chat-ready-state-fix.md`。最新已修复 OpenClaw 桌面端发送消息不进 Gateway 的问题：主进程新增 `gateway-chat-send` IPC，renderer WebSocket 失败时走 IPC 兜底。请不要回到“只修历史覆盖”的旧方向。下一步请重启 `F:\win-unpacked\OpenClawPro.exe` 实测：OpenClaw AI 会话发送后应立即出现用户气泡，Gateway 日志应出现 `chat.send`。若仍异常，优先检查 `window.uclaw.gatewayChatSend` 是否可用、preload 是否已加载最新文件、main 进程是否注册 `gateway-chat-send`。每个阶段必须执行 `git status`、`git diff`、`git add`、`git commit -m "..."`、`git push`，并新增 handoff，且 handoff 在“当前目标”前包含“总体目标”。
