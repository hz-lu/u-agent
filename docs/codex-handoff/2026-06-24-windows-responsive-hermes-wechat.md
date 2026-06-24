# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw 实现集成 Hermes，做到零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离和可视化配置中心，并且所有 Hermes 能力都要和现有 OpenClaw 前端界面无缝融合，给用户良好的操作体验。

## 当前目标
修复 Windows 端近期反馈的两个高影响稳定性问题：Hermes/协同对话触发自动启动后桌面程序未响应，以及微信扫码连接后 Gateway/OpenClaw 被重启导致 AI 会话和微信通道短暂不可用。

## 已完成
- Hermes 对话 IPC 新增后台任务模式：前端发送 Hermes/协同请求时传入 `background: true`，主进程立即返回 `taskId`，最终结果通过 `hermes-chat-result` 事件回传。
- Preload 暴露 `ipcOnHermesChatResult` / `ipcOffHermesChatResult`，前端新增 `runHermesChatBackground` 和 `waitForHermesChatResult`。
- Hermes 自动启动改为后台启动，不再在 `HermesManager.chat()` 中等待配置服务完整就绪后才继续当前对话。
- 微信插件配置不再在扫码/登录路径写入 `plugins.allow`，避免 Gateway 运行中检测到配置变化并热重启。
- OpenClaw 便携配置重写不再过滤掉 `openclaw-weixin`，避免与微信登录流程互相打架。
- 微信登录完成后不再由桌面壳强制 `gateway.restartGateway()`，只刷新微信状态并记录“Gateway keeps running”。
- WechatManager 内部登录完成日志改为账号凭据保存提示，不再提示 Gateway 已刷新/已重启。
- 将上述策略写入 `scripts/restore-openclaw-shell.mjs` 的最终稳定化步骤，保证以后从基线恢复/重新构建不会丢失。
- 重新构建 `dist` 并同步到 `F:\win-unpacked\resources\app\dist`。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/preload/index.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `dist/preload/index.js`
- `dist/preload/index.cjs`
- `dist/assets/assets/main-DIeui7ZO.js`
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-24-windows-responsive-hermes-wechat.md`

## 关键决策
- 不通过禁用切换 tab、禁止并发点击、终止长任务来掩盖问题；改为让 Hermes 长耗时任务后台运行，UI 继续可交互。
- 微信扫码登录成功后不主动重启 Gateway。原日志显示重启会导致 20 秒以上不可用窗口，还可能被用户理解为 OpenClaw 自动关闭。
- 不在扫码路径写 `plugins.allow`，避免触发 OpenClaw runtime 的配置 reload/restart。
- 保留首页手动“重启 Gateway”按钮的正常能力；本次只切断微信扫码链路的自动重启。

## 待继续
- 需要用户关闭并重新打开 `F:\win-unpacked\OpenClawPro.exe` 后实测：Hermes 未启动时直接对话、协同对话、微信扫码后发消息。
- 如果仍出现 Windows “未响应”，继续采集新日志，重点看 OpenClaw runtime 是否仍有 `event_loop_delay` / `embedded_run` CPU 长时间打满。
- Hermes 官方原生过程流如果有更细粒度事件接口，后续可替代当前基于 stdout/stderr 的进度提示。
- 微信消息链路如果仍偶发慢，需要继续看 `openclaw-weixin` 的 `getUpdates` 网络错误和企业微信/微信侧 API 延迟。

## 验证结果
- `node --check src\openclaw-shell-app\dist\main\index.js` 通过。
- `node --check scripts\restore-openclaw-shell.mjs` 通过。
- `npm.cmd run build` 通过。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-openclaw-runtime.mjs` 通过，runtime integrity `ok=true`，仅保留可选依赖 warning。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-hermes-runtime.mjs` 通过，Hermes/Python/Node runtime 均可用。
- `F:\win-unpacked\resources\app\dist\main\index.js` 语法检查通过。
- F 盘主进程内容确认包含 `hermes-chat-result` 和 `login complete; Gateway will keep running`，未再出现微信扫码旧重启标记。

## 如果需要下一台 Codex 接手，提示词
请在 `D:\github\u-agent` 继续开发 OpenClawPro U 盘便携版项目。当前目标是稳定 Windows 端 OpenClaw + Hermes + 微信集成体验。先阅读 `docs/codex-handoff/2026-06-24-windows-responsive-hermes-wechat.md` 以及最近几个 handoff。重点验证：Hermes 未启动时 AI 会话直接发送是否还导致未响应；协同会话是否后台运行并回传结果；微信扫码成功后是否不再触发 Gateway 重启。不要通过禁用 tab 切换或终止长任务来修复体验问题；需要做源码级修复，并同步 `src/openclaw-shell-app/dist`、`dist` 和 `scripts/restore-openclaw-shell.mjs`。每阶段结束执行 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`。
