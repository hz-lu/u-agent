# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 macOS U 盘版复制到新 U 盘后出现的 OpenClaw 启动假成功、慢盘首次启动超时、Hermes 首页日志撑破布局、右侧和底部黑边，以及 Hermes API Server 缺少 aiohttp 的问题。

## 已完成
- 修复 `start-gateway` IPC：主进程现在会把 Gateway 健康检查失败返回给前端，不再无条件 `{ ok: true }`，避免“启动失败也提示启动成功”。
- 将 OpenClaw Gateway 健康检查等待从 60 秒提高到 180 秒，适配新 U 盘、exFAT、首次冷启动较慢的情况。
- Gateway 进程 spawn 前会立即向 UI 日志写入启动命令，避免用户点击启动后长时间看不到任何日志。
- 修复首页布局溢出：
  - Hermes/OpenClaw 日志长行强制换行。
  - 首页环境检查网格改为按宽度自适应。
  - 根应用和首页容器增加横向防溢出，避免右侧/底部黑边。
  - 日志行禁用全局 transition，降低刷日志时的 UI 抖动和性能负担。
- 确认 macOS arm64 Hermes portable Python 缺少 `aiohttp`，已补入本机 `runtime/macos-arm64/HermesPortable/python/lib/python3.12/site-packages`，新生成的 release runtime 已可 import。
- 已重新生成 `/Users/ly/data/codex/u-agent/release/macos-usb-root-exfat`。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `dist/assets/main-CAx6YYDG.css`
- `docs/codex-handoff/2026-07-03-macos-usb-startup-layout-fixes.md`
- 本地 release runtime 环境补齐：`runtime/macos-arm64/HermesPortable/python/lib/python3.12/site-packages/aiohttp*` 及其依赖，未纳入 git。

## 关键决策
- 这次只改启动状态、慢盘等待、日志可见性、布局防溢出和 Hermes API 依赖，不改 OpenClaw 对话、模型配置、微信登录数据或技能数据。
- 不清理 U 盘 `data/`、`.license`、微信账号凭据，避免破坏用户已有测试状态。
- `aiohttp` 属于便携 runtime 二进制环境，不提交到 git；但会随本机重新 stage 的 `release/macos-usb-root-exfat/runtime` 进入测试包。
- Hermes 日志里的 `No user allowlists configured` 暂按 warning 处理，不作为本轮启动失败修复对象。

## 待继续
- 用户将新版 `/Users/ly/data/codex/u-agent/release/macos-usb-root-exfat` 拷贝到 U 盘后，在新的 macOS 机器上验证：
  - 双击 U 盘根目录 `OpenClawPro.app` 能启动。
  - 首页右侧和底部不再出现黑边。
  - OpenClaw 启动期间能立刻看到启动日志；未真正 ready 前不再提示成功。
  - Hermes 启动后 API Server 不再报 `aiohttp not installed`。
- 如果 Hermes 发消息仍跳回首页，需要继续追踪 AI 会话中 `handleHermesChatConfig` / `handleHermesChatApi` 是否被误触发，或路由状态是否被旧 localStorage 恢复影响。
- 如果 OpenClaw 首次启动仍超过 180 秒，需要检查 U 盘读写速度、`data/.openclaw/logs/gateway-launcher.log`、以及 Gateway 实际 `http server listening` 时间。

## 验证结果
- `npm run build` 通过。
- `npm run stage:macos-usb-root:final` 通过。
- `node --check dist/main/index.cjs` 通过。
- `node --check dist/main/index.js` 通过。
- `node --check src/openclaw-shell-app/dist/main/index.js` 通过。
- `node --check src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js` 通过。
- `release/macos-usb-root-exfat/runtime/HermesPortable/python/bin/python3.12 -c "import aiohttp; print(aiohttp.__version__)"` 输出 `3.14.1`。
- `stage:macos-usb-root:final` 显示 runtime required missing 为 `[]`，exFAT remaining symlinks 为 `[]`。

## 如果需要下一台 Codex 接手，提示词
继续在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支上开发。最新修复：OpenClaw Gateway 启动 IPC 已不再无条件成功，慢 U 盘健康检查等待提高到 180 秒，首页日志/环境检查布局已防溢出，macOS arm64 Hermes runtime 已在本机补入 aiohttp 并重新生成 `release/macos-usb-root-exfat`。下一步优先让用户用新版 U 盘包在新 mac 上测试；若仍有 Hermes 发送消息跳首页，检查 AI 会话路由/按钮触发和 localStorage 恢复逻辑。
