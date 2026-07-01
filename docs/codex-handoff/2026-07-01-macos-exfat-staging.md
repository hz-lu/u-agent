# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
适配用户当前 exFAT U 盘，让 macOS 便携测试目录可以在不依赖 macOS 原生符号链接能力的情况下拷贝到 U 盘测试。

## 已完成
- 新增 `npm run stage:macos-portable:exfat`。
- exFAT staging 默认输出到 `release/macos-portable-exfat-staging`，不覆盖普通 `release/macos-portable-staging`。
- exFAT staging 会：
  - 执行普通 macOS shell/staging 构建。
  - 将 staging 目录内所有符号链接实体化为真实文件或目录。
  - 对 `.command`、`.app/Contents/MacOS`、Node/OpenClaw/Python/Hermes bin 目录补执行权限。
  - 尝试清理 `com.apple.quarantine`。
  - 生成 `EXFAT-COMPATIBILITY.json`。
- `README-MACOS-PORTABLE.md` 增加 exFAT 说明。

## 改动文件
- `package.json`
- `scripts/stage-macos-portable-test.mjs`
- `docs/codex-handoff/2026-07-01-macos-exfat-staging.md`

## 关键决策
- 不强行把普通 macOS staging 变成 exFAT 版本，而是新增专用 exFAT staging，保留原生 macOS 包路径。
- exFAT 兼容核心是消除 symlink，并补足拷贝后可能丢失的可执行权限。
- runtime 二进制、release 目录仍不提交 Git，只提交构建脚本能力。

## 待继续
- 用户把 `release/macos-portable-exfat-staging` 整个目录拷贝到 exFAT U 盘后，在目标 Mac 上打开 `OpenClawPro.command` 或 `macos/OpenClawPro.app` 测试。
- 如果目标 Mac 的 exFAT 挂载仍导致执行权限异常，优先用终端执行：
  - `bash /Volumes/<U盘名>/<目录名>/OpenClawPro.command`
  - `xattr -dr com.apple.quarantine /Volumes/<U盘名>/<目录名>`
- 继续做 Mac 端 OpenClaw Gateway、模型配置、OpenClaw 对话、Hermes 对话、协同对话和技能同步端到端验证。

## 验证结果
- `npm run stage:macos-portable:exfat`：通过。
- `EXFAT-COMPATIBILITY.json`：`materializedSymlinks=48`，`remainingSymlinks=[]`。
- `find release/macos-portable-exfat-staging -type l`：无输出。
- exFAT staging 内版本检查通过：
  - Node v24.15.0
  - OpenClaw 2026.6.10
  - Hermes Agent v0.17.0
- exFAT staging `.app` smoke：`AGENT_HUB_ROOT=... OPENCLAW_DEV_SKIP_LICENSE=1 .../OpenClawPro` 可加载主界面。

## 如果需要下一台 Codex 接手，提示词
请继续在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支开发。用户的 U 盘是 exFAT，本阶段已新增 `npm run stage:macos-portable:exfat`，输出 `release/macos-portable-exfat-staging`，会实体化 symlink 并补执行权限。下一步请让用户拷贝该目录到 exFAT U 盘，在 Apple Silicon Mac 上测试 `OpenClawPro.command` 和 `.app`。如仍失败，优先查看 `EXFAT-COMPATIBILITY.json`、是否还有 symlink、Gatekeeper/quarantine、以及 exFAT 挂载是否允许执行。不要提交 release/runtime 大文件或 `uclaw/`。
