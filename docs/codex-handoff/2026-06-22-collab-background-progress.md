# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
提升协同对话稳定性和可用性：协同模式不应长时间空白等待，也不应因为 OpenClaw + Hermes 串行执行而锁死其它会话模式。

## 已完成
- 将聊天 busy 状态从单一全局状态改为按 `openclaw` / `hermes` / `collab` 三种模式分别记录。
- 协同模式发送后进入后台执行，不再阻塞 OpenClaw 或 Hermes 普通会话。
- 新增协同任务阶段状态：OpenClaw 生成草案、Hermes 复核草案、取消中、已完成、已取消。
- 新增协同任务取消按钮；取消会在当前请求返回后停止后续阶段，避免继续启动下一阶段。
- OpenClaw 草案失败时不再把失败文本继续交给 Hermes 复核，而是作为协同任务错误写入会话。
- Hermes 复核失败会以明确的“复核失败”消息写入会话。
- 协同阶段状态会在结束后短暂显示，然后自动收起。
- 已执行生产构建，并同步更新 `dist/` 编译产物。

## 改动文件
- `src/renderer/App.vue`
- `src/renderer/styles.css`
- `dist/assets/index.html`
- `dist/assets/assets/index-B5jjORhJ.js`
- `dist/assets/assets/index-C4lnRJxe.css`
- `docs/codex-handoff/2026-06-22-collab-background-progress.md`

## 关键决策
- 本阶段先在源码 UI 层实现后台协同和阶段反馈，保持改动集中，不引入新的主进程任务队列协议。
- 当前取消语义是“当前 IPC 请求返回后停止后续阶段”；不伪装成能强杀正在执行的模型请求。
- 分模式 busy 可以保证协同运行中仍可切到 OpenClaw 或 Hermes 单独对话。

## 待继续
- 若需要真正强制取消正在运行的 Hermes/OpenClaw 请求，需要在主进程 runtime 层引入可取消任务句柄。
- 为 release runtime artifact 设计获取、缓存、校验和打包流程。
- runtime artifact 准备好后，将 portable audit 纳入 release CI。
- Windows U 盘环境做完整启动与协同长任务 smoke test。

## 验证结果
- `npm run typecheck` 通过。
- `node --check scripts/build-windows-release.mjs` 通过。
- `node --check scripts/verify-openclaw-runtime.mjs` 通过。
- `npm run build` 通过。

## 如果需要下一台 Codex 接手，提示词
继续在 `/Users/ly/data/codex/u-agent` 开发。用户要求以 `src/` 全源码应用为准，不要继续依赖补丁脚本叠加。本阶段已把协同模式改为后台执行，增加阶段状态、取消按钮和按会话模式独立 busy；取消语义是当前请求返回后停止后续阶段。下一步建议设计主进程可取消任务队列，或继续做 release runtime artifact 获取与校验流程。每完成阶段性工作后按用户要求 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`。
