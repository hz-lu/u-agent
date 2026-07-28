# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

修复 OpenClaw 阅读历史消息时被自动拉回底部，以及 Hermes 长任务只显示静态 loading、股票技能失败后响应很慢的问题。

## 已完成

- `scrollToBottom` 改为受 `autoScroll` 控制，并在异步 `nextTick` 执行前再次检查，用户向上阅读时后台流式消息和状态事件不再强制滚底。
- 仅在用户主动发送、切换会话或切换 Agent 模式时恢复自动跟随并强制滚底。
- Hermes 后台进度按 `taskId` 过滤并原位更新“执行过程”工具卡；等待心跳不会不断新增消息。
- Hermes 后台任务在主进程接受后才注册结果等待，同一会话只允许一个活动任务，避免重复请求和串线。
- Hermes 登录 shell 使用 `runtime/python3` 执行技能，`execute_code` 通过 `VIRTUAL_ENV` 使用同一便携 Python。
- macOS/Linux 同步技能时排除 Windows `site-packages`，股票 runner 在不修改用户技能的前提下屏蔽相邻 Windows wheel。
- 修复股票 runner 覆盖 `Path.is_dir()` 后递归调用 `glob()` 导致的 `RecursionError`，并将真实 runner 执行纳入回归测试。
- 已从源码重新生成 macOS arm64 应用，并只更新 `release/macos-usb-root-exfat/OpenClawPro.app`，未覆盖 runtime、skills、data 或 `.license`。

## 改动文件

- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/main/portable-stock-runner.py`
- `dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `dist/main/portable-stock-runner.py`
- `scripts/verify-chat-scroll-control.mjs`
- `scripts/verify-hermes-chat-single-flight.mjs`
- `scripts/verify-macos-stock-skill-runtime.mjs`
- `package.json`

## 关键决策

- 不直接合并主干，只移植与当前分支结构兼容的最小行为。
- 不通过增加重试或超时掩盖 Hermes 工具失败；修复便携 Python 和跨平台依赖污染根因。
- 不清理或改写 U 盘技能目录；Python 缓存写入 `data/.hermes/cache/pycache`。
- 后台进度只展示阶段和工具状态，不把用户完整对话写入 Hermes 日志。
- 本轮 runtime 内容没有改变，测试只需替换新的 `OpenClawPro.app`。

## 待继续

- 在健康的 macOS U 盘上完全退出旧程序，仅替换 `OpenClawPro.app` 后重启。
- OpenClaw 流式回复期间向上滚动并停留 30 秒，确认不会跳底；手动滚回底部后确认自动跟随恢复。
- Hermes 发送普通问题和股票技能任务，确认对话中每约 8 秒更新执行过程，且最终回复耗时恢复正常。
- 查看新任务日志，确认不再出现 `os.add_dll_directory`、Windows numpy、`bad marshal data` 或几十次 curl 退化调用。

## 验证结果

- `node --check src/openclaw-shell-app/dist/main/index.js`：通过。
- `npm run build`：通过。
- `npm run package:macos-shell`：通过，arm64 app 生成成功。
- `npm run verify:chat-scroll-control`：通过。
- `npm run verify:hermes-chat-single-flight`：通过。
- `npm run verify:chat-skills`：通过。
- `npm run verify:hermes:macos`：通过，6208 个 Hermes Python 源文件无损坏。
- `npm run verify:macos:exfat-cache`：通过。
- `npm run verify:stock-skills:macos`：通过。
- 真实 `tool_fetch_sector_data`：通过，约 3 秒返回。
- `git diff --check`：通过，仅有仓库既存 CRLF 提示。
- 尚未替用户完成 U 盘 GUI 端到端交互，需按“待继续”步骤实测。

## 如果需要下一台 Codex 接手，提示词

继续 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支，先读取本 handoff。源码基准为 `src/openclaw-shell-app/dist/`。本阶段已修复 OpenClaw 滚动位置、Hermes 任务级过程反馈、单会话并发和 macOS 股票技能跨平台 Python 污染。不要提交或覆盖 runtime、release、用户 data、`mac_release_07_22/`、`uclaw/`。下一步先在健康 U 盘只替换 `OpenClawPro.app` 做 GUI 端到端测试，再依据新任务日志继续优化。
