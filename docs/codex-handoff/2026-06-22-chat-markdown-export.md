# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
补齐长会话的用户闭环：在长消息已可 sidecar 保存、UI 可折叠后，让用户能从源码 UI 直接导出当前会话为 Markdown。

## 已完成
- 在主进程增加 `chat:export-session` IPC，按当前会话模式导出 Markdown。
- 导出文件写入 U 盘数据目录 `data/.agent-hub/exports/`，不写宿主机下载目录，保持零痕迹原则。
- 导出前从已有会话持久化文件读取并 hydrate sidecar 全文，确保 Markdown 包含完整消息内容。
- 在 preload 和共享类型中暴露导出接口。
- 在聊天标题栏增加“导出”按钮，与“清空”按钮统一为当前会话操作。
- 已执行生产构建，并同步更新 `dist/` 编译产物。

## 改动文件
- `src/main/index.ts`
- `src/preload/index.ts`
- `src/shared/types.ts`
- `src/renderer/App.vue`
- `src/renderer/styles.css`
- `dist/assets/index.html`
- `dist/assets/assets/index-fPSZyKw7.js`
- `dist/assets/assets/index-C_vPKoho.css`
- `docs/codex-handoff/2026-06-22-chat-markdown-export.md`

## 关键决策
- 导出入口放在主进程，避免渲染进程直接访问文件系统。
- 导出位置固定在 U 盘 data 下，不弹系统保存对话框，减少宿主机痕迹。
- 导出当前激活会话模式，不混合 OpenClaw、Hermes、协同三套历史。

## 待继续
- 增加打开长文 sidecar / 导出文件所在目录的入口。
- 协同模式继续增强为后台任务，加入进度、取消和错误分段展示。
- 增加 CI，覆盖 `npm ci`、`npm run typecheck`、`npm run build`。
- 继续设计 Windows release 的运行时 artifact 获取与完整性验证。

## 验证结果
- `npm run typecheck` 通过。
- `node --check scripts/build-windows-release.mjs` 通过。
- `node --check scripts/verify-openclaw-runtime.mjs` 通过。
- `npm run build` 通过。

## 如果需要下一台 Codex 接手，提示词
继续在 `/Users/ly/data/codex/u-agent` 开发。用户要求以 `src/` 全源码应用为准，不要继续依赖补丁脚本叠加。本阶段已实现当前会话 Markdown 导出，文件写入 `data/.agent-hub/exports/`，并确保导出时读取 sidecar 全文。下一步建议增加打开 sidecar / 导出文件所在目录入口，或把协同模式改造成后台任务。每完成阶段性工作后按用户要求 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`。
