# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且所有 Hermes 能力都要和现有程序前端界面无缝融合，前端操作体验自然、稳定、可理解。

## 当前目标
修复用户启动程序后同时启动 Hermes 和 OpenClaw，刚进入 AI 会话、未发送消息就闪退的问题；同时补齐闪退诊断日志，避免再出现无日志退出。

## 已完成
- 将 Electron `userData`、`sessionData`、`cache`、`logs` 强制指向 U 盘 `data/.openclaw/electron-cache` 和 `data/.openclaw/logs`。
- 将 OpenClaw `RUNTIME_DIR` 从宿主机 `LOCALAPPDATA/OpenClaw/runtime` 改为 U 盘 `runtime`，避免 Gateway 继续使用宿主机旧运行时。
- 为主进程新增 `renderer:log` IPC，renderer 可把错误写入 `data/.openclaw/logs/desktop-crash.log`。
- preload 暴露 `ipcLogRendererError`。
- AI 会话页增加全局 `window.error` / `unhandledrejection` 记录。
- AI 会话页进入时记录 `ai-chat-mounted`，后续若再闪退可判断是否已进入 mounted 阶段。
- Hermes/协同会话状态恢复改为限量和容错：最多恢复 40 条，单条内容过长会折叠，坏的 localStorage 会自动清理。
- 清理了当前残留的宿主机 Gateway Node 进程，避免下次启动连接旧进程。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-21-ai-chat-startup-crash-hardening.md`

## 关键决策
- 这次闪退发生在“点击 AI 会话初始化”阶段，OpenClaw Gateway 日志出现 `closed before connect`，说明 renderer/window 在 Gateway 握手完成前断开。
- 旧版本 Electron 缓存和 LocalStorage 位于宿主机 `C:\Users\Administrator\AppData\Local\OpenClaw\electron-cache`，不符合零痕迹，也可能污染新 U 盘版本状态。
- 旧 Gateway 进程路径为 `C:\Users\Administrator\AppData\Local\OpenClaw\runtime\node.exe`，说明运行时也未完全便携化；因此本阶段同时改 runtime 和 Electron cache。
- 不通过禁用 OpenClaw/Hermes/协同来规避闪退，而是修复启动路径、状态恢复和日志诊断。

## 待继续
- 用户重新打开 `E:\win-unpacked` 程序，启动 OpenClaw 和 Hermes 后进入 AI 会话验证是否还会闪退。
- 如果仍闪退，先查看 `E:\data\.openclaw\logs\desktop-crash.log` 是否出现 `renderer-*`、`render-process-gone` 或 `ai-chat-mounted`。
- 验证 Gateway 新进程路径应为 `E:\runtime\node.exe`，不能再是 `C:\Users\Administrator\AppData\Local\OpenClaw\runtime\node.exe`。
- 后续仍需进一步清理旧宿主机 OpenClaw 缓存的历史遗留，但不应删除用户未授权的宿主机目录。

## 验证结果
- `node --check scripts/restore-openclaw-shell.mjs` 通过。
- 已执行 `node scripts/restore-openclaw-shell.mjs`，当前 `E:\win-unpacked\resources\app` 已更新。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\preload\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- 关键字符串检查确认当前包包含 `codex-portable-electron-cache`、`const RUNTIME_DIR = path$1.join(getAppRoot(), DIR_RUNTIME);`、`renderer:log`、`ipcLogRendererError`、`compactHermesSavedMessages`、`codex-renderer-error-logger`、`ai-chat-mounted`。
- 已停止当前残留的旧宿主机 Gateway Node 进程。

## 如果需要下一台 Codex 接手，提示词
请继续在 `E:\source\openclawpro-agent-hub` 上开发。当前总体目标是 U 盘便携版 OpenClaw + Hermes 完整融合。最近用户反馈启动 OpenClaw 和 Hermes 后点击 AI 会话立即闪退。本阶段修复了便携路径和启动稳定性：Electron cache/userData/logs 改到 U 盘 `data/.openclaw`，OpenClaw runtime 改到 U 盘 `runtime`，renderer 错误通过 `ipcLogRendererError` 写入 `desktop-crash.log`，AI 会话恢复状态做限量和坏数据清理。当前 `E:\win-unpacked` 已重建，旧宿主机 Gateway Node 进程已停止。下一步请让用户重启程序验证；如仍闪退，优先查看 `E:\data\.openclaw\logs\desktop-crash.log` 和 Gateway 新进程路径。
