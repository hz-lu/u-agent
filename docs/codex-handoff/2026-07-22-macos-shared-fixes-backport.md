# Codex Handoff

## 总体目标

基于已开发的 U 盘便携版 OpenClaw 集成 Hermes，实现零安装、零痕迹、Windows/macOS/Linux 三平台原生运行、Universal 单包自动识别平台、持久记忆与自动生成技能、多平台消息接入、自然语言定时自动化、子代理委派、本地/Docker/SSH/Singularity/Modal 沙箱，以及统一的可视化配置中心。所有能力需要与现有 OpenClaw 客户端界面和功能无缝融合，保证良好的用户体验。

## 当前目标

审查 `origin/feat/macos-portable-app` 最近 20 次提交，识别其中同样存在于 Windows 主干的问题，并在不直接合并 macOS 平台代码、不破坏主干现有功能和性能的前提下回移共享修复。

## 已完成

- 使用绕过失效全局代理的单次 fetch 获取远端最新分支，确认 `main` 与 macOS 分支的共同基点为 `343251b`。
- 审查 macOS 分支最近 20 次提交。回移 AI 会话模型同步、OpenClaw 最终消息立即刷新、Hermes 附件、输入法组合输入保护、附件预览、技能页事件刷新、Lightbox Esc 关闭、微信发送重试、统一技能来源、GitHub 子目录安装、Hermes 安装按需启动、Hermes 就绪等待、日志脱敏和轻量环境验证。
- OpenClaw 技能来源统一为根目录 `skills/`、`.openclaw/workspace/skills`、`.openclaw/skills` 和配置的 `extraDirs`；仅用户显式同步/安装技能时请求 Gateway reload。
- Hermes 支持 GitHub 仓库及 `/tree/<branch>/<subdir>` 技能地址，安装前验证并按需启动便携运行时。
- Hermes 对话等待配置服务和 API 端口真正就绪后再投递；进程信号中断返回明确的 `interrupted` 类型。
- Hermes 附件仅落盘到 U 盘 `data/.hermes/uploads`；运行日志和 `request.json` 不再保存原始提示词，只记录长度和附件数量。
- 微信出站消息对瞬时网络错误最多重试 3 次，并区分下载、上传和网络发送错误。
- 新增 `verify:shared-backports`，同时检查源码和正式 `dist` 构建产物。
- 未移植 macOS Dock、DMG、exFAT、AppleDouble、USB 序列号、平台路径发现和全局布局实验。
- 未照搬 macOS 分支“5 秒内相同用户文本即重复”的持久化去重，因为它会吞掉用户有意连续发送的相同内容；主干保留 ID 去重，renderer 使用更安全的 idempotency/local-only 条件。

## 改动文件

- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/preload/index.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `dist/preload/index.js`
- `dist/preload/index.cjs`
- `dist/assets/assets/main-DIeui7ZO.js`
- `extensions/openclaw-weixin/src/messaging/send.ts`
- `extensions/openclaw-weixin/src/messaging/process-message.ts`
- `scripts/verify-macos-shared-backports.mjs`
- `package.json`

## 关键决策

- 不直接 merge 或 cherry-pick macOS 分支，按问题和行为逐项移植。
- renderer 与微信扩展在分支差异中只有平台无关行为，因此同步最终共享实现；主进程只手工移植共享逻辑。
- `isCifuDefault` 不写入 OpenClaw 严格配置 schema；词符科技默认项身份继续由前端持久层维护。清理历史非法模型字段前会备份 `openclaw.json`。
- 环境检查只读取快速 snapshot 和已有报告，不启动服务、不递归扫描技能、不写内存探针，避免 UI 卡顿。
- 本轮只更新仓库源码和 `dist`，没有同步到 `F:\` 或 release 目录。

## 待继续

- 在带完整 Windows runtime 的 U 盘运行目录做人工冒烟：OpenClaw/Hermes 启停、三种会话、模型切换、附件、技能同步、微信收发。
- 在新电脑验证微信瞬时断网重试和 Hermes 首次启动等待提示。
- 微信扩展 Vitest 未运行，因为当前扩展目录未安装 `vitest`；类型检查和 TypeScript 构建已通过。
- 人工冒烟通过后再构建 Windows Electron 壳并同步 release，当前阶段不要直接覆盖发行目录。

## 验证结果

- `npm.cmd run build`：通过。
- `npm.cmd run verify:shared-backports`：通过。
- `npm.cmd run audit:openclaw-shell`：24/24 通过。
- `npm.cmd --prefix extensions/openclaw-weixin run typecheck`：通过。
- `npm.cmd --prefix extensions/openclaw-weixin run build`：通过。
- `node --check`：源码及 `dist` 的 main、preload、renderer 全部通过。
- `git diff --check`：通过。
- 微信 Vitest：未执行，原因是本机扩展开发依赖中没有可用的 `vitest` 命令。

## 如果需要下一台 Codex 接手，提示词

请在 `D:\github\u-agent` 的 `main` 分支继续。先阅读 `docs/codex-handoff/2026-07-22-macos-shared-fixes-backport.md`，运行 `git status`、`npm.cmd run verify:shared-backports` 和 `npm.cmd run audit:openclaw-shell`。不要直接合并 `origin/feat/macos-portable-app`，不要把 macOS Dock/DMG/exFAT/AppleDouble/路径发现代码带入 Windows 主干。下一步是在完整 U 盘 runtime 上做 OpenClaw、Hermes、协同会话、模型、附件、技能和微信的人工冒烟；通过后再构建 Windows 壳和 release。发现问题必须修改 `src/openclaw-shell-app` 源码并重新运行 `npm.cmd run build`，不要只修改 F 盘或 release 产物。
