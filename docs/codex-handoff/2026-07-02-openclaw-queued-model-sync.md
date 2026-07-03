# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并与现有程序前端界面无缝融合，让用户在前端界面上获得良好体验。

## 当前目标
修复新 U 盘测试中 OpenClaw 启动后，未配置模型时排队的消息在模型配置完成后进入会话但返回 `[assistant turn failed before producing content]` 的问题。

## 已完成
- 定位到 `G:\data\.openclaw\tmp\openclaw\openclaw-2026-07-02.log` 中失败请求实际使用 `cifu/请填写模型名称`，并收到 provider `401 Invalid token`。
- 确认同一会话后续切到 `cifu/deepseek-v4-pro` 后可以正常回复，说明核心问题是队列消息/旧会话模型未同步到当前有效模型。
- OpenClaw AI 会话发送前新增模型同步保护：自动将当前 session 切换到 UI 当前有效模型，再发送用户正文。
- 手动模型切换与顶部模型下拉统一使用 `provider/model` 格式，避免 UI 选中态和 Gateway 运行态不一致。
- OpenClaw 配置写入时跳过 `请填写模型名称` 占位项，并重建 `agents.defaults.models`，避免旧 alias 残留。
- Windows release 初始化脚本不再把词符科技占位模型写入 OpenClaw 运行配置；新包初始态不配置真实模型，用户填写后才生效。
- 已修复当前 `G:` 测试盘 `data\.openclaw\openclaw.json` 和 `openclaw.json.last-good` 中的占位 alias，并备份为 `.bak-20260702-model-fix`。
- 已同步最新运行 JS 到 `G:\win-unpacked\resources\app\dist\...`。

## 改动文件
- `dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `src/openclaw-shell-app/dist/main/index.js`
- `scripts/stage-windows-release-dir.mjs`
- `docs/codex-handoff/2026-07-02-openclaw-queued-model-sync.md`

## 关键决策
- 队列消息不应该携带发送当时的占位模型，而应该在真正 flush 发送前读取当前有效模型并同步到 OpenClaw session。
- `请填写模型名称` 只允许作为模型配置 UI 的占位提示，不允许进入 OpenClaw 运行配置。
- `agents.defaults.models` 必须按当前有效模型重建，不能保留历史 alias。
- release 初始包不预置可运行模型配置，避免默认 API Key `123456` 或占位模型触发真实请求失败。

## 待继续
- 用户需要关闭并重新打开 `G:` 盘程序后复测，因为运行 JS 已覆盖但当前进程不会热加载。
- 如果仍看到旧的 `[assistant turn failed...]` 气泡，那是历史聊天记录；新发消息应切到当前模型后再请求。
- 后续可以继续把 OpenClaw provider 错误翻译成用户友好的中文提示，而不是直接展示内部英文错误。

## 验证结果
- `node --check dist/assets/assets/main-DIeui7ZO.js` 通过。
- `node --check src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js` 通过。
- `node --check dist/main/index.js` 通过。
- `node --check src/openclaw-shell-app/dist/main/index.js` 通过。
- `node --check scripts/stage-windows-release-dir.mjs` 通过。
- `git diff --check` 通过。
- `G:\data\.openclaw\openclaw.json` 已验证为：`primary=cifu/deepseek-v4-pro`，`defaultModels=["cifu/deepseek-v4-pro"]`，provider model 仅 `deepseek-v4-pro`。
- 当前本机未运行 18789 Gateway，无法做 live chat 验证。

## 如果需要下一台 Codex 接手，提示词
继续开发 `D:\github\u-agent`。本轮修复了 OpenClaw 队列消息在模型配置后仍使用 `cifu/请填写模型名称` 的问题：发送前自动同步 session 模型、配置写入跳过占位模型、release 初始化不写占位模型。请先让用户关闭并重启 U 盘程序后复测 OpenClaw：未配置模型时发消息入队，配置有效模型并启动 OpenClaw 后，新消息应使用 `provider/model` 当前模型，不再返回 `[assistant turn failed before producing content]`。如果仍失败，优先读取 `<U盘>:\data\.openclaw\tmp\openclaw\*.log` 和 `<U盘>:\data\.openclaw\agents\main\sessions\*.jsonl`，确认实际 provider/model/status，而不要先猜前端队列问题。
