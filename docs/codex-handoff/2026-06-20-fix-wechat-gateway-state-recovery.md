# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长（持久记忆 + 自动生成技能）、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并和现有程序前端界面无缝融合。保留 OpenClaw 原有功能与体验，同时让 Hermes 在首页、AI 会话、模型配置、环境检查、技能管理等模块自然协同，为用户提供清晰、可操作、可验证的体验。

## 当前目标
修复用户已启动 OpenClaw 后，在聊天工具的微信页点击“重新扫码”，再回到 AI 会话时显示 Gateway/OpenClaw 未开启，需要手动重新启动的问题。

## 已完成
- 定位根因：微信扫码成功后主进程会执行 `gateway.restartGateway()`，让微信插件加载新账号；重启期间前端 Gateway store 会收到停止状态，AI 会话页随即显示未开启。重启完成后主进程虽然发送了 `gateway-restarted`，但 preload 未暴露该事件，前端也未监听恢复状态。
- 在 `scripts/restore-openclaw-shell.mjs` 中新增 `patchGatewayRestartStatus()`，恢复/部署主进程时会把 `restartGateway()` 改为：重启成功后主动发送 `gateway-status: running=true`、`gateway-ready=true`、`gateway-restarted:{ success:true }`；失败时发送失败状态。
- 在 `patchHermesPreload()` 中暴露 `onGatewayRestarted/offGatewayRestarted`，让渲染层可以接收 `gateway-restarted`。
- 新增 `patchGatewayRestartRecoveryUi()`，恢复/部署渲染 bundle 时为 Gateway store 增加 `gateway-restarted` 监听；成功后恢复 `running=true`、`gatewayReady=true` 并写入端口，AI 会话页 watcher 会自动重连。
- 已重新执行恢复脚本，部署到 `E:\win-unpacked\resources\app`；部署前备份为 `E:\backups\app-before-openclaw-shell-restore-20260620185846`。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-20-fix-wechat-gateway-state-recovery.md`

## 关键决策
- 微信重新扫码后的 Gateway 重启是合理行为，因为需要刷新微信账号配置；问题不应通过取消重启解决，而应让 UI 正确展示“重启中/已恢复”。
- 主进程在 `restartGateway()` 完成后必须发送强状态事件，不能只依赖 stdout 中的 ready 文本。
- 前端 Gateway store 需要监听 `gateway-restarted`，否则 AI 会话页容易停留在重启过程中的旧 stopped 状态。

## 待继续
- 后续可把微信重新扫码时的 UI 文案改成“重新扫码会自动重启 Gateway 并刷新微信账号”，降低用户困惑。
- 可进一步增加 Gateway 重启中的进度态，避免 AI 会话页短暂显示“未开启”。
- 继续推进微信消息端到端回复、Hermes skills 真实调用、cron/connectors/sandbox/subagent 等闭环。

## 验证结果
- `node --check scripts/restore-openclaw-shell.mjs` 通过。
- `node scripts/restore-openclaw-shell.mjs` 成功重新部署当前桌面程序。
- 已反查 `E:\win-unpacked\resources\app\dist\main\index.js`，确认 `restartGateway()` 成功后会发送 `sendGatewayStatus(true)`、`gateway-ready`、`gateway-restarted`。
- 已反查 `E:\win-unpacked\resources\app\dist\preload\index.js`，确认暴露 `onGatewayRestarted/offGatewayRestarted`。
- 已反查 `E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js`，确认 Gateway store 已监听 `gateway-restarted` 并恢复 UI 状态。
- `node scripts/verify-hermes-runtime.mjs` 通过。
- `node scripts/audit-portable-release.mjs` 显示 Windows portable、Windows zero install、strict zero trace 已通过；三平台原生与 Universal zip 仍未完成。
- 启动 `E:\win-unpacked\OpenClawPro.exe` 后，多个 `OpenClawPro` 进程均显示 `Responding=True`。

## 如果需要下一台 Codex 接手，提示词
继续在 `E:\source\openclawpro-agent-hub` 开发。当前刚修复微信“重新扫码”后 AI 会话页误显示 Gateway 未开启的问题：微信扫码成功会重启 Gateway，这是为了加载账号配置；修复点是主进程重启完成后广播 `gateway-status/gateway-ready/gateway-restarted`，preload 暴露 `onGatewayRestarted`，前端 Gateway store 收到后恢复运行态并让 AI 会话自动重连。不要取消微信扫码后的 Gateway 重启。每个阶段结束后执行 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`，并新增 `docs/codex-handoff/YYYY-MM-DD-xxx.md`，handoff 必须包含“总体目标”。
