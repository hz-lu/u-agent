# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
继续完善 `src/` 全源码应用中的会话体验，将 OpenClaw、Hermes、协同三套会话状态持久化到 U 盘 `data/`，避免依赖 Electron localStorage，也避免重启后会话完全丢失。

## 已完成
- 在 `src/shared/types.ts` 增加共享会话类型：`ChatMode`、`ChatMessage`、`ChatSessions`。
- 在 `src/main/index.ts` 增加基于 `JsonStore` 的会话存储，路径为 `data/.agent-hub/chat-sessions.json`。
- 主进程提供 `chat:read-sessions` 和 `chat:write-sessions` IPC。
- 写入前会规范化三套会话，限制每种模式最多 80 条消息、单条内容最多 24000 字符、speaker 最多 80 字符，避免历史无限增长拖慢 UI。
- 在 `src/preload/index.ts` 暴露 `readChatSessions()` 和 `writeChatSessions()`。
- 在 `src/renderer/App.vue` 启动时恢复 U 盘会话；用户消息、OpenClaw 回复、Hermes 回复都会写回 U 盘。
- 增加前端保存队列，避免异步保存乱序导致旧快照覆盖新会话。
- 已执行生产构建，并同步更新 `dist/` 编译产物。

## 改动文件
- `src/shared/types.ts`
- `src/main/index.ts`
- `src/preload/index.ts`
- `src/renderer/App.vue`
- `dist/main/index.js`
- `dist/preload/index.js`
- `dist/assets/index.html`
- `dist/assets/assets/index-C7pGqD9w.js`
- `docs/codex-handoff/2026-06-22-usb-chat-session-persistence.md`

## 关键决策
- 会话状态写入 `data/.agent-hub/chat-sessions.json`，作为桌面 Hub 自己的状态，不混入 OpenClaw 或 Hermes 原生配置。
- 不使用 localStorage，避免之前出现的旧状态回灌和覆盖问题。
- 先做轻量持久化和上限控制，暂不引入数据库、后台队列或复杂会话索引。
- 保存采用队列串行化，保证用户消息和回复按顺序落盘。

## 待继续
- 增加“清空当前会话”或“导出会话”操作。
- 协同模式继续增强为后台任务，加入阶段进度、取消、分段错误展示。
- Windows U 盘实机验证重启后三套会话能从 `data/.agent-hub/chat-sessions.json` 恢复。
- 接入 OpenClaw Gateway 协议级对话，逐步替代当前 OpenAI-compatible 直连模型 passthrough。

## 验证结果
- `npm run typecheck` 通过。
- `node --check scripts/build-windows-release.mjs` 通过。
- `node --check scripts/verify-openclaw-runtime.mjs` 通过。
- `npm run build` 通过。

## 如果需要下一台 Codex 接手，提示词
继续在 `/Users/ly/data/codex/u-agent` 开发。用户已明确要求以 `src/` 全源码应用为准，UI 要统一，不要继续依赖 `scripts/restore-openclaw-shell.mjs` 叠补丁。本阶段已将 OpenClaw、Hermes、协同三套会话持久化到 U 盘 `data/.agent-hub/chat-sessions.json`，主进程通过 JsonStore 读写，preload 暴露 API，前端启动恢复并串行化保存。下一步建议补“清空当前会话/导出会话”，并继续把协同模式改造成后台任务，提供进度、取消和错误分段展示。每完成阶段性工作后按用户要求 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`。
