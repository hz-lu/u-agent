# Codex Handoff

## 总体目标
基于已开发的 U盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并与现有程序前端界面无缝融合，让用户在前端界面上获得良好体验。

## 当前目标
修复自定义标题栏窗口控制：最小化按钮无反应，并补齐最大化/还原按钮和功能。

## 已完成
- 修复 preload 中 `ipcMinimize` 被注释吞掉的问题，重新显式暴露 `ipcMinimize`。
- 新增 preload API：`ipcToggleMaximize`。
- 主进程新增 `window-toggle-maximize` IPC，支持最大化与还原切换。
- 前端标题栏新增最大化/还原按钮，放在最小化和关闭之间。
- 前端最小化与最大化按钮都增加 `ipcSend` 兜底，避免运行壳 API 缺失时完全无响应。
- CSS 增加最大化方框符号样式，使按钮尺寸和现有标题栏一致。
- 已同步最新运行文件到 `F:` 和 `G:` 的 Electron 壳，未触碰原始 `E:` 盘。

## 改动文件
- `dist/assets/assets/main-DIeui7ZO.js`
- `dist/assets/main-CAx6YYDG.css`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `dist/preload/index.js`
- `dist/preload/index.cjs`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css`
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/preload/index.js`
- `docs/codex-handoff/2026-07-02-window-controls.md`

## 关键决策
- 窗口控制不能只改前端按钮，必须同时修 preload 暴露和主进程 IPC。
- 最大化按钮使用文本方框 `□`，避免依赖未知 iconfont 图标名。
- 保留 `ipcSend` 兜底路径，提高旧 preload/前端不一致时的兼容性。

## 待继续
- 复测前必须完全退出并重开 Electron，preload/main 不能热加载。
- 手动更新已拷贝的 U 盘版本时，这次需要拷贝 main、preload、前端 JS 和 CSS，不是只拷贝单个前端 JS。

## 验证结果
- `node --check dist/assets/assets/main-DIeui7ZO.js` 通过。
- `node --check src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js` 通过。
- `node --check dist/preload/index.js` / `index.cjs` / `src/openclaw-shell-app/dist/preload/index.js` 通过。
- `node --check dist/main/index.js` / `index.cjs` / `src/openclaw-shell-app/dist/main/index.js` 通过。
- `git diff --check` 通过。
- 已覆盖 `F:` 和 `G:` 的对应运行文件，并校验 SHA256 与源码一致。

## 如果需要下一台 Codex 接手，提示词
继续开发 `D:\github\u-agent`。本轮修复窗口控制：preload 显式暴露 `ipcMinimize` 和 `ipcToggleMaximize`，main 监听 `window-toggle-maximize` 并调用 maximize/unmaximize，前端标题栏新增最大化/还原按钮并给最小化/最大化加 `ipcSend` 兜底。复测前完全退出 Electron 后重开；手动更新 U 盘需要同步 dist main/preload/assets JS/CSS 多个文件。
