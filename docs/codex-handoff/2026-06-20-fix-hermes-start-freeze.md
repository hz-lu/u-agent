# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长（持久记忆 + 自动生成技能）、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并和现有程序前端界面无缝融合。保留 OpenClaw 原有功能与体验，同时让 Hermes 在首页、AI 会话、模型配置、环境检查、技能管理等模块自然协同，为用户提供清晰、可操作、可验证的体验。

## 当前目标
修复用户点击首页“启动 Hermes”后桌面程序长时间无响应，并被 Windows 提示“程序未响应”的问题。

## 已完成
- 定位根因：已部署到 `E:\win-unpacked\resources\app\dist\main\index.js` 的 Hermes 启动链路仍在 Electron 主进程同步执行 `syncOpenClawSkillsToHermes({ silent: false })` 和 `repairShims()`，其中 skills 同步会扫描/复制技能并启动 Python 验证，导致点击启动时主进程阻塞。
- 源码 `src/main/runtime/hermes/hermes-runtime.ts` 已移除 `start()` 自动执行 `verifyMemory()`、`syncAndVerifySkills()` 的逻辑。
- 源码 `src/main/runtime/hermes/hermes-runtime.ts` 已移除 `chat()` 自动执行 `syncAndVerifySkills({ silent: true })` 的逻辑。
- `scripts/restore-openclaw-shell.mjs` 已调整：生成/恢复打包主进程时，会清除自动启动路径中的 `syncOpenClawSkillsToHermes({ silent: false })` 和 `repairShims()`。
- 已重新执行恢复脚本并部署到 `E:\win-unpacked\resources\app`，部署前备份为 `E:\backups\app-before-openclaw-shell-restore-20260620183226`。
- 已确认打包后的 `index.js` 中，`start()`、`startApiServer()`、`chat()` 自动路径不再包含上述同步重活；仅保留“同步 Hermes 技能”显式 IPC 会执行 skills 同步。

## 改动文件
- `src/main/runtime/hermes/hermes-runtime.ts`
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-20-fix-hermes-start-freeze.md`

## 关键决策
- Hermes 启动、聊天自动启动、状态刷新这类 UI 高频/用户等待路径必须轻量化，不能同步执行 Python 验证、skills 镜像、shim 修复等重操作。
- skills 同步、memory 验证、skill growth 验证仍保留为显式用户动作或脚本，后续如果要在 UI 展示，需要提供进度、日志和可取消/后台执行能力。
- 当前修复优先解决“程序未响应”；三平台原生、Universal zip、Hermes 官方能力完整闭环仍是后续阶段任务。

## 待继续
- 将 Hermes skills 同步改成后台任务队列，UI 显示进度与结果，避免显式同步按钮也造成长时间无反馈。
- 继续补齐 Hermes 官方能力真实闭环：技能真实调用、自动生成技能、cron、connectors、sandbox/subagent、微信消息回复链路。
- 继续推进三平台运行时和 Universal zip 打包。

## 验证结果
- `node --check scripts/restore-openclaw-shell.mjs` 通过。
- `node scripts/restore-openclaw-shell.mjs` 成功重新部署到 `E:\win-unpacked\resources\app`。
- 反查 `E:\win-unpacked\resources\app\dist\main\index.js`：`start()`、`startApiServer()`、`chat()` 自动路径不再包含 `syncOpenClawSkillsToHermes({ silent: false })` 或 `repairShims()`。
- `node scripts/verify-hermes-runtime.mjs` 通过，Hermes CLI、portable Python、portable Node、config server、source 均存在。
- `node scripts/audit-portable-release.mjs` 显示 Windows portable、Windows zero install、strict zero trace 已通过；三平台原生与 Universal zip 仍未完成。
- 启动 `E:\win-unpacked\OpenClawPro.exe` 后，多个 `OpenClawPro` 进程均显示 `Responding=True`。

## 如果需要下一台 Codex 接手，提示词
继续在 `E:\source\openclawpro-agent-hub` 开发。当前刚修复“点击启动 Hermes 导致桌面程序未响应”：不要把 Python/Hermes skills 扫描、memory 验证、shim 修复放回 Electron 主进程的启动、聊天自动启动、状态刷新路径。重操作必须走显式按钮/后台任务，并向 UI 返回进度与日志。每个阶段结束后执行 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`，并新增 `docs/codex-handoff/YYYY-MM-DD-xxx.md`，handoff 必须包含“总体目标”。
