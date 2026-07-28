# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

修复 macOS U 盘版技能管理显示三百多个技能，但 OpenClaw 旧会话只识别 95 个技能的问题。

## 已完成

- 新建 OpenClaw 配置时写入官方技能容量限制。
- 已有配置低于要求时提升到 400，不降低用户已有更高值。
- 技能仓库发生真实变化后清除持久化 `skillsSnapshot`。
- 快照清理只删除技能快照，保留会话和全部聊天消息。

## 改动文件

- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/verify-openclaw-chat-skill-sync.mjs`

## 关键决策

- 不把技能管理目录数直接当作 OpenClaw 当前会话技能数。
- 不删除旧会话，不通过重置聊天历史解决旧快照。
- 只在 worker 报告 `changedCount > 0` 时清理快照，避免每次刷新写 U 盘。

## 待继续

- 补齐 macOS 独立便携 Python 和 34 个股票技能依赖。
- 修复 Hermes runtime 完整性与并发启动。

## 验证结果

- `node scripts/verify-openclaw-chat-skill-sync.mjs` 通过。
- `npm run verify:skill-repository` 通过。
- `npm run verify:skill-metadata` 通过。
- `npm run verify:chat-skills` 通过。
- `npm run audit:openclaw-shell` 24/24 通过。

## 如果需要下一台 Codex 接手，提示词

继续执行 `docs/superpowers/plans/2026-07-28-macos-skills-hermes-runtime.md`，从 macOS 股票技能便携 Python 阶段开始；不要整体合并主干，不要修改 UI、模型、微信和聊天路由。
