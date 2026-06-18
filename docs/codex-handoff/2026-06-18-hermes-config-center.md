# Codex Handoff

## 当前目标
继续把完整源码版 OpenClawPro Agent Hub 往 Hermes 深度融合推进。本阶段目标是把 Hermes 可视化配置中心从静态开关升级为可编辑、可测试、可导入导出、可落盘给运行时消费的配置工作流。

## 已完成
- 新增 Hermes 配置动作 IPC：连接器测试、沙箱测试、添加/删除定时任务、导入/导出配置。
- 保存 Hermes 配置时同步生成 `E:\data\.hermes` 下的便携运行时配置：
  - `config\.env`
  - `config\model.json`
  - `config\features.json`
  - `connectors\*.json`
  - `cron\schedules.json`
  - `sandboxes\backends.json`
- 前端 Hermes 区域改造成完整配置中心：
  - 模型 Provider/Model/Base URL/API Key 编辑与保存。
  - Telegram/Discord/Slack/WhatsApp/Signal/Email/CLI 连接器字段编辑与测试。
  - 持久记忆、自动生成技能开关。
  - 自然语言定时任务添加，cron 可留空自动推断。
  - local/docker/ssh/singularity/modal 沙箱字段编辑与测试。
  - Hermes 配置导出和按路径导入。
- 导出的配置会对模型 Key、token 等敏感字段脱敏，避免把密钥写进仓库或 handoff。
- 继续保持旧 Hermes dist 补丁层不回归。

## 改动文件
- `src/shared/types.ts`
- `src/main/index.ts`
- `src/main/runtime/hermes/hermes-runtime.ts`
- `src/preload/index.ts`
- `src/renderer/App.vue`
- `src/renderer/styles.css`
- `dist/**`
- `docs/codex-handoff/2026-06-18-hermes-config-center.md`

## 关键决策
- 连接器测试先做本地确定性校验和配置落盘，不主动向 Telegram/Discord/Slack 等外部服务发 token，避免误用或泄露用户凭据。
- 沙箱测试先验证必填字段；Docker 额外检查 socket 路径存在性。更深的后端实际执行测试留到下一阶段。
- 自然语言 cron 先实现基础推断：每小时、每周、每月、夜间、默认每日 09:00。后续可以接 Hermes 或 LLM 做更强解析。
- API Key 仍只保存在 U 盘 `data/.hermes/config/.env` 和 hub 配置中，不写进源码。

## 待继续
- 把连接器测试升级为可选真实连通性测试，并为每个平台增加明确错误解释。
- 把自然语言 cron 解析接入 Hermes/LLM，让“无人值守报告/备份/简报”生成更完整的执行计划。
- 为五种沙箱后端增加真实 dry-run：local command、Docker socket、SSH 登录、Singularity image、Modal token。
- 增加配置文件选择器，替代当前手动粘贴导入路径。
- 继续验证前端在真实 Electron 窗口中的布局和交互体验。

## 验证结果
- `npm run typecheck` 通过。
- `npm run build` 通过。
- 已同步 `dist` 回 `E:\source\openclawpro-agent-hub`。
- 已运行 `node scripts/deploy-to-usb.mjs`，部署到 `E:\win-unpacked\resources\app`，备份目录为 `E:\backups\app-full-source-20260618175403`。
- `node --check E:\win-unpacked\resources\app\dist\main\runtime\hermes\hermes-runtime.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `scripts\verify-hermes-runtime.mjs` 通过，Hermes Agent 为 `v0.15.1`，Python `3.12.13`，Node `v24.15.0`，零痕迹环境指向 `E:\data\.hermes`。
- `scripts\verify-openclaw-runtime.mjs` 通过，OpenClaw 配置存在，默认模型配置可读，API Key 仅显示 present。
- 部署后的 `dist/assets` 中未发现旧 Hermes patch/enhance 资产。

## 如果需要下一台 Codex 接手，提示词
请在 `E:\source\openclawpro-agent-hub` 继续开发。当前完整源码工程已经替代旧 dist 补丁层，本阶段新增了 Hermes 可视化配置中心和便携配置落盘。下一步建议优先做真实连接器测试、自然语言 cron 的 LLM/Hermes 解析、沙箱 dry-run，或用 Electron/Browser 视觉检查前端布局。每个阶段完成后按 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push` 流程提交，并新增一份 `docs/codex-handoff/YYYY-MM-DD-xxx.md`。
