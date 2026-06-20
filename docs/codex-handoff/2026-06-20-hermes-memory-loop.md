# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长（持久记忆 + 自动生成技能）、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并和现有程序前端界面无缝融合，保留 OpenClaw 原有功能与体验，同时让 Hermes 在首页、AI 会话、模型配置、环境检查、技能管理等模块自然协同。

## 当前目标
完成 Hermes 官方持久记忆的真实闭环：不是只创建 `memories` 目录，而是写入 `data/.hermes/config.yaml` 启用 memory/user profile，通过 Hermes 官方 `tools.memory_tool.MemoryStore` 验证 `MEMORY.md` / `USER.md` 可写、可重新加载、可清理测试项，并把结果接入源码状态、当前 U 盘桌面程序状态和环境检查。

## 已完成
- 新增 `scripts/verify-hermes-memory.mjs`，可独立验证 Hermes 官方 MemoryStore 在 `E:\data\.hermes\memories` 下的读写、重载和测试项清理。
- `HermesRuntime` 新增 `verifyMemory()`，启动和状态刷新时会生成 `E:\data\.hermes\reports\memory\persistence-last.json`。
- `HermesRuntime` 会写入便携 `E:\data\.hermes\config.yaml`，显式启用 `memory.memory_enabled` 与 `memory.user_profile_enabled`，避免未来 Hermes 默认配置变化导致记忆关闭。
- `AgentStatus` 新增 `hermesMemory`，capabilities 增加 `memoryReady`、`memoryWritable`、`memorySnapshotReady`。
- `scripts/restore-openclaw-shell.mjs` 已同步注入当前 U 盘 app：主进程 Hermes manager 增加 `verifyHermesMemory()`，状态快照带出 `memoryReady/memoryWritable/memoryReportPath`。
- 当前部署版环境检查已补上 `Hermes 持久记忆` 项，显示 MEMORY/USER 条数和 report 路径。
- 已重新部署到 `E:\win-unpacked\resources\app`，部署前备份到 `E:\backups\app-before-openclaw-shell-restore-20260620163802`。

## 改动文件
- `package.json`
- `scripts/verify-hermes-memory.mjs`
- `scripts/restore-openclaw-shell.mjs`
- `src/main/runtime/hermes/hermes-runtime.ts`
- `src/shared/types.ts`
- `docs/codex-handoff/2026-06-20-hermes-memory-loop.md`

## 关键决策
- 记忆能力的验收标准改为 Hermes 官方 `MemoryStore.add/load_from_disk/remove` 成功，而不是目录存在。
- 验证脚本使用临时 marker 写入后立即删除，避免污染用户长期记忆。
- 空记忆库是正常状态；`memorySnapshotReady` 在空库时可能为 false，但只要 `memoryWritable/userWritable/testEntryRemoved` 成功，就视为记忆闭环可用。
- `config.yaml` 放在 `data/.hermes` 根目录，配合 `HERMES_HOME=E:\data\.hermes`，保持零痕迹。
- 当前阶段只闭环官方持久记忆；自动生成技能、cron、connectors、sandbox、subagent 仍需要继续做真实运行闭环。

## 待继续
- 修复/补齐本地 `node_modules`，当前 TypeScript 包缺少 `lib/tsc.js`，`npm install` 多次超时，导致 `npm run typecheck` 仍无法作为通过项。
- 继续做 Hermes 自动生成技能闭环：从模型对话触发 skill tool/skill creation，到 OpenClaw/Hermes 共用技能目录，再到 Hermes 官方可见与可调用。
- 继续做 cron automation 真实执行闭环：自然语言任务保存、调度器运行、执行报告写入 `data/.hermes/reports/cron`。
- 继续做 connectors 真实闭环，尤其微信/OpenClaw Weixin 消息进入后调用 Hermes/OpenClaw 协同回复。
- 继续补三平台原生 runtime/launcher 与 universal zip manifest/package。

## 验证结果
- `node --check scripts/restore-openclaw-shell.mjs` 通过。
- `node --check scripts/verify-hermes-memory.mjs` 通过。
- `node scripts/verify-hermes-memory.mjs` 通过：`ok=true`，`memoryWritable=true`，`userWritable=true`，`testEntryRemoved=true`，report=`E:\data\.hermes\reports\memory\persistence-last.json`。
- `node scripts/verify-hermes-skills.mjs` 通过：sourceCount=80，mirroredCount=80，visibleCount=77，commandCount=77。
- `node scripts/verify-hermes-runtime.mjs` 通过：Hermes Agent v0.15.1，Python 3.12.13，Node v24.15.0，零痕迹环境指向 `E:\data\.hermes`。
- `node scripts/audit-portable-release.mjs` 通过但仍报告：windowsPortableUsable=true，strictZeroTraceReady=true，threePlatformNativeReady=false，universalZipReady=false。
- 已确认 deployed app bundle 包含 `verifyHermesMemory`、`memoryReady/memoryWritable`、`hermes-memory` 环境检查项。
- `npm run typecheck` 未通过：`npm` 可用但 `tsc` 缺失；直接运行 `node_modules/typescript/bin/tsc` 也失败，原因是 `node_modules/typescript/lib/tsc.js` 不存在；`npm install --ignore-scripts` 180 秒超时。

## 如果需要下一台 Codex 接手，提示词
继续在 `E:\source\openclawpro-agent-hub` 开发。当前已完成 Hermes skills 官方可见闭环和 Hermes memory persistence 官方读写闭环，并已部署到 `E:\win-unpacked\resources\app`。请先运行 `node scripts/verify-hermes-memory.mjs`、`node scripts/verify-hermes-skills.mjs`、`node scripts/verify-hermes-runtime.mjs`、`node scripts/audit-portable-release.mjs` 确认基线。下一步建议优先做 Hermes 自动生成技能真实闭环，要求 OpenClaw 与 Hermes 共用 `E:\skills`，新安装/新生成技能能被两边发现、验证和使用。继续保留原 OpenClaw UI，不要替换成新壳。每阶段结束执行 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`，并新增 handoff，handoff 必须包含“总体目标”。
