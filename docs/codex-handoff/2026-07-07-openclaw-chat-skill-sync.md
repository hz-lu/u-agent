# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 macOS U 盘版中 OpenClaw 桌面聊天内容晚刷新/显示不完整、OpenClaw 网页端安装的 skill 在桌面技能管理不可见、Hermes 不能读取 OpenClaw 已安装 skill 的问题。

## 已完成
- 为 OpenClaw 聊天完成事件增加统一收尾函数，final/done 后立即强制从 Gateway 拉取历史，避免 WebSocket 流式事件不完整时桌面端停留在残缺内容。
- 新增 OpenClaw skill 来源解析函数，始终把 U 盘根目录 `skills/` 纳入扫描源，同时保留 `openclaw.json` 中配置的 `skills.load.extraDirs`。
- 让技能管理扫描和 Hermes skill 镜像同步共用根 `skills/` 来源，OpenClaw 网页端或用户手动安装到根 `skills/` 的技能能被桌面端与 Hermes 发现。
- 修正单文件 `.md` skill 的扫描路径，返回具体 skill 文件路径而不是父目录。
- 新增静态回归脚本 `scripts/verify-openclaw-chat-skill-sync.mjs`，覆盖聊天完成后强制历史同步、根 skills 扫描、Hermes 同步根 skills 三个断点。
- 已刷新 `release/macos-usb-root-exfat`，runtime 未变，仅应用壳和源码构建产物更新。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/restore-openclaw-shell.mjs`
- `scripts/verify-openclaw-chat-skill-sync.mjs`
- `docs/codex-handoff/2026-07-07-openclaw-chat-skill-sync.md`

## 关键决策
- 不改 OpenClaw 原 UI 结构，不重写聊天页，只在现有完成事件后做一次真实 Gateway 历史同步。
- 不把 skill 发现完全绑定到 `openclaw.json`，因为 OpenClaw 网页端、用户手动拷贝、便携安装器都可能直接落到 U 盘根 `skills/`。
- Hermes skill 同步仍通过镜像目录 `data/.hermes/skills/openclaw/` 进行，不直接让 Hermes 修改根 `skills/`，避免污染用户原始 skill。
- 恢复脚本同步保留这些补丁，避免下次从 OpenClaw shell 基线恢复时回退。

## 待继续
- 在真实 U 盘 macOS 环境复测：OpenClaw 安装 `aihot` 后，桌面技能管理应立即显示或刷新后显示该技能。
- 在技能管理页点击同步到 Hermes 后，环境检查 Hermes skills 应显示可见数量，Hermes 对话应能识别该 skill。
- 继续观察微信回复链路。如果后台已经生成回复但微信晚到，应单独检查 WeChat outbound 队列、媒体下载和发送重试日志。

## 验证结果
- `runtime/macos-arm64/node/bin/node --check src/openclaw-shell-app/dist/main/index.js`
- `runtime/macos-arm64/node/bin/node --check dist/main/index.js`
- `runtime/macos-arm64/node/bin/node --check dist/main/index.cjs`
- `runtime/macos-arm64/node/bin/node --check scripts/restore-openclaw-shell.mjs`
- `runtime/macos-arm64/node/bin/node scripts/verify-openclaw-chat-skill-sync.mjs`
- `runtime/macos-arm64/node/bin/node scripts/verify-macos-ui-hermes-regressions.mjs`
- `runtime/macos-arm64/node/bin/node scripts/verify-hermes-skill-install-flow.mjs`
- `runtime/macos-arm64/node/bin/node scripts/build-openclaw-shell-app.mjs`
- `MACOS_EXFAT_COMPAT=1 MACOS_USB_ROOT_LAYOUT=1 runtime/macos-arm64/node/bin/node scripts/stage-macos-portable-test.mjs`

## 如果需要下一台 Codex 接手，提示词
请继续在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支工作。先阅读最新 handoff：`docs/codex-handoff/2026-07-07-openclaw-chat-skill-sync.md`。当前重点是用真实 macOS U 盘 release 复测 OpenClaw 聊天历史即时刷新、OpenClaw 网页端安装 skill 后桌面技能管理可见、Hermes 同步并可见 OpenClaw skill。不要改动用户 U 盘的 `data/`、`.license`、微信登录态或用户技能内容；若 runtime 未变，更新 U 盘时优先只拷贝 `OpenClawPro.app`。
