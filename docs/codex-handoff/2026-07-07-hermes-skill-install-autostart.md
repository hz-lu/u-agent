# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 Hermes 对话中请求安装 skill 时，Hermes 未真正完成按需启动就被主进程受控安装器提前拦截并返回失败的问题；同时支持 GitHub `/tree/branch/subdir` 形式的单个 skill 子目录链接。

## 已完成
1. 定位根因：Hermes 对话调用 `HermesManager.chat()` 后，主进程先执行 `detectPortableSkillInstallRequest()`，匹配到“安装 skill + GitHub URL”后直接调用 `installPortableSkillFromGit()` 并返回，导致后面的 Hermes runtime 检查、按需启动和 oneshot 对话链路都没有执行。
2. 调整 Hermes chat 顺序：先校验 Hermes CLI runtime，按需启动 Hermes 后台服务，再处理受控 skill 安装请求，避免 UI 显示“自动启动”但主进程实际没有走启动链路。
3. 新增 `normalizeGitHubSkillUrl()`，将 `https://github.com/user/repo/tree/main/path` 规范化为仓库地址 `https://github.com/user/repo.git`，并保留 `subdir`。
4. `installPortableSkillFromGit()` 支持 `options.subdir`，可只安装指定子目录里的 `SKILL.md`，也支持该子目录下包含多个 skill 子目录。
5. 同步更新 `scripts/restore-openclaw-shell.mjs`，避免后续恢复/生成壳时重新引入旧顺序或旧 URL 解析。
6. 新增 `scripts/verify-hermes-skill-install-flow.mjs`，静态检查 Hermes skill 安装不得绕过 runtime 校验/自动启动，并检查 GitHub URL 规范化逻辑存在。
7. 已刷新 `/Users/ly/data/codex/u-agent/release/macos-usb-root-exfat/OpenClawPro.app`。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/restore-openclaw-shell.mjs`
- `scripts/verify-hermes-skill-install-flow.mjs`
- `docs/codex-handoff/2026-07-07-hermes-skill-install-autostart.md`

## 关键决策
1. 保留“受控 skill 安装器”，因为它原本用于避免 Hermes 自由执行 Git 操作造成 UI 卡死/闪退；本次不让模型自由安装，而是修正它在 Hermes 对话链路中的执行顺序。
2. Hermes 模式下遇到安装 skill 请求仍然由主进程受控安装器完成，但必须先走 Hermes runtime 校验和按需启动，让 UI 状态与真实后台状态一致。
3. GitHub 子目录链接不再直接拼 `.git`，而是解析 owner/repo/subdir，避免 `/tree/main/aihot.git` 这类非法地址。
4. 本轮不改 OpenClaw 对话、模型配置、微信、runtime、data、license。

## 待继续
1. 用户覆盖 U 盘根目录的 `OpenClawPro.app` 后，复测 Hermes 未启动状态下发送：`帮我安装这个 skill: https://github.com/KKKKhazix/khazix-skills/tree/main/aihot`。
2. 预期结果：Hermes 状态先按需启动，随后安装 `aihot`，技能出现在 U 盘 `skills/aihot`，并同步到 `data/.hermes/skills/openclaw/aihot`。
3. 如果安装仍失败，优先读取 Hermes 日志 `[skill-install]` 行和 U 盘 `data/.hermes/tmp` clone/archive 结果，不要先改 UI。
4. 后续可以为 skill 安装增加更明确的前端进度，例如“正在启动 Hermes / 正在下载仓库 / 正在同步到 Hermes”。

## 验证结果
- `runtime/macos-arm64/node/bin/node scripts/verify-hermes-skill-install-flow.mjs` 通过。
- `runtime/macos-arm64/node/bin/node scripts/verify-macos-ui-hermes-regressions.mjs` 通过。
- `runtime/macos-arm64/node/bin/node --check src/openclaw-shell-app/dist/main/index.js` 通过。
- `runtime/macos-arm64/node/bin/node --check dist/main/index.js` 通过。
- `runtime/macos-arm64/node/bin/node --check dist/main/index.cjs` 通过。
- `runtime/macos-arm64/node/bin/node --check scripts/restore-openclaw-shell.mjs` 通过。
- `runtime/macos-arm64/node/bin/node scripts/build-openclaw-shell-app.mjs` 通过。
- `MACOS_EXFAT_COMPAT=1 MACOS_USB_ROOT_LAYOUT=1 runtime/macos-arm64/node/bin/node scripts/stage-macos-portable-test.mjs` 通过，runtime missing 为 0，exFAT 检查通过。

## 如果需要下一台 Codex 接手，提示词
请接手 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支。先阅读最新 handoff，重点确认 2026-07-07 Hermes skill 安装自动启动修复。用户反馈 Hermes 未启动时请求安装 skill 会直接返回“只支持 GitHub skill 仓库地址”，根因是受控安装器在 Hermes runtime 校验和自动启动之前拦截消息，并且不支持 GitHub `/tree/...` 子目录链接。本轮已调整顺序并支持 subdir。请让用户覆盖 U 盘 `OpenClawPro.app` 后复测，不要触碰 `data/`、`.license`、runtime 或用户技能数据。
