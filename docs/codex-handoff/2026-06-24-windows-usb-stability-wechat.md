# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心。所有能力需要和现有程序前端界面无缝融合，保留 OpenClaw 原有体验，并让 Hermes 在前端操作上具备良好用户体验。

## 当前目标
继续处理 Windows 测试中出现的未响应、OpenClaw 回复变慢/无回复、微信扫码安装慢且失败的问题。

## 已完成
- 定位微信失败根因：当前 F 盘没有随包微信插件，只能走在线安装；在线安装在便携 OpenClaw runtime 下会因为插件 peer link/openclaw hook pack 问题失败。
- 从原始可用 E 盘同步 `openclaw-weixin` 插件到项目 `extensions/openclaw-weixin`，并同步到 F 盘 `F:\extensions\openclaw-weixin` 与 `F:\data\.openclaw\extensions\openclaw-weixin`，让当前测试包直接走离线/已安装路径。
- 修改 `.gitignore`，允许 `extensions/openclaw-weixin` 及其 `node_modules` 入库，后续 release/staging 会自带微信插件，避免每次在线安装。
- 定位 OpenClaw 卡顿主因之一：F 盘 U 盘文件系统不支持 Windows junction/symlink，OpenClaw Gateway 反复在 `data/.openclaw/plugin-skills/browser-automation` 创建链接失败，造成 `EISDIR/EEXIST` 日志和事件循环压力。
- 增强 `dns-hook.cjs` 生成逻辑：兼容 `EISDIR/EEXIST/EPERM`，对 `plugin-skills` 链接错误进行容错，不再让 Gateway 因 U 盘不支持 junction 反复抛错。
- 修改 Gateway 启动前的 plugin skill 规范化逻辑：优先 symlink/junction，失败时复制内置 `browser-automation` skill 到 `data/.openclaw/plugin-skills`，兼容非 NTFS U 盘。
- 修复当前 F 盘 `openclaw.json` 被 PowerShell 写入 BOM 后导致 Node `JSON.parse` 失败的问题，并恢复模型配置可读。
- 已重新构建并同步 `dist` 到 `F:\win-unpacked\resources\app\dist`。

## 改动文件
- `.gitignore`
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/restore-openclaw-shell.mjs`
- `extensions/openclaw-weixin/**`
- `docs/codex-handoff/2026-06-24-windows-usb-stability-wechat.md`

## 关键决策
- 微信插件属于开箱即用体验关键路径，不能依赖首次联网安装；将小体积的已验证插件和依赖随仓库/随包携带。
- 非 NTFS U 盘不能创建 junction，便携版不能假设 symlink 可用；对 plugin skill 采用“能链接就链接，不能链接就复制”的策略。
- OpenClaw 对话无回复并不只是模型慢，日志显示 Gateway 曾被长任务和 plugin-skill 链接失败影响；本阶段先消除可复现的 U 盘文件系统兼容问题。

## 待继续
- 用户重新打开 `F:\win-unpacked\OpenClawPro.exe` 后测试：启动 Gateway、OpenClaw 发送“你好”、微信重新扫码。
- 如仍卡顿，继续查看 `F:\data\.openclaw\logs\gateway-launcher.log`，重点确认是否还出现 `plugin skill symlink`、`event_loop_delay`、`long-running session`。
- 微信扫码后需确认账号凭据是否写入 `F:\data\.openclaw\openclaw-weixin` 或 `F:\data\.openclaw\.openclaw\openclaw-weixin`，以及 Gateway 是否自动刷新加载通道。

## 验证结果
- `npm.cmd run build` 通过。
- `node --check src/openclaw-shell-app/dist/main/index.js` 通过。
- `node --check scripts/restore-openclaw-shell.mjs` 通过。
- F 盘 hook 测试通过：在不支持 junction 的 U 盘上，`fs.symlinkSync(..., 'junction')` 错误已被 hook 吞掉，不再抛出到 Gateway。
- `AGENT_HUB_ROOT=F:\ node scripts/verify-openclaw-runtime.mjs` 通过，OpenClaw runtime 完整、CLI smoke 成功、模型配置可读；Gateway 当前未启动所以 ready=false。
- `AGENT_HUB_ROOT=F:\ node scripts/verify-hermes-runtime.mjs` 通过，Hermes runtime 文件与版本可读；端口未启动属于当前未启动 Hermes 的状态。

## 如果需要下一台 Codex 接手，提示词
继续在 `D:\github\u-agent` 开发 U 盘便携版 OpenClawPro + Hermes 集成。当前重点：让用户重启 F 盘程序后测试 Gateway/OpenClaw/微信。若仍未响应，读取 `F:\data\.openclaw\logs\gateway-launcher.log` 最近日志，确认是否仍有 `plugin skill symlink`、`event_loop_delay`、`embedded_run` 长任务；若微信仍失败，确认程序是否直接识别 `F:\data\.openclaw\extensions\openclaw-weixin`，不要再走在线安装。所有修复必须进源码和打包脚本，阶段结束后执行 git status、git diff、git add、git commit、git push，并新增 handoff，且 `## 当前目标` 前必须有 `## 总体目标`。
