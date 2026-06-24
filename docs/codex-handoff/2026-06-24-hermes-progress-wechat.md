# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心。所有能力需要和现有程序前端界面无缝融合，保留 OpenClaw 原有体验，并让 Hermes 在前端操作上具备良好用户体验。

## 当前目标
修复 Hermes 会话执行过程刷屏和协作会话进度混入问题；修复微信扫码连接时因旧插件安装缓存导致的重复安装失败。

## 已完成
- Hermes 独立会话的执行过程改为单条 OpenClaw 风格工具块，不再生成多条普通聊天消息。
- Hermes 工具块在执行中自动展开，完成或失败后自动折叠，避免结果页刷屏。
- 协作会话不再展示 Hermes 细碎进度，只保留协作阶段和最终结果。
- 微信插件在线安装前会自动清理 `data/.openclaw/npm/projects` 下残留的 `tencent-weixin-openclaw-weixin-*` 缓存目录，并使用 `--force` 安装。
- 修复已同步到源码、构建产物和恢复脚本，避免以后重新构建时丢失。
- 已把新构建产物同步到 `F:\win-unpacked\resources\app\dist`。
- 已清理当前测试盘残留目录 `F:\data\.openclaw\npm\projects\tencent-weixin-openclaw-weixin-7783ac86ba`。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-24-hermes-progress-wechat.md`

## 关键决策
- 当前 Hermes 接入路径没有稳定暴露 OpenClaw 那种结构化工具调用 UI 遥测，本阶段使用主进程已有 Hermes progress 事件，统一归并成前端工具块。
- 协作模式中隐藏 Hermes 过程进度，避免用户把协作阶段消息和底层执行日志混淆。
- 微信扫码失败截图中的核心错误是旧 npm project 中插件已存在，本阶段选择安装前主动清理该缓存并强制安装。

## 待继续
- 继续观察微信扫码后是否能正常写入账号凭据并触发 Gateway 刷新。
- 深入处理 OpenClaw Gateway 日志里反复出现的 `plugin skill symlink EISDIR` 和 event loop delay 警告，这些仍可能影响 Windows 端卡顿体验。
- 若需要 Hermes 完全等同 OpenClaw 的工具调用过程展示，需要进一步研究 Hermes 官方 runtime 是否能输出结构化 tool-call telemetry，而不只是阶段进度文本。

## 验证结果
- `npm.cmd run build` 通过。
- `node --check src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js` 通过。
- `node --check src/openclaw-shell-app/dist/main/index.js` 通过。
- `node --check scripts/restore-openclaw-shell.mjs` 通过。
- `AGENT_HUB_ROOT=F:\ node scripts/verify-openclaw-runtime.mjs` 通过，OpenClaw CLI smoke 成功，Gateway ready；仍有飞书、Matrix、LanceDB、canvas-host 相关可选依赖缺失警告。
- `AGENT_HUB_ROOT=F:\ node scripts/verify-hermes-runtime.mjs` 通过，Hermes/Python/Node/API/config 端口可识别；Dashboard 端口未启动。

## 如果需要下一台 Codex 接手，提示词
继续在 `D:\github\u-agent` 开发 U 盘便携版 OpenClawPro + Hermes 集成。当前重点：验证微信扫码闭环，确认扫码后 `F:\data\.openclaw\openclaw-weixin` 或 `F:\data\.openclaw\.openclaw\openclaw-weixin` 是否写入账号凭据，并检查 Gateway 是否能加载微信通道；继续排查 Windows 端卡顿，重点看 `F:\data\.openclaw\logs\gateway-launcher.log` 中 `event_loop_delay`、`embedded_run`、`plugin skill symlink EISDIR`。注意所有修复必须进入源码和构建脚本，不做临时补丁；阶段结束后执行 git status、git diff、git add、git commit、git push，并新增 handoff 文档，且 handoff 中 `## 当前目标` 前必须有 `## 总体目标`。
