# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 macOS U 盘启动后授权检查失败的问题。用户已确认 `.license` 正确且位于 U 盘根目录，但 UI 显示无法获取 U 盘序列号、权限文件无效或 U 盘序列号不匹配。

## 已完成
- 读取 `/Volumes/OPENCLAW/.OpenClawPro-launch.log`，确认旧逻辑在 `check-step-license` 收到的序列号为 `null`。
- 检查 `/Volumes/OPENCLAW/.license`，确认授权序列号为 `FC22026D24A4A`。
- 检查 `diskutil info /Volumes/OPENCLAW`，确认 exFAT 卷没有 `Volume Serial Number` 字段。
- 检查 `ioreg`，确认 USB Mass Storage 设备层存在 `kUSBSerialNumberString = FC22026D24A4A`。
- 修改 macOS 序列号获取逻辑：先通过 `df/diskutil` 找到当前 app 所在整盘设备，再从 `ioreg -r -c IOUSBMassStorageInterfaceNub -l -w0` 中匹配对应 `BSD Name` 的 USB 硬件序列号。
- 保留旧的 `Volume Serial Number` 读取逻辑，并增加 `Volume UUID` 作为最后 fallback。
- 已重新生成 `release/macos-usb-root-exfat`，并只将新的 `OpenClawPro.app` 增量同步到 `/Volumes/OPENCLAW`。
- 启动 U 盘根目录 `OpenClawPro.app` 后，日志显示 `[check-step-license] 收到序列号: FC22026D24A4A`，不再是 `null`。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `docs/codex-handoff/2026-07-02-macos-usb-serial-license-fix.md`

## 关键决策
- 不绕过授权、不改公钥、不改 `.license` 格式，只修复 macOS 获取 U 盘硬件序列号的缺失路径。
- macOS 上 exFAT 卷的 `Volume UUID` 不是用户授权时使用的硬件序列号，因此优先使用 IORegistry 的 USB 设备序列号。
- 增量同步 U 盘时只替换 `OpenClawPro.app`，不覆盖 `data/` 和 `.license`。

## 待继续
- 用户在 UI 上确认是否已经从授权检查页进入主界面。
- 如果进入主界面，继续测试 OpenClaw Gateway、Hermes 启动、微信插件、共享模型配置和共享 skills。
- 仍需后续处理启动日志中的 OpenClaw workspace templates missing 提示，当前它不是本次授权失败根因。

## 验证结果
- `node --check src/openclaw-shell-app/dist/main/index.js`
- 独立 Node 验证脚本对 `/Volumes/OPENCLAW` 返回 `FC22026D24A4A`
- `npm run build`
- `npm run stage:macos-usb-root:final`
- `/opt/homebrew/bin/rsync -rlt --delete --size-only --info=progress2 ... OpenClawPro.app/ ...`
- `open /Volumes/OPENCLAW/OpenClawPro.app`
- `/Volumes/OPENCLAW/.OpenClawPro-launch.log` 显示 `[check-step-license] 收到序列号: FC22026D24A4A`

## 如果需要下一台 Codex 接手，提示词
请从 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支继续。macOS U 盘授权失败的直接原因不是 `.license` 文件错误，而是旧 macOS 取号逻辑只找 `Volume Serial Number`/`Device UUID`，在 exFAT U 盘上拿到 `null`。当前已改为从 `ioreg` 的 USB Mass Storage 树读取硬件序列号，并已在 `/Volumes/OPENCLAW` 上验证 `FC22026D24A4A`。下一步请让用户确认 UI 是否进入主界面，然后继续端到端测试 OpenClaw、Hermes、微信插件、共享模型与技能。
