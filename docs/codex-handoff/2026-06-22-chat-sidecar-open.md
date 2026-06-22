# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
继续补齐长会话体验：长消息保存到 sidecar 文件后，用户应能从源码 UI 直接打开全文文件，而不是只能看到路径提示。

## 已完成
- 读取会话时保留合法的 `contentFile` 元数据，UI 可识别哪些消息有 sidecar 文件。
- 增加 `chat:open-message-file` IPC，主进程校验路径必须位于 `data/.agent-hub/` 内。
- 使用 Electron `shell.openPath` 打开全文 Markdown 文件，避免渲染进程直接接触文件系统。
- 在长消息卡片中增加“打开全文文件”按钮。
- 调整消息操作按钮样式，支持图标与文字对齐。
- 已执行生产构建，并同步更新 `dist/` 编译产物。

## 改动文件
- `src/main/index.ts`
- `src/preload/index.ts`
- `src/renderer/App.vue`
- `src/renderer/styles.css`
- `dist/assets/index.html`
- `dist/assets/assets/index-CzRrq7DJ.js`
- `dist/assets/assets/index-CZqcYtaO.css`
- `dist/main/index.js`
- `dist/preload/index.js`
- `docs/codex-handoff/2026-06-22-chat-sidecar-open.md`

## 关键决策
- 只允许打开 `data/.agent-hub/` 下的相对文件，避免把任意宿主机路径暴露给渲染进程。
- `contentFile` 只在读取并 hydrate 会话时回传给 UI；持久化时仍由主进程根据长文本重新写入 sidecar。
- 打开全文文件是当前消息级操作，不影响会话折叠、导出和清空逻辑。

## 待继续
- 协同模式继续增强为后台任务，加入进度、取消和错误分段展示。
- 增加 CI，覆盖 `npm ci`、`npm run typecheck`、`npm run build`。
- 继续设计 Windows release 的运行时 artifact 获取与完整性验证。
- Windows U 盘环境做完整启动与长会话 smoke test。

## 验证结果
- `npm run typecheck` 通过。
- `node --check scripts/build-windows-release.mjs` 通过。
- `node --check scripts/verify-openclaw-runtime.mjs` 通过。
- `npm run build` 通过。

## 如果需要下一台 Codex 接手，提示词
继续在 `/Users/ly/data/codex/u-agent` 开发。用户要求以 `src/` 全源码应用为准，不要继续依赖补丁脚本叠加。本阶段已实现长消息 sidecar 文件打开入口，读取会话时会保留 `contentFile` 元数据，打开文件前主进程会校验路径在 `data/.agent-hub/` 内。下一步建议把协同模式改造成后台任务，加入进度、取消与错误分段展示，或补 CI。每完成阶段性工作后按用户要求 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`。
