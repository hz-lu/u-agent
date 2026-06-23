# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 Windows 上执行 `npm.cmd run package:windows-shell` 后没有生成 `win-unpacked\OpenClawPro.exe` 的问题。

## 已完成
- 定位截图中的关键错误：
  - `Detected unsettled top-level await at scripts/package-windows-shell.mjs:137`
  - 原脚本卡在 `await extractZip(zipPath, { dir: winUnpackedRoot })`，后续 `renameElectronExe()` 没执行，所以不会生成 `OpenClawPro.exe`。
- 修改 `scripts/package-windows-shell.mjs`：
  - 非 Windows 仍使用 `extract-zip`。
  - Windows 下优先使用系统 `tar.exe -xf electron.zip -C win-unpacked` 解压 Electron。
  - 如果 `tar.exe` 失败，再用 `powershell.exe -ExecutionPolicy Bypass Expand-Archive` 兜底。
  - 两种方式都失败时明确报 `Failed to extract Electron zip`。

## 改动文件
- `scripts/package-windows-shell.mjs`
- `docs/codex-handoff/2026-06-23-windows-shell-extract-fallback.md`

## 关键决策
- Windows 程序壳生成不应依赖 `extract-zip` 的异步行为；系统 `tar.exe` 在 Windows 10/11 上通常自带，适合解压 Electron 官方 zip。
- PowerShell 兜底命令显式带 `-ExecutionPolicy Bypass`，避免脚本策略再次干扰。

## 待继续
1. 用户 Windows 端 `git pull` 后重新执行：
   - `npm.cmd run package:windows-shell`
2. 成功后应看到：
   - `win-unpacked\OpenClawPro.exe`
   - `win-unpacked\BUILD-MANIFEST.json`
3. 如仍失败，收集完整终端输出，并检查 `win-unpacked` 里是否存在 `electron.exe` 或部分解压文件。

## 验证结果
- `node --check scripts/package-windows-shell.mjs`：通过。
- macOS 上执行 `npm run package:windows-shell`：通过，成功生成 `win-unpacked/OpenClawPro.exe`。
- macOS 无 Wine 时 exe 图标资源 patch 仍按预期跳过，Windows 上执行应通过 rcedit 写入图标。

## 如果需要下一台 Codex 接手，提示词
请继续在 `/Users/ly/data/codex/u-agent` 开发。用户 Windows 上执行 `npm.cmd run package:windows-shell` 后没有 `win-unpacked\OpenClawPro.exe`，截图显示 `Detected unsettled top-level await` 卡在 Electron zip 解压。已修改 `scripts/package-windows-shell.mjs`：Windows 下优先用 `tar.exe` 解压 Electron zip，失败再用 `powershell.exe -ExecutionPolicy Bypass Expand-Archive`。下一步让用户 `git pull` 后重新跑 `npm.cmd run package:windows-shell`，若仍失败，检查 `win-unpacked` 是否有 `electron.exe` 或部分文件。
