# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心；所有能力都要和现有程序前端界面无缝融合，让用户在前端界面上获得良好体验。

## 当前目标
修复 Hermes AI 会话进入后一直转圈、发送消息无反馈的问题，并保持最近性能/稳定性修复不回退。

## 已完成
- 在主进程 Hermes chat result 恢复逻辑中识别僵尸 running 任务：如果 status.json 显示 running，但当前主进程没有对应子进程且任务已超过 30 秒，会自动写入 interrupted result 并通过 IPC 返回给前端。
- 主进程对仍然存在的 live child 返回 pending 状态，避免把真实正在运行的 Hermes 任务误判为中断。
- 前端恢复 Hermes/协同历史任务时，先查询主进程任务状态：result 立即收口，pending 继续等待，找不到任务则释放等待态。
- Hermes 发送入口不再静默吞掉“发送中”的新消息：如果旧任务已恢复则允许继续发送；如果确实有任务在跑，则给出明确中文提示。
- 增加 Hermes 后台聊天任务 accepted 日志，便于后续判断消息是否进入主进程。
- 修复 scripts/deploy-to-usb.mjs 对当前 dist/assets/main/index.html 结构的检查兼容问题。
- 已重新构建 dist，并将最新 dist 部署到 F:\win-unpacked\resources\app\dist。

## 改动文件
- src/openclaw-shell-app/dist/main/index.js
- src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js
- dist/main/index.js
- dist/main/index.cjs
- dist/assets/assets/main-DIeui7ZO.js
- scripts/deploy-to-usb.mjs
- docs/codex-handoff/2026-06-29-hermes-stale-task-recovery.md

## 关键决策
- 不通过禁用 Tab、阻塞输入、缩短正常任务超时来掩盖问题；只收口“当前进程没有子进程的历史 running 任务”。
- 30 秒僵尸阈值只在无 live child 时生效，正常 Hermes 长任务仍可继续后台等待。
- 这次修复不触碰 OpenClaw 对话主链路，降低回归风险。
- F 盘部署脚本默认根目录识别仍可能命中仓库自身，后续自动部署建议显式设置 AGENT_HUB_ROOT=F:\。

## 待继续
- 用户重新打开 F:\win-unpacked\OpenClawPro.exe 后，验证 Hermes Tab 不再被旧任务卡死，并验证发送“你好”会显示用户消息、生成新 run、最终得到回复或友好错误。
- 若仍有未响应，需要继续从主进程事件循环阻塞、OpenClaw Gateway 高 CPU、重复 OpenClawPro 进程残留三个方向排查。
- 后续可补一个轻量 UI 状态：显示“正在恢复上一次 Hermes 任务/已恢复会话”，让用户更明确。

## 验证结果
- node --check src\openclaw-shell-app\dist\main\index.js：通过。
- node --check renderer bundle 临时 mjs：通过。
- npm run build：通过。
- node --check scripts\deploy-to-usb.mjs：通过。
- npm run audit:openclaw-shell：24/24 通过。
- 部署后 F:\win-unpacked\resources\app\dist\main\index.js 包含 HERMES_CHAT_STALE_MS、accepted background task、stale task close 逻辑。
- 部署后 F:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js 包含 clearRecoveredHermesTask、prepareRecoveredHermesTask、中文发送中提示。

## 如果需要下一台 Codex 接手，提示词
请在 D:\github\u-agent 继续开发 OpenClawPro 便携版。当前目标是稳定 OpenClaw + Hermes 双 Agent 的 Windows U 盘体验。最新修复集中在 Hermes 历史 running 任务恢复：主进程会把无 live child 的旧 running 任务收口为 interrupted result，前端恢复历史任务时根据 result/pending/不存在三种状态释放或等待。请先运行 git status、npm run audit:openclaw-shell，并检查 F:\data\.hermes\runs 是否仍有旧 running 任务。用户测试路径是 F:\win-unpacked\OpenClawPro.exe，构建后需要把 dist 部署到 F:\win-unpacked\resources\app\dist。不要禁用 Tab 或阻塞用户交互来规避问题，必须从任务状态、IPC、事件循环和进程生命周期闭环修复。
