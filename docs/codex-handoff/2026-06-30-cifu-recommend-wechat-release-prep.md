# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并与现有前端界面无缝融合，提供良好的用户体验。

## 当前目标
暂停 release 目录整理，先按用户要求在模型配置页推荐模型列表最前面新增“词符科技”卡片；同时保留已完成的微信插件 release 识别预修复，避免后续继续整理 release 时再次遗漏。

## 已完成
- 模型配置页“推荐模型”列表首位新增“词符科技”卡片。
- 词符科技推荐卡片默认 API URL 为 `https://token.51cifu.com/v1`。
- 词符科技推荐卡片选择后 API 类型默认沿用 OpenAI 兼容模式。
- 微信插件检测逻辑增加自愈：如果 `data/.openclaw/extensions/openclaw-weixin` 不存在，但 U 盘根目录 `extensions/openclaw-weixin` 存在，会自动镜像到 data 并补齐配置。
- Windows release/staging 初始化配置预置 `openclaw-weixin` 的 `plugins.allow`、`plugins.entries` 和 `channels`。
- 已执行 `npm.cmd run build`，并同步最新 `dist` 到 `F:\win-unpacked\resources\app\dist` 供测试。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/build-windows-release.mjs`
- `scripts/stage-windows-portable-test.mjs`
- `docs/codex-handoff/2026-06-30-cifu-recommend-wechat-release-prep.md`

## 关键决策
- 本轮不继续执行 release 目录复制整理，遵守用户“等会再执行”的要求。
- 词符科技推荐卡片使用 Unicode 转义写入，避免 PowerShell 管道导致中文被写成 `????`。
- 微信插件问题从源码层修复，不只依赖 release 目录复制：程序启动时能把根目录内置插件镜像到 data 检测路径。

## 待继续
- 用户确认模型配置页词符科技卡片显示无误后，再继续整理 `D:\share\1\o\1` release 包。
- 继续 release 时需要重新构建最新代码，并确保 `D:\share\1\o\1` 同时包含根目录 `extensions/openclaw-weixin` 和初始化 `data/.openclaw/extensions/openclaw-weixin`。
- release 目录整理完成后，再跑 OpenClaw/Hermes/runtime/微信插件识别验证。

## 验证结果
- `node --check src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js` 通过。
- `node --check src/openclaw-shell-app/dist/main/index.js` 通过。
- `node --check scripts/stage-windows-portable-test.mjs` 通过。
- `node --check scripts/build-windows-release.mjs` 通过。
- `npm.cmd run build` 通过。
- 已确认 `F:\win-unpacked\resources\app\dist\assets\assets\main-DIeui7ZO.js` 包含 `provider: "cifu"` 与 `https://token.51cifu.com/v1`。

## 如果需要下一台 Codex 接手，提示词
请在 `D:\github\u-agent` 继续。当前用户暂停 release 整理，先要求模型配置页推荐模型列表最前面新增“词符科技”卡片。本轮已改源码并构建，同步到 `F:\win-unpacked\resources\app\dist`。另外，release 微信插件识别问题已做源码预修复：主进程 `WechatManager.isPluginInstalled()` 会把根目录 `extensions/openclaw-weixin` 自动镜像到 `data/.openclaw/extensions/openclaw-weixin`，release/staging 初始化配置也默认启用 `openclaw-weixin`。下一步等用户确认后，再继续整理 `D:\share\1\o\1` release 包，确保不带用户配置/历史数据，但带完整 runtime 和微信插件可识别镜像。
