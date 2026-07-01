# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
解决 exFAT U 盘拷贝 5 万多个小文件极慢的问题，采用可写 DMG 方案：U 盘根目录只放启动器、一个可写 DMG 大文件和用户外部目录，程序与 runtime/data/skills/extensions 放在 DMG 内运行。

## 已完成
- 新增 `npm run stage:macos-dmg:rw`。
- 新增 `scripts/stage-macos-dmg-portable.mjs`。
- 生成 `release/macos-dmg-usb-root`，根目录包含：
  - `OpenClawPro.command`
  - `OpenClawPro.dmg`
  - `Add-Skills-Here/`
  - `Add-Plugins-Here/`
  - `My-Files/`
  - `Exported-Files/`
  - `README-MACOS-DMG-PORTABLE.md`
  - `DMG-USB-MANIFEST.json`
- `OpenClawPro.dmg` 为 4G UDRW 可写镜像，内部包含完整 `OpenClawPro.app`、`runtime/`、`data/`、`skills/`、`extensions/`、`workspace/`、`exports/`。
- 根目录启动器会：
  - 挂载 `OpenClawPro.dmg` 到 `.OpenClawPro-Mount`。
  - 同步 `Add-Skills-Here/` 到 DMG 内 `skills/`。
  - 同步 `Add-Plugins-Here/` 到 DMG 内 `extensions/`。
  - 将 `My-Files/` 以链接方式暴露给 DMG 内 `USB-My-Files` 和 `workspace/My-Files`，大文件不复制进 DMG。
  - 设置 `AGENT_HUB_ROOT` 指向 DMG 挂载目录。
  - 设置 `AGENT_HUB_USB_ROOT`、`AGENT_HUB_EXTERNAL_FILES`、`AGENT_HUB_EXPORTS`。
  - 启动并等待 `OpenClawPro.app` 退出。
  - 退出后同步 DMG 内导出目录到 U 盘根目录 `Exported-Files/` 并卸载 DMG。

## 改动文件
- `package.json`
- `scripts/stage-macos-dmg-portable.mjs`
- `docs/codex-handoff/2026-07-01-macos-writable-dmg.md`

## 关键决策
- DMG 方案不是安装包，而是 U 盘上的可写虚拟磁盘。用户正常退出并弹出后，可以把同一 U 盘插到另一台 Mac 使用。
- 大文件不放进 DMG 内，用户材料放 U 盘根目录 `My-Files/`，避免 4G DMG 容量限制影响 1G/10G 级文件。
- skills/plugins 支持用户手动拖入根目录导入区，启动时同步到 DMG 内供 OpenClaw/Hermes 读取。
- 不提交生成的 4G DMG 产物，只提交源码级打包脚本。

## 待继续
- 用户把 `release/macos-dmg-usb-root` 内所有内容复制到 exFAT U 盘根目录，双击 `OpenClawPro.command` 端到端测试。
- 验证从 `Add-Skills-Here/` 添加 skill 后，OpenClaw/Hermes 是否能发现并使用。
- 验证 `My-Files/` 中大文件是否能被对话和技能读取。
- 验证导出结果是否同步到 `Exported-Files/`。
- 后续可考虑将 DMG 容量做成可配置，或增加空间不足提示。

## 验证结果
- `node --check scripts/stage-macos-dmg-portable.mjs`：通过。
- `npm run stage:macos-dmg:rw`：通过。
- `release/macos-dmg-usb-root` 根目录文件数从 5 万级降到少量入口文件，`OpenClawPro.dmg` 为 4.0G。
- `hdiutil imageinfo release/macos-dmg-usb-root/OpenClawPro.dmg`：`Format: UDRW`。
- 手动挂载 DMG 后，内部包含 `OpenClawPro.app`、`runtime/`、`data/`、`skills/`、`extensions/`、`workspace/`、`exports/`。
- 手动写入 DMG 内 `exports/dmg-write-test.txt` 成功，证明可写。
- 使用 DMG 挂载目录作为 `AGENT_HUB_ROOT` 直接启动 `OpenClawPro.app` smoke 成功，UI 可加载，且 runtime source/target identical，无运行期解压。
- smoke 后已重新生成干净 DMG，避免测试写入污染交付目录。

## 如果需要下一台 Codex 接手，提示词
请继续在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支开发。用户选择了 macOS 可写 DMG 便携方案，本阶段新增 `npm run stage:macos-dmg:rw`，输出 `release/macos-dmg-usb-root`。使用时把该目录内所有内容复制到 exFAT U 盘根目录，双击 `OpenClawPro.command`。不要提交 `release/`、`OpenClawPro.dmg`、runtime 二进制或 `uclaw/`。下一步优先在真实 U 盘上验证 skills 导入、My-Files 大文件读取、Exported-Files 导出同步和 OpenClaw/Hermes 端到端对话。
