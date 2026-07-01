# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
适配用户希望“U 盘根目录直接启动”的 macOS exFAT 使用方式：U 盘插到 Mac 后，根目录直接显示 `OpenClawPro.app` 和 `OpenClawPro.command`，无需进入子目录。

## 已完成
- 新增 `npm run stage:macos-usb-root:exfat`。
- 新增 `MACOS_USB_ROOT_LAYOUT=1` staging 模式，默认输出到 `release/macos-usb-root-exfat`。
- USB 根目录布局将 `OpenClawPro.app` 直接放在输出目录第一层，同时保留 `runtime/`、`data/`、`skills/`、`extensions/` 同级目录。
- `OpenClawPro.command` 已改为从同级 `OpenClawPro.app` 启动，并设置 `AGENT_HUB_ROOT` 为当前目录。
- exFAT 兼容流程继续实体化 symlink、补执行权限、清理 quarantine，并生成 `EXFAT-COMPATIBILITY.json`。
- portable audit 和 runtime manifest 已识别根目录 `OpenClawPro.app`。

## 改动文件
- `package.json`
- `scripts/stage-macos-portable-test.mjs`
- `scripts/audit-portable-release.mjs`
- `runtime/PORTABLE-RUNTIME-MANIFEST.json`
- `docs/codex-handoff/2026-07-01-macos-usb-root-layout.md`

## 关键决策
- 不破坏已有 `stage:macos-portable` 和 `stage:macos-portable:exfat`，新增专用 USB root layout。
- U 盘根目录就是 portable root，因此 `OpenClawPro.app`、`OpenClawPro.command`、`runtime/`、`data/`、`skills/`、`extensions/` 必须同级。
- 对用户来说，拷贝方式应是把 `release/macos-usb-root-exfat` 目录内的所有内容复制到 U 盘根目录，而不是把该目录本身作为子目录复制过去。

## 待继续
- 用户将 `release/macos-usb-root-exfat` 内全部内容复制到 exFAT U 盘根目录，在 Apple Silicon Mac 上双击根目录 `OpenClawPro.command` 或 `OpenClawPro.app` 测试。
- 若 Gatekeeper 阻止，右键打开一次，或执行 `xattr -dr com.apple.quarantine /Volumes/<U盘名>`。
- 若 `.command` 双击没有反应，执行 `bash /Volumes/<U盘名>/OpenClawPro.command`。
- 继续做实际 U 盘端到端测试：UI、授权、模型配置、OpenClaw Gateway、OpenClaw 对话、Hermes 对话、协同对话、技能同步。

## 验证结果
- `node --check scripts/stage-macos-portable-test.mjs`：通过。
- `node --check scripts/audit-portable-release.mjs`：通过。
- `npm run build:main`：通过。
- `npm run stage:macos-usb-root:exfat`：通过。
- `release/macos-usb-root-exfat` 根目录包含 `OpenClawPro.app`、`OpenClawPro.command`、`runtime/`、`data/`、`skills/`、`extensions/`。
- `find release/macos-usb-root-exfat -type l`：无输出。
- `EXFAT-COMPATIBILITY.json`：`materializedSymlinks=48`，`remainingSymlinks=[]`。
- `AGENT_HUB_ROOT=release/macos-usb-root-exfat npm run audit:portable`：`macLauncher=true`，`strictZeroTraceReady=true`；Windows/Linux/macOS x64/Universal 缺项仍属后续阶段。

## 如果需要下一台 Codex 接手，提示词
请继续在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支开发。用户要求 Mac exFAT U 盘根目录直接启动，本阶段已新增 `npm run stage:macos-usb-root:exfat`，输出 `release/macos-usb-root-exfat`。测试时不要把整个目录作为子目录拷贝到 U 盘，而是把该目录内所有内容复制到 U 盘根目录，使 `OpenClawPro.app`、`OpenClawPro.command`、`runtime/`、`data/`、`skills/`、`extensions/` 同级。不要提交 release/runtime 大文件或 `uclaw/`。
