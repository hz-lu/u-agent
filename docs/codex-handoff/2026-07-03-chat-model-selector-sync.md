# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 AI 会话顶部模型下拉切换后，模型配置页未同步“使用中”模型，且后续 OpenClaw / Hermes 对话仍可能使用旧模型的问题。

## 已完成
- AI 会话顶部模型下拉 `handleModelSelect()` 现在会按 `provider/model`、`value`、`model`、`label` 精确匹配模型配置里的条目。
- 下拉切换后会同步更新 `modelsStore.selectedModels[].isCurrent`，因此模型配置页会显示同一个“使用中”模型。
- 下拉切换后继续发送 `/model <provider/model>` 给 OpenClaw 当前会话，保持 OpenClaw Gateway 会话模型和 UI 当前模型一致。
- 下拉切换后继续派发 `uclaw-active-model-changed`，Hermes 与协同模式会读取同一当前模型。
- 已重新构建 macOS USB-root release，并只同步 `Resources/app/` 小目录到 `/Volumes/OPENCLAW`。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `docs/codex-handoff/2026-07-03-chat-model-selector-sync.md`

## 关键决策
- 产品语义改为“一处模型选择”：模型配置页和 AI 会话顶部下拉都改变同一个全局当前模型。
- 不继续保留隐式“会话下拉只改当前会话但不改配置页”的行为，因为它会导致用户看到的当前模型和实际发送模型分叉。
- 后续如果要做“当前会话固定模型”，需要新增明确 UI 状态，不应隐式缓存。

## 待继续
- 重启 U盘 App 后测试：在 AI 会话顶部下拉从 `111` 切到 `deepseek-v4-pro`，模型配置页应同步显示 `deepseek-v4-pro` 为“使用中”。
- 再从模型配置页切回 `111`，AI 会话顶部下拉应同步显示 `111`，OpenClaw/Hermes 发送都应使用 `111`。

## 验证结果
- `npm run build` 通过。
- `npm run stage:macos-usb-root:final` 通过，runtime required missing 为 `[]`，exFAT remainingSymlinks 为 `[]`。
- `node --check src/openclaw-shell-app/dist/main/index.js` 通过。
- `node --check src/openclaw-shell-app/dist/preload/index.js` 通过。
- `node --check dist/main/index.cjs` 通过。
- `git diff --check` 通过；仅提示未触碰的 `dist/assets/assets/styles/_mixins.scss` CRLF/LF warning。
- 已执行 rsync，同步最新 `Resources/app/` 到 `/Volumes/OPENCLAW`。

## 如果需要下一台 Codex 接手，提示词
你现在接手 `/Users/ly/data/codex/u-agent`，当前分支为 `feat/macos-portable-app`。请先读取 `docs/codex-handoff/2026-07-03-chat-model-selector-sync.md`。重点验证 AI 会话顶部模型下拉和模型配置页的“使用中”模型双向一致，并确认 OpenClaw、Hermes、协同模式发送时都使用同一个当前模型。不要清空用户 `data/`，测试更新只需同步 `OpenClawPro.app/.../Resources/app/`。
