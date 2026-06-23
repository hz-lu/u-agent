# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
继续加固 Windows 程序壳打包脚本，让 `npm.cmd run package:windows-shell` 出错时能明确显示失败位置，避免只出现 `unsettled top-level await` 这类不易排查的信息。

## 已完成
- `scripts/package-windows-shell.mjs` 主流程改为 `main().catch(...)`。
- 失败时统一输出 `[windows-shell] failed:` 和 stack/message。
- 下载 Electron 后打印实际 zip 路径。
- Electron zip 解压后立即检查 `electron.exe` 是否存在。
- 如果缺失，会列出 `win-unpacked` 下部分实际条目，帮助判断是空目录、解压层级错误还是解压失败。

## 改动文件
- `scripts/package-windows-shell.mjs`
- `docs/codex-handoff/2026-06-23-windows-shell-error-reporting.md`

## 关键决策
- 打壳脚本是用户在 Windows 端直接运行的交付工具，失败信息必须直接可读，不依赖用户再查 Node 内部警告。
- 不改变 Electron 下载、图标 patch、OpenClaw app 复制的业务逻辑，只增强流程包裹和解压结果断言。

## 待继续
1. 用户 Windows 端 `git pull` 后重新运行：
   - `npm.cmd run package:windows-shell`
2. 成功后检查：
   - `win-unpacked\OpenClawPro.exe`
   - `win-unpacked\BUILD-MANIFEST.json`
3. 如果失败，把 `[windows-shell] failed:` 后面的完整内容发回。

## 验证结果
- `node --check scripts/package-windows-shell.mjs`：通过。
- macOS 上执行 `npm run package:windows-shell`：通过，成功生成 `win-unpacked/OpenClawPro.exe`。
- macOS 无 Wine 时 exe 图标 patch 仍按预期跳过；Windows 上执行应由 rcedit patch 图标。

## 如果需要下一台 Codex 接手，提示词
请继续在 `/Users/ly/data/codex/u-agent` 开发。当前 Windows 壳打包脚本已经先修为 Windows 下用 `tar.exe`/PowerShell 解压 Electron zip，本阶段又把脚本主流程改为 `main().catch(...)`，打印 Electron zip 路径，并在解压后断言 `electron.exe` 存在。下一步让用户 Windows 端 `git pull` 后重跑 `npm.cmd run package:windows-shell`，如果失败，收集 `[windows-shell] failed:` 后的完整 stack。
