# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 Hermes 长文/超大响应解析问题：不能再用最后 1MB 的 `rawTail` 解析完整 JSON，也不能在 Hermes 成功路径把正文截断后再交给前端。

## 已完成
- 在 `src/main/runtime/hermes/hermes-runtime.ts` 中移除成功路径的 `truncateForUi()` 截断。
- Hermes 响应仍持续写入 `data/.hermes/runs/<runId>/response.json`。
- 响应结束后，主进程会从完整 `response.json` 读取并解析 JSON，不再用 `rawTail` 解析。
- `rawTail` 保留为错误分类和读取文件失败时的兜底，不再作为正常成功解析来源。
- 成功回复会完整返回给前端，由会话 sidecar 机制保存长文全文。
- 已执行生产构建，并同步更新 `dist/` 编译产物。

## 改动文件
- `src/main/runtime/hermes/hermes-runtime.ts`
- `dist/main/runtime/hermes/hermes-runtime.js`
- `docs/codex-handoff/2026-06-22-hermes-large-response-parse-fix.md`

## 关键决策
- 解析完整响应应以 `response.json` 为准，`rawTail` 只适合作错误预览。
- Hermes runtime 不再替 UI 截断成功正文；长文性能和持久化交给前端会话 sidecar 层处理。
- 本阶段只修解析与截断问题，不改 Hermes API 协议和任务队列。

## 待继续
- UI 增加长文折叠/展开，避免几万字一次性渲染拖慢页面。
- 增加“打开全文文件”“导出 Markdown”“清空当前会话”操作。
- 协同模式继续增强为后台任务，加入进度、取消和错误分段展示。

## 验证结果
- `npm run typecheck` 通过。
- `node --check scripts/build-windows-release.mjs` 通过。
- `node --check scripts/verify-openclaw-runtime.mjs` 通过。
- `npm run build` 通过。

## 如果需要下一台 Codex 接手，提示词
继续在 `/Users/ly/data/codex/u-agent` 开发。用户要求基于审计继续修具体 bug。本阶段已修 Hermes 超大响应解析：成功路径从完整 `data/.hermes/runs/<runId>/response.json` 读取并解析，不再使用最后 1MB `rawTail` 解析，也不再用 `truncateForUi()` 截断成功正文。下一步建议做长文 UI 折叠/打开全文/导出 Markdown，避免完整长文渲染拖慢页面。每完成阶段性工作后按用户要求 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`。
