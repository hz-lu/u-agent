# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 OpenClaw、桌面技能管理、Hermes 三者 skill 来源不一致的问题：用户手动放入 U 盘根 `skills/` 的 skill 应被 OpenClaw 使用；OpenClaw 对话/网页端安装到 workspace 的 skill 应被桌面技能管理和 Hermes 发现。

## 已完成
- 将统一 skill 来源扩展为三类目录：
  - U 盘根 `skills/`
  - OpenClaw workspace 安装目录 `data/.openclaw/workspace/skills`
  - OpenClaw managed 目录 `data/.openclaw/skills`
- Gateway 启动前会修复 `data/.openclaw/openclaw.json` 的 `skills.load.extraDirs`，确保至少包含便携根 `skills`，并把旧的 `E:\skills` / 任意 `/skills` 尾缀规范为 `skills`。
- 桌面技能管理与 Hermes skill 镜像同步共用统一来源，因此 OpenClaw 对话安装的 skill 也能进入技能管理和 Hermes 同步链路。
- Hermes 环境检查中的 OpenClaw skill 目录展示也改为统一来源，避免只显示配置里的 `extraDirs` 造成误判。
- 更新 `scripts/verify-openclaw-chat-skill-sync.mjs`，要求源码显式覆盖 workspace/managed/root 三类 skill 来源和 OpenClaw skill 配置修复。
- 更新 `scripts/restore-openclaw-shell.mjs`，避免后续还原 OpenClaw UI 壳时丢失这次修复。
- 已刷新 `release/macos-usb-root-exfat`。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/restore-openclaw-shell.mjs`
- `scripts/verify-openclaw-chat-skill-sync.mjs`
- `docs/codex-handoff/2026-07-07-skill-source-unification.md`

## 关键决策
- 不把用户手动放入的 skill 强制复制到 OpenClaw workspace，避免污染用户根 `skills/`；通过 `skills.load.extraDirs` 让 OpenClaw 读取根目录。
- 不把 OpenClaw 对话安装的 skill 移动到根 `skills/`，因为 OpenClaw 官方安装逻辑默认安装到 workspace；桌面和 Hermes 改为额外扫描 workspace。
- Hermes 继续通过 `data/.hermes/skills/openclaw/` 镜像读取 OpenClaw skills，保持 Hermes 运行态和用户原始 skill 目录隔离。
- 已启动的 Gateway 可能需要重启后才加载新增/修复后的 `skills.load.extraDirs`。

## 待继续
- 用真实 U 盘复测：重启 OpenClaw Gateway 后，OpenClaw 对话应能识别手动放入根 `skills/` 的 `web-tools-guide`。
- 用真实 U 盘复测：OpenClaw 对话/网页端安装的 `aihot` 应出现在桌面技能管理中，并可同步到 Hermes。
- 若 Hermes 同步后仍未看到 workspace skill，检查 `data/.hermes/reports/skills/visibility-last.json` 的 `sourceRoots` 和 `missingNames`。

## 验证结果
- `runtime/macos-arm64/node/bin/node --check src/openclaw-shell-app/dist/main/index.js`
- `runtime/macos-arm64/node/bin/node --check dist/main/index.js`
- `runtime/macos-arm64/node/bin/node --check dist/main/index.cjs`
- `runtime/macos-arm64/node/bin/node --check scripts/restore-openclaw-shell.mjs`
- `runtime/macos-arm64/node/bin/node scripts/verify-openclaw-chat-skill-sync.mjs`
- `runtime/macos-arm64/node/bin/node scripts/verify-macos-ui-hermes-regressions.mjs`
- `runtime/macos-arm64/node/bin/node scripts/verify-hermes-skill-install-flow.mjs`
- `runtime/macos-arm64/node/bin/node scripts/build-openclaw-shell-app.mjs`
- `MACOS_EXFAT_COMPAT=1 MACOS_USB_ROOT_LAYOUT=1 runtime/macos-arm64/node/bin/node scripts/stage-macos-portable-test.mjs`

## 如果需要下一台 Codex 接手，提示词
请继续在 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支工作。先阅读最新 handoff：`docs/codex-handoff/2026-07-07-skill-source-unification.md`。当前重点是用真实 macOS U 盘复测 skill 三方统一：根 `skills/`、OpenClaw workspace `data/.openclaw/workspace/skills`、OpenClaw managed `data/.openclaw/skills` 都应被桌面技能管理和 Hermes 同步发现；OpenClaw Gateway 重启后应能读取根 `skills/`。不要改动用户 U 盘的 `.license`、微信登录态或用户数据。
