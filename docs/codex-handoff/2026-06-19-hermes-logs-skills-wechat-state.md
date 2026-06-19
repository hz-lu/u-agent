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
修复用户反馈的三类真实运行问题：Hermes 首页日志为空、Hermes 环境检查端口/技能数量显示不准、微信扫码后微信端发消息没有回复。

## 已完成
- 新增主进程 IPC `hermes:getLogs`，从 `E:\data\.hermes\logs` 读取 `gateway.log`、`agent.log`、`errors.log`、`gui.log`、`gateway-exit-diag.log` 的历史日志。
- preload 新增 `ipcGetHermesLogs()`。
- 首页 Hermes 日志 tab 会在页面挂载、启动/重启 Hermes、切换到 Hermes 日志时读取历史日志，不再只依赖实时事件。
- Hermes 技能统计由第一层目录统计改为递归识别 `SKILL.md` / `DESCRIPTION.md`。
- Hermes 状态统计合并 OpenClaw 的 `skills.load.extraDirs`，当前 `E:\skills` 识别到 83 个技能，`E:\data\.hermes\skills` 识别到 26 个，合计 109。
- 环境检查页在展示缓存后会立即异步重新执行 `runAllChecks()` 并写回最新结果，避免停留在旧的“端口未启动”缓存。
- 修复 WeChat Manager `_getEnv()`：微信登录/插件 CLI 进程现在显式设置 `OPENCLAW_STATE_DIR`、`CLAWDBOT_STATE_DIR`、`OPENCLAW_CONFIG` 指向 `E:\data\.openclaw`。
- 新增微信诊断 IPC `wechat:diagnostics`，`get-wechat-status` 会附带微信账号索引、账号目录、账号数量等诊断数据。
- 已重新部署到 `E:\win-unpacked\resources\app`。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-19-hermes-logs-skills-wechat-state.md`

## 关键决策
- Hermes 日志不能只显示本次进程 stdout/stderr，必须读取 U 盘持久日志，否则用户重进首页会看到“暂无日志”。
- 技能数量必须体现 OpenClaw 已安装技能和 Hermes 自带技能的融合状态，不能只数 Hermes 官方 skills 第一层目录。
- 微信“扫码成功”不等于“Gateway 可回复”。微信插件实际依赖 `OPENCLAW_STATE_DIR/openclaw-weixin/accounts.json` 和账号文件；之前 WeChat Manager 只设置 `OPENCLAW_HOME`，没有设置插件读取的 state env，导致账号可能没有落到 U 盘 state。
- 本轮不强行伪造微信账号配置；修正登录环境后，需要用户重新扫码，让账号重新写入 `E:\data\.openclaw\openclaw-weixin`。

## 待继续
- 用户重新启动桌面程序后，在首页切换 Hermes 日志 tab，确认可以看到 `gateway.log/agent.log` 历史日志。
- 进入环境检查页确认 Hermes 端口刷新为运行中，技能数量刷新为合并后的数量。
- 微信需要重新扫码登录一次；扫码后检查 `E:\data\.openclaw\openclaw-weixin\accounts.json` 是否生成，再测试微信发消息是否回复。
- 后续可以在聊天工具/微信页面直接展示微信诊断信息，避免“界面已连接但 Gateway 无账号”的误导。
- 如仍无微信回复，下一步查 OpenClaw Gateway 是否加载 openclaw-weixin channel，以及账号 long-poll 是否收到 inbound message。

## 验证结果
- `node --check scripts\restore-openclaw-shell.mjs` 通过。
- `node scripts\restore-openclaw-shell.mjs` 已执行，部署到 `E:\win-unpacked\resources\app`，最近备份目录为 `E:\backups\app-before-openclaw-shell-restore-20260619153246`。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\preload\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- 部署产物中已检索到 `hermes:getLogs`、`ipcGetHermesLogs`、`loadHermesLogs`、`switchLogSource`、`OPENCLAW_STATE_DIR`、`wechat:diagnostics`、`countHermesSkills`。
- 合并技能统计脚本结果：`E:\data\.hermes\skills` 为 26，`E:\skills` 为 83，总计 109。
- `node scripts\verify-hermes-runtime.mjs` 通过：Hermes Agent v0.15.1，Python 3.12.13，Node v24.15.0，配置/Dashboard/API 端口均可用，零痕迹环境指向 `E:\data\.hermes`。
- `node scripts\verify-openclaw-runtime.mjs` 通过：Gateway 18789 ready，模型配置和 API Key present；`openclawCmd` 仍为 false，但 zip、Node、配置和 Gateway 可用。

## 如果需要下一台 Codex 接手，提示词
请在 `E:\source\openclawpro-agent-hub` 继续开发。本阶段修复了 Hermes 首页日志为空、环境检查缓存旧端口状态、Hermes 技能数只显示第一层目录、微信登录进程没有显式设置 `OPENCLAW_STATE_DIR` 的问题。部署产物已更新到 `E:\win-unpacked\resources\app`。下一步优先让用户重启程序并重新扫码微信，确认 `E:\data\.openclaw\openclaw-weixin\accounts.json` 生成；如果微信仍不回复，继续查 Gateway channel 加载和 inbound long-poll。每个阶段完成后按 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push` 提交，并新增包含“总体目标”的 handoff。
