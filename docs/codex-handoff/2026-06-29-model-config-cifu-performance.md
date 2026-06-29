# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心。所有 Hermes 能力需要和现有 OpenClaw 前端界面无缝融合，前端操作要给用户良好体验。

## 当前目标
修复 Windows 端操作模型配置和切换页面时频繁未响应的问题，并完善模型配置页的词符科技购买入口与永久默认模型配置项。

## 已完成
- 将 OpenClaw Gateway reload 从同步 `execSync` 改为异步 `spawn`，避免模型配置保存时卡住 Electron 主进程。
- 将模型配置 watcher 改为 800ms 防抖写入，避免编辑 API Key 时每输入一个字符都触发配置写入。
- 新增永久置顶模型配置项 `词符科技`，默认 API Key 为 `123456`，默认进入统一模型配置列表。
- `词符科技` 配置项只允许编辑 API Key，不允许删除，不允许拖拽离开顶部。
- 模型购买卡改为点击跳转 `https://token.51cifu.com/`，按钮文案改为 `词符科技`，说明文案去掉“后续可在这里”。
- 已构建并部署新 `dist` 到 `F:\win-unpacked\resources\app\dist`，部署前备份为 `F:\win-unpacked\resources\app\dist.backup-20260629-202033-performance-cifu`。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css`
- `src/openclaw-shell-app/dist/main/index.js`
- `docs/codex-handoff/2026-06-29-model-config-cifu-performance.md`

## 关键决策
- 本轮不扩大改动到 OpenClaw/Hermes 对话主链路，只处理有明确证据的性能热路径，避免再次破坏当前已可用功能。
- `词符科技` 默认配置放在模型 store 规范化层，而不是只做 UI 展示卡，确保从 localStorage 或 OpenClaw 配置恢复时都能自动补齐、置顶、锁定。
- 继续保留用户可手动切换当前模型；`词符科技` 可以作为默认配置项存在，但不强制覆盖用户后续选择。
- 禁止使用整文件 `Set-Content` 重写编译后的 renderer bundle，之前曾导致中文字符串编码损坏和语法错误。

## 待继续
- 用户需要实机验证：启动程序、进入模型配置页、编辑词符科技 API Key、切换页面，观察是否还出现未响应。
- 如果仍有未响应，需要继续根据 `F:\data\.openclaw\logs\desktop-crash.log` 的最新 event-loop delay 时间点定位新的热路径。
- 后续可继续把主进程中其他 UI 热路径里的 `execSync/execFileSync/readdirSync` 分批替换为异步或后台队列，但每批必须小范围验证。

## 验证结果
- `node --check src\openclaw-shell-app\dist\main\index.js` 通过。
- renderer bundle 复制为 `.mjs` 后 `node --check` 通过。
- `npm run build` 通过。
- `npm run audit:openclaw-shell` 通过，24/24。
- F 盘实际部署文件 `node --check` 通过。
- F 盘实际部署文件已确认包含 `词符科技`、`https://token.51cifu.com/`、`modelsConfigWriteTimer`、异步 `child_process.spawn(ocBin, ["gateway", "reload"])`。

## 如果需要下一台 Codex 接手，提示词
请在 `D:\github\u-agent` 继续开发 U 盘便携版 OpenClawPro/Hermes 集成项目。当前重点是 Windows 端性能稳定性和模型配置体验。先阅读 `docs/codex-handoff/2026-06-29-model-config-cifu-performance.md` 及最近 handoff。不要用整文件编码 rewrite 修改 `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`，只能用小范围 patch 并每次跑 renderer `node --check`。如果用户继续反馈未响应，先读 `F:\data\.openclaw\logs\desktop-crash.log` 最新时间点，确认 event-loop delay 对应的 IPC/同步命令，再做小范围异步化修复。构建后运行 `npm run build`、`npm run audit:openclaw-shell`，并部署到 `F:\win-unpacked\resources\app\dist` 后验证 F 盘实际文件。
