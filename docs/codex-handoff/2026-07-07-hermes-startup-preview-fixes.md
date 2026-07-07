# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 macOS U 盘版测试中发现的两个问题：图片预览只能点 X 关闭、Esc 无效；Hermes 首次自动启动较慢时，对话任务可能抢在 API/Gateway 就绪前投递，导致先显示失败、过一会儿服务又启动并出现回复。

## 已完成
- 给聊天图片 Lightbox 增加 `Escape` 键关闭能力，保留点击遮罩和 X 关闭。
- Hermes 聊天子进程 `exit` 回调记录 `signal`，避免 `code=null` 时丢失真实退出原因。
- 将 Hermes oneshot 被 `SIGTERM` / `SIGKILL` / `code=null` 打断的情况归类为 `interrupted`，不再误导成模型、Key 或额度问题。
- Hermes 对话投递 oneshot 前先等待本地 config server 和 API/Gateway 端口就绪，慢 U 盘首次启动时通过进度通道提示正在等待。
- 同步更新 `dist/` 和 `scripts/restore-openclaw-shell.mjs`，确保后续从原 OpenClaw UI 恢复源码应用时不会丢失本轮修复。
- 更新 `scripts/verify-ai-chat-skill-runtime.mjs`，新增 Esc 关闭预览、Hermes exit signal、interrupted 分类和 readiness wait 的回归检查。
- 重新生成 `release/macos-usb-root-exfat`。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/restore-openclaw-shell.mjs`
- `scripts/verify-ai-chat-skill-runtime.mjs`
- `docs/codex-handoff/2026-07-07-hermes-startup-preview-fixes.md`

## 关键决策
- 不通过禁用发送、禁止切页面或阻塞整个 Electron UI 来掩盖 Hermes 慢启动；只在后台 Hermes 对话任务内部等待本地 runtime ready。
- Hermes 进程信号中断与模型调用失败分开处理，避免用户被错误引导去改模型配置。
- Lightbox 修复只改预览组件键盘事件，不触碰整体布局和滚动容器。

## 待继续
- 在真实 macOS U 盘上复测：图片预览按 Esc 关闭；Hermes 未启动时发送消息，应先显示等待本地 API/Gateway 就绪，再进入模型处理。
- 如果慢盘首次启动仍超过 2 分钟，应继续在 Hermes 首页启动流程中增加更细的阶段日志，而不是回退到旧的误报错误。
- 如仍出现 Hermes 服务先失败后恢复，需要继续检查是否存在外部 stop/restart 动作误杀 oneshot。

## 验证结果
- `runtime/macos-arm64/node/bin/node --check scripts/restore-openclaw-shell.mjs`
- `runtime/macos-arm64/node/bin/node --check src/openclaw-shell-app/dist/main/index.js`
- `runtime/macos-arm64/node/bin/node --check src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `runtime/macos-arm64/node/bin/node scripts/build-openclaw-shell-app.mjs`
- `runtime/macos-arm64/node/bin/node scripts/verify-ai-chat-skill-runtime.mjs`
- `runtime/macos-arm64/node/bin/node --check dist/main/index.js`
- `runtime/macos-arm64/node/bin/node --check dist/main/index.cjs`
- `runtime/macos-arm64/node/bin/node --check dist/assets/assets/main-DIeui7ZO.js`
- `runtime/macos-arm64/node/bin/node scripts/verify-openclaw-chat-skill-sync.mjs`
- `runtime/macos-arm64/node/bin/node scripts/verify-macos-ui-hermes-regressions.mjs`
- `runtime/macos-arm64/node/bin/node scripts/verify-hermes-skill-install-flow.mjs`
- `MACOS_EXFAT_COMPAT=1 MACOS_USB_ROOT_LAYOUT=1 runtime/macos-arm64/node/bin/node scripts/stage-macos-portable-test.mjs`

以上命令均已通过。release 生成结果显示 macOS arm64 runtime 必需文件无缺失，exFAT 兼容处理成功。

## 如果需要下一台 Codex 接手，提示词
请继续在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支工作。先阅读最新 handoff：`docs/codex-handoff/2026-07-07-hermes-startup-preview-fixes.md`。当前重点是让用户把 `release/macos-usb-root-exfat` 拷贝到 U 盘实测：图片预览 Esc 关闭、Hermes 未启动时自动等待本地 API/Gateway 就绪并正常回复。不要改动原 OpenClaw UI 布局，不要恢复技能页定时扫描，不要把 Hermes 信号中断归类成模型配置错误。
