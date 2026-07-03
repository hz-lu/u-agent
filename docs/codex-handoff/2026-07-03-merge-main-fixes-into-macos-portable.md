# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
读取主干分支最新修复，审计 OpenClaw/Hermes 相关问题和优化项，并将主干修复合并到 `feat/macos-portable-app`，同时保留 macOS U盘便携版已有的 root/data/runtime、license、exFAT、Hermes 环境检查语义和 AppleDouble 清理能力。

## 已完成
- 拉取并审计 `origin/main` 最新提交，主干新增修复包括默认词符模型去重、OpenClaw 队列 token 恢复、排队模型同步、processing 状态、busy 提示、stop 按钮、本地消息可见性、重复用户消息、窗口控制，以及 PowerShell 状态重定向到便携 `data/.system`。
- 将 `origin/main` 合并到 `feat/macos-portable-app`。
- 解决前端 bundle 中词符默认模型归一化冲突：保留 mac 分支的 `cifu-tech-default` 值归一化，同时采用主干的占位模型过滤和非占位模型 current 迁移逻辑。
- 保留 macOS 分支已有的 `AGENT_HUB_ROOT`、`AGENT_HUB_DATA_ROOT`、`AGENT_HUB_USB_ROOT`、Hermes AppleDouble 清理、`COPYFILE_DISABLE=1`、Hermes 环境检查可选状态语义。
- 重新构建并生成 macOS USB-root exFAT release 目录。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/preload/index.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `dist/preload/index.js`
- `dist/preload/index.cjs`
- `dist/assets/assets/main-DIeui7ZO.js`
- `dist/assets/main-CAx6YYDG.css`
- `src/main/runtime/openclaw-runtime.ts`
- `scripts/stage-windows-release-dir.mjs`
- `docs/codex-handoff/2026-07-01-cifu-default-flag.md`
- `docs/codex-handoff/2026-07-02-*.md`
- `docs/codex-handoff/2026-07-03-merge-main-fixes-into-macos-portable.md`

## 关键决策
- 不删除 macOS portable 分支已有脚本、图标、runtime staging 和 release 逻辑；主干没有这些文件，合并时以当前 mac 分支为准保留。
- 对压缩后的前端 bundle 冲突只做等价合并，不引入新 UI 或新交互。
- 主干的 PowerShell/命令执行状态重定向修复保留到 mac 分支，确保 Windows 路径也继续写入便携 `data/.system`，不落宿主机用户目录。
- `uclaw/` 是未跟踪本地目录，本次未纳入提交。

## 待继续
- 在真实 mac U盘根目录拷贝最新 `release/macos-usb-root-exfat` 后，再做一次双击 `OpenClawPro.app` 的端到端测试。
- 继续观察 OpenClaw 对话、Hermes 对话、协同对话在长输出、stop、重新发送、模型切换时的 UI 状态是否一致。
- 后续如主干继续修复 Windows 端，需要继续按源码合并，不只改 release 产物。

## 验证结果
- `npm run build` 通过。
- `node --check src/openclaw-shell-app/dist/main/index.js` 通过。
- `node --check src/openclaw-shell-app/dist/preload/index.js` 通过。
- `node --check scripts/build-openclaw-shell-app.mjs` 通过。
- `node --check scripts/stage-windows-release-dir.mjs` 通过。
- `git diff --check` 通过；仅提示未触碰的 `dist/assets/assets/styles/_mixins.scss` CRLF/LF warning。
- `npm run stage:macos-usb-root:final` 通过，runtime required missing 为 `[]`，exFAT remainingSymlinks 为 `[]`。

## 如果需要下一台 Codex 接手，提示词
你现在接手 `/Users/ly/data/codex/u-agent`，当前分支应为 `feat/macos-portable-app`。请先读取最新 `docs/codex-handoff/2026-07-03-merge-main-fixes-into-macos-portable.md`，确认主干 OpenClaw 聊天状态修复已合并到 macOS portable 分支。继续工作时必须保留 OpenClaw 原 UI、macOS U盘根目录结构 `OpenClawPro.app/runtime/data/skills/extensions`、license 根目录校验、exFAT 兼容、Hermes AppleDouble 清理，以及 Hermes 环境检查中 `未生成`、`未安装`、`未占用` 的可选状态语义。
