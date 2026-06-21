# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、持久记忆、自动生成技能、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心。所有能力都要和现有程序前端界面无缝融合，让用户在前端操作时获得清晰、稳定、友好的体验。

## 当前目标
优化 AI 会话中 Hermes 与协同窗口的交互一致性：增加模型选择，隐藏不适用的网页端按钮，补齐每轮消息复制能力，并让文本选中有明确视觉反馈。

## 已完成
- Hermes 与协同模式顶部已复用 OpenClaw 的模型选择器。
- Hermes 独立对话、旧协同流程、新协同流程调用 `ipcHermesChat` 时都会传入当前选中的 `provider/modelName/apiKey/baseUrl`，模型选择不只是界面展示。
- “网页端”按钮改为仅 OpenClaw 模式显示，Hermes 与协同模式隐藏，避免用户误以为 Hermes 有对应网页端。
- 用户自己发送的消息增加“复制/已复制”快捷按钮。
- Agent 回复的复制按钮支持错误消息和普通消息，并增加“已复制”状态反馈。
- 对用户消息、Agent 回复、错误文本、思考内容增加 `user-select: text`，并强化选中文本的蓝色高亮反馈。
- 已通过 restore 脚本同步到当前桌面程序目录 `E:\win-unpacked\resources\app`。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-21-ai-chat-hermes-ux.md`

## 关键决策
- 保持原 OpenClaw 会话结构和 MessageBubble 组件，不重做聊天界面。
- Hermes/协同模型选择复用现有模型配置和模型选择器，避免新增一套独立配置造成理解成本。
- 不给 Hermes/协同显示“网页端”入口，因为当前没有对应独立网页端能力。
- 复制按钮做轻量 hover 显示，避免聊天内容区域过于拥挤；点击后提供短暂“已复制”反馈。

## 待继续
- 可以后续把 Hermes/协同状态条改成更完整的状态卡片，显示“当前模型/运行状态/日志入口”。
- 可以增加“复制本轮问答”或“导出会话”功能。
- 如果后续 Hermes 有真实 Web Dashboard，可再为 Hermes 模式单独增加 Dashboard 按钮，而不是复用 OpenClaw 网页端。

## 验证结果
- `node --check scripts/restore-openclaw-shell.mjs` 通过。
- `node scripts/restore-openclaw-shell.mjs` 成功同步到 `E:\win-unpacked\resources\app`。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- 已确认实际 renderer bundle 中存在 `getSelectedHermesModel` 和三处 `...getSelectedHermesModel()` 调用。
- 已确认实际 renderer bundle 中 `ModelSelector` 在三种模式都渲染，`web-openclaw` 只在 OpenClaw 模式渲染。
- 已确认实际 renderer bundle 中用户消息复制按钮和 Agent 回复复制按钮都有 copied 状态。
- 已确认实际 CSS 中存在消息复制按钮、文本可选中和明显选中高亮样式。

## 如果需要下一台 Codex 接手，提示词
继续基于 `E:\source\openclawpro-agent-hub` 开发 U 盘便携版 OpenClaw + Hermes 集成。当前阶段已优化 AI 会话 UX：Hermes/协同复用模型选择并真实传参，网页端按钮只在 OpenClaw 显示，用户与 Agent 消息都有复制按钮和选中反馈。durable 修改在 `scripts/restore-openclaw-shell.mjs`，已同步到 `E:\win-unpacked\resources\app`。请先运行 `git status`，然后按阶段执行 `git diff`、`git add`、`git commit`、`git push`。
