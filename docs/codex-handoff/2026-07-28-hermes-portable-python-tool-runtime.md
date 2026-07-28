# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

修复 macOS U 盘版 Hermes 对话最终能回复但复杂技能任务等待数分钟的问题，确保 Hermes 在登录 shell 中稳定使用便携 Python，并且不受技能目录内跨 Python 版本缓存影响。

## 已完成

- 从 Hermes `state.db` 定位慢任务并非单次模型延迟：一次股票任务产生 95 次工具调用、64 次模型请求，其中 78 次为终端调用。
- 确认 Hermes 能读取 U 盘共享技能；根因是本地股票工具失败后退化为大量网络抓取。
- 确认 `bash -l` 会经 `/etc/profile` 重排 PATH，使裸 `python3` 落到 `/usr/bin/python3`，与便携 `PYTHONHOME` 冲突并报缺少 `encodings`。
- 确认改用便携 Python 后，技能目录旧 `__pycache__` 又会触发 `bad marshal data`。
- 主进程为 macOS/Linux Hermes 子 shell 生成 `data/.hermes/config/portable-shell-env.sh`，通过 `BASH_ENV` 恢复 venv PATH；Windows 路径保持不变。
- 设置 `PYTHONPYCACHEPREFIX=data/.hermes/cache/pycache`，不删除、不改写用户技能文件，绕开跨 Python 版本 `.pyc`。
- 环境文件仅在内容变化时写入，避免每次调用重复写 U 盘。
- 已从源码重新生成 macOS 应用，并更新本机 `release/macos-usb-root-exfat/OpenClawPro.app`；runtime 未改动。

## 改动文件

- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/verify-macos-stock-skill-runtime.mjs`
- `docs/codex-handoff/2026-07-28-hermes-portable-python-tool-runtime.md`

## 关键决策

- 修复环境传播根因，不增加重试次数，不修改 Hermes 官方源码，也不清理用户技能目录。
- `BASH_ENV` 只用于 POSIX 平台，避免影响 Windows Hermes 流程。
- Hermes 本体继续使用自身 venv；技能命令和 `execute_code` 使用独立的 `runtime/python3`，执行技能前显式移除会污染该解释器的 `PYTHONHOME`。
- 用户日志中的 SSH password、未配置平台 allowlist、SIGTERM 是安全审计或历史停止记录，不是本次慢响应的直接原因。
- 本轮只需替换 `OpenClawPro.app`；无需重新复制 1.1GB runtime。

## 待继续

- 将新的 `OpenClawPro.app` 复制到健康 U 盘，完全退出旧进程后重新启动。
- Hermes 普通消息测试正常模型延迟，再执行 `market-scanner`、`market-sentinel` 股票任务做端到端计时。
- 检查新任务的 `state.db`：不应再先调用 `/usr/bin/python3`，也不应因 `bad marshal data` 退化成数十次 curl。
- 当前 `/Volumes/OPENCLAW` 曾被 `diskutil verifyVolume` 判定 exFAT 损坏，最终性能结论必须在健康 U 盘复测。

## 验证结果

- 回归测试先按预期失败：源码缺少 `BASH_ENV` 接线。
- `node --check src/openclaw-shell-app/dist/main/index.js`：通过。
- `npm run verify:stock-skills:macos`（本机完整 runtime + U 盘真实技能）：通过。
- 真实 `/bin/bash -l` 解析 `python3` 为 U 盘 `HermesPortable/venv/bin/python3`：通过。
- U 盘股票工具 `tool_check_trading_status`：成功，工具自身耗时 164ms。
- `npm run verify:hermes:macos`：通过，6208 个 Python 源文件无损坏。
- `npm run verify:chat-skills`：通过。
- `npm run verify:macos:exfat-cache`：通过。
- `npm run package:macos-shell`：通过，release 包内主进程与构建产物哈希一致。

## 如果需要下一台 Codex 接手，提示词

继续 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支。先读取本 handoff。源码基准是 `src/openclaw-shell-app/dist/`。本轮已修复 Hermes 登录 shell 丢失便携 Python PATH 和旧 `.pyc` 导致股票技能退化为大量网络调用的问题。不要提交 runtime、release、用户 data、`mac_release_07_22/` 或 `uclaw/`。在健康 U 盘只替换新的 `OpenClawPro.app` 后，复测普通对话和股票多技能任务，并从 `state.db` 确认工具调用次数恢复正常。
