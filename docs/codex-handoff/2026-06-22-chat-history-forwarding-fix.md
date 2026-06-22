# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复普通 OpenClaw/Hermes 对话中的会话历史问题：OpenClaw 未接收历史消息，且普通对话会把当前用户消息重复传入模型。

## 已完成
- 在 `src/renderer/App.vue` 中，发送消息时先截取“发送前历史”，再把当前用户消息加入 UI。
- 普通 OpenClaw/Hermes 对话传给 runtime 的 `messages` 不再包含当前用户消息，避免 runtime 再追加当前 message 时重复。
- 在 `src/main/index.ts` 中，OpenClaw 分支改为 `openclaw.chat(request.message, request.messages || [])`，确保 OpenClaw runtime 能收到历史消息。
- 已执行生产构建，并同步更新 `dist/` 编译产物。

## 改动文件
- `src/renderer/App.vue`
- `src/main/index.ts`
- `dist/main/index.js`
- `dist/assets/index.html`
- `dist/assets/assets/index-BgX76I1b.js`
- `docs/codex-handoff/2026-06-22-chat-history-forwarding-fix.md`

## 关键决策
- 保持 runtime 负责追加当前 user message，前端只传发送前历史。
- 不改协同模式链路；协同模式本来就是显式传空历史给 OpenClaw，再把 OpenClaw 草案交给 Hermes。
- 本阶段只修复具体 bug，不引入新的对话协议或后台任务。

## 待继续
- 修复 Hermes 超大响应解析：当前 `rawTail` 只保留最后 1MB，不适合解析完整 JSON。
- UI 增加长文折叠、打开全文文件、导出 Markdown、清空当前会话。
- 后续接 OpenClaw Gateway 协议级对话，替代当前 OpenAI-compatible passthrough。

## 验证结果
- `npm run typecheck` 通过。
- `node --check scripts/build-windows-release.mjs` 通过。
- `node --check scripts/verify-openclaw-runtime.mjs` 通过。
- `npm run build` 通过。

## 如果需要下一台 Codex 接手，提示词
继续在 `/Users/ly/data/codex/u-agent` 开发。用户要求基于审计结果继续修具体问题。本阶段已修复普通对话历史：前端发送时先截取发送前历史再追加当前用户消息；主进程 OpenClaw 分支现在会把 `request.messages` 传给 `openclaw.chat()`。下一步建议修 Hermes 超大响应解析，不要再用最后 1MB 的 `rawTail` 解析完整 JSON。每完成阶段性工作后按用户要求 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`。
