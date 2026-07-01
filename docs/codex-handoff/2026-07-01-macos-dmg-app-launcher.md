# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
将 macOS 可写 DMG 便携版从开发可读目录收敛为最终用户可直接双击的根目录形态：不暴露 `.command`、README、manifest 等开发文件，只保留启动 App、DMG 和用户导入/导出目录。

## 已完成
- `stage:macos-dmg:rw` 现在输出根目录 `OpenClawPro.app` 作为轻量启动器 App。
- 移除正式 U 盘运行目录中的 `OpenClawPro.command`、`README-MACOS-DMG-PORTABLE.md`、`DMG-USB-MANIFEST.json`。
- 根目录启动器 App 内部脚本负责：
  - 定位同级 `OpenClawPro.dmg`。
  - 挂载 DMG 到 `.OpenClawPro-Mount`。
  - 同步 `Add-Skills-Here/` 到 DMG 内 `skills/`。
  - 同步 `Add-Plugins-Here/` 到 DMG 内 `extensions/`。
  - 将 `My-Files/` 链接进 DMG 内 `USB-My-Files` 和 `workspace/My-Files`。
  - 设置 `AGENT_HUB_ROOT` 为 DMG 挂载根目录。
  - 设置 `AGENT_HUB_USB_ROOT` 为外层 U 盘根目录。
  - 退出后同步导出内容到 `Exported-Files/` 并卸载 DMG。
- `scripts/build-openclaw-shell-app.mjs` 修改主程序授权序列号检测：优先使用 `AGENT_HUB_USB_ROOT`，避免 DMG 挂载卷序列号替代真实 U 盘根目录。

## 改动文件
- `scripts/stage-macos-dmg-portable.mjs`
- `scripts/build-openclaw-shell-app.mjs`
- `docs/codex-handoff/2026-07-01-macos-dmg-app-launcher.md`

## 关键决策
- `DMG-USB-MANIFEST.json`、README 属于开发/交付说明，不进入最终 U 盘运行目录。
- `.license` 不放在 U 盘根目录暴露；主程序仍按 `getAppRoot()/.license` 读写，DMG 方案中 `getAppRoot()` 是可写 DMG 挂载根目录，因此授权文件保存在 `OpenClawPro.dmg` 内并随 U 盘迁移。
- 授权绑定的序列号应来自外层 U 盘根目录，而不是 DMG 虚拟卷，所以新增 `AGENT_HUB_USB_ROOT` 优先路径。

## 待继续
- 用户把 `release/macos-dmg-usb-root` 内所有内容复制到 exFAT U 盘根目录，双击根目录 `OpenClawPro.app` 测试。
- 在真实 U 盘上完成授权流程，确认 `.license` 写入 DMG 内且下次启动可识别。
- 验证换另一台 Mac 后，正常挂载 DMG、读取授权、保留配置和历史。
- 验证 Add-Skills-Here、Add-Plugins-Here、My-Files、Exported-Files 的实际闭环。

## 验证结果
- `node --check scripts/stage-macos-dmg-portable.mjs`：通过。
- `npm run build:renderer`：生成 dist 后确认 `dist/main/index.js` 和 `dist/main/index.cjs` 包含 `process.env.AGENT_HUB_USB_ROOT?.trim() || process.execPath`。
- `npm run stage:macos-dmg:rw`：通过。
- `release/macos-dmg-usb-root` 根目录无 `.command`、README、manifest。
- `plutil -lint release/macos-dmg-usb-root/OpenClawPro.app/Contents/Info.plist`：通过。
- 根目录启动器 App smoke：成功挂载 DMG 并启动内部 Electron App；Electron userData 位于 DMG 内 `data/.openclaw/electron/electron-cache`。
- smoke 后已重新生成干净 DMG，避免测试运行态写入污染交付目录。

## 如果需要下一台 Codex 接手，提示词
请继续在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支开发。当前 macOS 可写 DMG 方案的最终用户根目录已经收敛为 `OpenClawPro.app`、`OpenClawPro.dmg`、`Add-Skills-Here/`、`Add-Plugins-Here/`、`My-Files/`、`Exported-Files/`。启动 App 会挂载 DMG 并启动内部真正的 OpenClawPro.app。授权 `.license` 保存在 DMG 内，序列号检测优先用外层 `AGENT_HUB_USB_ROOT`。不要提交 release/DMG/runtime 二进制或 `uclaw/`。
