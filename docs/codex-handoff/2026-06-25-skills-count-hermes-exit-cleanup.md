# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw，实现与 Hermes Agent 的无缝集成：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、自然语言定时自动化、子代理委派、沙箱隔离、可视化配置中心，并在现有前端界面中提供良好的 OpenClaw / Hermes / 协同使用体验。

## 当前目标
修复技能数量显示不准确、Hermes 后台进程异常退出缺少可读原因、退出整个程序后相关进程残留的问题。

## 已完成
- 确认 `F:\skills` 下实际有 80 个带 `SKILL.md` 的技能，`references` 和 `scripts` 不是技能目录。
- 修复 `scan-local-skills` 和旧同步逻辑的相对路径解析：`skills` 现在统一解析到 U 盘根目录 `F:\skills`，不再误解析到 `F:\data\skills`。
- Hermes 同步 OpenClaw 技能时会生成 `data/.openclaw/skills-catalog.json` 和 `skills-catalog.md`，作为 80 个技能的权威清单。
- 为 Hermes config server、api/dashboard 子进程退出增加 stdout/stderr 尾部诊断，`code=1` 不再只有空泛退出码。
- 程序退出时增加 `cleanupPortableChildProcesses()`，按当前程序根目录、runtime、data 路径精准清理相关 node/python/Hermes/OpenClaw 子进程。
- `HermesManager.stop()` 现在会清空 config/dashboard/api 进程引用，避免退出后状态误判。
- 修复已同步进 `scripts/restore-openclaw-shell.mjs`，重新 restore/build 不会丢掉路径解析、进程清理和技能 catalog 逻辑。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `scripts/restore-openclaw-shell.mjs`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `docs/codex-handoff/2026-06-25-skills-count-hermes-exit-cleanup.md`

## 关键决策
- 技能数量以 U 盘根目录 `skills/` 中带 `SKILL.md` 的目录为准，当前为 80 个。
- 不用全局 taskkill 杀所有 node/python，避免误伤用户其它开发进程；只杀命令行或可执行路径命中当前 U 盘 app/runtime/data 的相关进程。
- Hermes 自动重启问题先增强诊断，区分正常停止和异常退出，后续如果还有重启可直接从 launcher.log 的 tail 看到原因。

## 待继续
- 用户需要重新打开 `F:\win-unpacked\OpenClawPro.exe`，进入技能管理页确认数量是否显示为 80。
- 在技能管理页点击“同步到 Hermes”，确认 Hermes 技能报告里的 source/mirrored 数量为 80。
- 测试退出整个程序后，任务管理器中不应再残留 `F:\runtime` 或 `F:\win-unpacked` 相关 node/python/Hermes 进程。

## 验证结果
- `node --check src\openclaw-shell-app\dist\main\index.js` 通过。
- `node --check scripts\restore-openclaw-shell.mjs` 通过。
- 模拟扫描 `F:\skills`：识别 80 个技能。
- `npm.cmd run build` 通过。
- 已同步到 `F:\win-unpacked\resources\app\dist`，同步后 main/preload 语法检查通过。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-openclaw-runtime.mjs` 通过，OpenClaw CLI smoke 正常。
- `AGENT_HUB_ROOT=F:\ node scripts\verify-hermes-runtime.mjs` 通过，Hermes/Python/Node runtime 正常。
- 已生成 `F:\data\.openclaw\skills-catalog.json`，total=80。

## 如果需要下一台 Codex 接手，提示词
继续开发 `D:\github\u-agent`。刚修复 Windows 端技能数量和退出清理：`scan-local-skills` 已统一从 `getAppRoot()/skills` 扫描，Hermes 同步会生成 `data/.openclaw/skills-catalog.json/md`，退出程序会按 app/runtime/data 路径精准清理相关子进程，Hermes 子进程异常退出会记录 stdout/stderr tail。请先运行 `git status`、`npm.cmd run build`，再用 `F:\win-unpacked\OpenClawPro.exe` 测试技能管理数量、Hermes 同步和退出后进程残留。不要用全局杀 node/python 的方式修复残留进程，必须按当前 U 盘路径精准清理。
