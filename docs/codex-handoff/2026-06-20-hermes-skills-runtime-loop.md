# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、持久记忆 + 自动生成技能、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并和现有前端无缝融合。Hermes 要融合进原 OpenClaw 前端体验，保留原功能，同时在首页、AI 会话、模型配置、环境检查、技能管理等模块自然协同。

## 当前目标
完成 Hermes skills 真实运行闭环第一阶段：不只是把 OpenClaw skills 复制到 Hermes 目录，而是让 Hermes 官方 skill command 扫描真正看见，并把可见数量、slash 命令数量、报告路径反馈给 UI 和验证脚本。

## 已完成
- 新增 `scripts/verify-hermes-skills.mjs`，可独立同步 OpenClaw skills 到 `data/.hermes/skills/openclaw` 并调用 Hermes 官方 `agent.skill_commands.reload_skills()` 验证。
- 升级 `scripts/restore-openclaw-shell.mjs`，当前桌面程序的 Hermes skills 同步变为“镜像 + 官方扫描 + report”闭环。
- skills 同步增加重目录排除，跳过 `.git/.github/.hub/.archive/node_modules/__pycache__/.venv/venv/dist/build/.next/.cache`，避免 UI 点击后长时间无反馈。
- skills 同步增加 manifest 未变化跳过复制，重复验证从分钟级降到约 1.3 秒。
- 环境检查中的 Hermes 技能项改为显示镜像数量、Hermes 官方可见数量、slash 命令数量和报告路径。
- 技能管理页“同步到 Hermes”按钮的反馈改为显示 OpenClaw 源数量、镜像数量、Hermes 官方可见数量、slash 命令数量和报告路径。
- 源码层 `HermesRuntime` 增加 `syncAndVerifySkills()`、状态报告、skills report 类型和 IPC 入口，避免未来从源码构建时退回纯复制逻辑。
- 已部署到 `E:\win-unpacked\resources\app`，保留原 OpenClaw shell 并备份旧 app。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `scripts/verify-hermes-skills.mjs`
- `package.json`
- `src/main/index.ts`
- `src/main/runtime/hermes/hermes-runtime.ts`
- `src/preload/index.ts`
- `src/shared/types.ts`
- `docs/codex-handoff/2026-06-20-hermes-skills-runtime-loop.md`

## 关键决策
- 用户点击 skills 同步时默认只做 Hermes 官方扫描可见性验证，不默认执行 `build_skill_invocation_message()`，因为完整 skill 注入可能加载支持文件并导致分钟级等待。
- “可使用”不再按目录 `SKILL.md` 数量粗略判断，而按 Hermes 官方 `reload_skills/get_skill_commands` 返回的 visible/commands 数量判断。
- `missingNames` 使用 Hermes slash command slug 对齐，避免 `Agent Browser` 与 `/agent-browser` 这种大小写/格式差异误报。
- 当前阶段聚焦 skills 可见和命令注册闭环；具体让模型自动选择并执行某个 skill 的深度调用链，放到后续“单独验证调用/真实任务执行”阶段。

## 待继续
- 给 UI 增加单独的“验证 Hermes 调用某个 skill”按钮，异步执行并显示进度，避免阻塞主同步按钮。
- 处理 `missingNames` 中剩余 2 个技能，检查是否因为中文 name 被 Hermes 命令 slug 清洗为空或 frontmatter 不符合 Hermes 规范。
- 进入下一阶段：Hermes memory persistence loop，确认记忆写入、读取、报告和 UI 状态。
- 继续 cron automation、connectors、sandbox、subagent delegation 的真实闭环。
- 三平台原生和 Universal zip 仍未完成，需要补 macOS arm64/x64、Linux x64/arm64 runtime/launcher 和 universal package manifest。

## 验证结果
- `node --check scripts/restore-openclaw-shell.mjs` 通过。
- `node --check scripts/verify-hermes-skills.mjs` 通过。
- `node scripts/verify-hermes-skills.mjs` 通过：OpenClaw sourceCount=80，mirroredCount=80，visibleCount=77，commandCount=77，reportPath=`E:\data\.hermes\reports\skills\visibility-last.json`。
- `node scripts/verify-hermes-runtime.mjs` 通过：Hermes Agent v0.15.1、Python 3.12.13、Node v24.15.0，零痕迹环境指向 `E:\data\.hermes`。
- `node scripts/audit-portable-release.mjs` 通过但仍报告：Windows portable usable=true、strictZeroTraceReady=true、threePlatformNativeReady=false、universalZipReady=false。
- `npm run typecheck` 未完成：尝试 `npm install` 时 npm 进程长时间不退出，后续 `tsc` 仍未进入可用 PATH；未作为本阶段通过项。

## 如果需要下一台 Codex 接手，提示词
继续在 `E:\source\openclawpro-agent-hub` 开发。当前阶段已完成 Hermes skills 的“镜像 + 官方扫描可见性”闭环，并部署到 `E:\win-unpacked\resources\app`。请先运行 `node scripts/verify-hermes-skills.mjs`、`node scripts/verify-hermes-runtime.mjs`、`node scripts/audit-portable-release.mjs` 确认基线。下一步优先做 Hermes memory persistence loop：确认 `HERMES_HOME=E:\data\.hermes`、`HERMES_MEMORY_PATH=E:\data\.hermes\memories` 下的记忆写入/读取/报告，接入首页和环境检查，不要替换原 OpenClaw UI。每个阶段完成后执行 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`，并新增 handoff，handoff 必须包含“总体目标”。
