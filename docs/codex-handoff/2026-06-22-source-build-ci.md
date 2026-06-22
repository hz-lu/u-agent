# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
把“新机器克隆后源码能否构建”变成自动校验，降低后续 Windows 开箱即用和源码交付风险。

## 已完成
- 新增 GitHub Actions workflow `.github/workflows/source-build.yml`。
- 在 Ubuntu、macOS、Windows 三个平台执行 `npm ci --no-audit --no-fund`。
- CI 覆盖 `npm run typecheck`、关键 release 脚本 `node --check`、`npm run build`。
- 保持 CI 聚焦源码构建，不把当前仍缺 runtime artifact 的 portable audit 放进必过流程。

## 改动文件
- `.github/workflows/source-build.yml`
- `docs/codex-handoff/2026-06-22-source-build-ci.md`

## 关键决策
- CI 使用 Node 22，贴近当前 `@types/node` 版本和现代 Electron/Vite 工具链。
- 不在 CI 中运行 `npm run audit:portable`，因为当前仓库没有完整 Windows portable runtime；该检查应在 release artifact 准备好后再加入。
- 使用三平台矩阵，先验证源码层构建跨平台稳定性。

## 待继续
- 为 release runtime artifact 设计获取、缓存、校验和打包流程。
- runtime artifact 准备好后，将 portable audit 纳入 release CI，而不是普通源码 build CI。
- 协同模式继续增强为后台任务，加入进度、取消和错误分段展示。
- Windows U 盘环境做完整启动与长会话 smoke test。

## 验证结果
- 本地工作树新增 workflow，尚需推送后由 GitHub Actions 实际执行。
- 本地前一阶段已通过 `npm run typecheck`、`node --check scripts/build-windows-release.mjs`、`node --check scripts/verify-openclaw-runtime.mjs`、`npm run build`。

## 如果需要下一台 Codex 接手，提示词
继续在 `/Users/ly/data/codex/u-agent` 开发。用户要求以 `src/` 全源码应用为准，不要继续依赖补丁脚本叠加。本阶段新增三平台源码构建 CI，覆盖 `npm ci`、typecheck、关键脚本语法检查和生产构建，但没有把缺 runtime artifact 的 portable audit 放进必过流程。下一步建议设计 release runtime artifact 获取与校验流程，或把协同模式改造成后台任务。每完成阶段性工作后按用户要求 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`。
