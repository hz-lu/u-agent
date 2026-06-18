# Codex Handoff

## 当前目标

把 U 盘里的 OpenClawPro 客户端从旧的 dist 补丁式 Hermes 集成，重建为完整 Electron/Vue/TypeScript 源码工程，并推送到 `git@github.com:hz-lu/u-agent.git`。

## 已完成

- 在 `E:\source\openclawpro-agent-hub` 重建完整源码工程。
- 删除旧的 `hermes-enhance.js`、`real-hermes-ui.js`、`hermes-chat-enhance.js`、`hermes-env-enhance.js` 等 dist 注入式补丁层。
- 新增 Electron 主进程、preload、安全 IPC、Vue 前端 UI。
- 实现 OpenClaw/Hermes 双引擎状态、启动、停止、日志、诊断、模型配置、连接器、自动化/沙箱、会话测试和 Hermes 内嵌打开。
- Hermes 程序文件继续复用 `E:\runtime\HermesPortable`。
- Hermes 可变状态重定向到 `E:\data\.hermes`。
- 构建完成并整体部署替换 `E:\win-unpacked\resources\app`。
- 旧 app 已备份到 `E:\backups\app-before-full-source-20260618164815` 和 `E:\backups\app-full-source-20260618171749`。

## 改动文件

- `.gitignore`
- `README.md`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `tsconfig.main.json`
- `vite.config.ts`
- `assets/icon.ico`
- `assets/icon.png`
- `docs/CURRENT_USB_BASELINE.md`
- `docs/codex-handoff/2026-06-18-full-source-rebuild.md`
- `scripts/deploy-to-usb.mjs`
- `scripts/fetch-hermes.mjs`
- `scripts/migrate-hermes-data.mjs`
- `scripts/scan-usb.mjs`
- `scripts/verify-hermes-runtime.mjs`
- `src/main/index.ts`
- `src/main/portable-paths.ts`
- `src/main/runtime/agent-runtime.ts`
- `src/main/runtime/openclaw-runtime.ts`
- `src/main/runtime/hermes/hermes-runtime.ts`
- `src/main/services/json-store.ts`
- `src/main/services/net.ts`
- `src/main/services/process-supervisor.ts`
- `src/preload/index.ts`
- `src/renderer/App.vue`
- `src/renderer/env.d.ts`
- `src/renderer/index.html`
- `src/renderer/main.ts`
- `src/renderer/styles.css`
- `src/renderer/vue-shim.d.ts`
- `src/shared/platform.ts`
- `src/shared/types.ts`

## 关键决策

- 不再维护旧的打包产物补丁层，后续都从源码构建并整体替换 `resources/app`。
- 依赖安装和构建建议在本地磁盘完成，避免 U 盘写大量 `node_modules` 导致超时或掉盘。
- 当前部署复用已有 Electron 壳 `E:\win-unpacked\OpenClawPro.exe`。
- 当前 Hermes runtime 是 `E:\runtime\HermesPortable`，但新主进程启动时会把 `HOME`、`USERPROFILE`、`XDG_CONFIG_HOME`、`XDG_CACHE_HOME`、`HERMES_HOME`、`HERMES_LOG_DIR`、`HERMES_MEMORY_PATH`、`HERMES_SKILLS_PATH`、`TMP`、`TEMP` 指向 `E:\data\.hermes` 下。
- `vendor-snapshots/` 只保存旧打包快照，不纳入 Git。

## 待继续

- 如果需要三平台 Universal 包，继续补齐 macOS/Linux 的 Hermes venv 和启动器。
- OpenClaw 的聊天直连目前仍是占位，需要按 OpenClaw gateway API 补真实 chat passthrough。
- Hermes 的自然语言 cron、连接器字段测试、沙箱后端测试可以继续深化为实际命令调用。
- GitHub 推送受当前网络/认证影响，若 SSH 仍超时，需要配置可用代理或 HTTPS token。

## 验证结果

- `npm run typecheck` 通过。
- `npm run build` 通过。
- `node --check` 检查部署后的 `dist/main/index.js` 和 `dist/preload/index.js` 通过。
- `scripts/verify-hermes-runtime.mjs` 检测 Hermes runtime 通过：Hermes Agent `v0.15.1`，Python `3.12.13`，Node `v24.15.0`。
- 当前部署目录 `E:\win-unpacked\resources\app\dist` 中已无旧 Hermes 补丁资产。
- 短启动 `E:\win-unpacked\OpenClawPro.exe` 成功，进程保持运行。

## 如果需要下一台 Codex 接手，提示词

请在 `E:\source\openclawpro-agent-hub` 继续开发。这个目录是完整源码工程，旧的 dist 补丁层已经废弃。先运行 `git status`、`npm run typecheck`、`npm run build`、`npm run verify:hermes` 了解状态。后续所有 UI/IPC/运行时能力都应在源码里实现，再用 `npm run deploy:usb` 整体部署到 `E:\win-unpacked\resources\app`。不要恢复或继续使用 `hermes-enhance.js`、`real-hermes-ui.js` 等旧补丁文件。
