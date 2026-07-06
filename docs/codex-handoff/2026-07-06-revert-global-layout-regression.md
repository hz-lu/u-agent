# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复上一轮为处理 macOS 右侧黑边而引入的全局布局回归：首页 OpenClaw 启动区被截断、其他页面滚动条消失、页面卡顿/无响应风险上升。

## 已完成
- 反思并定位根因：上一轮改动把黑边问题当成全局布局问题处理，新增了 `html/body/#app` 100% 高宽、全局 `* { box-sizing: border-box; }`、`.main-app-layout { height:100vh; overflow:hidden; }`、`.main-app-main-wrapper { height: calc(...); overflow:hidden; }` 等关键根布局规则。
- 这些规则影响了所有页面的自然滚动和高度计算，导致模型配置、环境检查、首页等页面出现滚动消失、内容截断和布局错位。
- 已删除上述 21 行破坏性全局 CSS，恢复到上一版稳定的页面滚动和布局模型。
- 保留主进程窗口可见性修复：`window-ready` 后 focus、macOS `activate` show/focus、单实例二次启动 show/focus。
- 保留 macOS 打包脚本自举修复：使用当前 `process.execPath` 调内部 Node 脚本，避免本机 Homebrew Node/npm 损坏影响打包。
- 已重新生成 `/Users/ly/data/codex/u-agent/release/macos-usb-root-exfat`，并确认 release app 内 CSS 与仓库 `dist` CSS hash 一致。

## 改动文件
- `src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css`
- `dist/assets/main-CAx6YYDG.css`
- `docs/codex-handoff/2026-07-06-revert-global-layout-regression.md`

## 关键决策
- 从第一性原理看，右侧黑边不能通过锁死全局高度和全局 overflow 解决；页面滚动应该继续由原有页面/内容容器负责。
- 只撤销上一轮直接导致回归的全局 CSS，不改模型配置、OpenClaw 启动逻辑、Hermes 对话、微信插件和 runtime。
- 本轮不再扩大样式修改面，不碰全局 `div { transition: all ... }` 等历史样式，避免继续引入副作用。

## 待继续
- 用户只需覆盖 U 盘根目录 `OpenClawPro.app` 后验证：
  - 首页 Gateway 控制台启动按钮、状态、端口不再被截断。
  - 模型配置、环境检查、设置等页面的纵向滚动恢复。
  - 关闭/隐藏窗口后再次双击 app 仍可显示。
- 如果仍有右侧细边，需要继续判断是 Electron 窗口背景露出、macOS 截图边缘、还是某个具体页面局部长内容溢出；不能再用全局 `overflow:hidden` 处理。

## 验证结果
- `runtime/macos-arm64/node/bin/node scripts/build-openclaw-shell-app.mjs` 通过。
- `runtime/macos-arm64/node/bin/node --check dist/main/index.cjs` 通过。
- `runtime/macos-arm64/node/bin/node --check dist/main/index.js` 通过。
- `runtime/macos-arm64/node/bin/node --check src/openclaw-shell-app/dist/main/index.js` 通过。
- `MACOS_EXFAT_COMPAT=1 MACOS_USB_ROOT_LAYOUT=1 runtime/macos-arm64/node/bin/node scripts/stage-macos-portable-test.mjs` 通过。
- `src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css`、`dist/assets/main-CAx6YYDG.css`、release app 内 CSS hash 一致。

## 如果需要下一台 Codex 接手，提示词
继续在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支上开发。注意：2026-07-06 上一轮为修黑边加入的全局根布局 CSS 已被确认造成滚动消失和首页截断，已回退。后续处理黑边必须定位具体溢出元素或窗口背景，不要再锁死全局高度/overflow。主进程 show/focus 修复和 macOS 打包自举修复保留。
