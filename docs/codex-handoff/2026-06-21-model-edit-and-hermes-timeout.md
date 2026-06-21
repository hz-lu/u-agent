# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并与现有程序前端界面无缝融合，让用户在前端界面上获得良好的 OpenClaw + Hermes 协作体验。

## 当前目标
修复 Hermes 对话超时反馈过弱的问题，并完善模型配置页：已配置模型可编辑；新增官方模型 API/token 购买平台的置顶高亮占位入口。

## 已完成
- 将 Hermes oneshot 模型调用超时时间从 180 秒提升到 300 秒。
- 超时时返回更明确的中文诊断，提示检查 API Key、网络、模型服务状态或切换更快模型，并附带最近 stderr 日志。
- 超时时同步写入 Hermes 日志，便于用户和开发者追踪。
- 在模型配置页顶部新增“点击购买模型API，超低价格”占位卡片；当前平台 URL 未配置时点击会提示“模型 API 购买平台即将开放”。
- 已配置模型列表新增“编辑”按钮，当前模型也可编辑。
- 点击编辑后展开原生风格编辑表单，可修改 API URL、API Key、API 类型、模型名称。
- 保存模型编辑后写回统一模型配置，并提示 OpenClaw 与 Hermes 将共用新配置。
- 删除模型后若当前模型缺失，自动将剩余第一个模型设为当前，并提示重启。
- 重新运行恢复脚本，已把改动应用到 `E:\win-unpacked\resources\app`。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-21-model-edit-and-hermes-timeout.md`

## 关键决策
- 继续以 `scripts/restore-openclaw-shell.mjs` 作为可重复恢复/部署入口，不只改打包产物，避免换 U 盘或重新恢复基线后丢失改动。
- 模型配置仍保持“一个模型配置同时供 OpenClaw 与 Hermes 使用”的产品设计，不再为 Hermes 单独暴露模型配置页。
- 购买入口先做占位和可点击反馈，未来只需填入真实平台 URL 即可跳转。
- Hermes 超时不伪装成成功；仍真实暴露模型调用失败，但给出可行动诊断和日志。

## 待继续
- 未来接入正式购买平台 URL 后，将 `modelApiPurchaseUrl` 从空字符串改为真实地址。
- 可继续做 UI 实测，确认编辑表单在用户真实模型列表和不同窗口宽度下的观感。
- 若 Hermes 仍频繁超时，需要进一步检查具体模型平台、API Key、base URL 与 Hermes 官方 CLI 调用链。

## 验证结果
- `node --check scripts\restore-openclaw-shell.mjs` 通过。
- `node scripts\restore-openclaw-shell.mjs` 成功生成部署包。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- 已确认部署包包含 `model-api-purchase-card`、`model-row-edit`、`model-edit-form`、`saveEditingModel`。
- 已确认主进程包含 300000ms 超时和 `[chat-timeout]` Hermes 日志。
- 当前 `OpenClawPro` 进程显示 `Responding=True`。

## 如果需要下一台 Codex 接手，提示词
请在 `E:\source\openclawpro-agent-hub` 继续开发。项目通过 `scripts/restore-openclaw-shell.mjs` 从基线恢复并注入 OpenClaw + Hermes 集成，不要只改 `E:\win-unpacked` 里的部署产物。当前已完成 Hermes 超时诊断、模型配置页可编辑，以及模型 API 购买占位入口。下一步可实测模型配置编辑 UI，或继续排查 Hermes 模型调用超时的真实平台/API 链路。
