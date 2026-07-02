# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
确认 macOS 便携版授权公钥与 U 盘根目录 `.license` 逻辑，并让最终 U 盘根目录 `OpenClawPro.app` 使用原 OpenClaw 红色图标，而不是 Electron 默认图标。

## 已完成
- 确认构建后的授权公钥仍是 `MCowBQYDK2VwAyEA29uQxiQyam4tRMJfeul/MEZX8NOYVp6AM35bYGavo8I=`。
- 确认 macOS 根启动器会导出 `AGENT_HUB_USB_ROOT="$USB_ROOT"`，构建脚本会把 `.license` 路径改到 U 盘根目录。
- 新增 macOS 图标生成工具，从 `assets/icon.ico` 生成 `assets/icon.icns`。
- 修改 macOS 程序壳打包脚本，让内层 Electron app 使用 `icon.icns`。
- 修改 macOS U 盘根目录 staging 脚本，让根目录启动器 `OpenClawPro.app` 也使用同一个 `icon.icns`。
- 修复旧 release 目录清理时偶发 `ENOTEMPTY` 的重试问题。
- 已重新生成 `release/macos-usb-root-exfat`。

## 改动文件
- `assets/icon.icns`
- `scripts/lib/macos-icon.mjs`
- `scripts/package-macos-shell.mjs`
- `scripts/stage-macos-portable-test.mjs`
- `docs/codex-handoff/2026-07-02-macos-icon-license-root.md`

## 关键决策
- 图标源继续使用已有 Windows/OpenClaw 图标 `assets/icon.ico`，避免引入新品牌图形。
- 最终 U 盘根目录 app 是启动器 app，真正 Electron app 在 `Contents/Resources/OpenClawPro-Runtime.app` 内，因此两个 bundle 都必须写入图标。
- 授权校验逻辑不改公钥、不改签名算法；只确认构建产物使用 U 盘根目录 `.license`。

## 待继续
- 在真实 macOS U 盘上复制 `release/macos-usb-root-exfat` 后，双击根目录 `OpenClawPro.app` 做启动、授权、OpenClaw、Hermes、微信插件端到端测试。
- 如 Finder 图标缓存仍显示旧图标，可换新目录名或清理 Finder 图标缓存后再看；包内 `Info.plist` 与 `icon.icns` 已正确写入。

## 验证结果
- `node --check scripts/lib/macos-icon.mjs`
- `node --check scripts/package-macos-shell.mjs`
- `node --check scripts/stage-macos-portable-test.mjs`
- `npm run stage:macos-usb-root:final`
- `plutil -p release/macos-usb-root-exfat/OpenClawPro.app/Contents/Info.plist` 显示 `CFBundleIconFile => icon.icns`
- `plutil -p release/macos-usb-root-exfat/OpenClawPro.app/Contents/Resources/OpenClawPro-Runtime.app/Contents/Info.plist` 显示 `CFBundleIconFile => icon.icns`
- `find release/macos-usb-root-exfat/OpenClawPro.app -name icon.icns` 找到根启动器和内层运行 app 两份图标
- `rg` 确认构建产物内公钥仍是 `MCowBQYDK2VwAyEA29uQxiQyam4tRMJfeul/MEZX8NOYVp6AM35bYGavo8I=`，并且 `getLicensePath()` 读取 `AGENT_HUB_USB_ROOT`
- `find release/macos-usb-root-exfat -type l | wc -l` 结果为 `0`

## 如果需要下一台 Codex 接手，提示词
请从 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支继续。优先保持 U 盘根目录结构为 `OpenClawPro.app/runtime/data/skills/extensions/.license`，不要恢复 README、manifest、command 文件到最终 U 盘根目录。macOS Apple Silicon release 由 `npm run stage:macos-usb-root:final` 生成到 `release/macos-usb-root-exfat`。当前已确认授权公钥未变，构建产物读取 U 盘根目录 `.license`，根启动器和内层 app 都使用 `assets/icon.icns`。下一步做真实 macOS U 盘端到端测试，重点验证授权页、OpenClaw Gateway、Hermes 启动日志、微信插件、共享模型配置和共享 skills。
