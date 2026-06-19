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
纠偏 Hermes 集成方向：恢复原 OpenClaw 桌面程序 UI 和原有功能为默认体验，停止用新的 Hub UI 替换主界面。Hermes 后续必须作为原界面的新增能力最小侵入融合。

## 已完成
- 确认用户反馈属实：当前源码版主界面已经替换为新的 Agent Hub UI，不符合“保持原 OpenClaw UI/功能不变”的目标。
- 从 `E:\backups\app-before-full-source-20260618164815` 识别原 OpenClaw 主进程、preload、前端 bundle 和未注入 Hermes patch 的 HTML。
- 新增 `scripts/restore-openclaw-shell.mjs`：
  - 恢复原 OpenClaw `dist/main/index.js`。
  - 恢复原 OpenClaw `dist/preload/index.js`。
  - 恢复原 OpenClaw 前端 bundle `main-DIeui7ZO.js` 和 `main-CAx6YYDG.css`。
  - 使用 `index.html.bak-hermes-20260616163709` 作为无旧 Hermes 注入补丁的原始入口。
  - 不复制 `hermes-enhance.js`、`hermes-chat-enhance.js`、`hermes-env-enhance.js`、`real-hermes-ui.js` 等旧补丁资产。
- 新增 package script：`npm run restore:openclaw-shell`。
- 已执行恢复脚本，把 `E:\win-unpacked\resources\app` 恢复为原 OpenClaw shell。
- 当前源码中的 Hermes runtime 代码仍保留，后续应重新以原 OpenClaw UI 风格做最小侵入融合。

## 改动文件
- `package.json`
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-19-restore-openclaw-shell.md`

## 关键决策
- 后续开发原则：OpenClaw 原 UI、原功能、原 IPC 语义和原用户工作流优先，Hermes 不允许替换主界面。
- Hermes 不再以全新 Hub 首页作为默认体验，而应嵌入到原 OpenClaw 的现有设置/工具/模型/插件等自然入口中。
- 短期恢复部署产物以用户可见体验为优先：先恢复原 app shell，再规划源码化的最小侵入集成。
- 旧 Hermes dist 注入补丁层仍然不回归。

## 待继续
- 把当前源码工程调整为“以原 OpenClaw shell 为基线”的工程结构，而不是新的 Hub UI。
- 从原 `dist/main/index.js` 中抽取 OpenClaw 主进程功能，逐步源码化，避免长期只依赖打包备份产物。
- 在原 OpenClaw UI 中找到合适入口加入 Hermes，例如设置页新增 Hermes 标签、工具区新增 Hermes 控制、聊天模型选择中新增 Hermes Agent。
- 用原 UI 的视觉语言实现 Hermes 配置中心，不改变 OpenClaw 既有页面布局和用户习惯。
- 如果需要先快速接入 Hermes，可优先保留原 preload 中已有 `ipcStartHermes`、`ipcOpenHermesConfig`、`ipcOpenHermesDashboard` 等 IPC，但避免使用旧 JS/CSS 注入补丁。

## 验证结果
- 已执行 `node scripts/restore-openclaw-shell.mjs`。
- 恢复前备份当前 app 到 `E:\backups\app-before-openclaw-shell-restore-20260619112230`。
- `E:\win-unpacked\resources\app\dist\assets\main\index.html` 存在。
- `E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 存在。
- `E:\win-unpacked\resources\app\dist\assets\main-CAx6YYDG.css` 存在。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\preload\index.js` 通过。
- 部署后的 `dist/assets` 中未发现旧 Hermes patch/enhance 资产。
- 短启动 `E:\win-unpacked\OpenClawPro.exe` 成功，进程保持运行后已关闭。
- `scripts\verify-hermes-runtime.mjs` 通过。
- `scripts\verify-openclaw-runtime.mjs` 通过。

## 如果需要下一台 Codex 接手，提示词
请在 `E:\source\openclawpro-agent-hub` 继续开发。用户明确纠偏：必须保持原 OpenClaw UI 和原功能不变，在此前提下集成 Hermes。当前已通过 `scripts/restore-openclaw-shell.mjs` 把部署目录恢复为原 OpenClaw shell，并且没有复制旧 Hermes 注入补丁资产。下一步不要继续扩写新的 Hub UI；应以原 OpenClaw 界面为基线，规划并实现最小侵入的 Hermes 入口和配置页。每个阶段完成后按 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push` 流程提交，并新增一份包含“总体目标”的 `docs/codex-handoff/YYYY-MM-DD-xxx.md`。
