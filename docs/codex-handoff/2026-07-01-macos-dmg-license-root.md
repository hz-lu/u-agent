# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 macOS DMG 便携版双击根目录 `OpenClawPro.app` 启动不可见失败的问题，并将授权文件 `.license` 改为放在 U 盘根目录，便于用户批量给新 U 盘预置授权。

## 已完成
- 主程序授权路径改为：优先读写 `AGENT_HUB_USB_ROOT/.license`，没有外层 U 盘根目录环境变量时才回退到 `getAppRoot()/.license`。
- 授权序列号检测仍优先使用 `AGENT_HUB_USB_ROOT`，避免绑定到 DMG 虚拟卷。
- 根目录启动器 App 增加 `.OpenClawPro-launch.log` 隐藏日志。
- 根目录启动器 App 增加失败弹窗，双击失败时提示查看 U 盘根目录 `.OpenClawPro-launch.log`。
- 修复启动器同步函数在可选目录不存在时被 `set -e` 误判失败的问题。
- 重新生成 `release/macos-dmg-usb-root`，最终目录仍只包含：`OpenClawPro.app`、`OpenClawPro.dmg`、`Add-Skills-Here/`、`Add-Plugins-Here/`、`My-Files/`、`Exported-Files/`。

## 改动文件
- `scripts/build-openclaw-shell-app.mjs`
- `scripts/stage-macos-dmg-portable.mjs`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `docs/codex-handoff/2026-07-01-macos-dmg-license-root.md`

## 关键决策
- `.license` 是用户/授权交付文件，应放在 U 盘根目录，便于复制到多个新 U 盘。
- 模型配置、聊天历史、Hermes 记忆、日志、缓存仍保存在 DMG 内 data 目录，保持程序数据零安装和便携迁移。
- 根目录不暴露 README/manifest/command；启动问题通过隐藏日志 `.OpenClawPro-launch.log` 定位。

## 待继续
- 用户将新生成的 `release/macos-dmg-usb-root` 内容覆盖到 U 盘根目录后测试双击 `OpenClawPro.app`。
- 若仍启动失败，查看 U 盘根目录隐藏文件 `.OpenClawPro-launch.log`。
- 在 U 盘根目录放置 `.license` 后验证授权检查通过。
- 完成 OpenClaw/Hermes/协同对话、模型配置、技能导入、大文件读取、导出同步端到端测试。

## 验证结果
- `npm run build:renderer`：生成 dist，确认 `getLicensePath()` 使用 `AGENT_HUB_USB_ROOT/.license`。
- `node --check scripts/stage-macos-dmg-portable.mjs`：通过。
- `node --check scripts/build-openclaw-shell-app.mjs`：通过。
- `npm run stage:macos-dmg:rw`：通过。
- 根目录启动器 App smoke：可挂载 DMG 并启动内部 Electron App。
- smoke 期间 Electron userData 位于 DMG 内 `data/.openclaw/electron/electron-cache`。
- smoke 后已重新生成干净 DMG，最终目录无挂载点、无启动日志残留。

## 如果需要下一台 Codex 接手，提示词
请继续在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支开发。当前 macOS DMG 便携包通过 `npm run stage:macos-dmg:rw` 生成，最终根目录只放 `OpenClawPro.app`、`OpenClawPro.dmg` 和四个用户目录。`.license` 已改为读写外层 U 盘根目录 `AGENT_HUB_USB_ROOT/.license`，不是 DMG 内。若用户说双击没反应，先看 U 盘根目录 `.OpenClawPro-launch.log`。不要提交 release/DMG/runtime 二进制或 `uclaw/`。
