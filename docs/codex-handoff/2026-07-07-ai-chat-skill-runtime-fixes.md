# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 macOS 便携版 AI 对话和技能运行态问题：运行中手动新增 skill 后技能管理不刷新、OpenClaw 运行态未重载技能、输入法回车误发送、附件无法预览，以及 Hermes 收不到上传文件上下文。

## 已完成
- 技能管理页进入后会重新扫描本地 skills，窗口重新聚焦会刷新，页面打开期间每 15 秒轻量刷新一次。
- 点击“同步到 Hermes”前后都会重扫技能，并在同步完成后请求 OpenClaw Gateway reload，让运行中的 OpenClaw 重新加载技能目录。
- ChatInput 增加 IME composition 判断，Enter 在输入法候选/联想确认时不会误发送。
- 附件 chip 支持点击预览；删除按钮阻止冒泡，不会误触预览。
- 图片和普通文件附件都保留 filePath；没有 filePath 的粘贴图片会在主进程落盘到 `data/.hermes/uploads/`，再把路径交给 Hermes。
- Hermes chat IPC 现在带 `attachments`，oneshot prompt 会附加附件名称、类型、路径或内联内容信息。
- Hermes 运行日志仍只记录 redacted message 与长度，不打印用户对话原文。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/restore-openclaw-shell.mjs`
- `scripts/verify-ai-chat-skill-runtime.mjs`
- `scripts/verify-macos-ui-hermes-regressions.mjs`

## 关键决策
- 不改原 OpenClaw UI 主体布局，只在现有技能页、对话输入和 Hermes IPC 链路上做最小修复。
- 手动拷贝 skill 后，技能管理页负责实时重扫；OpenClaw 运行态必须通过 Gateway reload 才能重新识别。
- 附件落盘只写入 U 盘 `data/.hermes/uploads/`，不写入 runtime，也不接触宿主机用户目录。

## 待继续
- 在真实 macOS U 盘环境重新验证：手动复制 skill 到根 `skills/` 后，技能管理页是否自动出现；点击同步后 OpenClaw 对话是否可识别。
- 验证 Hermes 上传截图 OCR：拖拽/粘贴图片后让 Hermes 调用 `pdf-image-text-extractor` 或类似技能读取。
- 如 OpenClaw Gateway `reload` 对 skill 不生效，需要改为提示或触发完整 Gateway restart。

## 验证结果
- `runtime/macos-arm64/node/bin/node --check src/openclaw-shell-app/dist/main/index.js`
- `runtime/macos-arm64/node/bin/node --check dist/main/index.js`
- `runtime/macos-arm64/node/bin/node --check dist/main/index.cjs`
- `runtime/macos-arm64/node/bin/node --check scripts/restore-openclaw-shell.mjs`
- `runtime/macos-arm64/node/bin/node scripts/verify-ai-chat-skill-runtime.mjs`
- `runtime/macos-arm64/node/bin/node scripts/verify-openclaw-chat-skill-sync.mjs`
- `runtime/macos-arm64/node/bin/node scripts/verify-macos-ui-hermes-regressions.mjs`
- `runtime/macos-arm64/node/bin/node scripts/verify-hermes-skill-install-flow.mjs`

## 如果需要下一台 Codex 接手，提示词
继续在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支工作。优先验证 macOS U 盘 release 中技能管理实时刷新、OpenClaw Gateway reload 后技能可见、Hermes 附件 OCR 链路。不要动 `uclaw/` 未跟踪目录，不要破坏原 OpenClaw UI。源码以 `src/openclaw-shell-app/dist` 为准，修改后运行 `scripts/build-openclaw-shell-app.mjs` 同步 `dist/`，再刷新 `release/macos-usb-root-exfat`。
