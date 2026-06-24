# Codex Handoff

## 总体目标
基于已开发的U盘便捷版 OpenClaw 实现集成 Hermes，达到零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且与现有 OpenClaw 前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 Windows 测试盘中 OpenClaw 已启动但 AI 会话长时间等待 Gateway、微信扫码连接后 OpenClaw/Gateway 停止或重启、微信插件轮询失败刷屏并拖慢主链路的问题。

## 已完成
- 定位到 Gateway 实际能启动，但 AI 会话初始化被多条 webchat 连接、模型/插件预热和微信插件重启拖慢。
- 定位到微信扫码后存在双重 Gateway 重启：登录子进程调用 `openclaw gateway restart`，IPC 监听又调用 `gateway.restartGateway()`。
- 修改主进程源码：微信登录子进程不再直接执行 Gateway restart，统一由桌面 supervisor 重启一次。
- 修改微信插件启用逻辑：有微信账号/扫码流程时显式启用 `plugins.entries.openclaw-weixin.enabled=true`，避免配置处于 entry/channel 存在但 allowlist 不一致的状态。
- 改进 OpenClaw runtime hook：已有 `plugin-skills/browser-automation` 普通目录且包含 `SKILL.md` 时直接复用，减少 EISDIR 重复异常。
- 改进微信插件源码：记录 `fetch failed` 的 cause 细节；识别微信 session timeout `-14` 并提示“微信登录已过期，请重新扫码连接”，避免短周期错误风暴。
- 构建通过并已把 `dist` 同步到 `F:\win-unpacked\resources\app\dist`。
- 已将当前 F 盘已安装微信插件的 `api.ts`、`monitor.ts` 同步为修复后的源码。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/restore-openclaw-shell.mjs`
- `extensions/openclaw-weixin/src/api/api.ts`
- `extensions/openclaw-weixin/src/monitor/monitor.ts`
- `docs/codex-handoff/2026-06-24-wechat-gateway-stability.md`

## 关键决策
- 先不把微信桥完全拆成独立进程，本阶段先去掉双重重启、修复配置一致性和错误风暴，降低对 OpenClaw 主链路的冲击。
- 当前 F 盘测试配置保留用户已有模型 key 和微信账号数据，只补齐 `plugins.allow` 中的 `openclaw-weixin`。
- `restore-openclaw-shell.mjs` 同步加入修复，保证从 GitHub 重新构建/重新打包不会丢失本次源码级修复。

## 待继续
- 用户需要重新打开 `F:\win-unpacked\OpenClawPro.exe`，启动 OpenClaw 后复测 AI 会话就绪速度和微信消息回复。
- 若微信消息仍拖慢 Gateway，下一步应将微信轮询/消息转发从 Gateway 进程拆到独立受控 worker，彻底隔离微信 channel 对主会话的影响。
- 继续优化 OpenClaw 回复慢的问题：重点看 `embedded_run`、模型流式输出、会话锁恢复和重复 webchat 连接。
- 环境检查里 Hermes 待验证项还需要继续补真实检测闭环。

## 验证结果
- `npm.cmd run build`：通过。
- `node --check dist/main/index.cjs && node --check dist/preload/index.cjs`：通过（由 build 执行）。
- `$env:AGENT_HUB_ROOT='F:\'; node scripts\verify-openclaw-runtime.mjs`：OpenClaw runtime 完整，CLI smoke 通过；Gateway ready 为 false，因为同步前主动停止了测试进程。
- `$env:AGENT_HUB_ROOT='F:\'; node scripts\verify-hermes-runtime.mjs`：Hermes runtime 完整，Python/Node/Hermes CLI 可用；端口未运行，因为测试进程已停止。
- 微信接口用 F 盘 Node + 真实 token 直接请求 `getupdates` 成功拉到用户微信消息“你好”，说明网络和凭据可用，问题在插件/Gateway 集成链路。

## 如果需要下一台 Codex 接手，提示词
你在 `D:\github\u-agent` 继续开发 USB 便携版 OpenClawPro + Hermes 集成项目。总体目标是保持原 OpenClaw UI/功能不被破坏，同时集成 Hermes，实现零安装、零痕迹、Windows/macOS/Linux 原生、Universal 包、技能/记忆/多平台消息等完整闭环。当前重点是 Windows 稳定性：OpenClaw AI 会话就绪慢、微信扫码连接后 Gateway 停止/重启、微信消息不能稳定回复。最新阶段已提交微信稳定性修复：登录子进程不再直接重启 Gateway、openclaw-weixin 配置显式启用、plugin-skills EISDIR 容错、微信 getUpdates 错误详情和 session timeout 友好提示。请先 `git pull`，再复测 `F:\win-unpacked\OpenClawPro.exe`：启动 OpenClaw、进入 AI 会话、扫码微信并发送消息。查看 `F:\data\.openclaw\logs\gateway-launcher.log` 和 `F:\data\.openclaw\tmp\openclaw\openclaw-2026-06-24.log`。如果微信仍拖慢主链路，优先把微信轮询从 Gateway 进程拆成独立 worker，再通过本地 Gateway API/WebSocket 转发消息，避免微信 channel 影响 OpenClaw 主会话。
