# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、持久记忆与自动技能、多平台接入、自然语言定时自动化、子代理委派、沙箱隔离、可视化配置中心，并和现有前端界面无缝融合，前端操作体验要自然清晰。

## 当前目标
整体检查项目进展，判断是否已经满足“任意 U 盘拷贝即插即用、零安装、零痕迹、三平台原生”的交付要求；对当前能立即修复的便携性问题进行修正。

## 已完成
- 新增 `scripts/portable-root.mjs`，仓库脚本不再默认硬编码 `E:\`，会优先从 `AGENT_HUB_ROOT` 或当前目录向上识别 U 盘根目录。
- 新增 `scripts/audit-portable-release.mjs`，输出 Windows 可用性、零安装、零痕迹、三平台 runtime、Universal zip 缺口等审计报告。
- 更新 `scan/verify/deploy/fetch/migrate/restore` 脚本使用统一便携根目录解析。
- 修复 OpenClaw 配置的 skills 路径策略：`data/.openclaw/openclaw.json` 中 `skills.load.extraDirs` 改为相对 `skills`。
- 桌面恢复脚本中加入启动前配置自修复：旧盘符绝对路径如 `E:\skills` 会被归一为相对 `skills`。
- 将 `runtime/openclaw.zip` 内的 `openclaw.cmd` 解到 `E:\runtime\openclaw.cmd`，OpenClaw CLI 已可从 U 盘 runtime 直接启动。
- 将 `E:\runtime\HermesPortable\data` 和 `_home` 迁到 `E:\backups\runtime-hermes-legacy-data-202606191709`，避免运行时目录残留可变数据。

## 改动文件
- `package.json`
- `scripts/audit-portable-release.mjs`
- `scripts/portable-root.mjs`
- `scripts/deploy-to-usb.mjs`
- `scripts/fetch-hermes.mjs`
- `scripts/migrate-hermes-data.mjs`
- `scripts/restore-openclaw-shell.mjs`
- `scripts/scan-usb.mjs`
- `scripts/verify-hermes-runtime.mjs`
- `scripts/verify-openclaw-runtime.mjs`
- `src/main/runtime/openclaw-runtime.ts`
- `docs/codex-handoff/2026-06-19-portable-audit.md`

## 关键决策
- “任意 U 盘”不能依赖固定 `E:\`，工程脚本和运行配置必须从当前启动位置或 `AGENT_HUB_ROOT` 推断根目录。
- OpenClaw skills 使用相对 `skills`，由 Gateway 的 U 盘根目录 cwd 解析；Hermes 继续镜像到 `data/.hermes/skills/openclaw`。
- Windows 便携版先补齐到严格零痕迹与零安装基本可用；三平台原生与 Universal zip 需要后续独立阶段补 runtime 和 launcher。

## 待继续
- 补齐 macOS arm64/x64、Linux x64/arm64 的 Electron 启动器、Node runtime、Hermes venv 和 OpenClaw runtime。
- 生成单个 Universal zip，包含三平台目录结构、自动识别启动器和 manifest。
- 把开发依赖安装/缓存进工程或提供可复现构建环境；当前 `npm run typecheck` 因本机 PATH 找不到 `tsc` 未能运行。
- 进一步验证微信桌面端真实收发消息、Hermes skill 实际调用、协同模式长期会话。

## 验证结果
- `node scripts/audit-portable-release.mjs`：`windowsPortableUsable=true`、`zeroInstallWindowsMostlyReady=true`、`strictZeroTraceReady=true`、`threePlatformNativeReady=false`、`universalZipReady=false`。
- `node scripts/verify-openclaw-runtime.mjs`：`openclawCmd=true`、`openclawZip=true`、`nodeExe=true`、模型配置和 API Key 存在。
- `node scripts/verify-hermes-runtime.mjs`：Hermes Agent v0.15.1、Python 3.12.13、Node v24.15.0 均可用，环境指向 `E:\data\.hermes`。
- `E:\runtime\openclaw.cmd --version` 输出 `OpenClaw 2026.6.5`。

## 如果需要下一台 Codex 接手，提示词
继续在 `E:\source\openclawpro-agent-hub` 开发 U 盘便携版 OpenClaw + Hermes 集成。当前 Windows U 盘版已经通过新增 audit 脚本确认基本零安装、严格零痕迹可用，但三平台原生和 Universal zip 未完成。下一步优先设计 `runtime/{windows-x64,macos-arm64,macos-x64,linux-x64,linux-arm64}` 和三平台 launcher/manifest，然后实现打包脚本。每个阶段结束按用户要求执行 `git status`、`git diff`、`git add`、`git commit`、`git push`，并新增 `docs/codex-handoff/YYYY-MM-DD-xxx.md`，handoff 中 `## 当前目标` 前必须有 `## 总体目标`。
