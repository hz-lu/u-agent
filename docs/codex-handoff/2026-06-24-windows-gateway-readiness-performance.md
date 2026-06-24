# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw，实现与 Hermes Agent 的无缝集成：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、自然语言定时自动化、子代理委派、沙箱隔离、可视化配置中心，并在现有前端界面中提供良好的 OpenClaw / Hermes / 协同使用体验。

## 当前目标
修复 Windows 端启动 OpenClaw 后健康检查过慢、AI 会话仍显示等待 Gateway 就绪、首页日志暴露非致命 pricing fetch 错误，以及频繁点击后程序未响应的问题。

## 已完成
- Gateway 健康检查改为端口先行：端口可连接时立即把 Gateway 标记为可用，后台继续健康检查。
- AI 会话页面增加轻量 Gateway 状态轮询，避免首页已启动但会话页长期停留在等待就绪。
- Gateway 日志改为内存缓冲并异步批量写入 `data/.openclaw/logs/gateway-launcher.log`，减少 U 盘同步写入导致的主进程卡顿。
- 首页实时日志隐藏 `[model-pricing] LiteLLM/OpenRouter pricing fetch failed` 这类非致命价格表拉取失败，避免误导用户。
- 关闭 OpenClaw 对话流式事件中的大量 `[DEDUP-DEBUG]` 和 `_handleMessage` 高频调试输出，降低 renderer 压力。
- 将上述修复同步进 `scripts/restore-openclaw-shell.mjs`，后续从基线恢复或重新打包不会丢失。
- 已重新构建 `dist`，并同步到 `F:\win-unpacked\resources\app\dist`。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-24-windows-gateway-readiness-performance.md`

## 关键决策
- 不通过禁用切换、不阻塞用户操作、不强行终止任务来规避卡顿，而是降低主进程同步 I/O 和渲染层高频日志压力。
- pricing fetch 失败属于后台价格表获取失败，不作为首页实时错误展示；完整日志仍保存在 U 盘 data 目录。
- Gateway 就绪判断不再只依赖 `/health`，端口已经打开时即可让 UI 进入可连接状态，避免用户看到互相矛盾的状态。

## 待继续
- 需要用户用更新后的 `F:\win-unpacked\OpenClawPro.exe` 实测：启动 OpenClaw、进入 AI 会话、微信扫码发消息、连续切换页面。
- 如果仍出现未响应，需要重点查看 `F:\data\.openclaw\logs\desktop-crash.log`、`gateway-launcher.log` 和 Windows 任务管理器中 Gateway Node 的 CPU 占用。
- OpenClaw runtime 验证仍提示若干 optional/static imports 缺包警告，当前 CLI smoke 通过；如 Feishu/Matrix/LanceDB/Canvas 特定功能失败，再补对应 runtime 依赖。

## 验证结果
- `node --check src\openclaw-shell-app\dist\main\index.js` 通过。
- `node --check scripts\restore-openclaw-shell.mjs` 通过。
- `npm.cmd run build` 通过。
- 已同步构建到 `F:\win-unpacked\resources\app\dist`，并检查 `index.js/index.cjs/preload` 语法通过。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-openclaw-runtime.mjs`：runtime 结构和 CLI smoke 通过；Gateway 未运行时 `ready=false`。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-hermes-runtime.mjs`：Hermes/Python/Node 版本检查通过；端口未启动时为 false。

## 如果需要下一台 Codex 接手，提示词
继续开发 `D:\github\u-agent`。当前阶段刚修复 Windows 端 Gateway 就绪判断和性能卡顿：主进程 Gateway 日志已改为异步缓冲写盘，AI 会话页有轻量 Gateway 状态轮询，pricing fetch 失败不再显示在首页实时日志，高频聊天 debug 已关闭，并同步到 `scripts/restore-openclaw-shell.mjs`。请先运行 `git status`、`npm.cmd run build`、`AGENT_HUB_ROOT=F:\ node scripts\verify-openclaw-runtime.mjs`、`AGENT_HUB_ROOT=F:\ node scripts\verify-hermes-runtime.mjs`，再让用户测试 `F:\win-unpacked\OpenClawPro.exe`。如果仍未响应，优先分析 `F:\data\.openclaw\logs\desktop-crash.log` 和 `gateway-launcher.log`，不要通过禁用页面切换或阻塞用户操作来绕开问题。
