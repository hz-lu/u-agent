# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
废弃 DMG 作为最终 macOS 运行结构，恢复并固定用户确认的 U 盘根目录运行结构：`OpenClawPro.app`、`runtime/`、`data/`、`skills/`、`extensions/`。

## 已完成
- 新增 package script：`npm run stage:macos-usb-root:final`。
- 最终输出目录：`release/macos-usb-root-exfat`。
- 最终根目录严格只有五项：
  - `OpenClawPro.app`
  - `runtime/`
  - `data/`
  - `skills/`
  - `extensions/`
- 移除最终根目录中的 README、manifest、`.command`、DMG、Add-Skills、Add-Plugins、My-Files、Exported-Files 等非用户确认项。
- `OpenClawPro.app` 外层是小启动器，内部资源中包含真正 Electron 壳 `OpenClawPro-Runtime.app`，但根目录仍只有一个 `OpenClawPro.app`。
- 启动器显式设置：
  - `AGENT_HUB_ROOT=<U盘根目录>`
  - `AGENT_HUB_DATA_ROOT=<U盘根目录>/data`
  - `AGENT_HUB_USB_ROOT=<U盘根目录>`
- exFAT 兼容处理保留：符号链接实体化、关键可执行目录 chmod、quarantine 清理。

## 改动文件
- `package.json`
- `scripts/stage-macos-portable-test.mjs`
- `docs/codex-handoff/2026-07-01-macos-final-usb-root-layout.md`

## 关键决策
- 最终 macOS U 盘交付不再使用 DMG。
- U 盘根目录结构以用户确认为准，不添加说明文件、manifest、command、额外用户目录。
- 为了在双击 `.app` 时稳定传入 U 盘根目录环境变量，采用外层小启动器 App + 内部 Electron Runtime App 的方式；这是 App 包内部结构，不改变 U 盘根目录结构。

## 待继续
- 在可靠或已修复的 U 盘上复制 `release/macos-usb-root-exfat` 五项内容到根目录测试。
- 复制前先修复当前 `/Volumes/Untitled` 的 exFAT 文件系统；当前 `diskutil verifyVolume` 已显示 `.Trashes` 和 bitmap 损坏。
- 后续建议新增 U 盘部署脚本，复制完成后自动校验文件数量、总大小、关键可执行文件、runtime manifest 和启动日志。

## 验证结果
- `node --check scripts/stage-macos-portable-test.mjs`：通过。
- `npm run stage:macos-usb-root:final`：通过。
- `release/macos-usb-root-exfat` 根目录检查：仅包含 `OpenClawPro.app`、`runtime/`、`data/`、`skills/`、`extensions/`。
- `find release/macos-usb-root-exfat -type l`：无符号链接残留。
- 本机 smoke：直接执行 `release/macos-usb-root-exfat/OpenClawPro.app/Contents/MacOS/OpenClawPro` 可启动 UI。
- smoke 中 Electron userData 位于 `release/macos-usb-root-exfat/data/.openclaw/electron/electron-cache`。
- smoke 后已重新生成干净 release，无 `.OpenClawPro-launch.log` 等测试残留。

## 如果需要下一台 Codex 接手，提示词
请继续在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支开发。macOS 最终 U 盘结构已经固定为五项：`OpenClawPro.app`、`runtime/`、`data/`、`skills/`、`extensions/`，输出命令是 `npm run stage:macos-usb-root:final`，输出目录是 `release/macos-usb-root-exfat`。不要再把 DMG 作为最终运行结构。当前 `/Volumes/Untitled` 的 exFAT 文件系统已损坏，先修复或换盘再测试。完成后继续做 OpenClaw/Hermes 端到端验证。
