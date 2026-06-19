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
继续把 Hermes 融入原 OpenClaw 模块体系：在原首页环境检查卡片中增加 Hermes Agent 健康状态，并修正恢复后的 Hermes 启动环境，使其可变数据写入 U 盘 `E:\data\.hermes`。

## 已完成
- 更新 `scripts/restore-openclaw-shell.mjs`。
- 在原首页 `useEnvCheck()` 检查项中新增 `Hermes Agent` 卡片。
- 新增 `checkHermes()`，通过原 preload 已暴露的 `window.uclaw.ipcGetHermesStatus()` 读取 Hermes 状态。
- `runAllChecks()` 会同时触发 Hermes 检查。
- Hermes 状态逻辑：
  - `hermesReady && pythonReady` 时显示 `已就绪` 或 `运行中`。
  - runtime 不完整时显示 `未完整`。
  - IPC 异常时显示 `异常`。
- 主进程 Hermes `snapshot()` 增加：
  - `runtimeRoot`
  - `dataRoot`
  - `hermesReady`
  - `pythonReady`
  - `sourceReady`
- 修正原 Hermes Manager 的环境变量：
  - `HOME`
  - `USERPROFILE`
  - `XDG_CONFIG_HOME`
  - `XDG_CACHE_HOME`
  - `HERMES_HOME`
  - `HERMES_LOG_DIR`
  - `HERMES_MEMORY_PATH`
  - `HERMES_SKILLS_PATH`
  - `TMP`
  - `TEMP`
- 上述可变目录均指向 `E:\data\.hermes` 下。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-19-hermes-env-check.md`

## 关键决策
- Hermes 健康状态进入原首页环境检查模块，而不是新增独立诊断页。
- 继续不部署旧 Hermes JS/CSS 注入补丁。
- 当前仍通过恢复脚本对打包 bundle 做确定性变换；这是过渡方案，长期应源码化原 OpenClaw 前端。
- Hermes 零痕迹要求优先级提高：原备份中 `_home`/`data` 位于 `runtime\HermesPortable`，本阶段已改为 `E:\data\.hermes`。

## 待继续
- 实机查看环境检查里的 Hermes 卡片是否展示正常。
- 在 AI 会话页增加 OpenClaw / Hermes / 协同模式切换。
- 在模型配置页增加 Hermes 模型配置区，并复用原页面风格。
- 将 Hermes 运行日志接入原首页实时日志或独立 Hermes 日志面板。
- 继续抽取原 OpenClaw 前端源码，减少 bundle 变换。

## 验证结果
- 已执行 `node scripts/restore-openclaw-shell.mjs`。
- 恢复前备份当前 app 到 `E:\backups\app-before-openclaw-shell-restore-20260619114450`。
- 部署后的主进程中可检索到 `E:\data\.hermes`、`XDG_CONFIG_HOME`、`HERMES_MEMORY_PATH`、`hermesReady`、`pythonReady`、`sourceReady`。
- 部署后的 renderer bundle 中可检索到 `id: "hermes"`、`checkHermes`、`ipcGetHermesStatus`。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- 部署后的 `dist/assets` 中未发现旧 Hermes patch/enhance 资产。
- `scripts\verify-hermes-runtime.mjs` 通过，零痕迹环境指向 `E:\data\.hermes`。
- `scripts\verify-openclaw-runtime.mjs` 通过。

## 如果需要下一台 Codex 接手，提示词
请在 `E:\source\openclawpro-agent-hub` 继续开发。当前方向是保留 OpenClaw 原 UI/功能体系，并把 Hermes 融入原首页、AI 会话、模型配置、环境检查等模块。当前 `scripts/restore-openclaw-shell.mjs` 会恢复原 OpenClaw shell，并在首页控制台加入 Hermes 控制卡片、在环境检查中加入 Hermes Agent 健康卡片、在托盘加入 Hermes 入口，同时修正 Hermes 可变数据到 `E:\data\.hermes`。下一步建议做 AI 会话页的 OpenClaw/Hermes/协同模式切换。每个阶段完成后按 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push` 流程提交，并新增包含“总体目标”的 handoff。
