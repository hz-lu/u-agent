# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
处理用户反馈的两个问题：
- 只发送一条微信消息，但桌面 AI 会话中显示了两条重复用户消息。
- 微信侧短时间显示“暂无法连接 OpenClaw”，过一会儿又收到回复。

## 已完成
- 定位重复消息不是微信真实发了两条：
  - OpenClaw agent session 中 `zaima` 只有一条。
  - 桌面持久化文件 `data/.openclaw/chat-history/main/messages.jsonl` 中同一条用户消息被写入两次，时间只差 11ms。
- 修复前端合并逻辑：
  - Gateway 历史回灌与本地乐观消息合并时，用户消息也按“同角色、同内容、近时间、localOnly/idempotencyKey”去重。
- 修复主进程本地持久化读写：
  - `save-chat-messages-bulk` 写入前去重。
  - `load-chat-messages` 读取时去重。
- 已将修复后的 app 文件精准同步到当前 U 盘：
  - `/Volumes/OPENCLAW/OpenClawPro.app/Contents/Resources/OpenClawPro-Runtime.app/Contents/Resources/app/dist/main/index.js`
  - `/Volumes/OPENCLAW/OpenClawPro.app/Contents/Resources/OpenClawPro-Runtime.app/Contents/Resources/app/dist/main/index.cjs`
  - `/Volumes/OPENCLAW/OpenClawPro.app/Contents/Resources/OpenClawPro-Runtime.app/Contents/Resources/app/dist/assets/assets/main-DIeui7ZO.js`
- 检查微信连接日志与网络：
  - 日志中存在连续 `getUpdates` 的 `ECONNRESET` / `fetch failed`。
  - `curl -Iv https://ilinkai.weixin.qq.com` 一度在 TLS 握手阶段失败。
  - 随后 `/Volumes/OPENCLAW/runtime/node` 的 `fetch('https://ilinkai.weixin.qq.com', { method: 'HEAD' })` 成功返回 `405 Method Not Allowed`，说明网络有间歇性恢复。
  - 用户随后确认过一会儿微信有消息回复，符合“临时网络/长轮询不可达后恢复”的判断。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `docs/codex-handoff/2026-07-03-openclaw-chat-dedup-weixin-status.md`

## 关键决策
- 未继续修改微信退避策略，因为用户反馈等待后已有回复，说明通道不是永久不可用；当前优先收敛确定的重复消息 bug。
- 未清理或重置 U 盘 `data/.openclaw/openclaw-weixin`，避免破坏已登录微信账号和上下文 token。
- 未修改模型配置、Hermes、OpenClaw Gateway 启动逻辑。
- 对历史去重使用保守条件：
  - 同角色、同内容、时间戳接近。
  - 用户消息要求 5 秒内，且优先匹配 `_localOnly` 或 `idempotencyKey`。
  - assistant 消息沿用原来更宽的 5 分钟近似去重。

## 待继续
- 重启 U 盘上的 OpenClawPro 后验证：
  - 再从微信发送一条普通文本，桌面 AI 会话不应出现两条重复用户消息。
  - 微信如果短时间显示“暂无法连接 OpenClaw”，查看稍后是否恢复回复。
- 后续建议单独做微信通道健康状态优化：
  - 在环境检查或微信状态区域明确显示最近一次 `getUpdates` 失败原因。
  - 区分“Gateway 已启动”和“微信 iLink 长轮询可达”。
  - 评估是否将连续网络失败的退避从 30 秒调整为更短/指数退避，并避免微信侧长时间判定 bot 不可达。

## 验证结果
- `npm run build` 通过。
- `node --check src/openclaw-shell-app/dist/main/index.js` 通过。
- `git diff --check` 通过。
- 已用日志确认 15:31 的重复用户消息发生在桌面 `chat-history/main/messages.jsonl`，agent session 中只有一条真实用户消息。
- 已确认微信 iLink 连接存在间歇性 TLS/ECONNRESET 问题，并且用户反馈随后能恢复回复。

## 如果需要下一台 Codex 接手，提示词
继续在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支上开发。最新上下文：模型切换问题已解决；微信下行发送之前加过有限重试；本轮修复了桌面 AI 会话中同一条微信入站消息被本地乐观消息和 Gateway 历史回灌重复显示的问题。当前微信“暂无法连接 OpenClaw”主要证据是 `getUpdates` 到 `https://ilinkai.weixin.qq.com` 间歇性 `ECONNRESET`，用户等待后又收到回复。下一步如果继续处理微信通道，请不要清空 `data/.openclaw/openclaw-weixin`，优先改健康状态展示与可恢复退避策略。
