# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
继续修复长文会话体验：长文已经完整保存到 U 盘 sidecar 文件后，UI 不应一次性渲染几万字导致滚动和重绘压力。

## 已完成
- 在 `src/renderer/App.vue` 增加长消息折叠/展开逻辑。
- 超过 6000 字符的消息默认显示前 6000 字符和折叠提示。
- 每条长消息提供“展开全文 / 折叠”按钮，展开后仍显示完整内容。
- 在聊天标题栏增加“清空”按钮，可清空当前会话模式，并通过已有会话持久化队列写回 U 盘。
- 在 `src/renderer/styles.css` 增加长消息操作按钮样式。
- 已执行生产构建，并同步更新 `dist/` 编译产物。

## 改动文件
- `src/renderer/App.vue`
- `src/renderer/styles.css`
- `dist/assets/index.html`
- `dist/assets/assets/index-B89pRThZ.js`
- `dist/assets/assets/index-D2w4dwmV.css`
- `docs/codex-handoff/2026-06-22-chat-long-message-folding.md`

## 关键决策
- 折叠只影响 UI 显示，不影响消息内容本身，也不影响 U 盘 sidecar 全文保存。
- “清空”只清空当前会话模式，不影响另外两套会话。
- 暂不做导出 Markdown 和打开 sidecar 文件，本阶段先解决 UI 长文渲染压力。

## 待继续
- 增加导出当前会话为 Markdown。
- 增加打开长文 sidecar 文件的入口。
- 协同模式继续增强为后台任务，加入进度、取消和错误分段展示。

## 验证结果
- `npm run typecheck` 通过。
- `node --check scripts/build-windows-release.mjs` 通过。
- `node --check scripts/verify-openclaw-runtime.mjs` 通过。
- `npm run build` 通过。

## 如果需要下一台 Codex 接手，提示词
继续在 `/Users/ly/data/codex/u-agent` 开发。用户要求继续修审计中发现的问题。本阶段已为聊天 UI 增加长消息折叠/展开和清空当前会话；超过 6000 字符的消息默认折叠，展开后可看全文，清空会通过现有持久化写回 U 盘。下一步建议做导出当前会话为 Markdown、打开 sidecar 文件入口，或继续把协同模式改造成后台任务。每完成阶段性工作后按用户要求 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`。
