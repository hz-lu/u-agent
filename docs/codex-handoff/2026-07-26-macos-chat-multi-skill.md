# Codex Handoff

## 总体目标

基于已开发的 U 盘便携版 OpenClaw 实现集成 Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

在 macOS 便携版保持原 OpenClaw UI 和稳定性的前提下，迁移主干技能能力：`/skill` 搜索、技能多选、OpenClaw/Hermes/协同路由、共享技能调用、历史隔离和安全回退，并保证 `src/openclaw-shell-app` 是唯一源码基准。

## 已完成

- 增加官方 OpenClaw Gateway/CLI 与 Hermes Python bridge 技能目录查询。
- 增加技能去重、整组可用性检查和协同路由：OpenClaw 优先，未接受任务时才允许安全回退 Hermes。
- `/skill`、`/ski`、`/skil` 可打开技能搜索；选择技能只生成可删除标签，不立即发送；支持多选。
- OpenClaw 多技能生成单条组合请求，Hermes 多技能使用官方预加载函数。
- OpenClaw 发送接口返回 `accepted/queued/retrySafe/error`；已接受任务不再重复回退。
- 运行提示词与用户历史分离，历史保留原始文本、技能元数据和执行 Agent。
- 协同模式的 OpenClaw 技能执行使用隐藏独立 session，避免污染 OpenClaw 主对话历史。
- Gateway 历史恢复可识别单技能和多技能内部请求，重启后仍显示原始用户文本和技能标签。
- Hermes 技能验证器支持 macOS `venv/bin/python`、跨平台 site-packages，并真实验证两个技能的官方预加载。
- `scripts/restore-openclaw-shell.mjs` 已重写为原子复制 `src/openclaw-shell-app` 的源码部署器，移除历史 renderer/main 字符串补丁层。
- 已生成 `release/macos-usb-root-exfat`，包含 arm64 runtime；OpenClaw/Hermes runtime 完整性检查、exFAT symlink 物化和 ad-hoc 签名验证通过。

## 改动文件

- `src/openclaw-shell-app/dist/main/chat-skill-routing.cjs`
- `src/openclaw-shell-app/dist/main/index.js`
- `src/openclaw-shell-app/dist/preload/index.js`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css`
- `scripts/verify-chat-skill-commands.mjs`
- `scripts/verify-ai-chat-skill-runtime.mjs`
- `scripts/verify-hermes-skills.mjs`
- `scripts/restore-openclaw-shell.mjs`
- `scripts/verify-openclaw-chat-skill-sync.mjs`
- `scripts/verify-macos-ui-hermes-regressions.mjs`
- `scripts/verify-hermes-skill-install-flow.mjs`
- `docs/codex-handoff/2026-07-26-macos-chat-multi-skill.md`
- 构建同步目录：`dist/`

## 关键决策

- OpenClaw 官方一次只接受一个 `/skill` 调用；多技能由客户端生成一条明确的组合请求，不能拼接多个 slash 命令或拆成多条消息。
- 协同模式的整组技能只能由一个 Agent 执行。OpenClaw 请求一旦被接受、排队或进入不确定网络状态，禁止 Hermes 重跑。
- `runtimeMessage` 只作为本次 IPC/Agent 请求使用，不写入本地用户历史；Gateway 历史恢复使用固定格式解析还原展示内容。
- 不修改全局 overflow、窗口尺寸或 OpenClaw 页面布局；技能选择菜单和标签只使用 ChatInput 局部样式。
- restore 脚本不再以旧 baseline 为输入，也不再层层注入补丁；恢复结果直接来自 `src/openclaw-shell-app`。

## 待继续

- 在真实 macOS 机器/U 盘上端到端验证：`/skill` 多选、OpenClaw 执行、Hermes 自动启动执行、协同安全回退、切页/重启后的历史恢复。
- 在有可用模型和 Gateway 的环境中验证 OpenClaw 隐藏协同 session 不出现在主 OpenClaw 会话列表和 UI 历史中。
- 完成任务四/五之后的 UI 截图检查和 macOS 真实窗口交互检查。
- 继续将 Windows 端 runtime 和三平台 Universal release 纳入同一套源码构建流水线。

## 验证结果

已通过：

```text
npm run build:renderer
npm run build:main
npm run verify:chat-skills
node scripts/verify-ai-chat-skill-runtime.mjs
node scripts/verify-openclaw-chat-skill-sync.mjs
node scripts/verify-macos-ui-hermes-regressions.mjs
node scripts/verify-hermes-skill-install-flow.mjs
npm run verify:skill-metadata
npm run verify:skill-repository
npm run verify:hermes-skills
node --check scripts/restore-openclaw-shell.mjs
codesign --verify --deep --strict release/macos-usb-root-exfat/OpenClawPro.app
```

生成干净 release 之前，Hermes macOS runtime 使用现有 281 个共享技能完成真实验证：官方命令层可见 252 个，并成功预加载两个技能。重新生成的最终 release 按分发规则不携带用户技能，最后一次验证为 `sourceCount: 0`、`invocationStatus: no-skills`。release 构建报告显示 OpenClaw dist、Hermes Python/venv、模板文件齐全，exFAT 兼容检查无残留 symlink。

## 如果需要下一台 Codex 接手，提示词

请在 `/Users/ly/data/codex/u-agent` 继续开发，先读取本 handoff 和最新 Git 状态。当前分支是 `feat/macos-portable-app`，`src/openclaw-shell-app` 是唯一源码基准，不要恢复旧 `restore-openclaw-shell` 补丁层，也不要修改 `uclaw/`。优先在真实 macOS/U 盘环境端到端测试 `/skill` 多选、OpenClaw/Hermes/协同路由、历史隔离和 Hermes 自动启动；发现问题先写可复现验证，再做最小源码修改。阶段完成后执行中文 commit、push 和新的 handoff。
