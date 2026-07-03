# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 macOS U 盘版中微信消息已经在桌面 UI 生成回复、但微信侧未收到回复的问题，并避免网络发送失败被误报为“媒体文件下载失败”。

## 已完成
- 检查 U 盘运行日志，确认 OpenClaw 生成回复正常，失败集中在 `openclaw-weixin` 下行发送链路。
- 针对 `sendMessage` 下行接口增加有限重试：最多 3 次，间隔 800ms / 2000ms。
- 将普通微信发送默认超时从 15 秒提高到 30 秒，降低慢网络或微信服务抖动导致的误失败。
- 将错误提示分类拆开：
  - 远程媒体下载失败才提示“媒体文件下载失败”。
  - CDN 上传失败提示“媒体文件上传失败”。
  - `fetch failed`、`AbortError`、`ECONNRESET`、超时等下行发送问题提示“微信消息发送失败，网络连接不稳定或微信服务暂时不可达”。
- 已将修复后的插件源码精准同步到当前挂载的 U 盘插件镜像：
  - `/Volumes/OPENCLAW/data/.openclaw/extensions/openclaw-weixin/src/messaging/send.ts`
  - `/Volumes/OPENCLAW/data/.openclaw/extensions/openclaw-weixin/src/messaging/process-message.ts`

## 改动文件
- `extensions/openclaw-weixin/src/messaging/send.ts`
- `extensions/openclaw-weixin/src/messaging/process-message.ts`
- `docs/codex-handoff/2026-07-03-weixin-outbound-retry.md`

## 关键决策
- 不改模型配置和 OpenClaw 主对话逻辑，因为用户确认模型问题已解决，且桌面 UI 已生成回复。
- 不清理或重置 U 盘 `data/.openclaw/openclaw-weixin` 账号数据，避免破坏已登录微信状态。
- 不做无限重试，避免重复发送和阻塞回复链路；仅对典型瞬时网络错误做有限重试。
- 插件修复是源码级修改；当前测试可只同步插件源码，不需要重新复制 runtime 或整个 app。

## 待继续
- 用户需要完整退出并重新打开 OpenClawPro，让 Gateway 重新加载 U 盘插件源码。
- 继续观察 `data/.openclaw/logs/gateway-launcher.log`：
  - 如果出现 `sent after retry`，说明瞬时网络抖动已被重试恢复。
  - 如果仍连续出现 `send attempt 3/3 failed`，需要继续检查当前网络到 `https://ilinkai.weixin.qq.com` 的可达性、代理、TLS 或微信服务侧限流。
- 后续可考虑在 UI 微信状态面板中展示“最后一次微信下行发送失败”状态，避免只看到“启动成功”。

## 验证结果
- `npm run build` 通过。
- `npm --prefix extensions/openclaw-weixin run build --if-present` 通过。
- 已用 `rg` 确认 U 盘插件镜像包含新逻辑：
  - `sendMessageWithRetry`
  - `classifyWeixinReplyError`
  - `微信消息发送失败，网络连接不稳定或微信服务暂时不可达`

## 如果需要下一台 Codex 接手，提示词
继续在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支上开发。最新上下文：模型选择问题已修复，当前聚焦微信插件下行发送稳定性。用户反馈桌面 UI 已生成回复但微信侧收不到，日志中出现 `fetch failed`、`ECONNRESET`、`AbortError`、`weixin reply block`。已在 `extensions/openclaw-weixin/src/messaging/send.ts` 增加有限重试，并在 `process-message.ts` 区分媒体下载、媒体上传、网络发送错误。下一步如果仍失败，请读取 `/Volumes/OPENCLAW/data/.openclaw/logs/gateway-launcher.log`，查看是否有 `send attempt` / `sent after retry`，再判断是网络不可达、代理/TLS、微信服务限流，还是插件发送参数问题。
