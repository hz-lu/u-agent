# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并和现有前端界面无缝融合，提供良好的 OpenClaw / Hermes / 协同体验。

## 当前目标
修复协同会话卡在“阶段 2/2：Hermes 正在复核内部草案并整理最终答复”，但 Hermes 实际已经在 `data/.hermes/runs` 中生成回复、UI 没有显示最终结果的问题。

## 已完成
- 定位根因：Hermes 最新 run 的 `stdout.txt` 已有最终回复，说明 Hermes 后端完成；卡住的是主进程到前端的 `hermes-chat-result` 结果通道。
- 前端 `runHermesChatBackground()` 改为预先生成 `taskId`，先创建等待 Promise，再调用 `ipcHermesChat({ background: true, taskId })`，避免 Hermes 很快返回时事件先发出、前端后监听的竞态。
- 主进程增加 `hermesChatResults` 缓存，后台任务完成后先写缓存，再发送 `hermes-chat-result` 事件。
- 新增 `hermes:chatResult` IPC，preload 暴露 `ipcGetHermesChatResult(taskId)`。
- 前端 `waitForHermesChatResult()` 在监听事件的同时，每 2 秒轮询主进程缓存；即使错过事件，也能拿回结果并 append 到协同消息。
- 修复 preload 中 `ipcOffHermesChatResult(callback)` 无法移除包装 listener 的问题，避免多轮协同后结果监听器堆积。
- 重新构建并部署到 `F:\win-unpacked\resources\app\dist`。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/preload/index.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.cjs`
- `dist/main/index.js`
- `dist/preload/index.cjs`
- `dist/preload/index.js`

## 关键决策
- 不把“阶段 2 卡住”归因于模型慢，因为 F 盘 `data/.hermes/runs/hermes-chat-1782463183886-72atv0/stdout.txt` 已经有 Hermes 回复。
- 结果通道不再依赖一次性 renderer event 必达，改为“事件 + 主进程结果缓存查询”的可恢复闭环。
- 保持 Hermes 子进程和模型调用逻辑不变，只修 UI 结果回传闭环，避免扩大改动范围。

## 待继续
- 用户重新启动 `F:\win-unpacked\OpenClawPro.exe`，测试协同会话发送“你好”：
  - 阶段 1 OpenClaw 生成草案。
  - 阶段 2 Hermes 完成后应出现“协同结果”最终消息。
  - 不应继续停在阶段 2。
- 若仍卡住，优先检查 `F:\data\.hermes\runs\最新目录\stdout.txt` 是否生成，以及 `hermes:chatResult` 是否能拿到缓存结果。

## 验证结果
- `node --check src/openclaw-shell-app/dist/main/index.js` 通过。
- `node --check src/openclaw-shell-app/dist/preload/index.js` 通过。
- `npm run build` 通过。
- F 盘部署后 `node --check F:\win-unpacked\resources\app\dist\main\index.cjs` 通过。
- F 盘部署后 `node --check F:\win-unpacked\resources\app\dist\preload\index.cjs` 通过。
- F 盘产物确认包含：
  - `hermesChatResults`
  - `hermes:chatResult`
  - `ipcGetHermesChatResult`
  - `waitPromise`
  - `pollTimer`
- F 盘旧 dist 已备份：`F:\win-unpacked\resources\app\dist.backup-20260626-170910`。
- 冒烟启动 `F:\win-unpacked\OpenClawPro.exe` 8 秒，进程存活，`desktop-crash.log` 未更新；随后已关闭 F 盘相关进程。

## 如果需要下一台 Codex 接手，提示词
继续开发 `D:\github\u-agent`。最新修复聚焦 Hermes 协同阶段 2 卡住：后端已生成 `data/.hermes/runs/.../stdout.txt`，但 UI 没收到结果。已将前端改成先监听再启动 Hermes background task，并在主进程缓存 `hermes-chat-result`，前端通过 `ipcGetHermesChatResult(taskId)` 轮询兜底。请先用 `F:\win-unpacked\OpenClawPro.exe` 验证协同会话是否能在阶段 2 后显示最终“协同结果”。每次阶段性工作后执行 `git status`、`git diff`、`git add`、`git commit`、`git push`，并更新 `docs/codex-handoff/`。
