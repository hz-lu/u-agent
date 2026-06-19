# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、持久记忆 + 自动生成技能、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并和现有前端界面无缝融合，融合Hermes到这个项目里，前端界面上操作要给用户良好的体验。

## 当前目标
修复用户反馈的两个闭环问题：微信连接失败时缺少可理解诊断；Hermes 环境检查显示 OpenClaw skills 可用，但运行时没有真正加载这些 skills。

## 已完成
- 在主进程 HermesManager 中新增 `syncOpenClawSkillsToHermes()`，将 `E:\skills` 中带 `SKILL.md` 的 OpenClaw 技能同步到 `E:\data\.hermes\skills\openclaw\...`。
- Hermes 启动、Dashboard/API、oneshot 对话、状态快照、手动同步按钮都会走同一套同步逻辑，避免 UI 计数和实际运行时脱节。
- 将微信账号状态检查路径从错误的 `E:\data\openclaw-weixin\accounts.json` 修正为插件实际使用的 `E:\data\.openclaw\openclaw-weixin\accounts.json`。
- 微信登录进程成功退出或连接成功后会尝试刷新 Gateway，让账号配置进入消息通道。
- 前端微信状态处理兼容主进程返回的 `{ status, diagnostics }` 对象，避免把对象写入状态导致 UI 判断异常。
- 微信页面在没有账号凭据时会把诊断写入日志区，提示用户重新扫码，并显示账号目录。
- 已重新部署到 `E:\win-unpacked\resources\app`。
- 已实际同步当前 U 盘数据：`E:\data\.hermes\skills\openclaw` 中有 80 个 OpenClaw 技能目录。

## 改动文件
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-19-hermes-skills-wechat-diagnostics.md`

## 关键决策
- Hermes 技能不直接混入官方技能分类根目录，而是放入 `skills/openclaw/<skill>`，利用 Hermes 官方递归扫描 `SKILL.md` 的机制实现真实运行时可见。
- 技能同步使用 manifest 判断是否变化，避免每次状态刷新都重复复制大量技能文件。
- 微信账号状态以插件源码中的 `OPENCLAW_STATE_DIR/openclaw-weixin/accounts.json` 为准。
- 不强制杀掉当前正在运行的桌面程序；用户需要重启 OpenClawPro 才能加载本次部署后的主进程和前端代码。

## 待继续
- 用户重启桌面程序后，重新进入微信连接页扫码，确认 `E:\data\.openclaw\openclaw-weixin\accounts.json` 和 `accounts/*.json` 是否生成。
- 扫码成功后，从微信端发送消息，确认 Gateway 已加载微信账号并能回复。
- 如微信仍不能回复，需要读取微信插件日志和 Gateway channel status，进一步检查 inbound monitor 是否启动、contextToken 是否建立。
- 如要严格实现“零痕迹”，后续还要处理现有 OpenClaw runtime 解压到 `%LOCALAPPDATA%\OpenClaw\runtime` 的历史机制。

## 验证结果
- `node --check scripts\restore-openclaw-shell.mjs` 通过。
- `node scripts\restore-openclaw-shell.mjs` 已重新部署。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\preload\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 通过。
- `scripts\verify-hermes-runtime.mjs` 通过，Hermes 运行时存在，`HERMES_HOME` 指向 `E:\data\.hermes`。
- 当前 Hermes skills 树中有 83 个 `SKILL.md`，其中 `E:\data\.hermes\skills\openclaw` 下有 80 个 OpenClaw 技能。
- 当前 `E:\data\.openclaw\openclaw-weixin` 仍不存在，说明当前 U 盘数据里还没有成功落盘的微信账号凭据，需要重启新版本后重新扫码。

## 如果需要下一台 Codex 接手，提示词
继续在 `E:\source\openclawpro-agent-hub` 开发。用户目标是基于 U 盘便携版 OpenClaw 集成 Hermes，并保持原 OpenClaw UI/功能基础上无缝融合。上阶段已修复 Hermes skills 真实同步和微信诊断路径。请先确认用户是否已重启 `E:\win-unpacked\OpenClawPro.exe` 并重新扫码微信；若微信仍无回复，检查 `E:\data\.openclaw\openclaw-weixin\accounts.json`、`accounts/*.json`、Gateway channel status、微信插件日志和 inbound monitor。每个阶段结束必须执行 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`，并新增 `docs/codex-handoff/YYYY-MM-DD-xxx.md`，handoff 中 `## 当前目标` 前必须有 `## 总体目标`。
