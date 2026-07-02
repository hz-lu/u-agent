# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 macOS exFAT U 盘环境下 Hermes 环境检查异常、Hermes 对话调用模型失败的问题，重点处理 macOS 在 exFAT 目录中生成的 AppleDouble `._*` 元数据文件污染 Hermes 运行时和数据目录的问题。

## 已完成
- 定位到 Hermes 报错 `utf-8 codec can't decode byte 0xb0` 的直接原因：U 盘 runtime/data 目录中存在大量 AppleDouble `._*` 二进制元数据文件，Hermes 扫描/读取时按 UTF-8 解析失败。
- 在 Hermes 主进程管理器中加入 macOS 专用 AppleDouble 清理逻辑，覆盖 Hermes runtime 和 `data/.hermes`。
- Hermes 对话、Hermes 启动、技能同步、记忆验证、环境检查前都会执行必要清理。
- 可写数据区 `data/.hermes` 清理改为每次强制执行，避免 macOS/exFAT 新生成的 `._*` 再次污染聊天和环境检查。
- 全量 runtime 清理保留节流，避免每次聊天都递归扫描大目录导致慢盘卡顿。
- 技能扫描和复制流程跳过 `._*`，避免把 macOS 元数据同步成 Hermes/OpenClaw skill。
- Hermes 子进程环境增加 `COPYFILE_DISABLE=1`，减少 macOS 复制行为继续生成 AppleDouble 文件。
- 新增 `hermes:verifyEnvironment` IPC，环境检查 UI 会走完整验证而不是只读快速状态。
- macOS staging 脚本过滤 `._*`，release 根目录不会主动带入 AppleDouble 文件。
- 已重新生成 macOS USB root release，并把新 `OpenClawPro.app` 同步到 `/Volumes/OPENCLAW/OpenClawPro.app`。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/preload/index.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `dist/preload/index.js`
- `dist/preload/index.cjs`
- `dist/assets/assets/main-DIeui7ZO.js`
- `scripts/stage-macos-portable-test.mjs`
- `docs/codex-handoff/2026-07-02-macos-hermes-appledouble-fix.md`

## 关键决策
- 不把手动删除 U 盘文件当作最终方案，修复放在源码级 Hermes 管理器和 staging 脚本里。
- `data/.hermes` 是运行期可写区，必须允许用户和程序继续写入；这里的修复只删除 macOS 生成的 `._*` 元数据文件，不删除用户数据、日志、技能、记忆或配置。
- Hermes runtime 大目录清理保留 5 分钟节流，避免慢 U 盘上频繁递归扫描；Hermes 可写数据区每次聊天/验证前强制清理，保证稳定性。
- 环境检查使用完整 IPC 验证，状态卡片可以显示 macOS 元数据清理结果。

## 待继续
- 在用户的 macOS U 盘 UI 中再次点击“环境检查”，确认 Hermes 记忆、自我成长、技能状态从“待验证”刷新为可用状态。
- 在 UI 的 Hermes 对话窗口直接发送一条消息，确认不再出现 `utf-8 codec can't decode` 类错误。
- 后续继续处理 Hermes API Server `aiohttp not installed`，目前 oneshot Hermes 对话已可用，但 API Server 模式仍提示依赖缺失。
- OpenClaw Gateway 日志仍有 `/tmp/openclaw` 输出，零痕迹目标下后续应迁移到 U 盘 `data/.openclaw/logs`。

## 验证结果
- `npm run build` 通过，包含 `node --check dist/main/index.cjs` 和 `node --check dist/preload/index.cjs`。
- `npm run stage:macos-usb-root:final` 通过，runtime required missing 为 `[]`，exFAT compatibility 通过。
- U 盘 app 已确认包含 `cleanupWritableAppleDoubleFiles`、`hermes:verifyEnvironment`、`COPYFILE_DISABLE` 等新代码。
- 启动 `/Volumes/OPENCLAW/OpenClawPro.app` 后，Hermes launcher 日志显示主进程自动清理 AppleDouble：`removed=2302 errors=0 roots=/Volumes/OPENCLAW/data/.hermes, /Volumes/OPENCLAW/runtime/HermesPortable`，后续新生成的少量 `._*` 也被连续清理。
- 使用 U 盘 runtime、U 盘 `data/.openclaw/openclaw.json` 中的 cifu/deepseek-v4-pro 模型配置直接运行 Hermes oneshot 成功，返回 `Hermes 已可用。`

## 如果需要下一台 Codex 接手，提示词
请在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支继续。最新阶段已修复 macOS exFAT AppleDouble `._*` 文件导致 Hermes 环境检查和对话出现 UTF-8 解码错误的问题。先读取本 handoff 和最新 git commit，确认 `src/openclaw-shell-app/dist/main/index.js` 中的 `cleanupAppleDoubleFiles`、`cleanupWritableAppleDoubleFiles`、`verifyEnvironment`、`COPYFILE_DISABLE` 是否存在。下一步优先在真实 UI 中点击 Hermes 环境检查和 Hermes 对话验证；若仍有异常，读取 `/Volumes/OPENCLAW/data/.hermes/logs/launcher.log`、最新 run 目录的 `stderr.txt` 和 `result.json`，不要回退 OpenClaw UI，也不要手动改 U 盘产物作为最终修复。
