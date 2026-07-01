# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 macOS U 盘根目录 `OpenClawPro.app` 双击启动不稳定的问题，避免用户必须手动打开 `OpenClawPro.dmg` 再启动内部 App。

## 已完成
- 将 U 盘根目录 `OpenClawPro.app` 的 `Contents/MacOS/OpenClawPro` 从 bash 脚本改为原生 Mach-O 小启动器。
- 新增 `scripts/macos-root-launcher.c`，打包时由 `clang` 编译，启动器负责调用 `Contents/Resources/launcher.sh`。
- 根启动器脚本仍负责挂载 `OpenClawPro.dmg`、同步技能/插件/导出目录、传递便携环境变量。
- 内部 App 启动方式从 `open -W OpenClawPro.app` 改为直接执行 `OpenClawPro.app/Contents/MacOS/OpenClawPro`，确保 `AGENT_HUB_ROOT`、`AGENT_HUB_USB_ROOT`、`AGENT_HUB_EXTERNAL_FILES`、`AGENT_HUB_EXPORTS` 被真实继承。
- `.license` 继续放在 U 盘根目录，由 `AGENT_HUB_USB_ROOT/.license` 读写。
- 重新生成干净的 `release/macos-dmg-usb-root`。

## 改动文件
- `scripts/macos-root-launcher.c`
- `scripts/stage-macos-dmg-portable.mjs`
- `docs/codex-handoff/2026-07-01-macos-native-root-launcher.md`

## 关键决策
- 根目录 `.app` 不能再依赖 shell 脚本作为 `CFBundleExecutable`，因为 Finder 双击、LaunchServices、exFAT/U 盘场景下不够稳定。
- 保留 shell 脚本作为资源文件，便于后续维护挂载和同步流程。
- 内部 Electron App 使用直接执行二进制的方式启动，减少 LaunchServices 对环境变量传递的不确定性。

## 待继续
- 用户将最新 `release/macos-dmg-usb-root` 内容覆盖到 U 盘根目录，直接双击根目录 `OpenClawPro.app` 测试。
- 若仍失败，读取 U 盘根目录隐藏日志 `.OpenClawPro-launch.log`。
- 若出现 Apple 崩溃弹窗，优先查看 DMG 内 `data/.openclaw/logs/desktop-crash.log` 和 macOS 崩溃报告。
- 后续继续做 OpenClaw/Hermes/协同对话、模型配置、技能导入、导出同步端到端测试。

## 验证结果
- `node --check scripts/stage-macos-dmg-portable.mjs`：通过。
- `clang -O2 -Wall -Wextra -mmacosx-version-min=11.0 scripts/macos-root-launcher.c`：通过，输出 Mach-O arm64。
- `npm run stage:macos-dmg:rw`：通过，runtime 检查无缺失。
- 根目录 `OpenClawPro.app/Contents/MacOS/OpenClawPro` 确认为 `Mach-O 64-bit executable arm64`。
- smoke：从根目录启动器执行后自动挂载 DMG，并直接启动内部 Electron 二进制；日志显示 UI 加载成功。
- smoke：Electron userData 位于 DMG 内 `data/.openclaw/electron/electron-cache`。
- smoke 后重新生成干净 release，最终根目录仅包含 `OpenClawPro.app`、`OpenClawPro.dmg`、`Add-Skills-Here/`、`Add-Plugins-Here/`、`My-Files/`、`Exported-Files/`。

## 如果需要下一台 Codex 接手，提示词
请继续在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支开发。当前 macOS DMG 便携方案通过 `npm run stage:macos-dmg:rw` 生成，根目录只保留 `OpenClawPro.app`、`OpenClawPro.dmg` 和四个用户目录。根目录 `OpenClawPro.app` 已改为原生 Mach-O 小启动器，源码在 `scripts/macos-root-launcher.c`，实际挂载逻辑在 `Contents/Resources/launcher.sh`，由 `scripts/stage-macos-dmg-portable.mjs` 生成。`.license` 放 U 盘根目录。若用户双击仍失败，先看 U 盘根目录 `.OpenClawPro-launch.log`；若内部 App 崩溃，再看 DMG 内 `data/.openclaw/logs/desktop-crash.log` 和 macOS 崩溃报告。不要提交 release/DMG/runtime 二进制或 `uclaw/`。
