# Codex Handoff

## 总体目标

基于已开发的 U 盘便携版 OpenClaw 集成 Hermes，实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离和可视化配置中心，并与现有前端界面无缝融合，保证用户体验和运行稳定性。

## 当前目标

修复 Windows 完整测试壳中 `/skill` 选中后菜单不关闭、窗口右侧和底部黑边，以及操作过程中 Electron 未响应的问题，并重新生成完整 `win-unpacked` 供 U 盘实机测试。

## 已完成

- 技能选中后立即关闭大型选择列表，同时保留已选技能标签，仍可再次输入 `/skill` 继续多选。
- 增加离线 HTML/CSS reset，不再依赖 Tailwind CDN 提供页面边距重置，消除右侧和底部页面溢出黑边。
- 删除全局 `div { transition: all ... }`，避免所有节点变化触发不必要的合成和重绘。
- 将 Hermes 状态刷新中的同步 `tasklist` 改为异步子进程，并增加节流和超时，避免阻塞 Electron 主线程。
- 缓存便携 Python 路径，减少高频文件系统探测。
- 技能仓库常驻 worker 启动时不再递归统计整个根技能仓库；完整计数只保留给一次性验证模式。
- 为 Hermes 官方技能解析结果增加持久缓存，并在技能根目录变化时失效，避免反复启动 Python 扫描全部技能。
- 补充自动化验证，覆盖技能选择后菜单关闭、非阻塞 Hermes 状态采样、技能缓存和常驻 worker 不做全量计数。

## 改动文件

- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css`
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/main/skill-repository-worker.cjs`
- `dist/assets/assets/main-DIeui7ZO.js`
- `dist/assets/main-CAx6YYDG.css`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `dist/main/skill-repository-worker.cjs`
- `scripts/audit-openclaw-shell-features.mjs`
- `scripts/verify-chat-skill-commands.mjs`
- `scripts/verify-skill-repository-events.mjs`
- `docs/codex-handoff/2026-07-26-windows-freeze-overflow-fix.md`

## 关键决策

- 性能修复从 Electron 主线程阻塞源入手，不限制 Hermes 复杂任务、不截断正常输出。
- 页面基础布局必须离线自足，不能依赖 CDN 是否成功加载。
- 技能同步采用事件触发加 10 分钟低频兜底；常驻 worker 不为展示计数执行全量 fingerprint。
- Hermes 技能缓存以便携 `skills/` 根目录修改时间校验，仓库变更事件主动失效缓存。
- 不覆盖测试 U 盘、release、runtime、data 或用户技能；本轮只重新生成独立测试壳。

## 待继续

- 用新 `win-unpacked` 在真实 U 盘上进行 OpenClaw、Hermes、协同会话和 `/skill` 的持续交互测试。
- 观察 `data/.openclaw/logs/desktop-crash.log` 是否仍出现超过 2 秒的主事件循环延迟。
- 若仍退出，需按实机时间点关联 `render-process-gone`、主进程异常和 agent 子进程退出码，不能只根据 Windows“未响应”界面推断原因。

## 验证结果

- `npm.cmd run build` 通过。
- `npm.cmd run audit:openclaw-shell`：45/45 通过。
- `npm.cmd run verify:chat-skill-commands` 通过。
- `npm.cmd run verify:skill-repository-events` 通过，事件触发约 0.8 秒，兜底周期 600000 ms。
- `npm.cmd run verify:portable-skill-repository` 通过。
- 静态页面验证中，首页和 `/ai-chat` 的 `clientWidth/scrollWidth`、`clientHeight/scrollHeight` 一致，`body` margin 为 0，页面无溢出。
- `git diff --check` 通过。
- 已重新生成 `D:/github/u-agent/win-unpacked`：Electron 35.7.5、Windows x64、96 个文件。
- 已重新生成 `D:/github/u-agent/OpenClawPro U盘便携版.exe` 根目录启动器。
- 壳内 main、preload、worker 均通过 `node --check`。
- 壳内 main、worker、renderer 和 CSS 与仓库最新 `dist` 的 SHA-256 全部一致。

## 如果需要下一台 Codex 接手，提示词

请在 `D:/github/u-agent` 的 `main` 分支继续。先阅读 `docs/codex-handoff/2026-07-26-windows-freeze-overflow-fix.md`。本轮已从源码修复技能菜单、离线页面黑边和已确认的 Electron 主线程同步阻塞源，并重新构建 Windows 测试壳。后续根据真实 U 盘测试时间点读取 `data/.openclaw/logs/desktop-crash.log` 继续定位；不要热改 U 盘产物，不要修改 OpenClaw/Hermes 官方 runtime，不要通过限制 Hermes 任务能力掩盖性能问题。
