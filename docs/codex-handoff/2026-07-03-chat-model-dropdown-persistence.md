# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 AI 会话顶部下拉切换模型后，发送消息时又被旧全局模型配置重置的问题。

## 已完成
- `getPreferredOpenClawModelId()` 现在优先使用当前会话刚选择的 `sessionModelMap`，避免发送前被旧全局 current 覆盖。
- AI 会话顶部下拉切换模型后，立即更新 `modelsStore.selectedModels[].isCurrent`。
- AI 会话顶部下拉切换模型后，立即调用 `ipcWriteOpenClawConfig({ models }, "model")` 持久写入 OpenClaw 配置，不再只依赖模型配置页 watcher 的防抖保存。
- 继续发送 `/model <provider/model>` 给 OpenClaw 当前会话，保持 Gateway 会话模型与 UI 下拉一致。
- 已重新构建 macOS USB-root release，并同步最新 `Resources/app/` 小目录到 `/Volumes/OPENCLAW`。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `docs/codex-handoff/2026-07-03-chat-model-dropdown-persistence.md`

## 关键决策
- 下拉切换模型应视为用户明确改变当前模型，而不是临时会话状态。
- 发送前模型校准不能把用户刚在下拉选择的模型重置回旧的全局配置。
- 配置页 watcher 的防抖保存仍保留，但下拉切换必须即时写入，避免用户快速发送时读到旧配置。

## 待继续
- 重启 U盘 App 后测试：模型配置页为 `111` 时，AI 会话下拉切换到 `deepseek-v4-pro`，配置页应同步变成 `deepseek-v4-pro`，后续发送不应再被重置回 `111`。
- 再从模型配置页切回 `111`，AI 会话下拉与 OpenClaw/Hermes 发送应同步使用 `111`。

## 验证结果
- `npm run build` 通过。
- `npm run stage:macos-usb-root:final` 通过，runtime required missing 为 `[]`，exFAT remainingSymlinks 为 `[]`。
- `node --check dist/main/index.cjs` 通过。
- `node --check src/openclaw-shell-app/dist/main/index.js` 通过。
- `git diff --check` 通过；仅提示未触碰的 `dist/assets/assets/styles/_mixins.scss` CRLF/LF warning。
- 已执行 rsync，同步最新 `Resources/app/` 到 `/Volumes/OPENCLAW`。

## 如果需要下一台 Codex 接手，提示词
你现在接手 `/Users/ly/data/codex/u-agent`，当前分支为 `feat/macos-portable-app`。请先读取 `docs/codex-handoff/2026-07-03-chat-model-dropdown-persistence.md`。重点验证 AI 会话顶部下拉切换模型后，模型配置页、OpenClaw 发送模型、Hermes 发送模型三者保持一致，且发送消息时不会被旧全局配置重置。
