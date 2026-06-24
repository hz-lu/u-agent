# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心。所有能力需要和现有程序前端界面无缝融合，在保留 OpenClaw 原有体验的基础上集成 Hermes，并提供良好的用户体验。

## 当前目标
修复 Windows 测试盘 `F:\` 中启动界面卡很久、点击后未响应/闪退、首页显示 OpenClaw 已启动但 AI 会话/微信仍等待就绪的问题。

## 已完成
- 修复 `openclaw-weixin` 插件请求头：移除手动 `Content-Length`，并在 fetch 前兜底删除，解决 Node/undici `invalid content-length header`。
- 同步修复 F 盘已安装插件 `F:\data\.openclaw\extensions\openclaw-weixin\src\api\api.ts`。
- 将启动页改为 8 秒超时兜底显示主界面，Gateway 继续后台启动，避免卡在 `等待就绪 / 健康检查中`。
- 将 `start-gateway` IPC 改为后台启动，不再等待完整健康检查返回，降低点击按钮导致前端假死的概率。
- 将 Windows 端口清理改为异步 `exec`，避免 `execSync/netstat/taskkill/ping` 阻塞 Electron 主进程。
- 放宽插件技能 symlink hook 对 Windows `plugin-skills` 目录的容错，减少 `browser-automation` 目录导致的 EISDIR 启动噪声。
- 更新 `scripts/restore-openclaw-shell.mjs`，确保后续 restore/构建不会丢失这些源码级修复。
- 重新构建并同步 `dist` 到 `F:\win-unpacked\resources\app\dist`。

## 改动文件
- `extensions/openclaw-weixin/src/api/api.ts`
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-24-windows-gateway-responsive-startup.md`

## 关键决策
- 这次不通过禁用用户切换界面或限制并发操作来“规避”崩溃，而是减少主进程同步阻塞和错误重试噪声。
- Gateway 启动按钮立即返回 `starting`，实际就绪状态继续通过日志、状态事件和健康检查更新。
- 微信插件的 `Content-Length` 由 fetch/undici 自动处理，不再由插件手动设置。
- 测试盘已有插件也同步修复，但根本修复已落在源码和恢复脚本里。

## 待继续
- 微信长轮询在移除非法 header 后仍出现 `UND_ERR_CONNECT_TIMEOUT`，这是连接 `https://ilinkai.weixin.qq.com` 的真实网络超时，需要继续区分网络/代理/服务端/登录态。
- OpenClaw `provider auth state pre-warmed` 仍可出现约 4 秒事件循环卡顿，`chat.metadata/chat.startup` 仍有 6-9 秒耗时，需要继续做更深的 OpenClaw runtime 启动期优化。
- 需要用户重新启动 `F:\win-unpacked\OpenClawPro.exe` 后实测 UI 是否还会未响应或闪退。
- 若微信已扫码连接但消息不回复，需要在新日志中继续跟踪 `getUpdates` 是否成功拿到消息，以及消息是否进入 OpenClaw 会话。

## 验证结果
- `npm.cmd run build` 通过。
- 已同步构建产物到 `F:\win-unpacked\resources\app\dist`。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-openclaw-runtime.mjs` 通过；Gateway ready=false 是因为验证时测试 Gateway 已停止。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-hermes-runtime.mjs` 通过；Hermes 端口 false 是因为服务未启动。
- 使用 F 盘 runtime 启动真实 OpenClaw Gateway 两轮：
  - HTTP listening 从此前日志里的 69.1s 降到 22.7s / 20.6s。
  - Gateway ready 正常出现。
  - 最新启动未再出现 `invalid content-length header`。
  - 微信后续错误变为 `ConnectTimeoutError/UND_ERR_CONNECT_TIMEOUT`，说明请求头问题已修复，剩余是网络连接层问题。

## 如果需要下一台 Codex 接手，提示词
继续在 `D:\github\u-agent` 开发并用 `F:\win-unpacked\OpenClawPro.exe` 做 Windows U 盘测试。当前最新重点是 Windows 稳定性和微信闭环：源码已修复微信插件非法 `Content-Length`、Gateway 启动页卡顿、start-gateway IPC 阻塞、Windows 端口同步清理和 plugin-skills symlink EISDIR 容错。请先 `git pull`，查看 `docs/codex-handoff/2026-06-24-windows-gateway-responsive-startup.md`，然后让用户重新启动 F 盘程序复测。若仍有微信连接失败，重点查 `F:\data\.openclaw\tmp\openclaw\openclaw-2026-06-24.log` 中最新 `openclaw-weixin getUpdates`：当前已从非法 header 变为 `UND_ERR_CONNECT_TIMEOUT`，需要继续定位网络/代理/登录态，并验证扫码后微信消息是否进入 OpenClaw 会话。每阶段完成后执行 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`，并新增 handoff。
