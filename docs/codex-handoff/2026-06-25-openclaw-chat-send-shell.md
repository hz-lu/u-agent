# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw 实现集成 Hermes，形成零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心的一体化 Agent Hub，并与现有 OpenClaw 前端界面无缝融合，保持良好的用户体验。

## 当前目标
修复 Windows Electron 壳中 AI 会话 OpenClaw 标签页发送消息后本地消息不显示、Gateway 收不到/桌面端无反馈的问题，并重新生成可复制到 U 盘测试的 win-unpacked 壳。

## 已完成
- 修复 ChatInput 发送入口：不再因为 Gateway ready 状态或 sending 状态拦截发送事件。
- 发送框、附件按钮、命令按钮不再因为 ready=false 被禁用，用户输入可以先显示到本地会话。
- 发送中不再把发送按钮替换成停止按钮，避免 sending 卡住后下一条消息永远无法发送。
- OpenClaw 发送走主进程 IPC fallback 成功后，会主动触发 renderer WebSocket 重连，补齐“消息已发出但回复事件没回到桌面端”的兜底。
- OpenClaw 等待回复超时从 120 秒缩短到 45 秒，并改成中文可理解提示。
- Windows 打壳脚本增加 Electron 下载失败降级路径：如果已有 win-unpacked/OpenClawPro.exe，则复用现有 Electron 外壳并刷新 resources/app/dist。
- 已重新构建并刷新 D:\github\u-agent\win-unpacked，可手动复制到 F 盘测试。

## 改动文件
- dist/assets/assets/main-DIeui7ZO.js
- src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js
- scripts/package-windows-shell.mjs
- docs/codex-handoff/2026-06-25-openclaw-chat-send-shell.md

## 关键决策
- 用户发送消息必须先在本地会话显示，不能被 Gateway/WebSocket ready 状态阻断。
- Gateway 发送链路和回复事件链路要分开处理：IPC fallback 可负责发送，发送后必须拉起 renderer WebSocket 接收后续事件。
- 当前网络环境下载 Electron 超时，因此打包脚本必须能复用已有壳，避免每次都卡死在下载环节。

## 待继续
- 需要用户将 D:\github\u-agent\win-unpacked 手动复制到 F:\win-unpacked 后实际测试：OpenClaw 发送后是否立即出现用户消息、Gateway 网页端是否收到、回复是否回流桌面端。
- 如果仍然无回复，下一步重点抓 Gateway 事件流：对比 renderer WebSocket 握手、Origin、token、sessionKey，以及 Gateway 是否广播 chat.message 事件。
- 后续仍需继续处理 Windows 端未响应/性能卡顿、微信扫码/消息通道稳定性、Hermes 长任务过程反馈等问题。

## 验证结果
- npm.cmd run build：通过。
- npm.cmd run package:windows-shell：通过；Electron 下载超时后复用 existing shell，成功刷新 win-unpacked。
- node --check win-unpacked/resources/app/dist/main/index.cjs：通过。
- node --check win-unpacked/resources/app/dist/preload/index.cjs：通过。
- 静态核验 win-unpacked/resources/app/dist/assets/assets/main-DIeui7ZO.js：确认包含 canSend 仅按内容判断、输入控件 disabled=false、false && __props.sending、usedMainIpcFallback 后 reconnectWs、45 秒中文超时提示。

## 如果需要下一台 Codex 接手，提示词
你接手的是 D:\github\u-agent 的 OpenClawPro + Hermes 便携 Agent Hub。用户当前最关注 Windows 壳稳定性和 OpenClaw 聊天闭环。请先阅读 docs/codex-handoff/2026-06-25-openclaw-chat-send-shell.md，然后基于源码继续排查：如果用户复制新 win-unpacked 到 F 盘后 OpenClaw 仍无法聊天，重点验证 renderer WebSocket 握手、Gateway chat.send 是否收到、Gateway 是否广播 chat.message 事件、sessionKey 是否一致。不要用 F 盘临时补丁，必须改 D:\github\u-agent 源码并重新 npm run build / npm run package:windows-shell。每个阶段按 git status、git diff、git add、git commit、git push 流程提交。
