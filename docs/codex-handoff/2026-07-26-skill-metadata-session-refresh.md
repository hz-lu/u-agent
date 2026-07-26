# Codex Handoff

## 总体目标

基于已开发的 U 盘便携版 OpenClaw 完整集成 Hermes，实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离和可视化配置中心，并与现有前端和 OpenClaw 功能自然融合。

## 当前目标

修复技能管理页介绍显示为 `|`、`>` 或空白的问题，并解决 OpenClaw 主会话持续复用旧技能快照、只向模型注入 134 个技能的问题，同时澄清 Hermes 模型估算数量与官方命令数量的差异。

## 已完成

- 新增独立、可测试的技能元数据解析模块，正确支持 YAML 行内值、引号值、`|` literal block 和 `>` folded block。
- 缺少 `description` 时从 `SKILL.md` 正文提取第一段有效说明，仍无内容时 UI 显示“暂无技能介绍”。
- 技能包发现支持分类目录嵌套，并在遇到一个有效技能包后停止继续扫描其内部辅助文件，避免重复计数。
- 技能管理页扫描迁移到独立 Node 子进程，避免 Electron 主线程同步读取 280 个技能文件。
- 技能扫描子进程增加单次结算与超时保护，避免退出事件竞态影响 IPC 响应。
- Gateway 每次启动前只删除会话中的派生 `skillsSnapshot`，保留 sessionId、聊天记录和其他会话状态；下一次对话由 OpenClaw 按当前技能目录和限制重建快照。
- 更新 Windows 共享技能验证，使包统计与 UI 使用同一套发现规则。

## 改动文件

- `src/openclaw-shell-app/dist/main/skill-metadata.cjs`
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `scripts/verify-skill-metadata.mjs`
- `scripts/verify-windows-shared-skill-closure.mjs`
- `scripts/build-openclaw-shell-app.mjs`
- `scripts/audit-openclaw-shell-features.mjs`
- `package.json`
- 上述源码构建生成的 `dist/` 对应文件

## 关键决策

- 不能把模型口头回答当成技能运行时统计。技能包数量、唯一声明名称、Agent eligible 数量和实际注入提示词数量是四个不同指标。
- OpenClaw 的 134 来自持久化旧快照：旧会话记录明确包含 `Skills truncated: included 134 of 171`；当前官方 fresh snapshot 是 211/211。
- 不删除聊天历史来刷新技能，只删除可重建的 `skillsSnapshot` 字段。
- Hermes 的“大约 257”是模型估算；当前官方隔离扫描为 252 个 slash 命令。根目录 280 个包中有 260 个唯一声明名称，Hermes 还会按平台、重复名称和命令名合法性过滤。
- 技能元数据扫描必须在子进程运行，不能为了修复展示重新引入主线程 I/O 卡顿。

## 待继续

- 关闭 E 盘当前应用后，把最新 `dist/` 部署到测试壳；E 盘当前壳缺少 `dist/main/skill-repository-worker.cjs` 和 `dist/main/skill-metadata.cjs`，并非最新构建。
- 部署后重启 Gateway，发送第一条 OpenClaw 消息并检查新生成的 session snapshot 是否为 211 项、提示词是否不再截断。
- 后续可在技能管理页增加“已安装 / 唯一名称 / OpenClaw 可用 / Hermes 命令”四项可解释统计及不可用原因筛选。

## 验证结果

- `npm.cmd run verify:skill-metadata`：通过，覆盖 literal、folded、正文回退、嵌套技能、子进程扫描及会话历史保护。
- E 盘只读解析：280 个技能包、260 个唯一声明名称、异常介绍 0。
- `npm.cmd run verify:windows-shared-skills`：通过；OpenClaw 211/211 注入且无截断，Hermes 官方命令 252。
- `npm.cmd run build`：通过。
- `npm.cmd run audit:openclaw-shell`：31/31 通过。
- `npm.cmd run verify:shared-backports`：通过。
- `git diff --check`：通过。

## 如果需要下一台 Codex 接手，提示词

请在 `D:\github\u-agent` 的 `main` 分支继续。先阅读本 handoff 与 `2026-07-26-canonical-skill-repository.md`。不要把模型回答的技能数量当成官方统计；使用 `verify:windows-shared-skills` 和会话 `skillsSnapshot` 验证。部署到 E 盘前必须先关闭当前 OpenClawPro 进程，并至少同步最新 main、renderer、`skill-metadata.cjs`、`skill-repository-worker.cjs` 和 preload 构建文件。不要修改或删除用户的 `E:\skills` 与聊天历史。
