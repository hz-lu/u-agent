# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并与现有程序前端界面无缝融合，保证 OpenClaw 原功能和 UI 体验稳定。

## 当前目标
修复 `D:\share\1\o\1` release 包拷贝到新 U 盘/新电脑后 OpenClaw 启动失败的问题，并降低因 Gateway 反复崩溃造成的桌面壳未响应风险。

## 已完成
- 定位新电脑日志中的直接根因：`data/.openclaw/openclaw.json` 使用了 `meta.release` / `meta.initializedAt`，被 OpenClaw 2026.6.5 schema 拒绝，报 `meta: Invalid input`。
- 直接修复当前 release：`D:\share\1\o\1\data\.openclaw\openclaw.json` 改为 `meta.lastTouchedVersion` / `meta.lastTouchedAt`。
- 将 `skills.load.extraDirs` 从机器绝对路径改为便携相对路径 `skills`。
- 修复 release 配置文件 UTF-8 BOM 和词符科技模型名 mojibake，确认默认模型为 `cifu/词符科技`。
- 从源码复制 `runtime/PORTABLE-RUNTIME-MANIFEST.json` 到当前 release runtime。
- 删除当前 release 中 `runtime/HermesPortable/data` 的可再生缓存，恢复严格零痕迹审计通过。
- 修改源码 release/staging 生成脚本，避免后续重新打包再次生成不兼容 OpenClaw schema 的配置。
- 修改 `OpenClawRuntime.createDefaultOpenClawConfig()`，让应用 fallback 生成的默认配置也包含兼容 meta 和词符科技默认模型。
- 增强 `scripts/audit-portable-release.mjs`，检测 OpenClaw 配置 BOM、meta schema、绝对 `extraDirs`。
- 已构建新 `dist` 并部署到 `D:\share\1\o\1\win-unpacked\resources\app\dist`，部署前备份为 `dist.backup-20260630-120127-config-schema`。

## 改动文件
- `scripts/audit-portable-release.mjs`
- `scripts/build-windows-release.mjs`
- `scripts/stage-windows-portable-test.mjs`
- `src/main/runtime/openclaw-runtime.ts`
- `docs/codex-handoff/2026-06-30-release-config-schema-fix.md`

## 关键决策
- OpenClaw 配置 `meta` 必须使用官方兼容字段：`lastTouchedVersion`、`lastTouchedAt`，不能使用自定义 `release`、`initializedAt`。
- 初始化 release 可以保留产品默认的词符科技模型占位项，API Key 为 `123456`，这不是用户历史数据。
- 技能目录在模板中保持为相对路径 `skills`，由运行时在 U 盘根目录解析，避免拷贝到新盘符后失效。
- 打包/审计脚本必须承担配置 schema 防线，不能只靠手工检查。

## 待继续
- 用户需要用修复后的 `D:\share\1\o\1` 重新拷贝到新 U 盘/新电脑测试 OpenClaw 启动。
- 如果仍有未响应，需要读取新测试机 `data/.openclaw/logs` 和 Electron crash/log 文件，区分是 Gateway 崩溃循环还是独立 UI 性能问题。
- 当前 Windows release 审计已通过 Windows 便携、零安装、严格零痕迹；三平台原生和 Universal zip 仍未完成。
- Hermes skill mirror 统计仍为 0，后续需要确认 Hermes 是否通过配置直接读取根目录 `skills`，或是否需要物理镜像到 `data/.hermes/skills/openclaw`。

## 验证结果
- `npm.cmd run build`：通过。
- `D:\share\1\o\1\runtime\openclaw.cmd config validate --json`：返回 `{"valid":true}`。
- `AGENT_HUB_ROOT=D:\share\1\o\1 node scripts/audit-portable-release.mjs`：`windowsPortableUsable:true`、`zeroInstallWindowsMostlyReady:true`、`strictZeroTraceReady:true`、`windows-x64.missingRequired:[]`。
- `AGENT_HUB_ROOT=D:\share\1\o\1 node scripts/verify-openclaw-runtime.mjs`：`runtimeIntegrity.ok:true`、CLI smoke 通过、默认模型为 `cifu/词符科技`。
- 当前审计仍显示 macOS/Linux runtime 和 Universal zip 未完成，这是目标缺口，不影响本次 Windows OpenClaw 配置修复。

## 如果需要下一台 Codex 接手，提示词
请在 `D:\github\u-agent` 继续开发 OpenClawPro Agent Hub。当前用户的 release 目录是 `D:\share\1\o\1`。先阅读 `docs/codex-handoff/2026-06-30-release-config-schema-fix.md`。本阶段已修复新电脑 OpenClaw 启动失败的直接根因：release 的 `data/.openclaw/openclaw.json` 使用了 OpenClaw 2026.6.5 不接受的 `meta.release/initializedAt`，已改为 `lastTouchedVersion/lastTouchedAt`，并将技能路径改为相对 `skills`。如果用户继续反馈未响应，优先要求/读取新测试机 release 下 `data/.openclaw/logs`、Electron crash/log 和 OpenClaw Gateway 日志，确认是否仍有 Gateway crash loop；不要大范围改 UI 会话逻辑。每次阶段性工作后执行 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`，并新增 handoff，且在 `## 当前目标` 前保留 `## 总体目标`。
