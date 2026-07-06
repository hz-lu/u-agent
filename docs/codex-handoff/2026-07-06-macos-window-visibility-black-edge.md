# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 macOS U 盘版首页右侧仍有黑边，以及程序启动/二次点击后窗口不显示、用户感觉“点程序没有响应”的问题。

## 已完成
- 将 Electron 主窗口 `backgroundColor` 从深色 `#0a0a0a` 改为浅色 `#f0f2f5`，避免无边框窗口内容未完全铺满时露出黑边。
- 补齐 `html/body/#app` 的 100% 尺寸、0 margin/padding、浅色背景，以及应用根容器的 `100vw/100vh/overflow:hidden`。
- 补齐主内容容器 `min-width:0`、高度和溢出控制，减少右侧/底部黑边和窗口缩放小数带来的露底。
- `window-ready` 和启动超时兜底显示窗口时增加 `focus()`。
- 修复 macOS `activate` 事件为空的问题：Dock 点击或重新激活时会 restore/show/focus 已有窗口；如果窗口不存在则重新创建。
- 修复单实例二次启动只 `focus()` 不 `show()` 的问题，避免窗口被隐藏后再次双击 app 仍看不到界面。
- 本机 Homebrew Node 当前缺失 `libllhttp.9.3.dylib`，导致 `npm run build` 崩溃；已将 macOS 打包脚本改为使用当前 `process.execPath` 直接调用内部 Node 脚本，不再在脚本内部硬依赖 shell 里的 `npm`。
- 已用 portable Node 重新生成 `/Users/ly/data/codex/u-agent/release/macos-usb-root-exfat`。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `dist/assets/main-CAx6YYDG.css`
- `scripts/package-macos-shell.mjs`
- `scripts/stage-macos-portable-test.mjs`
- `docs/codex-handoff/2026-07-06-macos-window-visibility-black-edge.md`

## 关键决策
- 这次不改 OpenClaw/Hermes 对话链路和模型配置，只修窗口可见性、黑边和 macOS 打包自举可靠性。
- 不动 U 盘 `data/`、`.license`、微信账号凭据。
- 当前正式生成命令可直接用 portable Node：
  `MACOS_EXFAT_COMPAT=1 MACOS_USB_ROOT_LAYOUT=1 runtime/macos-arm64/node/bin/node scripts/stage-macos-portable-test.mjs`
- `release/macos-usb-root-exfat` 已更新，用户若只做快速验证，可优先替换 U 盘根目录的 `OpenClawPro.app`；如果需要确保 Hermes API 依赖也一致，再替换 `runtime/`。

## 待继续
- 用户将新版 `OpenClawPro.app` 拷到 U 盘后验证：
  - 首页右侧黑边是否消失或变成和页面一致的浅色背景。
  - 关闭/隐藏窗口后，再次从 U 盘双击 `OpenClawPro.app` 是否能把窗口带到前台。
  - Dock 点击是否能正常恢复窗口。
- 如果仍有黑边，需要进一步检查是否来自 macOS 窗口阴影/屏幕截图边缘，而不是 Web 内容区；可用截图比对窗口 `backgroundColor` 是否仍露出。

## 验证结果
- `runtime/macos-arm64/node/bin/node scripts/build-openclaw-shell-app.mjs` 通过。
- `MACOS_EXFAT_COMPAT=1 MACOS_USB_ROOT_LAYOUT=1 runtime/macos-arm64/node/bin/node scripts/stage-macos-portable-test.mjs` 通过。
- `node --check` 使用 portable Node 检查以下文件通过：
  - `src/openclaw-shell-app/dist/main/index.js`
  - `dist/main/index.js`
  - `dist/main/index.cjs`
  - `scripts/package-macos-shell.mjs`
  - `scripts/stage-macos-portable-test.mjs`
- release app 内 `dist/main/index.cjs` 和仓库 `dist/main/index.cjs` hash 一致。
- release app 内 `dist/assets/main-CAx6YYDG.css` 和仓库 `dist/assets/main-CAx6YYDG.css` hash 一致。
- `release/macos-usb-root-exfat/runtime/HermesPortable/python/bin/python3.12 -c "import aiohttp; print(aiohttp.__version__)"` 输出 `3.14.1`。
- 本机 `npm run build` 未通过，原因是系统 Homebrew Node 缺失动态库 `libllhttp.9.3.dylib`，不是项目源码语法错误；本轮已绕过该环境问题。

## 如果需要下一台 Codex 接手，提示词
继续在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支上开发。最新修复：macOS U 盘版窗口黑边和二次启动不显示问题已修，Electron 背景色改为浅色，根容器铺满 100%，Dock/二次启动会 show/focus。macOS 打包脚本已改成用当前 Node 自举，不再依赖 shell npm。本机 Homebrew Node 坏了，使用 `runtime/macos-arm64/node/bin/node` 执行打包和检查。
