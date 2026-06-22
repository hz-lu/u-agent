# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
继续将 OpenClaw/Hermes 会话体验统一到 `src/` 全源码应用，避免单一聊天状态在切换 Agent 时串台，并恢复用户能同时使用 OpenClaw 对话、Hermes 对话、协同对话的基础体验。

## 已完成
- 在 `src/renderer/App.vue` 增加 `ChatMode`：`openclaw`、`hermes`、`collab`。
- 将单一 `chatMessages` 改为 `chatSessions`，OpenClaw、Hermes、协同三种会话各自保留独立消息列表。
- 聊天面板增加分段模式控件，用户可在同一界面切换 OpenClaw、Hermes、协同会话，不再因切换模式而互相覆盖消息。
- 增加 `chatBusy`，避免一次发送尚未返回时重复提交。
- 协同模式实现真实顺序调用：先调用 OpenClaw 生成草案，再把用户请求和 OpenClaw 草案交给 Hermes 复核、补充和整理。
- 在 `src/renderer/styles.css` 增加会话模式分段控件样式。
- 已执行生产构建，并同步更新 `dist/` 编译产物。

## 改动文件
- `src/renderer/App.vue`
- `src/renderer/styles.css`
- `dist/assets/index.html`
- `dist/assets/assets/index-BNcCI73a.js`
- `dist/assets/assets/index-sCPX0X3m.css`
- `docs/codex-handoff/2026-06-22-source-chat-mode-isolation.md`

## 关键决策
- 本阶段只改前端会话状态和调用编排，不改主进程 IPC 或 OpenClaw/Hermes runtime，降低对 OpenClaw 主流程的回归风险。
- 协同模式先采用明确、可解释的两步链路：OpenClaw 草案 -> Hermes 复核。后续可再加入阶段性进度事件、取消任务和更细的协同消息结构。
- 会话状态目前保存在窗口运行态中，保证同一运行会话内三种模式互不串台；持久化到 U 盘 data 目录另开阶段处理，避免重引入旧 localStorage 覆盖问题。

## 待继续
- 增加会话持久化，但优先写入 U 盘 `data/`，避免依赖 Electron localStorage 覆盖真实状态。
- 协同模式继续增强为后台任务，提供阶段性进度、可取消、错误分段展示，避免长任务时 UI 空白等待。
- 接入 OpenClaw Gateway 协议级对话，逐步替代 OpenAI-compatible 直连模型 passthrough。
- 在 Windows U 盘环境验证三种会话模式切换、模型配置读取、OpenClaw/Hermes 返回和协同链路。

## 验证结果
- `npm run typecheck` 通过。
- `node --check scripts/build-windows-release.mjs` 通过。
- `node --check scripts/verify-openclaw-runtime.mjs` 通过。
- `npm run build` 通过。

## 如果需要下一台 Codex 接手，提示词
继续在 `/Users/ly/data/codex/u-agent` 开发。用户已明确要求以 `src/` 全源码应用为准，UI 要统一，不要继续依赖 `scripts/restore-openclaw-shell.mjs` 叠补丁。本阶段已将聊天面板拆成 OpenClaw、Hermes、协同三套独立会话状态，并让协同模式真实顺序调用 OpenClaw 和 Hermes。下一步建议把会话持久化写入 U 盘 data 目录，并继续增强协同模式的后台任务、进度反馈和错误分段展示。每完成阶段性工作后按用户要求 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`。
