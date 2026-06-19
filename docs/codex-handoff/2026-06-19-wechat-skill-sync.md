# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、持久记忆与自动技能、多平台接入、自然语言定时自动化、子代理委派、沙箱隔离、可视化配置中心，并和现有前端界面无缝融合，前端操作体验要自然清晰。

## 当前目标
修复微信二维码/连接后不回复的问题，并确认 OpenClaw 与 Hermes 共用同一批已安装 skills，未来新增 skills 能自动同步给 Hermes 使用。

## 已完成
- 修复桌面 Gateway 启动环境，强制使用 U 盘 `E:\data\.openclaw` 作为 OpenClaw 状态目录和配置目录。
- 修复微信二维码事件链路，preload 暴露 `ipcOnWeChatQrText`，前端收到二维码 URL 或文本后进入扫码状态并显示二维码。
- 登录完成后自动重启 Gateway，让新扫码账号立即被 Gateway 加载。
- 修复微信插件 `fetch failed` 根因：移除 `getUpdates` 手动 `Content-Length` 头，避免 undici 抛 `UND_ERR_INVALID_ARG invalid content-length header`。
- 为微信插件保留 `node:https` fallback 和详细 cause 日志，后续网络异常能看到真实原因。
- 保持 Hermes skill 同步路径：`E:\skills` 镜像到 `E:\data\.hermes\skills\openclaw`，当前已验证两边均为 82 个条目。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-19-wechat-skill-sync.md`
- 部署脚本已重新生成 `E:\win-unpacked\resources\app`
- 部署脚本已修补已安装插件 `E:\data\.openclaw\extensions\openclaw-weixin\src\api\api.ts`

## 关键决策
- 不把微信修复做成一次性的手工补丁，而是放入 `restore-openclaw-shell.mjs`，以后恢复/部署仍会自动修复已安装插件。
- Hermes skills 以 OpenClaw 当前配置的 `skills.load.extraDirs` 为来源，`E:\skills` 作为共享 skill 源目录，Hermes 在 start/status/chat/API/dashboard/manual sync 前刷新镜像。
- Gateway 不再依赖宿主机默认 home/config，显式传入 `OPENCLAW_STATE_DIR` 和 `OPENCLAW_CONFIG_PATH`，减少 U 盘便携版状态分裂。

## 待继续
- 请在桌面程序里重新打开微信连接页，确认二维码可以直接显示。
- 启动 Gateway 后从微信发一条新消息，确认 OpenClaw 能收到并回复。
- 后续可把微信日志面板从 OpenClaw 临时日志读取迁移到 U 盘 `data/.openclaw/logs`，进一步接近零痕迹。

## 验证结果
- `node --check scripts/restore-openclaw-shell.mjs` 通过。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\preload\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- 使用 OpenClaw runtime Node 直接调用微信 `getUpdates`，不带 `Content-Length` 时返回 `200` 和 `get_updates_buf`。
- `E:\skills` 与 `E:\data\.hermes\skills\openclaw` 均为 82 个条目。

## 如果需要下一台 Codex 接手，提示词
继续在 `E:\source\openclawpro-agent-hub` 开发 U 盘便携版 OpenClaw + Hermes 集成。先检查 `scripts/restore-openclaw-shell.mjs` 和最新 handoff。重点验证桌面程序微信二维码显示、微信发消息回复、Hermes skill 真实调用闭环。每个阶段结束按用户要求执行 `git status`、`git diff`、`git add`、`git commit`、`git push`，并新增 `docs/codex-handoff/YYYY-MM-DD-xxx.md`，handoff 中 `## 当前目标` 前必须有 `## 总体目标`。
