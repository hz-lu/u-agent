# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw 实现集成 Hermes，达到零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并与现有 OpenClaw 前端界面无缝融合，提供良好的用户体验。

## 当前目标
根据多 Agent 对抗性审查结果，从第一性原理修复 Gateway readiness 误判、Hermes 后台任务生命周期不闭环、Electron 宿主机写入痕迹、构建脚本可重复性风险，并把构建产物部署到 F 盘测试壳。

## 已完成
- Gateway 只有 health/真实 ready 后才标记 `gatewayReady=true`，不再把端口打开或进程 running 当成可对话状态。
- AI 会话前端只在 `gatewayReady` 为真时触发 OpenClaw WebSocket 连接，降低反复连接导致的等待、卡顿和假就绪。
- Hermes 会话与协同会话保存 `activeTaskId`，刷新或重进页面后会继续拉取后台任务结果。
- Hermes `/stop` 和停止按钮改为真正调用 IPC 取消后台 oneshot 子进程，不再只是 toast。
- Hermes oneshot 任务新增 `status.json/result.json` 落盘，恢复逻辑只读取 finished/failed/cancelled 状态，不再把稳定的 `stdout.txt` 当作最终结果。
- Electron 非开发模式下 `userData/sessionData/crashDumps/logs` 改到 U 盘 `data/.openclaw/electron` 下，减少宿主机 AppData 写入。
- 构建脚本加入零痕迹路径校验，避免 source dist 缺失便携路径时仍静默构建。
- 已重新构建 `D:\github\u-agent\dist`，并部署到 `F:\win-unpacked\resources\app\dist`。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/preload/index.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `dist/preload/index.js`
- `dist/preload/index.cjs`
- `dist/assets/assets/main-DIeui7ZO.js`
- `scripts/build-openclaw-shell-app.mjs`
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-29-gateway-hermes-lifecycle.md`

## 关键决策
- `running` 只表示进程或端口层面，不能代表 OpenClaw AI 会话可用；AI 会话只认 `gatewayReady`。
- Hermes 后台任务必须有 taskId、进程句柄、状态文件、结果文件四件套，刷新、取消、完成、失败都走同一套闭环。
- 不通过限制用户切换 Tab 来规避崩溃，修复点放在后台任务和 IPC 生命周期上。
- 构建产物仍来自 `src/openclaw-shell-app/dist`，因此源码包和根 `dist` 同步提交，避免下一次 clone/build 丢失修复。

## 待继续
- 继续实机验证 F 盘壳：启动 OpenClaw、进入 AI 会话、发送消息、微信扫码发消息、Hermes 对话、协同会话阶段 1/2。
- `scripts/restore-openclaw-shell.mjs` 仍存在旧式 Hermes `/stop` toast 模板片段，当前构建不使用该路径；后续若要继续维护恢复脚本，应把该历史补丁函数彻底迁移到当前 Adapter 结构。
- 便携发布审计仍显示仓库缺完整 runtime：Windows OpenClaw/Hermes runtime、macOS/Linux runtime、Universal manifest/zip、初始化 data 模板等。
- 需要继续做性能剖析：如果实机仍卡顿，优先抓 Electron 主进程日志、renderer console、Gateway health/WS 时序，而不是继续盲改 UI。

## 验证结果
- `node --check src/openclaw-shell-app/dist/main/index.js` 通过。
- renderer bundle 复制为 `.mjs` 后 `node --check` 通过。
- `node --check scripts/build-openclaw-shell-app.mjs` 通过。
- `node --check scripts/restore-openclaw-shell.mjs` 通过。
- `npm run build` 通过。
- F 盘部署后：
  - `node --check F:\win-unpacked\resources\app\dist\main\index.cjs` 通过。
  - `node --check F:\win-unpacked\resources\app\dist\preload\index.cjs` 通过。
  - F 盘 renderer bundle 复制为 `.mjs` 后 `node --check` 通过。
- `npm run audit:openclaw-shell` 通过，24/24。
- `npm run audit:portable` 未完全通过：严格零痕迹为 true，但 Windows 完整便携 runtime、三平台 runtime、Universal zip 尚未齐备。

## 如果需要下一台 Codex 接手，提示词
你正在继续开发 `D:\github\u-agent`，测试 U 盘壳在 `F:\win-unpacked`。请先阅读 `docs/codex-handoff/2026-06-29-gateway-hermes-lifecycle.md`，不要回滚用户或上一台 Codex 已做的改动。当前重点是实机验证 OpenClaw Gateway readiness、AI 会话发送、微信扫码消息链路、Hermes 对话、协同会话阶段 1/2，以及继续定位 Windows 端卡顿/闪退。注意：`running` 不能当成 `gatewayReady`，Hermes 后台任务必须通过 taskId + status.json/result.json 闭环。每次阶段性工作后执行 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`，并新增 handoff 文档且在 `## 当前目标` 前保留 `## 总体目标`。
