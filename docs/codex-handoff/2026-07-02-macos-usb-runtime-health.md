# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 macOS U 盘根目录版本中 OpenClaw/Hermes 环境检查、OpenClaw Gateway 假成功、模型配置重复默认项的问题，确保用户可从 U 盘根目录直接打开 `OpenClawPro.app` 进行测试。

## 已完成
- 将 OpenClaw runtime 诊断改为按真实平台判断：macOS 下检查 `runtime/openclaw`、`runtime/node`、`runtime/node_modules/openclaw/openclaw.mjs` 和 `dist`，不再误判为 Windows runtime。
- Hermes 环境检查兼容 macOS 共享 Node：识别根目录 `runtime/node` 可执行文件。
- Gateway 启动状态改为以 `/health` 成功为准：进程存在、端口打开、stdout 出现 listening、自动重启等待中都不再直接标记启动成功。
- 修复 cifu 默认模型重复显示：清理历史重复默认项，UI 本地保留 `isCifuDefault: 1`，但写入 OpenClaw config 时不再写入非法字段。
- macOS staging 保留 OpenClaw agent templates，并保留依赖包 `node_modules/**/src` 和 `node_modules/**/skills` 内的运行期必要文件，避免瘦身误删 `sisteransi/src/index.js`、`openai/resources/skills/skills.js`。
- 重新生成 `release/macos-usb-root-exfat`，并同步新版 `OpenClawPro.app` 到 `/Volumes/OPENCLAW/OpenClawPro.app`。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `dist/assets/assets/main-DIeui7ZO.js`
- `scripts/stage-macos-portable-test.mjs`
- `docs/codex-handoff/2026-07-02-macos-usb-runtime-health.md`

## 关键决策
- 不用“进程已启动”代表 OpenClaw 可用，必须等待 Gateway health 返回成功，避免用户看到“启动成功”但实际不可用。
- cifu 默认模型的锁定/默认标记只属于 shell UI 状态，不写入 OpenClaw config 的 provider model schema，避免 OpenClaw 读取配置时报错。
- macOS U 盘根目录继续保持用户指定结构：
  - `OpenClawPro.app`
  - `runtime/`
  - `data/`
  - `skills/`
  - `extensions/`
  - `.license`
- U 盘同步不覆盖 `data/`、`skills/`、`extensions/` 和 `.license`。

## 待继续
- OpenClaw Gateway 直接运行时仍打印 `log file: /tmp/openclaw/openclaw-2026-07-02.log`，需要继续追踪 OpenClaw 自身日志目录配置，保证零痕迹完全落到 U 盘 `data/`。
- 当前默认 cifu 模型名仍可能是 `请填写模型名称`，Gateway warmup 会失败但不影响 health；后续需要在 UI/配置层阻止未填写模型进入 warmup 或给出友好提示。
- 环境检查还需要做一轮完整 UI 验证：OpenClaw、Hermes、skills、extensions、模型配置页逐项确认。
- 后续频繁测试建议只同步变更文件或更换更快 U 盘；本次完整 app 同步 771MB 用时约 6 分 49 秒，平均约 1.8MB/s。

## 验证结果
- `npm run build` 通过，包含 renderer build 和 `node --check dist/main/index.cjs && node --check dist/preload/index.cjs`。
- `npm run stage:macos-usb-root:final` 通过，runtime required missing 为 `[]`，exFAT 兼容检查通过。
- U 盘 runtime 关键文件存在：
  - `runtime/openclaw`
  - `runtime/node`
  - `runtime/node_modules/openclaw/src/agents/templates/AGENTS.md`
  - `runtime/node_modules/openclaw/node_modules/sisteransi/src/index.js`
  - `runtime/node_modules/openclaw/node_modules/openai/resources/skills/skills.js`
- 直接从 `/Volumes/OPENCLAW/runtime/openclaw gateway --allow-unconfigured` 启动后，`curl http://127.0.0.1:18789/health` 返回 `{"ok":true,"status":"live"}`。
- 直接打开 `/Volumes/OPENCLAW/OpenClawPro.app` 成功启动，launch log 显示：
  - license 序列号读取成功
  - runtime 已存在并跳过解压
  - window 创建并加载完成
  - Electron user data/cache 落在 `/Volumes/OPENCLAW/data/.openclaw/electron/electron-cache`

## 如果需要下一台 Codex 接手，提示词
请在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支继续。先读取最新 handoff `docs/codex-handoff/2026-07-02-macos-usb-runtime-health.md`。优先处理两个剩余稳定性问题：1）OpenClaw 自身日志仍写到 `/tmp/openclaw`，需要源码级让日志落到 U 盘 `data/.openclaw/logs`；2）cifu 默认模型未填写时 warmup 报错，需要配置/UI 层友好处理。继续保持 U 盘根目录结构 `OpenClawPro.app/runtime/data/skills/extensions/.license`，不要覆盖用户数据和 license。
