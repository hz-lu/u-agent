# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
修复 macOS U 盘版最新测试中暴露的三个回归：右侧黑边仍存在、AI 对话页最大化后未铺满、Hermes 日志面板泄露完整对话提示词；同时避免再次引入全局布局锁导致首页错乱、滚动消失或卡顿。

## 已完成
1. 将 AI 对话页 `.ai-chat-view` 从固定 `944px` 改为 `width: 100%` 并补充 `min-width: 0`，让最大化窗口时对话区域跟随主内容区展开。
2. 将全局滚动条 track/corner 以及 Firefox scrollbar track 从透明改为 `var(--background)`，减少 macOS/Electron 下滚动槽露出窗口底色形成黑边的风险；未修改全局高度、未禁用页面纵向滚动。
3. Hermes 对话启动日志不再拼接 `chatCommand.args.join(" ")`，避免 `--oneshot` 后面的完整用户消息/协同提示词进入 UI 日志；改为显示命令路径、`[message redacted]`、消息长度、provider/model/key 状态。
4. 本地 Hermes API gateway 启动环境补充 `GATEWAY_ALLOW_ALL_USERS=true`，用于便携版 127.0.0.1 本地网关，减少 “No user allowlists configured” 的误导性告警。
5. 同步更新 `scripts/restore-openclaw-shell.mjs`，避免后续恢复 OpenClaw 壳时重新生成旧的泄露日志逻辑。
6. 新增回归检查脚本，覆盖 AI 固定宽度、透明滚动槽、Hermes UI 日志泄露三类问题。
7. 已刷新 `/Users/ly/data/codex/u-agent/release/macos-usb-root-exfat/OpenClawPro.app`。

## 改动文件
- `src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css`
- `dist/assets/main-CAx6YYDG.css`
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/restore-openclaw-shell.mjs`
- `scripts/verify-macos-ui-hermes-regressions.mjs`
- `docs/codex-handoff/2026-07-07-macos-ai-chat-log-redaction.md`

## 关键决策
1. 不再通过 `html/body/#app` 高度锁定、全局 `overflow:hidden` 或强制 viewport 布局来修黑边，因为上一轮已经证明这种做法会破坏首页布局和其他页面滚动。
2. 本轮只做局部 UI 和日志脱敏修复，保留原 OpenClaw UI 主体结构与现有交互。
3. Hermes 的完整请求仍按现有机制写入运行期 `data/.hermes/runs/...`，本轮只修 UI 日志泄露；运行数据属于 U 盘 data，不进入 runtime/release 源码包。
4. `uclaw/` 是未跟踪目录，本轮没有触碰。

## 待继续
1. 用户需要把刷新后的 `OpenClawPro.app` 拷贝到 U 盘根目录覆盖旧 app 后复测。
2. 若右侧仍有黑边，需要基于新截图进一步判断是 Electron 窗口边框、系统滚动条槽，还是某个页面容器产生了横向溢出。
3. Hermes 的 SSH password authentication 安全审计告警目前未屏蔽；如果确认只是本地便携噪音，可在后续做更精细的日志分级/过滤。
4. 后续仍需做一轮完整 macOS U 盘端到端测试：OpenClaw 启动、模型配置、OpenClaw 对话、Hermes 对话、协同对话、微信消息收发、技能读取。

## 验证结果
- `runtime/macos-arm64/node/bin/node scripts/verify-macos-ui-hermes-regressions.mjs` 通过。
- `runtime/macos-arm64/node/bin/node --check src/openclaw-shell-app/dist/main/index.js` 通过。
- `runtime/macos-arm64/node/bin/node --check dist/main/index.js` 通过。
- `runtime/macos-arm64/node/bin/node --check dist/main/index.cjs` 通过。
- `runtime/macos-arm64/node/bin/node --check scripts/restore-openclaw-shell.mjs` 通过。
- `runtime/macos-arm64/node/bin/node scripts/build-openclaw-shell-app.mjs` 通过。
- `MACOS_EXFAT_COMPAT=1 MACOS_USB_ROOT_LAYOUT=1 runtime/macos-arm64/node/bin/node scripts/stage-macos-portable-test.mjs` 通过，runtime missing 为 0，exFAT 检查通过。

## 如果需要下一台 Codex 接手，提示词
请接手 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支。先阅读最新 handoff，重点确认 2026-07-07 这次修复：AI 对话页宽度、滚动条黑边、Hermes UI 日志脱敏。不要重新引入全局 `html/body/#app` 高度锁或页面 `overflow:hidden` 修法。先让用户把 `release/macos-usb-root-exfat/OpenClawPro.app` 覆盖到 U 盘根目录复测，如仍有黑边或 Hermes 告警，再基于新截图和日志继续做最小源码级修复。
