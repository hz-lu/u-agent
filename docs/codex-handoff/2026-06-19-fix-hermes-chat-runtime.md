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

以上任务均要和现有程序前端界面无缝融合，融合 Hermes 到这个项目里，前端界面上操作就要给用户良好的体验。

## 当前目标
修复用户实机截图中 Hermes 会话报错 `this.resolvePythonCommand is not a function`，让 AI 会话页的 Hermes 模式真正能调用 Hermes runtime。

## 已完成
- 定位根因：
  - 原打包主进程 `HermesManager.chat()` 调用了不存在的 `this.resolvePythonCommand()`。
  - 原实现还尝试执行不存在的 Python 模块 `python -m hermes.chat --stdin`。
  - `E:\data\.hermes\config\hub.json` 当前没有模型 Key；OpenClaw 当前模型配置存在于 `E:\data\.openclaw\openclaw.json`。
- 更新 `scripts/restore-openclaw-shell.mjs` 的 `patchHermesRuntimeEnv()`：
  - 用官方 Hermes CLI `hermes --oneshot` 替代不存在的 `hermes.chat` Python 模块。
  - Hermes chat 会自动启动后台 config server，但不再依赖 `this.proc` 才能聊天。
  - Hermes 自己的配置为空时，自动读取 OpenClaw 当前模型：
    - 当前主模型：`qwen/deepseek-v4-flash`
    - 映射 Hermes provider：`alibaba`
    - 注入 `DASHSCOPE_API_KEY`、`DASHSCOPE_BASE_URL`、`HERMES_API_KEY`、`HERMES_BASE_URL`
  - 保持 `HOME`、`USERPROFILE`、`XDG_CONFIG_HOME`、`XDG_CACHE_HOME` 等指向 `E:\data\.hermes`。
- 已重新部署到 `E:\win-unpacked\resources\app`。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-19-fix-hermes-chat-runtime.md`

## 关键决策
- 不再使用半成品 `resolvePythonCommand()` / `python -m hermes.chat --stdin` 路径。
- 优先使用 Hermes 官方提供的脚本接口 `hermes --oneshot`。
- 为了让用户“不重复填 Key”，Hermes 会话默认复用 OpenClaw 当前模型配置。
- Qwen/DashScope 在 Hermes 中映射到 `alibaba` provider。
- 直接运行外部 PowerShell 的 `hermes config path` 会落到宿主机 `C:\Users\Administrator\.hermes`；应用内必须通过 `getHermesEnv()` 强制重定向到 U 盘 `E:\data\.hermes`。

## 待继续
- 用户需要完全退出当前 OpenClawPro 进程并重新打开，才能加载新的 `dist\main\index.js`。
- 在实机 UI 中再次发送 Hermes 消息确认前端回包。
- 后续把 Hermes 模型状态显示到模型配置页 Hermes Tab 中：provider/model/baseUrl/key-present/current-source。
- 将 OpenClaw -> Hermes 模型映射做成可视化可调，而不是只在主进程里自动推断。
- 进一步清理已超时的旧 Hermes/Python 子进程，避免用户多次测试后残留。

## 验证结果
- 已执行 `node scripts\restore-openclaw-shell.mjs`，部署成功。
- 部署前当前 app 已备份到 `E:\backups\app-before-openclaw-shell-restore-20260619131159`。
- `node --check scripts\restore-openclaw-shell.mjs` 通过。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- 部署后的 main bundle 中不再检索到 `resolvePythonCommand` 或 `hermes.chat`，可检索到 `--oneshot`。
- 等价环境直接执行 Hermes CLI 成功：
  - provider: `alibaba`
  - model: `deepseek-v4-flash`
  - baseUrl: `https://dashscope.aliyuncs.com/compatible-mode/v1`
  - API Key: present
  - `hermes --oneshot` exit code `0`，stdout 返回正常内容。
- `scripts\verify-hermes-runtime.mjs` 通过。
- `scripts\verify-openclaw-runtime.mjs` 通过。
- 部署后的 `dist/assets` 未发现旧 Hermes patch/enhance 资产。

## 如果需要下一台 Codex 接手，提示词
请在 `E:\source\openclawpro-agent-hub` 继续开发。用户截图显示 Hermes 会话报 `this.resolvePythonCommand is not a function`，本阶段已修复：`scripts/restore-openclaw-shell.mjs` 现在把主进程 `HermesManager.chat()` 改为 Hermes CLI `--oneshot`，并在 Hermes 自身模型配置为空时复用 OpenClaw 当前 `qwen/deepseek-v4-flash` DashScope 配置，映射到 Hermes provider `alibaba`。已验证 CLI 真实回包。下一步请让用户完全退出并重启 `E:\win-unpacked\OpenClawPro.exe` 后在 UI 里再测 Hermes 会话；继续把模型映射和 Key 状态做进可视化配置中心。每个阶段完成后按 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push` 流程提交，并新增包含“总体目标”的 handoff。
