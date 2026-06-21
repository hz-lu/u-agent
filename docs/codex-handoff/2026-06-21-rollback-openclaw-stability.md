# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心。以上能力需要和现有程序前端界面无缝融合，让用户在首页、AI 会话、模型配置、环境检查、技能管理等模块获得一致且可理解的体验。

## 当前目标
按用户要求回滚到改坏 OpenClaw 主链路之前的版本，恢复首页启动状态、AI 会话、模型配置等原有体验，并重新生成桌面启动程序实际加载的 app。

## 已完成
- 将 `scripts/restore-openclaw-shell.mjs` 恢复到 `71e640c` 附近的稳定融合版本。
- 移除最近引发回归的补丁层：Hermes 后台聊天任务、Hermes 进度反馈、AI 会话启动硬化、Gateway/模型状态恢复补丁、Electron userData 迁移到 U 盘缓存。
- 保留唯一确认必要且低风险的便携 runtime 修复：如果 `E:\runtime\openclaw.cmd` 和 `E:\runtime\node.exe` 已存在，则写入 `.extracted` 并跳过自解压，避免启动时卡在解压覆盖自身。
- 重新生成 `E:\win-unpacked\resources\app`，当前旧坏产物备份在 `E:\backups\app-before-openclaw-shell-restore-20260621230123`。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-21-rollback-openclaw-stability.md`

## 关键决策
- 这次不继续在坏状态上叠补丁，而是回滚到 OpenClaw 主链路未被破坏的生成脚本版本。
- 不使用 `git reset --hard`，避免不可追踪地丢失历史；通过源码文件恢复形成可审计回滚提交。
- 本次不重新引入模型 hydration 修复，因为它属于新逻辑；先确认回滚是否让旧 Electron localStorage 模型配置恢复，再单独设计更小的修复。
- 回滚源码后必须重新生成 `E:\win-unpacked\resources\app`，否则用户打开的桌面程序仍会使用旧坏产物。

## 待继续
- 请用户重新打开 `E:\win-unpacked\OpenClawPro.exe`，验证 OpenClaw 启动、首页状态、AI 会话 Gateway 状态和模型配置是否恢复。
- 如果模型配置仍为空，优先检查旧 Electron localStorage 是否已被坏版本覆盖；随后用独立小补丁从 `E:\data\.openclaw\openclaw.json` 恢复模型，不再动 AI 会话/Gateway 大块逻辑。
- Hermes 复杂任务仍可能因为同步等待 `ipcHermesChat` 导致界面卡顿；后续需要重新设计异步任务方案，但要小步实现并保留 OpenClaw 原生链路。

## 验证结果
- `node --check scripts\restore-openclaw-shell.mjs` 通过。
- `npm.cmd run restore:openclaw-shell` 通过。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\preload\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- 生成产物仅保留 `codex-portable-runtime-ready-skip`，不再包含 `codex-gateway-status-query`、`codex-model-config-hydration`、`codex-hermes-background-chat-task`、`codex-hermes-chat-progress-main`、`codex-renderer-error-logger`。

## 如果需要下一台 Codex 接手，提示词
继续在 `E:\source\openclawpro-agent-hub` 开发。用户要求回滚此前改坏 OpenClaw 的改动；当前已将 `scripts/restore-openclaw-shell.mjs` 恢复到后台任务/进度/AI 硬化之前的稳定融合版本，并只保留便携 runtime 自解压跳过修复。已重新生成 `E:\win-unpacked\resources\app`。下一步先让用户验证 OpenClaw 首页启动、AI 会话状态、模型配置是否恢复；如模型仍为空，请单独小范围修复模型从 `E:\data\.openclaw\openclaw.json` 恢复，不要再大范围改 AI 会话或阻塞用户切换窗口。
