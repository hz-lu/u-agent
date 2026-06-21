# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并与现有程序前端界面无缝融合，让用户在前端界面上获得良好的 OpenClaw + Hermes 协作体验。

## 当前目标
修复 Hermes 对话执行稍复杂任务时桌面程序卡死/闪退的问题。

## 已完成
- 确认现场现象：OpenClaw Gateway 的 `node.exe` 仍在运行，但 `OpenClawPro` Electron 桌面进程消失，说明崩溃主要发生在桌面壳/主进程侧，而不是 Gateway。
- 给 Hermes chat 子进程增加 stdout/stderr 输出护栏：
  - stdout 只保留固定大小尾部内容。
  - stderr 只保留固定大小尾部内容。
  - stderr 日志推送到 UI 限流为约 1 秒一次。
  - 输出超过阈值后自动 kill Hermes 子进程，并向用户返回“任务输出过大，已终止以保护桌面程序”的错误。
- 前端调用 Hermes chat 时显式传入保守阈值：
  - `maxStdoutBytes: 524288`
  - `maxStderrBytes: 131072`
- 重新生成 `E:\win-unpacked\resources\app` 部署包。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-21-hermes-chat-output-guard.md`

## 关键决策
- 复杂 Hermes 任务的直接风险是子进程输出无限缓存和高频 IPC 日志推送，这会导致 Electron 主进程/渲染进程压力过大。
- 当前先做止崩护栏：限制输出、限流日志、超量终止。
- 如果后续仍出现闪退，需要进一步把 Hermes chat 从 Electron 主进程中剥离到独立 worker/守护进程，通过文件或本地 HTTP 交换结果，彻底隔离崩溃。

## 待继续
- 做一次真实 UI 复测：Hermes 执行复杂任务时应返回错误或结果，但桌面程序不应闪退。
- 如果还有闪退，下一步实现 Hermes task runner 独立进程隔离。
- 可以在 UI 中增加“复杂任务建议转入 Dashboard/终端执行”的提示。

## 验证结果
- `node --check scripts\restore-openclaw-shell.mjs` 通过。
- `node scripts\restore-openclaw-shell.mjs` 成功重新生成部署包。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- 已确认部署包包含 `chat-output-limit`、`maxStdoutBytes`、`lastStderrLogAt`。
- 已确认渲染 bundle 的 Hermes chat 调用包含 `maxStdoutBytes` 和 `maxStderrBytes`。
- 重启 `E:\win-unpacked\OpenClawPro.exe` 后，`OpenClawPro` 进程 `Responding=True`。

## 如果需要下一台 Codex 接手，提示词
请在 `E:\source\openclawpro-agent-hub` 继续开发。刚针对 Hermes 复杂任务导致桌面程序卡死/闪退的问题，给 Hermes chat 子进程增加了 stdout/stderr 输出上限、stderr 日志限流和超量 kill 保护，并让前端调用传入保守输出阈值。若用户复测仍闪退，下一步应把 Hermes chat 执行迁移到独立 worker/守护进程，避免 Electron 主进程承载长任务。
