# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长（持久记忆 + 自动生成技能）、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并和现有程序前端界面无缝融合，保留 OpenClaw 原有功能与体验，同时让 Hermes 在首页、AI 会话、模型配置、环境检查、技能管理等模块自然协同。

## 当前目标
完成 Hermes 自我成长中“自动生成技能”的可验证最小闭环：通过 Hermes 官方 `skill_manage(action="create")` 创建技能，`reload_skills()` 让 Hermes 官方 slash command 可见，再同步到 U 盘 `skills/` 目录让 OpenClaw 也能看到，最后清理临时技能并生成报告。

## 已完成
- 新增 `scripts/verify-hermes-skill-growth.mjs`，验证 Hermes 官方 skill manager 创建、标记 agent-created、reload 可见、同步回 OpenClaw skills、清理后不可见的完整流程。
- `package.json` 增加 `verify:hermes-skill-growth`。
- `HermesRuntime` 状态增加 `hermesSkillGrowth`，capabilities 增加 `autoSkillGrowthReady`，diagnostics 增加 growth report 路径。
- `config.yaml` 写入统一增加 `skills.external_dirs: E:\skills`，让 Hermes 直接把 OpenClaw skills 作为共享外部技能目录扫描。
- `scripts/verify-hermes-skills.mjs` 与 `scripts/verify-hermes-memory.mjs` 也同步写入 external_dirs，避免验证脚本互相覆盖配置。
- `scripts/restore-openclaw-shell.mjs` 已把 external_dirs、skillGrowthReady、skillGrowthReportPath 注入当前 U 盘桌面程序。
- 当前部署版环境检查已新增 `Hermes 自我成长` 项，读取 `E:\data\.hermes\reports\skills\growth-last.json`。
- 已重新部署到 `E:\win-unpacked\resources\app`，部署前备份到 `E:\backups\app-before-openclaw-shell-restore-20260620175616`。

## 改动文件
- `package.json`
- `scripts/verify-hermes-skill-growth.mjs`
- `scripts/verify-hermes-skills.mjs`
- `scripts/verify-hermes-memory.mjs`
- `scripts/restore-openclaw-shell.mjs`
- `src/main/runtime/hermes/hermes-runtime.ts`
- `src/shared/types.ts`
- `docs/codex-handoff/2026-06-20-hermes-skill-growth-loop.md`

## 关键决策
- 不把 `data/.hermes/skills` 中 Hermes 自带/seed 的分类技能全量同步回 `E:\skills`，避免污染 OpenClaw 技能目录。
- 自我成长的验证标准使用 Hermes 官方 `skill_manage(create)`，而不是手写 `SKILL.md`。
- 同步回 OpenClaw 的闭环仅针对明确由验证桥创建的技能；真实长期同步后续应只同步 Hermes agent-created 或有 `.hermes-generated.json` provenance 的技能。
- 清理验证技能时必须先删除 Hermes 本地技能，再删除 OpenClaw 外部镜像并 reload；否则 Hermes 会通过 `skills.external_dirs` 继续看到刚同步到 `E:\skills` 的技能。

## 待继续
- 把“真实对话中模型决定创建技能”的流程接到 UI：在 AI 会话或技能管理页提供“将本次流程保存为共用技能”的可见入口，并异步显示创建、reload、同步、验证结果。
- 为长期 Hermes agent-created skills 做非临时同步：读取 `.usage.json` 中 `created_by=agent` 的技能，稳定同步到 `E:\skills`，避免同步内置/Hub 技能。
- 继续做 cron automation 真实执行闭环：自然语言创建任务、调度执行、报告写入、UI 查看。
- 继续做 connectors 真实闭环，尤其微信消息进来后调用 OpenClaw/Hermes 协同回复。
- 三平台原生 runtime/launcher 与 Universal zip 仍未完成。
- 本地 `node_modules` 仍是半安装状态，TypeScript typecheck 暂不可用。

## 验证结果
- `node --check scripts/restore-openclaw-shell.mjs` 通过。
- `node --check scripts/verify-hermes-skill-growth.mjs` 通过。
- `node scripts/verify-hermes-skill-growth.mjs` 通过：officialCreated=true，officialVisible=true，officialAgentCreated=true，openClawSynced=true，cleanupDeleted=true，cleanupStillVisible=false。
- `node scripts/verify-hermes-skills.mjs` 通过：sourceCount=80，mirroredCount=80，visibleCount=77，commandCount=77。
- `node scripts/verify-hermes-memory.mjs` 通过：memoryWritable=true，userWritable=true，testEntryRemoved=true。
- `node scripts/verify-hermes-runtime.mjs` 通过：Hermes Agent v0.15.1，Python 3.12.13，Node v24.15.0，零痕迹环境指向 `E:\data\.hermes`。
- `node scripts/audit-portable-release.mjs` 通过但仍报告：windowsPortableUsable=true，strictZeroTraceReady=true，threePlatformNativeReady=false，universalZipReady=false。
- deployed app 已确认包含 `skillGrowthReady`、`skillGrowthReportPath` 和 `hermes-skill-growth` 环境检查项。

## 如果需要下一台 Codex 接手，提示词
继续在 `E:\source\openclawpro-agent-hub` 开发。当前已完成 Hermes skills 官方可见闭环、Hermes memory persistence 官方读写闭环、Hermes skill growth 最小官方创建/同步闭环，并已部署到 `E:\win-unpacked\resources\app`。请先运行 `node scripts/verify-hermes-skill-growth.mjs`、`node scripts/verify-hermes-skills.mjs`、`node scripts/verify-hermes-memory.mjs`、`node scripts/audit-portable-release.mjs` 确认基线。下一步建议做“真实对话生成技能”或 cron automation 闭环：不要替换 OpenClaw UI，只在现有首页、AI 会话、技能管理、环境检查中融合 Hermes 能力。每阶段结束执行 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`，并新增 handoff，handoff 必须包含“总体目标”。
