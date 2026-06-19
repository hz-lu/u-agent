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
按用户纠正后的产品方向继续：不是完全保持原 UI 静止，也不是另起一个 Hub，而是在保留 OpenClaw 原有首页、AI 会话、模型配置、环境检查等模块的基础上，把 Hermes 融合进去。当前阶段先在原首页 Gateway 控制台下增加 Hermes 协同控制卡片。

## 已完成
- 更新 `scripts/restore-openclaw-shell.mjs`，在恢复原 OpenClaw shell 时继续保持原前端 bundle 为基线。
- 在原首页控制台中插入 `Hermes Agent 协同控制台` 卡片。
- 卡片提供四个操作：
  - 配置中心：调用 `window.uclaw.ipcOpenHermesConfig()`。
  - Dashboard：调用 `window.uclaw.ipcOpenHermesDashboard()`。
  - Agent API：调用 `window.uclaw.ipcOpenHermesApiServer()`。
  - 停止 Hermes：调用 `window.uclaw.ipcStopHermes()`。
- 为卡片追加与原 OpenClaw 深色科技风格相近的 CSS。
- 继续保留托盘菜单中的 Hermes 旁路入口。
- 继续避免旧 Hermes dist 注入补丁资产回归。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-19-home-console-hermes-controls.md`

## 关键决策
- 当前阶段仍不替换 OpenClaw 主界面；Hermes 融入原首页控制台，成为 OpenClaw Gateway 旁边的协同控制能力。
- 由于原前端源码目前只有打包 bundle，暂时通过恢复脚本做确定性变换；后续应逐步抽取/重建原 OpenClaw 前端源码，减少对 bundle patch 的依赖。
- 不部署独立 `hermes-enhance.js`、`real-hermes-ui.js`、`hermes-chat-enhance.js` 等旧补丁层。
- 后续可继续在 AI 会话、模型配置、环境检查模块按同样方式增加 Hermes 切换与协同能力。

## 待继续
- 实机查看首页 Hermes 卡片视觉效果，必要时微调 spacing、对比度和响应式表现。
- 在 AI 会话页增加 OpenClaw / Hermes / 协同 三种会话模式。
- 在模型配置页增加 Hermes 模型配置区域，并复用原模型配置的交互风格。
- 在环境检查页增加 Hermes runtime、Python、Node、数据目录、端口检查。
- 将原 OpenClaw 前端源码化，避免长期维护压缩 bundle 变换。

## 验证结果
- 已执行 `node scripts/restore-openclaw-shell.mjs`。
- 恢复前备份当前 app 到 `E:\backups\app-before-openclaw-shell-restore-20260619113821`。
- 部署后的 renderer bundle 中可检索到 `home-hermes-card`、`Hermes Agent 协同控制台`、`handleHermesConfig`、`handleHermesDashboard`、`handleHermesApi`。
- 部署后的 CSS 中可检索到 `home-hermes-card`、`home-hermes-btn`、`home-hermes-actions`。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- 部署后的 `dist/assets` 中未发现旧 Hermes patch/enhance 资产。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- 当前机器已有多个 `OpenClawPro.exe` 实例，短启动新进程会因单实例锁退出；未强杀用户可能正在查看的窗口。
- `scripts\verify-hermes-runtime.mjs` 通过。
- `scripts\verify-openclaw-runtime.mjs` 通过。

## 如果需要下一台 Codex 接手，提示词
请在 `E:\source\openclawpro-agent-hub` 继续开发。用户明确方向：保留原 OpenClaw UI 和功能体系，但允许并需要把 Hermes 融合进首页控制台、AI 会话、模型配置、环境检查等模块；不要另起一个全新 Hub，也不要让原功能消失。当前 `scripts/restore-openclaw-shell.mjs` 会恢复原 OpenClaw shell，并在原首页插入 Hermes 协同控制卡片、在托盘加入 Hermes 入口。下一步建议实机检查首页卡片，然后继续在 AI 会话页做 OpenClaw/Hermes/协同模式切换。每个阶段完成后按 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push` 流程提交，并新增一份包含“总体目标”的 handoff。
