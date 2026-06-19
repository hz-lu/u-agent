# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：

- 零安装：Python / Node 运行时自带，不依赖系统任何东西。
- 零痕迹：所有读写劫持到 U 盘 `data/` 目录，宿主机零接触。
- 三平台原生：macOS arm64/x64、Linux x64/arm64、Windows x64。
- Universal 包：单个 zip 带齐三平台 venv，启动器自动识别。
- 自我成长：持久记忆 + 自动生成技能，运行越久越强。
- 多平台接入：Telegram/Discord/Slack/WhatsApp/Signal/Email/CLI，一处启动多处可达。
- 定时自动化：自然语言 cron 调度，无人值守执行报告/备份/简报。
- 子代理委派：隔离子对话 + 独立终端 + Python RPC，零上下文成本流水线。
- 沙箱隔离：本地/Docker/SSH/Singularity/Modal 五种后端。
- 可视化配置中心：选模型/填 Key/测试连接/换模型/查看日志/导入导出。

以上任务均要和现有程序前端界面无缝融合，让用户在前端界面上获得良好操作体验。

## 当前目标
在保持原 OpenClaw 主界面和原功能完全不变的前提下，为 Hermes 增加一个最小侵入入口。当前阶段选择 Electron 托盘菜单作为旁路入口，避免改动原 OpenClaw 前端页面和用户工作流。

## 已完成
- 更新 `scripts/restore-openclaw-shell.mjs`，恢复原 OpenClaw shell 时对主进程做小型、可审计补丁。
- 在原托盘菜单中新增 `🧠 Hermes Agent` 子菜单：
  - 打开配置中心。
  - 打开 Dashboard。
  - 启动 Agent API。
  - 停止 Hermes。
- 继续使用原 OpenClaw 前端 bundle：
  - `dist/assets/main/index.html`
  - `dist/assets/assets/main-DIeui7ZO.js`
  - `dist/assets/main-CAx6YYDG.css`
- 没有修改原 OpenClaw 前端 UI，没有新增 Hub 首页，没有替换原用户体验。
- 已重新执行恢复脚本部署到 `E:\win-unpacked\resources\app`。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-19-hermes-tray-entry.md`

## 关键决策
- Hermes 第一阶段入口放在托盘菜单，而不是主界面，确保 OpenClaw 原 UI/功能不受影响。
- 托盘入口复用原主进程里已经存在的 Hermes Manager 和 IPC 能力，不引入新的前端注入脚本。
- 旧 Hermes dist 注入补丁仍不复制、不启用。
- 后续如果要进入主界面，也必须按原 OpenClaw 的视觉语言和信息架构做最小入口。

## 待继续
- 实测托盘菜单点击配置中心、Dashboard、Agent API 的交互体验。
- 为 Hermes 增加原 UI 风格的设置页入口，而不是独立 Hub 页面。
- 把当前对打包主进程的托盘补丁逐步源码化，避免长期依赖构建产物字符串补丁。
- 梳理原 OpenClaw 前端页面路由和组件结构，找到最自然的 Hermes 融合位置。

## 验证结果
- 已执行 `node scripts/restore-openclaw-shell.mjs`。
- 恢复前备份当前 app 到 `E:\backups\app-before-openclaw-shell-restore-20260619113154`。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- 部署后的主进程中可检索到 `🧠 Hermes Agent`、`打开配置中心`、`打开 Dashboard`、`启动 Agent API`、`停止 Hermes`。
- 部署后的 `dist/assets` 中未发现旧 Hermes patch/enhance 资产。
- 原 OpenClaw 前端 bundle 文件存在。
- 短启动 `E:\win-unpacked\OpenClawPro.exe` 成功，进程保持运行后已关闭。
- `scripts\verify-hermes-runtime.mjs` 通过。
- `scripts\verify-openclaw-runtime.mjs` 通过。

## 如果需要下一台 Codex 接手，提示词
请在 `E:\source\openclawpro-agent-hub` 继续开发。用户明确要求保持原 OpenClaw UI 和原功能不变，在此前提下集成 Hermes。当前部署通过 `scripts/restore-openclaw-shell.mjs` 恢复原 OpenClaw shell，并在托盘菜单新增最小侵入 Hermes 入口。下一步不要恢复新的 Hub UI，也不要使用旧 Hermes JS/CSS 注入补丁；应实测托盘入口，并逐步在原 OpenClaw 设置/工具/模型区域里按原设计语言加入 Hermes。每个阶段完成后按 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push` 流程提交，并新增一份包含“总体目标”的 handoff。
