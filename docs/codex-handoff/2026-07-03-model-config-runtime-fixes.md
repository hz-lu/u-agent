# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 macOS U盘端测试发现的两个问题：OpenClaw Gateway 因模型配置中写入 UI 专用字段而启动失败；AI 会话中 OpenClaw 和 Hermes 继续使用旧会话模型，未跟随模型配置页当前模型。

## 已完成
- `updateModelsField()` 写入 OpenClaw `openclaw.json` 时不再把 `isCifuDefault` 等 UI 专用字段写进 `models.providers.*.models[]`。
- Gateway 启动前的 `rewritePortableOpenClawConfigPaths()` 增加旧配置清理：自动移除 provider model 里的 UI 专用字段，并在清理前备份 `openclaw.json.bak-invalid-model-fields-*`。
- 模型配置页切换或保存当前模型后，会派发 `uclaw-active-model-changed` 事件。
- AI 会话模型选择优先级改为全局“使用中”模型优先，旧会话 `sessionModelMap` 不再覆盖模型配置页的当前模型。
- AI 会话收到全局模型变化事件后，会同步当前会话模型；OpenClaw 与 Hermes 后续发送都应使用同一个当前模型。
- 已重新构建 macOS USB-root release，并只同步小程序目录到 `/Volumes/OPENCLAW/OpenClawPro.app/.../Resources/app/`，未触碰 runtime、data、skills、extensions 和 `.license`。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `docs/codex-handoff/2026-07-03-model-config-runtime-fixes.md`

## 关键决策
- UI 内部用的 `isCifuDefault` 继续保留在前端模型列表中，但不能写入 OpenClaw Gateway 的 provider model schema。
- 对已经写坏的 U盘旧配置做启动前自动迁移，而不是要求用户手动删除配置或清空数据。
- OpenClaw 与 Hermes 都应默认跟随模型配置页的当前模型；会话内模型缓存不能长期覆盖全局当前模型。
- 本次 U盘更新只需要同步 `OpenClawPro.app/Contents/Resources/OpenClawPro-Runtime.app/Contents/Resources/app/`。

## 待继续
- 在 U盘 App 重启后验证：Gateway 启动不再报 `models.providers.cifu.models.0: Invalid input`。
- 在模型配置页将当前模型设为不可用测试模型 `111` 后，分别测试 OpenClaw 对话和 Hermes 对话都应使用 `111`，并按真实模型不可用返回错误，而不是回退到旧的 `deepseek-v4-pro`。
- 如需要保留“某个会话单独固定模型”的能力，后续应在 UI 上显式区分“跟随全局模型”和“固定当前会话模型”，不要隐式缓存。

## 验证结果
- `npm run build` 通过。
- `npm run stage:macos-usb-root:final` 通过，runtime required missing 为 `[]`，exFAT remainingSymlinks 为 `[]`。
- `node --check src/openclaw-shell-app/dist/main/index.js` 通过。
- `node --check src/openclaw-shell-app/dist/preload/index.js` 通过。
- `node --check dist/main/index.cjs` 通过。
- `git diff --check` 通过；仅提示未触碰的 `dist/assets/assets/styles/_mixins.scss` CRLF/LF warning。
- 已执行 rsync，将最新 `Resources/app/` 小目录同步到 `/Volumes/OPENCLAW`。

## 如果需要下一台 Codex 接手，提示词
你现在接手 `/Users/ly/data/codex/u-agent`，当前分支为 `feat/macos-portable-app`。请先读取 `docs/codex-handoff/2026-07-03-model-config-runtime-fixes.md`。重点确认 macOS U盘端 OpenClaw Gateway 不再因 `isCifuDefault` 写入 `openclaw.json` 而崩溃，并确认 AI 会话中 OpenClaw、Hermes、协同模式都跟随模型配置页当前模型。不要清空用户 `data/`，不要重拷 runtime，测试更新只需同步 `OpenClawPro.app/.../Resources/app/`。
