# 2026-07-27 OpenClaw Web 工具与 Hermes 安全日志修复

## 总体目标

在保留 OpenClaw 和 Hermes 官方安全边界的前提下，构建可复制到任意 U 盘运行的 Windows 便携版，并保证本地对话、网络工具、技能、日志和环境状态具备可理解、可诊断、可重复构建的完整闭环。

## 当前目标

修复 Clash/Mihomo Fake-IP 环境下 OpenClaw `web_fetch` 被误判为特殊地址、未配置搜索服务时模型反复调用 `web_search`，以及 Hermes 外部消息渠道默认拒绝 warning 在首页被误认为桌面对话故障的问题。

## 本轮完成

- OpenClaw 启用官方 `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange`，只兼容 Fake-IP 使用的 `198.18.0.0/15`，未开放局域网、回环或其他特殊地址。
- 未配置搜索 provider、搜索 API Key 和相关环境凭据时，自动设置 `tools.web.search.enabled=false`，避免向模型暴露必然失败的工具；已有配置不覆盖。
- Hermes 的 allowlist warning 在首页精确转换为中文安全说明，原始 `errors.log` 和 `launcher.log` 继续保留，其他 warning/error 不过滤。
- 明确不启用 `GATEWAY_ALLOW_ALL_USERS=true`，避免未来接入 Telegram、Discord 等外部渠道后形成未授权访问。
- 恢复脚本和 OpenClaw shell 审计同步更新，重新构建不会丢失本轮修复。

## 验证结果

- `node --check src/openclaw-shell-app/dist/main/index.js`：通过。
- `node --check scripts/restore-openclaw-shell.mjs`：通过。
- `npm.cmd run audit:openclaw-shell`：54/54 通过。
- `npm.cmd run build`：通过。
- `npm.cmd run package:windows-shell`：通过，生成最新 `win-unpacked`。
- F 盘 `dist/main/index.js` 与最新构建产物 SHA-256 一致。

## 运行目录同步

最新应用代码已同步到 `F:\win-unpacked\resources\app\dist`。同步时 F 盘程序仍在运行，当前窗口仍使用旧内存代码；完全退出并重新打开后，新配置才会写入 `F:\data\.openclaw\openclaw.json` 并由 Gateway 生效。runtime、模型配置和历史数据未被覆盖。

## 后续验证

- 重启 F 盘程序和 OpenClaw 后，确认 `httpbin.org` 在 Clash Fake-IP 模式下可通过 `web_fetch` 访问。
- 未配置搜索 provider 时，确认模型不再调用 `web_search`；若产品后续增加搜索配置入口，保存 provider/key 时需显式重新启用搜索。
- 首页 Hermes 日志应显示中文默认拒绝策略说明；外部消息渠道仍需单独配置用户 allowlist。
