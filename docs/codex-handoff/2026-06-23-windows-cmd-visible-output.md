# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 Windows 用户双击 `scripts/windows-stage-slim.cmd` 后窗口一闪而过、看不到执行结果的问题。

## 已完成
- `scripts/windows-stage-slim.cmd` 增加：
  - 项目路径和日志路径显示。
  - `npm.cmd` 是否存在的检查。
  - 完整输出写入 `release\windows-stage-slim.log`。
  - 执行结束后显示日志内容。
  - 成功/失败提示。
  - `pause` 保留窗口，避免双击后一闪而过。
- `scripts/windows-diagnose-hermes.cmd` 做同样处理：
  - 输出写入 `release\windows-diagnose-hermes.log`。
  - 结束后保留窗口。

## 改动文件
- `scripts/windows-stage-slim.cmd`
- `scripts/windows-diagnose-hermes.cmd`
- `docs/codex-handoff/2026-06-23-windows-cmd-visible-output.md`

## 关键决策
- Windows `.cmd` 面向用户双击使用，默认保留窗口比自动关闭更适合当前排障阶段。
- 仍然使用 `npm.cmd`，避免 PowerShell `npm.ps1` 执行策略问题。

## 待继续
1. 用户在 Windows 重新 `git pull` 后双击 `scripts\windows-stage-slim.cmd`。
2. 如果失败，直接把窗口内容或 `release\windows-stage-slim.log` 发回来。
3. 若 staging 成功，再复制 `release\windows-shell-e2e-slim-staging\` 内容到 U 盘测试。

## 验证结果
- 当前为 Windows 批处理脚本显示/日志增强，Mac 上不执行 `.cmd`。
- 已通过源码 diff 检查确认只改批处理入口和 handoff。

## 如果需要下一台 Codex 接手，提示词
请继续在 `/Users/ly/data/codex/u-agent` 开发。用户反馈 Windows 双击 `scripts/windows-stage-slim.cmd` 后窗口一闪而过。本阶段已把 `windows-stage-slim.cmd` 和 `windows-diagnose-hermes.cmd` 改为显示项目路径、检查 `npm.cmd`、写入 `release\*.log`、显示日志并 pause。下一步让用户 Windows 端 `git pull` 后重新运行；若失败，读取 `release\windows-stage-slim.log`。
