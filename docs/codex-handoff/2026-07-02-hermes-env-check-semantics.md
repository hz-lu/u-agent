# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 macOS U 盘环境检查页面对 Hermes 可选能力的误报：Hermes 对话已经可用时，不应因为没有安装 skill、没有生成自我成长 skill、API/Dashboard 端口未启动而显示为异常或待验证问题。

## 已完成
- 将 `Hermes 自我成长` 的未生成状态从警告改为通过状态，说明“自我成长 skill 会在 Hermes 生成新技能后出现；当前基础对话不受影响”。
- 将 `Hermes 技能` 的空技能状态从“待验证”改为“未安装”，说明未安装 skill 不影响基础 Hermes 对话。
- 将 `Hermes 端口` 的未启动状态从警告改为“未占用”，说明基础 Hermes 对话按需启动，API/Dashboard 端口未启动不影响当前对话。
- 将 macOS launcher 已传入的 `AGENT_HUB_ROOT`、`AGENT_HUB_DATA_ROOT`、`AGENT_HUB_USB_ROOT` 根目录逻辑写回 `src/openclaw-shell-app/dist/main/index.js`，不再只依赖 build 脚本临时注入。
- 调整 `scripts/build-openclaw-shell-app.mjs`，当源码已包含 U 盘根目录逻辑时不重复替换，避免补丁层继续叠加。
- 重新构建并生成 macOS USB root release，已同步新的 `OpenClawPro.app` 到 `/Volumes/OPENCLAW/OpenClawPro.app`。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `scripts/build-openclaw-shell-app.mjs`
- `docs/codex-handoff/2026-07-02-hermes-env-check-semantics.md`

## 关键决策
- 环境检查区分基础可用性和可选能力：Python/Node/CLI/数据目录/模型桥接/记忆属于基础检查；skills、自我成长、API/Dashboard 端口是可选或按需能力。
- 用户截图发生时 U 盘还没有拷入新的 skills，因此不能用后续手动拷入的 skills 反推当时的问题。未安装 skill 应是正常空状态，不是异常。
- 不修改 OpenClaw 主流程和 UI 框架，只修状态判定和文案。
- 不触碰 U 盘上的 `data/`、`skills/`、`.license`，只同步 app 壳。

## 待继续
- 用户重新打开 U 盘 app 后，在环境检查页点击检查，确认 `Hermes 自我成长`、`Hermes 技能`、`Hermes 端口`不再显示误导性的待验证/未启动问题。
- 后续如果要验证用户新拷入的 skills，需要在技能管理页执行“同步到 Hermes”，再单独处理 Hermes 官方 slash command 映射数量。
- Hermes API Server 仍有 `aiohttp not installed` 的独立依赖问题，和当前 oneshot 对话可用性分开处理。

## 验证结果
- `npm run build` 通过，包含 `node --check dist/main/index.cjs` 和 `node --check dist/preload/index.cjs`。
- `node --check scripts/build-openclaw-shell-app.mjs` 通过。
- `node --check src/openclaw-shell-app/dist/main/index.js` 通过。
- `npm run stage:macos-usb-root:final` 通过，runtime required missing 为 `[]`，exFAT compatibility 通过。
- `/Volumes/OPENCLAW/OpenClawPro.app` 已确认包含新的环境检查文案：`未生成`、`未安装`、`未占用`，以及 `AGENT_HUB_ROOT`/`AGENT_HUB_DATA_ROOT` 根目录逻辑。
- release staging 目录 AppleDouble 文件数量为 `0`。

## 如果需要下一台 Codex 接手，提示词
请在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支继续。最新阶段修复的是 Hermes 环境检查语义误报，不是 Hermes 对话功能。先确认 `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js` 中 `Hermes 自我成长` 未生成显示为通过、`Hermes 技能` 空状态显示为未安装、`Hermes 端口` 未启动显示为未占用；确认 `src/openclaw-shell-app/dist/main/index.js` 原生读取 `AGENT_HUB_ROOT`、`AGENT_HUB_DATA_ROOT`、`AGENT_HUB_USB_ROOT`。下一步如果用户要验证新拷入的 skills，请从技能管理页同步到 Hermes，再看 `data/.hermes/reports/skills/visibility-last.json`，不要把“没有安装 skill”误判为环境异常。
