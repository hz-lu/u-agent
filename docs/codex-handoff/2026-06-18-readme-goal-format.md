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
参考用户提供的 `D:\Users\DELL\Downloads\README.md`，重写当前工程 `README.md`，并把后续 handoff 文档格式调整为在“当前目标”前增加“总体目标”。

## 已完成
- 阅读参考 README 和当前工程 README。
- 将 `README.md` 改写为更完整的项目说明：
  - 中英双语入口。
  - 项目定位。
  - 总体目标。
  - 当前能力表。
  - 快速开始、部署、文件结构、U 盘运行时布局。
  - Hermes 配置中心、零痕迹策略、验证命令、开发流程、FAQ。
- 明确记录旧 Hermes dist patch 层已移除，当前工程从源码构建部署。
- 在 handoff 模板中加入固定的“总体目标”章节。

## 改动文件
- `README.md`
- `docs/codex-handoff/2026-06-18-readme-goal-format.md`

## 关键决策
- README 采用参考项目的教程式结构，但内容全部改成当前工程真实路径、真实能力和当前开发状态。
- README 中不写任何 API Key 或用户私密配置。
- 后续 handoff 均应按新模板，把“总体目标”放在“当前目标”前。

## 待继续
- 继续完善 Hermes 真实连接器连通性测试。
- 继续推进自然语言 cron 的 Hermes/LLM 解析能力。
- 继续补齐 macOS/Linux runtime、venv 和 Universal zip 启动器。
- 可以把旧 handoff 文档也补充“总体目标”，让历史文档格式完全统一。

## 验证结果
- 已检查 git 工作区，修改前工作区干净。
- 本次为文档更新，未运行构建。
- README 已按 UTF-8 写入。

## 如果需要下一台 Codex 接手，提示词
请在 `E:\source\openclawpro-agent-hub` 继续开发。当前用户要求后续所有 `docs/codex-handoff/YYYY-MM-DD-xxx.md` 都在“当前目标”前增加“总体目标”，总体目标内容以本文件为准。下一步可继续实现 Hermes 真实连接器测试、自然语言 cron 解析、沙箱 dry-run 或 Universal 三平台打包。每个阶段完成后按 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push` 流程提交。
