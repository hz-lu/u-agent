# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
继续把历史补丁脚本里的 OpenClaw 主流程能力迁回 `src/` 全源码应用。本阶段聚焦 OpenClaw 模型配置和 Gateway 状态，让 OpenClaw 页面具备真实配置读取、保存和状态展示能力，而不是只依赖手工编辑 `data/.openclaw/openclaw.json`。

## 已完成
- 在 `src/main/runtime/openclaw-runtime.ts` 增加 `readModelConfig()` 和 `writeModelConfig()`。
- OpenClaw 模型配置从 `data/.openclaw/openclaw.json` 读取，解析 `agents.defaults.model.primary`、provider、model、baseUrl、apiKey。
- 保存配置时会补齐缺失的 `models.providers` 和 `agents.defaults.model` 结构，避免旧配置字段不完整导致崩溃。
- 在 `src/main/index.ts` 增加 OpenClaw 模型配置读写 IPC，以及 Gateway 状态查询 IPC。
- 在 `src/preload/index.ts` 暴露 OpenClaw 配置 API 给渲染进程。
- 在 `src/renderer/App.vue` 的 OpenClaw 页面增加“模型与服务”配置面板和 Gateway 状态面板，与 Hermes 页面使用同一套 UI 语言。
- 已执行生产构建，并同步更新 `dist/` 编译产物。

## 改动文件
- `src/main/runtime/openclaw-runtime.ts`
- `src/main/index.ts`
- `src/preload/index.ts`
- `src/renderer/App.vue`
- `dist/main/runtime/openclaw-runtime.js`
- `dist/main/index.js`
- `dist/preload/index.js`
- `dist/assets/assets/index-BsFBidMe.js`
- `dist/assets/index.html`
- `docs/codex-handoff/2026-06-22-openclaw-model-config-source-ui.md`

## 关键决策
- OpenClaw 模型配置的真实来源仍是 `data/.openclaw/openclaw.json`，前端只做读写入口，不引入新的并行配置文件。
- `src/` 作为唯一主线，新增功能直接进入主进程、preload、Vue UI，不再通过 `restore-openclaw-shell.mjs` 往打包产物里叠加补丁。
- 本阶段不改变 OpenClaw chat 的执行链路，只把配置闭环和状态展示迁入源码，降低回归风险。
- Gateway 状态先复用 `OpenClawRuntime.getStatus()` 的真实端口检查和 runtime 诊断信息，后续再接更细的 Gateway 协议级健康检查。

## 待继续
- 继续第一阶段 OpenClaw 稳定性：让 AI 会话使用独立的 OpenClaw/Hermes/协同历史，避免当前单一 `chatMessages` 在切换 Agent 时混用。
- 增加 OpenClaw 启动后主动刷新 Gateway 状态和会话可用状态，确认重新扫码、切换页面后不会误报未启动。
- 在 Windows U 盘环境验证 OpenClaw 页面能读取现有 5 个模型配置，并能保存后继续发送消息。
- 后续再做 OpenClaw Gateway 协议级对话接入，逐步替代当前 OpenAI-compatible 直连模型的临时 passthrough。

## 验证结果
- `npm run typecheck` 通过。
- `node --check scripts/build-windows-release.mjs` 通过。
- `node --check scripts/verify-openclaw-runtime.mjs` 通过。
- `npm run build` 通过。

## 如果需要下一台 Codex 接手，提示词
继续在 `/Users/ly/data/codex/u-agent` 开发。用户已明确要求以 `src/` 全源码应用为准，UI 要统一，不要继续依赖 `scripts/restore-openclaw-shell.mjs` 叠补丁。本阶段已把 OpenClaw 模型配置读写和 Gateway 状态展示迁入源码：主进程 `OpenClawRuntime` 读写 `data/.openclaw/openclaw.json`，preload 暴露 API，Vue OpenClaw 页面提供模型与服务面板。下一步建议继续 OpenClaw 稳定性：拆分 OpenClaw/Hermes/协同会话历史，增强 Gateway 状态同步，并在 Windows U 盘环境验证模型读取、保存和发送消息。每完成阶段性工作后按用户要求 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`。
