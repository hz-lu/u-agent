# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
按用户最新要求，将后续开发主线统一到 `src/` 全源码应用，不再依赖 `scripts/restore-openclaw-shell.mjs` 作为层层叠加的补丁路径。本阶段先把 OpenClaw runtime 完整性检查、启动时误解压保护、release 前置校验落到源码和脚本中。

## 已完成
- 在 `src/main/runtime/openclaw-runtime.ts` 增加 OpenClaw runtime 完整性检查。
- OpenClaw 启动前会检查 `runtime/openclaw(.cmd)`、`runtime/node(.exe)`、`runtime/node_modules/openclaw/dist`、`dist/entry.(m)js`。
- 增加 dist 内部 JS/CSS/HTML 相对资源引用检查，可发现类似缺少 `env-*.js` 的不完整 runtime。
- 移除 OpenClaw 启动路径中的 `tar.exe` 现场解压逻辑。若只有 `openclaw.zip` 但没有展开后的 runtime，启动会给出明确错误，不在 UI 主流程解大包。
- `scripts/verify-openclaw-runtime.mjs` 输出同一套 runtimeIntegrity JSON，便于 Mac 源码开发和 Windows U 盘实机排查。
- `scripts/build-windows-release.mjs` 打包前要求 expanded OpenClaw runtime 存在，并校验 `dist/entry.(m)js` 和 dist 资源引用完整性，避免生成会启动失败的 release zip。

## 改动文件
- `src/main/runtime/openclaw-runtime.ts`
- `scripts/verify-openclaw-runtime.mjs`
- `scripts/build-windows-release.mjs`
- `docs/codex-handoff/2026-06-22-source-runtime-integrity.md`

## 关键决策
- 后续以 `src/` 全源码应用为准；`restore-openclaw-shell.mjs` 只保留为历史/迁移参考，不再作为新功能主落点。
- release 包必须预置完整展开后的 OpenClaw runtime，不能依赖启动时现场解压 `runtime/openclaw.zip`。
- runtime 完整性失败时要阻止启动并给用户明确修复方向，不能用遮罩、卡住、禁用切换页面等方式掩盖问题。
- 资源完整性检查采用通用 dist 引用扫描，避免只针对某一个历史缺失文件名做临时补丁。

## 待继续
- 第一阶段继续统一 OpenClaw 主流程：把原 OpenClaw 的关键 UI/状态体验逐步迁回 `src/`，避免 `src/renderer/App.vue` 与历史 OpenClaw 壳体验割裂。
- 增加 OpenClaw Gateway 真实状态查询和前端状态同步，确保启动后切换页面、重新扫码、进入 AI 会话不会误报未启动。
- 增加 OpenClaw 模型配置读取/展示/选择闭环，优先从 `data/.openclaw/openclaw.json` 恢复，避免空缓存覆盖真实配置。
- 在 Windows U 盘环境运行 `npm run verify:openclaw` 和 release 打包脚本，确认实际 runtime 目录通过完整性检查。

## 验证结果
- `npm run typecheck` 通过。
- `node --check scripts/build-windows-release.mjs` 通过。
- `node --check scripts/verify-openclaw-runtime.mjs` 通过。
- 在 Mac 源码目录执行 `AGENT_HUB_ROOT=/Users/ly/data/codex/u-agent node scripts/verify-openclaw-runtime.mjs`，脚本按预期输出 JSON，并明确报告当前 Mac 源码目录缺少展开后的 OpenClaw runtime；验证脚本同时接受 Windows `.cmd/.exe` 和 macOS/Linux 无后缀 runtime 候选，方便 Mac 开发时检查 Windows U 盘目录。

## 如果需要下一台 Codex 接手，提示词
继续在 `/Users/ly/data/codex/u-agent` 开发。用户已明确要求后续以 `src/` 全源码应用为准，UI 要统一，不能继续依赖 `scripts/restore-openclaw-shell.mjs` 叠补丁。本阶段已把 OpenClaw runtime 完整性检查落到 `src/main/runtime/openclaw-runtime.ts`，启动路径不再调用 `tar.exe` 现场解压；`verify-openclaw-runtime.mjs` 和 `build-windows-release.mjs` 也会检查 expanded runtime、`dist/entry.(m)js` 和 dist 内资源引用。下一步继续第一阶段 OpenClaw 稳定性：把 Gateway 真实状态查询、模型配置恢复、AI 会话模型选择从历史补丁迁入 `src/`，每一步小范围修改并验证，阶段完成后按用户要求 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`。
