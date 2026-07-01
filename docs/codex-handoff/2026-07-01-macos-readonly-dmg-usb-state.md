# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
解决 macOS exFAT U 盘上根目录 `OpenClawPro.app` 无法启动的问题，并避免 4GB 可写 HFS+ DMG 在慢盘/坏盘上复制慢、挂载失败、运行期写入损坏。

## 已完成
- 将 macOS DMG 从 4GB 可写 UDRW 原始镜像改为压缩只读 UDZO 镜像，当前大小约 660MB。
- 根启动器继续保持 U 盘根目录 `OpenClawPro.app` 直接启动。
- 根启动器 App 生成后执行 `codesign --force --deep --sign -`，避免 Finder/LaunchServices 直接杀掉未正确签名的 Mach-O 启动器。
- 启动器不再把 DMG 当运行期数据盘，而是：
  - 挂载只读 DMG 到 macOS 临时目录；
  - 将 `AGENT_HUB_ROOT` 指向 U 盘根目录隐藏 `.OpenClawPro`；
  - 将 `AGENT_HUB_DATA_ROOT` 指向 `.OpenClawPro/data`；
  - 将 `OPENCLAW_RUNTIME_ROOT` 指向 DMG 内 `runtime/<platform>`；
  - 将 `HERMES_PORTABLE_ROOT` 指向 DMG 内 Hermes runtime。
- 主进程 `getAppRoot()` 支持 `AGENT_HUB_ROOT`，`getDataRoot()` 支持 `AGENT_HUB_DATA_ROOT`。
- 启动器首次运行只种子化必要 data 配置文件和目录，不再整包复制 data 模板。
- 本机 release 根目录 smoke 通过：只读 DMG 成功挂载，UI 加载成功，Electron userData 写入 `.OpenClawPro/data/.openclaw/electron/electron-cache`。

## 改动文件
- `scripts/stage-macos-dmg-portable.mjs`
- `scripts/build-openclaw-shell-app.mjs`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `docs/codex-handoff/2026-07-01-macos-readonly-dmg-usb-state.md`

## 关键决策
- 不再使用可写 HFS+ DMG 承载 data。运行期可写数据放到 U 盘根目录隐藏 `.OpenClawPro`，`.license` 仍放 U 盘根目录。
- DMG 只负责保存 macOS App/runtime，避免用户历史、缓存、日志写入 DMG。
- 根目录保持干净：可见项仍为 `OpenClawPro.app`、`OpenClawPro.dmg`、`Add-Skills-Here/`、`Add-Plugins-Here/`、`My-Files/`、`Exported-Files/`；运行后会新增隐藏 `.OpenClawPro/` 和 `.OpenClawPro-launch.log`。

## 待继续
- 当前测试 U 盘 `/Volumes/Untitled` 会静默写坏 DMG：`rsync` 和 `dd conv=fsync` 后 SHA256 均与源文件不一致，`hdiutil verify` 报映像数据损坏。
- 必须换一块可靠 U 盘，或重新格式化当前 U 盘后再复制测试；当前这块盘不能作为端到端测试依据。
- 建议新增专门的 macOS U 盘部署/校验脚本：复制后自动 `shasum -a 256` 和 `hdiutil verify`，不通过就拒绝测试。
- 换盘或重格式化后，重新复制 `release/macos-dmg-usb-root`，再双击根目录 `OpenClawPro.app` 测试。

## 验证结果
- `node --check scripts/stage-macos-dmg-portable.mjs`：通过。
- `npm run stage:macos-dmg:rw`：通过。
- 本机 release `codesign -vvv --deep --strict release/macos-dmg-usb-root/OpenClawPro.app`：通过。
- 本机 release smoke：通过，日志显示 `seed portable data templates`、UI 加载成功。
- U 盘 `/Volumes/Untitled` 校验失败：
  - `hdiutil verify /Volumes/Untitled/OpenClawPro.dmg`：失败，映像数据已损坏。
  - `shasum -a 256`：源 DMG 与 U 盘 DMG 不一致。
  - 使用 `dd if=... of=... bs=4m conv=fsync` 重写后，SHA 仍不一致，说明当前 U 盘或 exFAT 状态不可靠。

## 如果需要下一台 Codex 接手，提示词
请继续在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支开发。macOS U 盘方案已从 4GB 可写 DMG 改为只读压缩 UDZO DMG + U 盘隐藏状态目录 `.OpenClawPro`。根目录 App 是原生小启动器并已 ad-hoc codesign。`.license` 仍在 U 盘根目录。当前 `/Volumes/Untitled` U 盘会静默写坏 DMG，即使 `dd conv=fsync` 后 SHA 也不一致，不能继续作为测试依据。下一步优先换可靠 U 盘或重格式化后复制，并新增复制后自动 SHA + `hdiutil verify` 的部署脚本。
