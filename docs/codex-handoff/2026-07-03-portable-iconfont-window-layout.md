# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心；所有能力需要和现有程序前端界面无缝融合，前端体验稳定、清晰、可用。

## 当前目标
修复 release 包拷贝到新 U 盘/新电脑后图标显示为方块、界面边缘出现黑边的问题，并保证后续重新构建不会再次依赖远程字体资源。

## 已完成
- 将 OpenClaw 壳的 iconfont 从 AliCDN 远程加载改为本地随包字体文件加载。
- 将 `font_5166553_u9vpb1kec7` 的 woff2/woff/ttf 三个字体文件加入源码壳资源与构建产物。
- 将主窗口 `maximizable` 改为 `true`，并把窗口背景从黑色改为浅色 `#f0f2f5`，降低加载或边缘露底时出现黑边的概率。
- 在构建脚本中加入本地字体资源必备检查和远程 iconfont CDN 禁用检查。
- 已把最新 `dist` 同步到 `win-unpacked/resources/app/dist`，并同步到 release 目录 `D:\share\1\o\1\win-unpacked\resources\app\dist`。

## 改动文件
- `scripts/build-openclaw-shell-app.mjs`
- `src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css`
- `src/openclaw-shell-app/dist/assets/font_5166553_u9vpb1kec7.woff2`
- `src/openclaw-shell-app/dist/assets/font_5166553_u9vpb1kec7.woff`
- `src/openclaw-shell-app/dist/assets/font_5166553_u9vpb1kec7.ttf`
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/assets/main-CAx6YYDG.css`
- `dist/assets/font_5166553_u9vpb1kec7.woff2`
- `dist/assets/font_5166553_u9vpb1kec7.woff`
- `dist/assets/font_5166553_u9vpb1kec7.ttf`
- `dist/main/index.js`
- `dist/main/index.cjs`

## 关键决策
- 根因不是用户漏拷普通图片，而是 CSS 依赖远程 iconfont，便携发行版在新电脑/离线/网络受限时不能依赖 CDN。
- 字体文件必须进入 `src/openclaw-shell-app/dist/assets` 这个构建源头，而不是只临时放到 release 包里。
- 构建脚本必须失败于 `at.alicdn.com`，防止未来再次把远程字体带回 release。

## 待继续
- 用户需要在已有 U 盘上替换 `win-unpacked/resources/app/dist` 或至少替换 CSS、字体文件和 main 入口文件后重新测试。
- 如果仍有黑边，需要进一步查看新 U 盘实际运行目录是否混用了旧壳文件，或是否存在 Windows 缩放/显卡渲染导致的透明背景露底。

## 验证结果
- `npm.cmd run build` 通过。
- `node --check dist/main/index.cjs` 通过。
- `node --check dist/preload/index.cjs` 通过。
- `node --check dist/assets/assets/main-DIeui7ZO.js` 通过。
- `git diff --check` 通过。
- `rg "at\.alicdn" D:\share\1\o\1\win-unpacked\resources\app\dist` 无结果。
- release 目录中的 `main-CAx6YYDG.css` 与仓库 `dist` 哈希一致。

## 如果需要下一台 Codex 接手，提示词
继续在 `D:\github\u-agent` 上开发 OpenClawPro U 盘便携版。当前重点：验证新 release 在新 U 盘/新电脑上图标字体和窗口边缘显示是否恢复。最近一次修复已把 iconfont 本地化、主窗口改为可最大化并使用浅色背景。请先运行 `git status`、检查 `dist/assets/main-CAx6YYDG.css` 不含 `at.alicdn.com`、确认 `font_5166553_u9vpb1kec7.woff2/woff/ttf` 存在于 `dist/assets` 和 release 目录。如果用户报告仍有黑边，优先核对运行中的 U 盘 `win-unpacked/resources/app/dist` 是否与仓库 `dist` 哈希一致，再检查 CSS 根布局和 Electron 主窗口配置。
