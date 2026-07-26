# Codex Handoff

## 总体目标

基于已开发的 U 盘便携版 OpenClaw 集成 Hermes，实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离和可视化配置中心，并与现有前端界面无缝融合，保证用户体验和运行稳定性。

## 当前目标

修复 Windows 壳中 Hermes 会话右侧内容超出可视区域、用户消息只显示一部分的问题，并保证 OpenClaw、Hermes、协同三个会话模式共用的布局在常规和较窄窗口下均不横向溢出。

## 已完成

- 将主工作区改为 `flex-basis: 0`、`width: 0`、`min-width: 0` 的受约束 flex 子项，避免左侧导航宽度被重复计入页面内容宽度。
- AI 会话根节点从 `width: 100%` 改为在父容器可用空间内伸缩，并增加 `max-width` 和 overflow 约束。
- 为会话布局、消息列表、用户消息和 AI 消息补齐 `min-width: 0`、`max-width: 100%`，长消息在可视区域内换行。
- 增加功能审计标记，防止主工作区和 AI 会话宽度约束在后续构建中丢失。

## 改动文件

- `src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css`
- `dist/assets/main-CAx6YYDG.css`
- `scripts/audit-openclaw-shell-features.mjs`
- `docs/codex-handoff/2026-07-26-hermes-chat-width-containment.md`

## 关键决策

- 根因位于外层 flex 宽度计算，不通过扩大页面或开放横向滚动掩盖问题。
- 修复作用于三个会话模式共用的容器，避免 Hermes 使用单独偏移量产生新的响应式分叉。
- 保留消息文本选择、复制按钮和气泡样式，只收紧尺寸边界。

## 待继续

- 重新生成完整 Windows `win-unpacked` 后，在带真实 Hermes 历史长消息的 U 盘数据上复测。
- 重点验证最大化、普通窗口和较窄窗口下，顶部工具栏、长用户消息、长 Markdown 回复和输入区均完整显示。

## 验证结果

- `npm.cmd run build` 通过。
- `npm.cmd run audit:openclaw-shell`：47/47 通过。
- `git diff --check` 通过。
- 1280×720 页面验证：主工作区为 256–1280px，会话根、顶部栏、消息区和输入区均无横向溢出。
- 900×700 页面验证：主工作区为 256–900px，相关容器 `scrollWidth <= clientWidth`，实际截图中右侧工具栏和输入区完整显示。

## 如果需要下一台 Codex 接手，提示词

请在 `D:/github/u-agent` 的 `main` 分支继续，先阅读 `docs/codex-handoff/2026-07-26-hermes-chat-width-containment.md`。本轮已从共用 flex 布局根因修复 Hermes 会话右侧裁切，并完成 1280px 和 900px 页面尺寸验证。后续问题必须回到 `src/openclaw-shell-app/dist` 修改并重新构建，不要只热改 U 盘产物，也不要为某个 Agent 单独增加固定宽度或偏移。
