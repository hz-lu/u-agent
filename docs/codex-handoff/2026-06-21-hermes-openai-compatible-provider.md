# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、持久记忆、自动生成技能、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心。所有能力都要和现有程序前端界面无缝融合，让用户在前端操作时获得清晰、稳定、友好的体验。

## 当前目标
修复 OpenClaw 已配置模型可用、但 Hermes 对话报“模型名或 Base URL 不正确”的问题。

## 已完成
- 读取 Hermes 失败日志，确认失败请求实际传入 `provider: "qwen"`、`modelName: "qwen3.6-plus"`。
- 确认 Hermes 报错原文为 `Qwen CLI credentials not found. Run 'qwen auth qwen-oauth' first.`。
- 判定根因不是用户模型配置错误，而是 Hermes 将 `qwen` provider 路由到 Qwen CLI/OAuth，而当前 OpenClaw 配置使用的是 DashScope OpenAI-compatible API。
- 修复主进程 `mapProvider`：只要模型配置带 Base URL，就统一映射为 Hermes 的 `openai-api` provider。
- 修复 AI 会话前端 `getSelectedHermesModel`：有 Base URL 的模型向 Hermes 传 `provider: "openai-api"`。
- 保留当前模型名、API Key、Base URL 传递逻辑，让 Hermes 和 OpenClaw 复用同一套模型配置。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-21-hermes-openai-compatible-provider.md`

## 关键决策
- 不要求用户为 Hermes 重新配置模型，也不引导用户做 `qwen auth qwen-oauth`，因为便携版目标是复用 OpenClaw 的 API Key/Base URL。
- 对 DashScope、DeepSeek、Moonshot、自定义 OpenAI-compatible 等带 Base URL 的配置，统一走 Hermes `openai-api`。
- 主进程和前端都做 provider 规范化，避免后续 UI 或历史状态再次把 `qwen` 直接传给 Hermes。

## 待继续
- 可以在 Hermes 错误归类中新增 `Qwen CLI credentials not found` 的专项提示，明确说明“当前应走 API Key 模式，而不是 OAuth 模式”。
- 可以增加一条环境检查项，显示 Hermes 当前会用哪个 provider/model/baseUrl。
- 可以在模型配置页测试连接时同时测试 Hermes 的 OpenAI-compatible 调用链。

## 验证结果
- `node --check scripts/restore-openclaw-shell.mjs` 通过。
- `node scripts/restore-openclaw-shell.mjs` 成功同步到 `E:\win-unpacked\resources\app`。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- 手动执行 Hermes CLI：`hermes --oneshot "请只回复 OK" --provider openai-api --model qwen3.6-plus`，配合同一个 DashScope `OPENAI_BASE_URL/OPENAI_API_KEY`，返回 `OK`。
- 已确认实际 main bundle 中 `mapProvider` 对 Base URL 返回 `openai-api`。
- 已确认实际 renderer bundle 中 `getSelectedHermesModel` 对 Base URL 返回 `openai-api`。

## 如果需要下一台 Codex 接手，提示词
继续基于 `E:\source\openclawpro-agent-hub` 开发 U 盘便携版 OpenClaw + Hermes 集成。当前阶段已修复 Hermes 使用 OpenClaw 模型配置时 provider 路由错误的问题：带 Base URL 的模型统一传给 Hermes `openai-api`，避免 `qwen` 被 Hermes 当成 Qwen CLI OAuth provider。durable 修改在 `scripts/restore-openclaw-shell.mjs`，已同步到 `E:\win-unpacked\resources\app`。请先运行 `git status`，然后按阶段执行 `git diff`、`git add`、`git commit`、`git push`。
