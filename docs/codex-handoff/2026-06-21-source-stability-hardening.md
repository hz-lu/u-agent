# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心。所有 Hermes 能力都要和现有前端界面无缝融合，让用户能在原 OpenClaw 体验中自然使用 Hermes，并获得清晰、稳定、友好的操作反馈。

## 当前目标
确认并修正上一轮 Hermes/OpenClaw 并发稳定性修复的落点，确保不是只修改打包产物或临时脚本，而是进入真实工程源码，避免以后重新打包到新 U 盘时问题复发。

## 已完成
- 在 `src/main/index.ts` 增加桌面崩溃诊断，记录主进程异常、未处理 Promise、渲染进程退出和子进程退出到 U 盘 `data/.openclaw/logs/desktop-crash.log`。
- 在 `src/main/index.ts` 对主进程推送到前端的日志做长度精简，避免超长 Hermes 日志拖慢界面。
- 在 `src/main/runtime/hermes/hermes-runtime.ts` 将 Hermes API 聊天响应异步写入 `data/.hermes/runs/<runId>/response.json`，界面只保留有限尾部和精简回复。
- 在 `src/main/runtime/hermes/hermes-runtime.ts` 限制传给 Hermes API 的历史消息为最近 20 条，避免长会话或复杂技能调用造成请求体过大。
- 在 `src/main/runtime/hermes/hermes-runtime.ts` 增加用户友好的错误分类：额度不足、Key/权限、限流、网络、模型配置错误等。
- 在 `src/shared/types.ts` 增加 `ChatResponse.runId/runDir`，并补齐已有源码中使用的 `warn` 日志等级。
- 使用 `tsc -p tsconfig.main.json` 同步了 `dist/main` 中的编译产物，确保仓库内源码和已跟踪构建产物一致。

## 改动文件
- `src/main/index.ts`
- `src/main/runtime/hermes/hermes-runtime.ts`
- `src/shared/types.ts`
- `dist/main/index.js`
- `dist/main/runtime/hermes/hermes-runtime.js`
- `dist/main/runtime/openclaw-runtime.js`
- `dist/preload/index.js`
- `docs/codex-handoff/2026-06-21-source-stability-hardening.md`

## 关键决策
- 这次明确把稳定性修复落到 `src/` TypeScript 源码；`scripts/restore-openclaw-shell.mjs` 保留上一轮修复，用于恢复原 OpenClaw 壳并融合 Hermes 的打包流程。
- 不采用“输出过大就终止任务”的策略；Hermes 任务输出继续写入 U 盘数据目录，前端只做精简展示。
- `dist/main/runtime/openclaw-runtime.js` 和 `dist/preload/index.js` 的变化来自 `tsc` 将已有源码能力同步到已跟踪构建产物，不是手工临时补丁。

## 待继续
- 当前本地 `node_modules` 状态异常：`npm install --no-audit --no-fund` 两次长时间未返回，并导致 `node_modules/typescript/lib/tsc.js`、`node_modules/tinyglobby/dist/index.mjs` 缺失。后续需要重新安装依赖，建议删除本地 `node_modules` 后执行 `npm ci --no-audit --no-fund`。
- 依赖修复后，重新跑 `npm run typecheck` 和 `npm run build`。
- 如果用户继续遇到闪退，读取 `data/.openclaw/logs/desktop-crash.log` 和 `data/.hermes/runs/<runId>` 定位。

## 验证结果
- 在本地 `node_modules` 被 `npm install` 中断影响前，已通过：
  - `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json`
  - `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`
- 已执行 `node node_modules/typescript/bin/tsc -p tsconfig.main.json`，并同步更新 `dist/main` 编译产物。
- `vite build` 未完成，原因是本地依赖 `node_modules/tinyglobby/dist/index.mjs` 缺失；随后尝试 `npm install` 修复依赖，但 npm 进程长时间不返回，导致当前本地 `node_modules` 仍需重装。

## 如果需要下一台 Codex 接手，提示词
请继续基于 `E:\source\openclawpro-agent-hub` 开发 U 盘便携版 OpenClaw + Hermes 集成。用户强调不能只改打包产物或脚本补丁，需要进入源码。当前已把 Hermes/OpenClaw 并发稳定性修复落到 `src/main/index.ts`、`src/main/runtime/hermes/hermes-runtime.ts`、`src/shared/types.ts`，并同步了 `dist/main`。下一步先修复本地依赖：删除 `node_modules` 后执行 `npm ci --no-audit --no-fund`，再跑 `npm run typecheck` 和 `npm run build`。不要撤销已有用户改动。每完成阶段性工作后按用户要求执行 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`。
