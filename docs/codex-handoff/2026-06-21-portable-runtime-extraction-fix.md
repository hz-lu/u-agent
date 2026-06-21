# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且所有 Hermes 能力都要和现有程序前端界面无缝融合，前端操作体验自然、稳定、可理解。

## 当前目标
修复程序启动时卡在“正在解压 OpenClaw 核心组件（首次可能需要 1-3 分钟）”的问题，避免 U 盘已存在运行时被误判为首次解压目标。

## 已完成
- 定位到 `E:\runtime` 已经包含 `openclaw.cmd`、`node.exe`、`node_modules`、`openclaw.zip`，但缺少 `.extracted` 标记。
- 上一阶段把 `RUNTIME_DIR` 改到 U 盘后，启动器误判需要首次解压，并尝试将 `E:\runtime\openclaw.zip` 解压到同一个 `E:\runtime`，导致卡在遮罩层。
- 在启动器 `extractRuntime()` 入口增加保护：如果 `runtime/openclaw.cmd` 和 `runtime/node.exe` 已存在，直接写 `.extracted` 并跳过解压。
- 增加保护：如果 runtime 源目录和目标目录相同，跳过自解压。
- 已给当前 `E:\runtime\.extracted` 写入就绪标记。
- 已重新生成当前 `E:\win-unpacked\resources\app`。
- 已启动程序做快速验证，未再出现 `tar.exe` 解压进程。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-21-portable-runtime-extraction-fix.md`

## 关键决策
- U 盘便携版已经自带 runtime 时，不应再走“首次解压到本地 runtime”的旧逻辑。
- `openclaw.zip` 可以作为发布包的备用压缩资产保留，但不能在源目录和目标目录相同时自解压。
- 用 `openclaw.cmd + node.exe` 作为运行时就绪判断，比单独依赖 `.extracted` 更稳。

## 待继续
- 用户重新打开 `E:\win-unpacked\OpenClawPro.exe`，确认启动不再卡在解压遮罩。
- 继续验证上一阶段的 AI 会话启动稳定性：启动 OpenClaw、启动 Hermes、进入 AI 会话。
- 如果进入 AI 会话仍异常，查看 `E:\data\.openclaw\logs\desktop-crash.log`。

## 验证结果
- `node --check scripts/restore-openclaw-shell.mjs` 通过。
- 已执行 `node scripts/restore-openclaw-shell.mjs`，当前 `E:\win-unpacked\resources\app` 已更新。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\preload\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- 关键字符串检查确认当前包包含 `codex-portable-runtime-ready-skip`、`Portable runtime already present, skipping extraction`、`Runtime source and target are identical; skipping self-extraction`。
- 快速启动验证未发现 `tar.exe` 解压进程。

## 如果需要下一台 Codex 接手，提示词
请继续在 `E:\source\openclawpro-agent-hub` 上开发。当前总体目标是 U 盘便携版 OpenClaw + Hermes 完整融合。最近用户反馈程序启动卡在“正在解压 OpenClaw 核心组件”。原因是上一阶段将 runtime 切回 U 盘后，`E:\runtime` 已有 `openclaw.cmd` 和 `node.exe`，但缺少 `.extracted`，启动器误判首次运行并尝试将 `E:\runtime\openclaw.zip` 解压到 `E:\runtime` 自身。本阶段已在 `extractRuntime()` 加保护：运行时已存在则写 `.extracted` 并跳过解压；源目标相同也跳过。当前 `E:\runtime\.extracted` 已写入，`E:\win-unpacked` 已重建。下一步请让用户重新打开程序验证启动和 AI 会话。
