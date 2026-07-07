# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 macOS U盘版近期出现的卡顿、Hermes 自动启动状态抖动、图片附件无法预览、技能同步导致 OpenClaw Gateway 频繁 reload 的问题。

## 已完成
- 将 Hermes 环境检查改为只读快照，不再在检查时执行技能镜像、Python 技能扫描、内存写入验证或 Gateway reload。
- 将 OpenClaw Gateway reload 改为显式 opt-in：只有安装 skill 或用户点击“同步到 Hermes”时才请求 reload。
- 移除技能管理页 15 秒定时扫描，改为页面打开、窗口重新可见和显式同步时刷新。
- 修复聊天输入框附件图片预览，点击上传图片 chip 时使用应用内 Lightbox，不再依赖 `window.open(data:)`。
- 给 macOS AppleDouble 元数据清理增加节流，避免 Hermes 启动/聊天期间反复递归扫描 U 盘目录。
- 更新 `scripts/restore-openclaw-shell.mjs`，确保从原 OpenClaw UI 恢复源码应用时不会重新引入旧的轮询、二次 reload 或图片预览问题。
- 重新生成 `dist/` 和 `release/macos-usb-root-exfat`。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `dist/assets/assets/main-DIeui7ZO.js`
- `scripts/restore-openclaw-shell.mjs`
- `scripts/verify-ai-chat-skill-runtime.mjs`
- `docs/codex-handoff/2026-07-07-macos-skill-sync-performance.md`

## 关键决策
- 环境检查只负责展示状态，不做会导致卡顿或进程状态抖动的重活。
- 技能同步和 OpenClaw reload 保留真实闭环，但只能由明确用户动作或安装动作触发。
- 不通过阻塞用户操作、禁用切换页面或禁止发送消息来掩盖稳定性问题。
- 恢复脚本必须和 `src/` 当前行为一致，避免源码重建后回退到旧补丁逻辑。

## 待继续
- 在真实 macOS U盘上复测：OpenClaw 启动、Hermes 自动启动聊天、技能管理同步、手动添加 skill 后同步到 Hermes、OpenClaw 对话是否读取新技能。
- 如果 OpenClaw 仍不能读取刚安装的 skill，下一步应检查 OpenClaw Gateway 对 `skills.load.extraDirs` 的运行时 reload 能力；必要时提供明确的“重启 Gateway 以加载新技能”动作，而不是后台反复 reload。
- 继续关注慢盘上的 Hermes oneshot 首次启动耗时，必要时将状态文案改为更明确的阶段反馈。

## 验证结果
- `runtime/macos-arm64/node/bin/node --check src/openclaw-shell-app/dist/main/index.js`
- `runtime/macos-arm64/node/bin/node --check src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `runtime/macos-arm64/node/bin/node --check scripts/restore-openclaw-shell.mjs`
- `runtime/macos-arm64/node/bin/node --check dist/main/index.js`
- `runtime/macos-arm64/node/bin/node --check dist/main/index.cjs`
- `runtime/macos-arm64/node/bin/node --check dist/assets/assets/main-DIeui7ZO.js`
- `runtime/macos-arm64/node/bin/node scripts/verify-ai-chat-skill-runtime.mjs`
- `runtime/macos-arm64/node/bin/node scripts/verify-openclaw-chat-skill-sync.mjs`
- `runtime/macos-arm64/node/bin/node scripts/verify-macos-ui-hermes-regressions.mjs`
- `runtime/macos-arm64/node/bin/node scripts/verify-hermes-skill-install-flow.mjs`
- `MACOS_EXFAT_COMPAT=1 MACOS_USB_ROOT_LAYOUT=1 runtime/macos-arm64/node/bin/node scripts/stage-macos-portable-test.mjs`

以上命令均已通过。release 生成结果显示 macOS arm64 runtime 必需文件无缺失，exFAT 兼容处理成功。

## 如果需要下一台 Codex 接手，提示词
请继续在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支工作。先阅读最新 handoff：`docs/codex-handoff/2026-07-07-macos-skill-sync-performance.md`。当前重点是做真实 macOS U盘端到端复测，确认 OpenClaw 与 Hermes 聊天不卡顿、附件图片可预览、技能同步后 Hermes 与 OpenClaw 都能读取新技能。不要恢复技能页定时扫描，不要让环境检查触发 Gateway reload 或技能镜像。
