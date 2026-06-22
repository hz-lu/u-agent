# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修正上一阶段会话持久化中“单条消息最多 24000 字符”的粗暴截断问题，支持用户写长文章、报告、公众号长文等几万字输出，同时避免 `chat-sessions.json` 过大拖慢 UI。

## 已完成
- 在 `src/shared/types.ts` 为 `ChatMessage` 增加 `id`、`createdAt`、`contentFile`、`preview`、`contentChars` 元数据。
- 在 `src/main/index.ts` 将聊天持久化从简单 JsonStore 改为自定义读写。
- 短消息继续内联保存在 `data/.agent-hub/chat-sessions.json`。
- 超过 24000 字符的长消息全文写入 `data/.agent-hub/chat-messages/<messageId>.md`。
- `chat-sessions.json` 对长消息只保存预览、全文文件引用和字符数，避免主索引文件无限膨胀。
- 读取会话时主进程会根据 `contentFile` 自动 hydrate 全文，前端恢复后仍能看到完整内容。
- 写入时会清理不再被最近 80 条会话索引引用的旧 `.md` sidecar 文件。
- 前端新消息会生成稳定 `id/createdAt`，避免同一条长消息多次保存时反复创建新文件。
- 已执行生产构建，并同步更新 `dist/` 编译产物。

## 改动文件
- `src/shared/types.ts`
- `src/main/index.ts`
- `src/renderer/App.vue`
- `dist/main/index.js`
- `dist/assets/index.html`
- `dist/assets/assets/index-8QnfwVae.js`
- `docs/codex-handoff/2026-06-22-long-chat-content-sidecar.md`

## 关键决策
- 不再截断用户正文。24000 字符只作为“是否旁路保存全文”的阈值，不再作为内容丢弃上限。
- 主会话 JSON 保存索引和预览，长文全文用 Markdown sidecar 文件保存，兼顾可恢复和 UI 性能。
- sidecar 文件仍在 U 盘 `data/.agent-hub/` 下，符合零痕迹原则。
- 本阶段仍保留每种会话模式最近 80 条消息的索引上限，避免无限历史撑爆界面；后续可做归档/导出。

## 待继续
- UI 增加“打开全文文件”“导出 Markdown”“清空当前会话”操作。
- 长文消息在 UI 中可增加折叠/展开，避免一次渲染超长内容造成滚动压力。
- 协同模式继续增强为后台任务，加入阶段进度、取消、分段错误展示。
- Windows U 盘实机验证几万字输出、重启恢复、sidecar 文件清理。

## 验证结果
- `npm run typecheck` 通过。
- `node --check scripts/build-windows-release.mjs` 通过。
- `node --check scripts/verify-openclaw-runtime.mjs` 通过。
- `npm run build` 通过。

## 如果需要下一台 Codex 接手，提示词
继续在 `/Users/ly/data/codex/u-agent` 开发。用户指出 24000 字符限制会影响写长文章，本阶段已修正：长消息全文会保存到 U 盘 `data/.agent-hub/chat-messages/<messageId>.md`，`chat-sessions.json` 只保留预览和引用，读取时主进程会 hydrate 全文返回给前端。下一步建议补“打开全文文件/导出 Markdown/清空当前会话”，并考虑长文 UI 折叠，避免超长文本一次性渲染拖慢页面。每完成阶段性工作后按用户要求 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`。
