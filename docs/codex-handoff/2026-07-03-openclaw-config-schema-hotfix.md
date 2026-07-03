# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心；所有能力需要和现有程序前端界面无缝融合，前端体验稳定、清晰、可用。

## 当前目标
修复刚同步新壳后 OpenClaw 启动失败的问题：日志显示 `Invalid config`，具体为 `models.providers.cifu.models.0: Invalid input`。

## 已完成
- 定位根因：前端专用的 `isCifuDefault` 标记被写入 OpenClaw 的 `openclaw.json` 模型配置，OpenClaw schema 不接受该字段。
- 从 OpenClaw 配置写入链路中移除 `isCifuDefault` 字段，只保留在前端模型列表中使用。
- 从 `src/main/runtime/openclaw-runtime.ts` 的默认 OpenClaw 配置中移除该字段，避免初始化新 data 时写出非法配置。
- 已清理 `F:\data\.openclaw\openclaw.json` 和 release 初始化配置里的非法 `isCifuDefault` 字段。
- 已同步最新 main 文件到 `F:\win-unpacked\resources\app\dist\main` 和 `D:\share\1\o\1\win-unpacked\resources\app\dist\main`。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `src/main/runtime/openclaw-runtime.ts`
- `dist/main/index.js`
- `dist/main/index.cjs`

## 关键决策
- `isCifuDefault` 是 UI 层用于“默认置顶仅可编辑”的标记，不能进入 OpenClaw runtime 配置。
- OpenClaw runtime 配置应只包含它的 schema 支持字段，例如 `id/name/input/contextWindow/maxTokens`。
- 已经写坏的 U 盘 data 需要一次性清理，否则即使代码修好，旧配置仍会让 Gateway 启动失败。

## 待继续
- 用户重新完全退出程序后启动 F 盘测试 OpenClaw Gateway。
- 如果仍失败，优先查看最新日志是否还包含 `models.providers.cifu.models.0`；如果没有，再按新错误继续定位。

## 验证结果
- `npm.cmd run build` 通过。
- `node --check dist/main/index.cjs` 通过。
- `node --check dist/main/index.js` 通过。
- `rg isCifuDefault src/openclaw-shell-app/dist/main/index.js dist/main/index.js dist/main/index.cjs F:\win-unpacked\resources\app\dist\main\index.cjs D:\share\1\o\1\win-unpacked\resources\app\dist\main\index.cjs src/main/runtime/openclaw-runtime.ts` 无结果。
- `F:\data\.openclaw\openclaw.json` 已不含 `isCifuDefault`。
- `dist/main/index.cjs`、F 盘运行壳、release 运行壳哈希一致。

## 如果需要下一台 Codex 接手，提示词
继续在 `D:\github\u-agent` 开发 OpenClawPro U 盘便携版。最近一次热修是移除写入 OpenClaw 配置的 `isCifuDefault` 字段，因为它会导致 OpenClaw Gateway 报 `models.providers.cifu.models.0: Invalid input`。请先检查 `F:\data\.openclaw\openclaw.json` 和 release data 是否不含 `isCifuDefault`，再测试 Gateway 启动。如果用户仍报启动失败，读取首页 OpenClaw 日志和 `data/.openclaw/logs/stability/*startup_failed.json` 继续定位。
