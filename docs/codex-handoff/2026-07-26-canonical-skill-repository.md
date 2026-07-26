# Codex Handoff

## 总体目标

基于已开发的 U 盘便携版 OpenClaw 完整集成 Hermes，实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离和可视化配置中心，并与现有前端和 OpenClaw 功能自然融合。

## 当前目标

将 U 盘根目录 `skills/` 建设为唯一共享技能仓库，使 OpenClaw 下载或生成、Hermes 下载或生成以及用户手动安装的有效技能都能被 OpenClaw 和 Hermes 发现并使用，同时避免技能扫描阻塞 Electron 主线程。

## 已完成

- 新增独立 Node 技能仓库协调进程，监控 OpenClaw managed、OpenClaw workspace 和 Hermes local/generated 三类原生写入目录。
- 将 Agent 新增和更新的技能同步到根目录 `skills/`，同名冲突使用来源后缀隔离。
- 支持原生卸载传播，并保护用户在根目录手动修改过的技能不被覆盖或删除。
- 技能协调清单持久化到 `data/.agent-hub/shared-skills.json`。
- OpenClaw 和 Hermes 均配置为读取根目录共享技能仓库；技能管理界面只展示根目录，不重复展示内部副本。
- 协调进程随应用启动和退出，异常退出自动恢复；同步结果通过 preload 事件通知技能管理界面刷新。
- 移除 Hermes 环境快照在 Electron 主线程递归扫描技能目录的逻辑，技能数量改读协调进程报告。
- 后台同步默认每 15 秒执行一次，显式技能扫描和同步会立即执行；技能包计数支持六层嵌套目录。
- 增加共享技能仓库自动化验证和构建产物完整性检查。

## 改动文件

- `src/openclaw-shell-app/dist/main/skill-repository-worker.cjs`
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/preload/index.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `scripts/verify-portable-skill-repository.mjs`
- `scripts/build-openclaw-shell-app.mjs`
- `scripts/stage-windows-release-dir.mjs`
- `scripts/audit-openclaw-shell-features.mjs`
- `package.json`
- 上述源码构建生成的 `dist/` 对应文件

## 关键决策

- 根目录 `skills/` 是唯一对外共享仓库，Agent 内部技能目录只是需要被协调的原生写入来源。
- 不修改 OpenClaw 或 Hermes runtime 官方代码，通过独立协调进程兼容二者硬编码或官方默认写入位置。
- 文件扫描和复制不在 Electron 主线程执行，避免技能数量增长后造成界面未响应。
- 根目录用户内容优先：冲突时保留用户技能并为 Agent 来源分配新目录；用户修改后的同步副本不自动删除。
- “物理可见”与“Agent 可用”分开判断。有效技能包必须包含 `SKILL.md`；平台、依赖和声明条件仍由 OpenClaw/Hermes 官方加载规则决定。

## 待继续

- 将本轮 `dist/` 和新增 worker 部署到实际 Windows 运行壳后，分别验证 OpenClaw 安装、Hermes 生成和手动复制三条真实操作链路。
- 在 macOS 和 Linux runtime 上执行同样的便携根目录验证，确认路径和子进程退出行为一致。
- 后续可增加技能管理界面的来源、兼容性和不可用原因展示，让“目录中存在但 Agent 未加载”的原因对用户可见。

## 验证结果

- `npm.cmd run build`：通过。
- `npm.cmd run verify:portable-skill-repository`：通过，覆盖导入、嵌套计数、冲突、更新、删除和用户修改保护。
- `npm.cmd run verify:shared-backports`：通过。
- `npm.cmd run audit:openclaw-shell`：29/29 通过。
- `npm.cmd run verify:windows-shared-skills`（`PORTABLE_ROOT=E:\`）：通过。根目录 280 个有效包；OpenClaw 211/211 注入且未截断；Hermes 官方扫描识别 252 个。
- `node --check` 与 `git diff --check`：通过。

## 如果需要下一台 Codex 接手，提示词

请在 `D:\github\u-agent` 的 `main` 分支继续开发。先阅读本 handoff 和上一份 `2026-07-26-windows-shared-skills-closure.md`，运行现有共享技能验证，不要直接修改 runtime，也不要覆盖用户 U 盘数据。重点在真实运行壳验证三条技能来源闭环，以及为未被 Agent 官方规则加载的技能展示明确原因。所有文件扫描必须留在独立 worker，不能回到 Electron 主线程。阶段完成后按约定执行 status、diff、add、commit、push。
