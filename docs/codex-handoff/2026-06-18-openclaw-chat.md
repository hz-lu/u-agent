# Codex Handoff

## 当前目标

继续完善完整源码版 OpenClawPro Agent Hub，把 OpenClaw 会话从占位实现改成可用的真实模型调用路径，并保持旧补丁层不回归。

## 已完成

- 探测了当前 `E:\data\.openclaw\openclaw.json` 配置。
- 确认 OpenClaw 默认模型为 `qwen/deepseek-v4-flash`，provider 类型为 `openai-completions`。
- 将 OpenClaw runtime 启动命令改为旧客户端实际使用的 `openclaw gateway --allow-unconfigured`。
- 实现 OpenClaw chat passthrough：读取 `data/.openclaw/openclaw.json` 中的 provider/baseUrl/model/apiKey，向 OpenAI-compatible `/chat/completions` 发起请求。
- 新增 `scripts/verify-openclaw-runtime.mjs`，诊断 OpenClaw runtime、gateway、模型配置；输出只显示 `apiKeyPresent`，不泄露密钥。
- 重新构建并整体部署到 `E:\win-unpacked\resources\app`。

## 改动文件

- `package.json`
- `scripts/verify-openclaw-runtime.mjs`
- `src/main/runtime/agent-runtime.ts`
- `src/main/runtime/openclaw-runtime.ts`
- `dist/**`
- `docs/codex-handoff/2026-06-18-openclaw-chat.md`

## 关键决策

- OpenClaw 会话优先复用已有 OpenClaw 模型配置，不把模型 Key 写进源码或新配置文件。
- OpenClaw gateway 启动参数以旧客户端稳定实现为准：`gateway --allow-unconfigured`。
- 当前阶段没有直接对 gateway WebSocket 协议做深集成；会话先走 provider 的 OpenAI-compatible HTTP 接口，以最快恢复用户可用聊天。
- 旧 dist 注入补丁仍保持移除状态。

## 待继续

- 继续实现 OpenClaw gateway WebSocket 原生会话协议，以获得更完整的 agent/tool 流式能力。
- 在 UI 中增加 OpenClaw 模型配置编辑器，而不是只读 `openclaw.json`。
- Hermes 的 cron、连接器测试、沙箱后端还可以继续接入真实命令。
- 三平台 Universal 包仍需补 macOS/Linux venv 与启动器。

## 验证结果

- `npm run typecheck` 通过。
- `npm run build` 通过。
- 部署脚本成功整体替换 `E:\win-unpacked\resources\app`，备份到 `E:\backups\app-full-source-20260618174246`。
- `scripts/verify-openclaw-runtime.mjs` 通过：`openclaw.zip`、`node.exe`、`openclaw.json` 存在，默认模型配置完整，`apiKeyPresent=true`。
- `scripts/verify-hermes-runtime.mjs` 通过。
- 部署后的 app 目录没有旧 Hermes 补丁资产。

## 如果需要下一台 Codex 接手，提示词

请在 `E:\source\openclawpro-agent-hub` 继续开发。当前完整源码工程已经替代旧 dist 补丁层。OpenClaw chat 现在通过 `data/.openclaw/openclaw.json` 的 OpenAI-compatible provider 直接请求 `/chat/completions`。下一步优先把 OpenClaw gateway WebSocket 协议接进主进程，或者继续完善 Hermes 的 cron/connector/sandbox 真实命令调用。每个阶段完成后按 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push` 流程提交，并新增一份 `docs/codex-handoff/YYYY-MM-DD-xxx.md`。
