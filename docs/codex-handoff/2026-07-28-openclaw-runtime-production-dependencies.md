# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

修复 macOS U 盘版 OpenClaw 冷启动时因生产依赖残缺而崩溃的问题，并补强源码、构建阶段和程序启动前的 runtime 完整性检查。

## 已完成

- 确认本轮只替换了 `OpenClawPro.app`，U 盘 runtime 修改时间更早，新壳仍正确使用 U 盘根目录 `runtime/`。
- 复现现有校验器发现 `highlight.js` 缺失却仍返回成功的问题。
- 将 OpenClaw `package.json` 中声明的生产依赖缺失升级为硬错误。
- 在主进程启动 Gateway 前检查生产依赖，并向用户显示具体缺包名称。
- macOS staging 生成 release 时自动运行 OpenClaw runtime 校验。
- 增加生产依赖缺失回归测试。
- 仅向当前 U 盘增量补齐残缺的 `highlight.js` 和 `openai` 包，没有整体覆盖 runtime。
- 重新生成本机 release 的 macOS app 并完成 ad-hoc 深度签名。

## 改动文件

- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/verify-openclaw-runtime.mjs`
- `scripts/verify-openclaw-production-dependencies.test.mjs`
- `scripts/stage-macos-portable-test.mjs`
- `package.json`
- `docs/codex-handoff/2026-07-28-openclaw-runtime-production-dependencies.md`

## 关键决策

- `src/openclaw-shell-app/dist/` 继续作为程序壳源码基准，不修改打包产物来替代源码修复。
- 生产依赖缺失属于不可启动错误；未声明且按需加载的静态 import 继续作为 warning，避免误伤可选功能。
- 不在启动阶段遍历或哈希整个 runtime，避免 exFAT 慢盘再次卡住 UI；启动前只检查 OpenClaw 声明的生产依赖包。
- 当前 U 盘问题采用最小增量补包，不要求重新复制整个 runtime。

## 待继续

- 用户关闭当前正在运行的 U 盘 app 后，将 `release/macos-usb-root-exfat/OpenClawPro.app` 覆盖到 U 盘根目录进行 UI 启动验证。
- 后续设计离线 runtime 文件清单或构建期深层引用检查，覆盖“包目录存在但包内文件残缺”的情况，同时避免在 U 盘启动时全盘扫描。
- `qwen` 未安装目前只产生 OpenClaw 配置 warning，不影响 Gateway ready；是否预装官方 qwen provider 需单独评估。

## 验证结果

- RED：缺少 `highlight.js` 的 fixture 在旧校验器中错误返回 exit 0。
- GREEN：`npm run verify:openclaw:production-dependencies` 通过。
- `AGENT_HUB_ROOT=release/macos-usb-root-exfat npm run verify:openclaw` 通过，生产依赖缺失列表为空。
- `npm run verify:openclaw-chat-reconciliation` 通过。
- `npm run verify:collab-openclaw-draft` 通过。
- `node --check` 对主进程和相关脚本通过。
- U 盘 runtime 真实冷启动输出 `http server listening`、微信通道启动、`[gateway] ready` 和 heartbeat；随后 SIGINT 干净退出。
- 本机 release app 通过 `codesign --verify --deep --strict`。

## 如果需要下一台 Codex 接手，提示词

请先阅读本 handoff 和前一篇 OpenClaw 消息顺序 handoff。当前 U 盘已最小补齐 `highlight.js` 与 `openai`，真实 Gateway 冷启动成功。继续时不要覆盖 U 盘 `data/`、`skills/`、`.license` 或整体 runtime；先让用户关闭旧 app，只增量复制本机 release 中的新 `OpenClawPro.app`，再验证首页启动状态、日志和 OpenClaw 对话。若继续做 runtime 深层完整性，检查应放在构建/staging 阶段，不要在 exFAT 启动主线程遍历全部文件。
