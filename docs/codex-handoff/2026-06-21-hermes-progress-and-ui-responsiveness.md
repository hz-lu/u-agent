# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且所有 Hermes 能力都要和现有程序前端界面无缝融合，前端操作体验自然、稳定、可理解。

## 当前目标
修复 Hermes 执行复杂任务时桌面窗口短暂未响应、用户长时间看不到执行过程的问题；让 Hermes 对话也能像 OpenClaw 一样给出持续的运行过程反馈，同时降低日志和监听导致的 UI 压力。

## 已完成
- 为 Hermes chat 主进程调用增加 `hermes-chat-progress` 事件。
- 在 Hermes 任务准备、服务检查/启动、运行目录创建、插件/工具加载、stderr 活动、stdout 输出、心跳阶段推送进度。
- preload 新增 `ipcOnHermesChatProgress`。
- AI 会话页新增进度事件监听，把 Hermes/协同任务的占位消息更新为步骤列表，结果回来后再替换为最终回复。
- 进度更新做了节流：主进程 1.5 秒最小间隔，心跳 4 秒；前端保存 localStorage 6 秒节流，滚动 1.8 秒节流。
- 修复进度列表重复刷同一句的问题：主进程心跳不再把“已运行 N 秒”拼进正文，前端按阶段覆盖更新，而不是把每次心跳追加成新步骤。
- 为 `no final response was produced` 增加可读进度说明，最终错误仍进入统一的模型/API/额度排查提示。
- Hermes/协同模式隐藏旧的三点等待气泡，避免“过程气泡 + 额外 typing 气泡”同时出现造成误解；OpenClaw 原等待动画保持不变。
- 修复 Hermes log/status IPC 监听无法正确卸载的问题，避免多次进入页面后监听叠加。
- 首页不再默认加载 300 行 Hermes 历史日志；只有切到 Hermes 日志或执行 Hermes 启动/重启后才读取。
- Hermes 实时日志只在用户查看 Hermes 日志面板时进入响应式列表，后台日志合并计数并提示完整日志路径。
- Hermes 首页日志上限从 500 条降到 160 条，减少渲染负担。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-21-hermes-progress-and-ui-responsiveness.md`

## 关键决策
- Hermes 官方 `--oneshot` 模式说明为“只打印最终回复，不显示 spinner/tool previews/session 信息”，所以之前长时间空等是这个入口天然行为。
- 本阶段先在便携集成层加稳定进度桥，不直接切换到 `chat -q --verbose`，避免 ANSI/交互输出污染最终回复。
- 进度桥以用户能理解的阶段反馈为主，不把原始日志全量塞进聊天窗口。
- 进度气泡现在按“接收任务、检查服务、启动 Hermes、加载上下文、执行过程、生成回复、当前状态”这些阶段稳定展示；同一阶段后续事件只更新内容和耗时，避免刷屏。
- UI 未响应的问题不仅来自 Hermes 任务本身，也可能来自日志监听叠加和大量响应式日志更新，因此同时做监听清理和日志降噪。

## 待继续
- 用户重启桌面程序后验证：Hermes 发天气查询等复杂任务，观察是否持续显示步骤、窗口是否还被 Windows 标记未响应。
- 如还会未响应，下一步重点看 OpenClaw webview / Gateway Node 进程 CPU、主窗口 renderer 性能，以及是否需要把 OpenClaw 网页端内嵌视图延迟加载或独立窗口化。
- 后续可以进一步接入 Hermes 官方 `tool_progress_callback` / `stream_delta_callback`，做成真正的工具卡片和 token 级流式输出。

## 验证结果
- `node --check scripts/restore-openclaw-shell.mjs` 通过。
- 已执行 `node scripts/restore-openclaw-shell.mjs`，当前 `E:\win-unpacked\resources\app` 已更新。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\preload\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- 关键字符串检查确认当前包包含 `hermes-chat-progress`、`ipcOnHermesChatProgress`、`codex-hermes-chat-progress-main`、`codex-hermes-listener-cleanup`、`hermesLogUnsubscribers`。
- 关键字符串检查确认当前包包含 `normalizeHermesProgressText`、`buildHermesProgressLines`，并且 Hermes/协同不再触发 OpenClaw 的三点等待气泡。

## 如果需要下一台 Codex 接手，提示词
请继续在 `E:\source\openclawpro-agent-hub` 上开发。当前目标是 U 盘便携版 OpenClaw + Hermes 的完整融合。最近一次修复给 Hermes 对话增加了进度桥：主进程发送 `hermes-chat-progress`，preload 暴露 `ipcOnHermesChatProgress`，renderer 将进度写回当前 Hermes/协同占位消息。进度现在按阶段覆盖更新，避免重复刷“加载技能和上下文”；`no final response was produced` 会转成可读错误排查；Hermes/协同不再显示额外三点等待气泡。同时修复 Hermes log/status 监听泄漏，并降低首页 Hermes 日志的响应式更新压力。用户反馈此前复杂任务会让窗口短暂未响应；请先让用户重启程序验证。如果仍未响应，优先检查 OpenClaw Gateway Node 进程 CPU、Electron renderer 日志监听、内嵌 webview 负载，以及 Windows 事件日志。
