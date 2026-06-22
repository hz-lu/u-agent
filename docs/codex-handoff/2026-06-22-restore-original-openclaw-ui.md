# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
纠正此前错误的 Agent Hub 新壳路线，将原 OpenClaw UI 和已经开发完成的 Hermes/OpenClaw 融合功能迁回当前项目主线。

## 已完成
- 从用户拷贝的 `src/win-unpacked/resources/app` 提取原 OpenClaw app 包到 `src/openclaw-shell-app`，只保留约 1.9MB 的 app 资源，不提交 286MB 的 Windows Electron 外壳。
- 将 `src/win-unpacked/`、`data/`、`ui-screenshots/` 加入 `.gitignore`，避免提交本地运行数据、截图和完整 Windows 打包目录。
- 新增 `scripts/build-openclaw-shell-app.mjs`，`npm run build` 会从 `src/openclaw-shell-app/dist` 生成根目录 `dist/`。
- 构建时为 Mac 本地开发做兼容：
  - 主进程复制为 `dist/main/index.cjs`，根 `package.json` main 指向 `.cjs`。
  - preload 复制为 `dist/preload/index.cjs`，主进程 preload 路径指向 `.cjs`。
  - 默认本地 `npx electron .` 按生产文件加载原 `dist/assets/main/index.html`。
  - 非 Windows 下 Electron userData 指向项目 `data/.openclaw/electron-cache`，保持零痕迹方向。
  - 增加显式测试开关 `OPENCLAW_DEV_SKIP_LICENSE=1`，仅用于本机 UI 测试时跳过授权页；不设置该变量仍走原授权检查。
- 新增 `scripts/audit-openclaw-shell-features.mjs`，自动检查原 UI 和已完成功能标记。
- CI 增加 `npm run audit:openclaw-shell`，防止后续误回错误 UI。
- 已启动原 OpenClaw UI 并通过 CDP 截图检查：首页、模型配置、AI 会话、技能管理、环境检查。

## 已迁回功能
- 原 OpenClaw 左侧导航和整体 UI：主页、AI 会话、模型配置、技能管理、聊天工具、环境检查、设置。
- 首页 Hermes Agent 协同控制台：启动、配置中心、Dashboard、Agent API、重启、停止、Hermes 日志入口。
- OpenClaw 与 Hermes 共用模型配置：模型配置页文案、模型编辑、保存后共用配置、主进程 provider 映射到 `openai-api`。
- Hermes 独立会话：AI 会话页 Hermes 模式、`ipcHermesChat`、会话状态持久化。
- OpenClaw/Hermes 协同会话：AI 会话页协同模式、OpenClaw 草案、Hermes 复核、协同状态。
- Hermes 与 OpenClaw 共用技能：技能管理页“同步到 Hermes”、主进程 `syncOpenClawSkillsToHermes()`。
- Hermes 环境检查：Python、Node、CLI、数据目录、模型桥接、持久记忆、自我成长、技能、端口。

## 改动文件
- `.gitignore`
- `.github/workflows/source-build.yml`
- `package.json`
- `scripts/build-openclaw-shell-app.mjs`
- `scripts/audit-openclaw-shell-features.mjs`
- `src/openclaw-shell-app/**`
- `dist/**`
- `docs/codex-handoff/2026-06-22-restore-original-openclaw-ui.md`

## 关键决策
- 当前正确产品基准是 `src/openclaw-shell-app`，不是此前的 `src/renderer/App.vue` Agent Hub 壳。
- 不提交 `src/win-unpacked/` 完整 Windows 外壳；它仅作为用户拷贝来的本地参考。
- 本阶段先做保真迁回，确保原 UI 和已完成能力可运行；后续再逐步把 bundle 拆成更细的源码模块。
- `OPENCLAW_DEV_SKIP_LICENSE=1` 仅为本机 UI 自动化测试入口，正式默认行为不绕过授权。

## 待继续
- 在 Windows U 盘环境用合法 license 和完整 runtime 做真实端到端测试：启动 Gateway、发送 OpenClaw 对话、Hermes 对话、协同对话、技能同步、Hermes 配置中心/Dashboard/API。
- 如果坚持完全 SFC/TS 源码化，需要继续从 `main-DIeui7ZO.js` 反向拆分原 Vue 页面模块，或拿到原 OpenClaw 前端上游源码。
- 让 release 脚本优先基于 `src/openclaw-shell-app` 输出完整三平台包，并继续补 runtime artifact 获取/校验。

## 验证结果
- `npm run audit:openclaw-shell` 通过，24/24 功能标记存在。
- `npm run typecheck` 通过。
- `node --check scripts/build-openclaw-shell-app.mjs` 通过。
- `node --check scripts/audit-openclaw-shell-features.mjs` 通过。
- `node --check scripts/build-windows-release.mjs` 通过。
- `node --check scripts/verify-openclaw-runtime.mjs` 通过。
- `npm run build` 通过。
- `node --check dist/main/index.js`、`dist/main/index.cjs`、`dist/preload/index.js`、`dist/preload/index.cjs`、`dist/assets/assets/main-DIeui7ZO.js` 均通过。
- 本机用 `OPENCLAW_DEV_SKIP_LICENSE=1 npx electron . --remote-debugging-port=9223` 打开原 OpenClaw UI，通过 CDP 检查并截图以下页面：
  - `ui-screenshots/home.png`
  - `ui-screenshots/model.png`
  - `ui-screenshots/ai-chat.png`
  - `ui-screenshots/skill.png`
  - `ui-screenshots/env-check.png`

## 如果需要下一台 Codex 接手，提示词
继续在 `/Users/ly/data/codex/u-agent` 开发。用户指出此前 Agent Hub UI 完全错误，已将原 OpenClaw UI 和已经开发完成的 Hermes/OpenClaw 融合功能从 `src/win-unpacked/resources/app` 迁回 `src/openclaw-shell-app`，并让 `npm run build` 生成原 UI 的 `dist/`。当前不要继续改 `src/renderer/App.vue` 作为产品主界面。下一步请在 Windows U 盘环境用合法 license 和完整 runtime 做端到端测试，或继续把 `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js` 逐步拆成真正源码模块。每完成阶段性工作后按用户要求 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`。
