# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心。所有能力都要和现有程序前端界面无缝融合，让用户在前端操作时获得清晰、稳定、友好的体验。

## 当前目标
优化 Hermes 对话失败时的用户体验：不再把 `hermes -z`、`no final response was produced` 等底层技术错误直接展示给用户，而是归类为额度不足、API Key/权限、限流、网络、模型配置错误或未知失败，并给出明确处理建议。

## 已完成
- 在 Hermes chat 主进程调用链中新增 `classifyHermesError`，统一归类 Hermes/模型供应商失败。
- 覆盖额度/余额不足、API Key 无效或权限不足、限流、网络/代理/超时、模型名称或 Base URL 错误、Hermes 无最终回复、未知错误等场景。
- 对 `no final response was produced` 这种 Hermes 泛化错误增加面向用户的“可能原因”和“建议处理”，优先提示检查额度、Key、限流、模型配置。
- 将 Hermes 子进程启动错误、超时、非零退出、空回复都接入统一错误归类。
- 调整 AI 会话和协同模式的错误气泡，直接展示友好说明，不再额外拼接生硬的“Hermes 调用失败: 原始错误”。
- 将当前桌面程序目录 `E:\win-unpacked\resources\app` 通过 restore 脚本同步到最新实现。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-21-friendly-hermes-errors.md`

## 关键决策
- 不终止复杂任务或大输出任务，仅优化失败后的归因和说明。
- 技术日志仍保留在返回结构和用户可见提示中，方便排查，但用户第一眼看到的是原因和处理建议。
- 对 Hermes 只返回泛化错误的情况不武断断言“就是额度不足”，而是列出最可能原因，并把额度/余额放在第一位。
- 继续保持 OpenClaw 原 UI 融合策略：修改 restore 脚本作为 durable source，再注入到实际桌面程序 bundle。

## 待继续
- 后续可以把 `errorKind` 映射到更结构化的 UI 卡片，例如“去模型配置测试”“打开日志目录”“切换模型”等快捷按钮。
- 可以在模型配置测试接口中同步使用同一套错误归类，让配置页、聊天页、协同页的失败说明一致。
- 若 Hermes CLI 后续能暴露更完整的 provider stderr，可进一步提高额度/Key/限流等判断准确度。

## 验证结果
- `node --check scripts/restore-openclaw-shell.mjs` 通过。
- `node scripts/restore-openclaw-shell.mjs` 成功同步到 `E:\win-unpacked\resources\app`。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- 已在实际 main bundle 中确认存在 `classifyHermesError`、`quota_exhausted`、`no_final_response` 分支。
- 已在实际 renderer bundle 中确认 Hermes 对话失败文案改为“暂时无法完成请求，请到模型配置页测试当前模型连接后重试”。

## 如果需要下一台 Codex 接手，提示词
继续基于 `E:\source\openclawpro-agent-hub` 开发 U 盘便携版 OpenClaw + Hermes 集成。当前阶段已完成 Hermes 对话错误归类和用户友好提示，durable 修改在 `scripts/restore-openclaw-shell.mjs`，并已同步到 `E:\win-unpacked\resources\app`。请先运行 `git status` 查看工作区，再按阶段执行 `git diff`、`git add`、`git commit`、`git push`。如果继续优化错误 UX，建议将 `errorKind` 做成前端结构化操作卡片，并复用到模型配置测试接口。
