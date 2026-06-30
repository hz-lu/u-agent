# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw 实现集成 Hermes，集成实现：

零安装 — Python / Node 运行时自带，不依赖系统任何东西  
零痕迹 — 所有读写劫持到 U 盘 data/ 目录，宿主机零接触  
三平台原生 — macOS（arm64/x64）、Linux（x64/arm64）、Windows（x64）  
Universal 包 — 单个 zip 带齐三平台 venv，启动器自动识别  
自我成长 — 持久记忆 + 自动生成技能，运行越久越强（官方核心特性）  
多平台接入 — Telegram/Discord/Slack/WhatsApp/Signal/Email/CLI，一处启动多处可达  
定时自动化 — 自然语言 cron 调度，无人值守执行报告/备份/简报  
子代理委派 — 隔离子对话 + 独立终端 + Python RPC，零上下文成本流水线  
沙箱隔离 — 本地/Docker/SSH/Singularity/Modal 五种后端  
可视化配置中心 — 选模型/填 Key/测试连接/换模型/查看日志/导入导出

以上任务均要和现有程序前端界面无缝融合，在保留 OpenClaw 体验的基础上融合 Hermes，让前端操作有良好用户体验。

## 当前目标
整理一个不带用户配置和历史数据的 Windows 初始化 release 目录，输出到 `D:\share\1\o\1`，包含最新 Electron 壳、完整 runtime、skills、extensions，并确保微信插件在新机器上离线识别为已安装。

## 已完成
- 重新执行 `npm run package:windows-shell`，将最新前端/主进程代码写入 `win-unpacked/resources/app/dist`。
- 新增 `npm run release:windows-dir`，通过 `scripts/stage-windows-release-dir.mjs` 可重复整理 Windows release 目录。
- 已刷新 `D:\share\1\o\1`：
  - `win-unpacked/`
  - `runtime/`
  - `skills/`
  - `extensions/`
  - 初始化 `data/`
  - `启动OpenClawPro.bat`
  - `README-PORTABLE.md`
  - `RELEASE-MANIFEST.json`
- release 初始化配置已启用 `openclaw-weixin`，同时把插件复制到：
  - `extensions/openclaw-weixin`
  - `data/.openclaw/extensions/openclaw-weixin`
- 微信账号数据已清空：`data/.openclaw/openclaw-weixin/accounts.json` 为 `[]`。
- 去掉初始化 OpenClaw 配置里的 `meta` 字段，避免 `openclaw config validate` 报 schema 错误。
- 同步修正旧的 Windows staging/zip 脚本，避免以后旧脚本再次生成不兼容配置。
- 根目录不再放孤立 `OpenClawPro.exe`，避免用户误点缺少 `resources` 的 exe；启动入口改为 `启动OpenClawPro.bat` 或 `win-unpacked/OpenClawPro.exe`。

## 改动文件
- `package.json`
- `scripts/stage-windows-release-dir.mjs`
- `scripts/stage-windows-portable-test.mjs`
- `scripts/build-windows-release.mjs`
- `docs/codex-handoff/2026-06-30-windows-release-dir-final.md`

## 关键决策
- release 目录脚本默认保留已有 `runtime`；如果关键 runtime 文件缺失且 `F:\runtime` 存在，则自动从 `F:\runtime` 复制补齐。
- release 初始化数据只保留空账号、空日志目录、空工作目录和 Hermes 配置模板，不携带授权、聊天历史、微信登录态、Hermes 记忆/数据库。
- 微信插件必须同时放在根目录 `extensions` 和 OpenClaw 数据目录镜像中，解决“文件存在但界面仍提示下载插件”的问题。
- 词符科技初始化模型使用 `cifu/请填写模型名称`，base URL 为 `https://token.51cifu.com/v1`，默认占位 API Key 为 `123456`。

## 待继续
- 用户可把 `D:\share\1\o\1` 整体复制到新 U 盘再在新电脑实测启动、模型配置、OpenClaw 对话、Hermes 对话、微信扫码。
- 如果需要可继续基于该目录生成正式 zip 包。
- 当前 release 仍是 Windows x64 版本；macOS/Linux runtime 与 Universal 三平台 zip 仍未完成。
- OpenClaw runtime 校验提示若干可选/static package import 缺失，例如 `@larksuiteoapi/node-sdk`、`matrix-js-sdk`、`@lancedb/lancedb`、`@a2ui/markdown-it`。这些目前是 warning，不阻断 OpenClaw CLI smoke test，但涉及相应可选功能时仍需专项验证。

## 验证结果
- `npm run package:windows-shell`：通过；Electron 下载超时，复用现有 shell，已更新 app dist。
- `npm run release:windows-dir`：通过。
- `node --check scripts/stage-windows-release-dir.mjs`：通过。
- `node --check scripts/stage-windows-portable-test.mjs`：通过。
- `node --check scripts/build-windows-release.mjs`：通过。
- `D:\share\1\o\1\runtime\openclaw.cmd config validate --json`：`valid: true`。
- `scripts/verify-openclaw-runtime.mjs`：runtimeIntegrity `ok: true`，CLI smoke test 通过。
- `scripts/verify-hermes-runtime.mjs`：Hermes、Python、Node 文件和版本检查通过。
- 用户数据检查：`.license`、聊天历史、微信 accounts 目录、Hermes auth/state/memory 数据库均不存在。

## 如果需要下一台 Codex 接手，提示词
请在 `D:\github\u-agent` 继续开发 OpenClawPro Agent Hub。当前 Windows 初始化 release 目录已经整理到 `D:\share\1\o\1`，使用 `npm run release:windows-dir` 可重复生成。重点不要破坏 OpenClaw 原有链路和 Hermes 已有会话体验。下一步请先让用户把 `D:\share\1\o\1` 复制到新 U 盘和新电脑实测；若仍提示微信插件需要下载，优先检查 `data/.openclaw/extensions/openclaw-weixin/openclaw.plugin.json`、`data/.openclaw/openclaw.json` 的 `plugins.allow/plugins.entries/channels`，以及主进程 `WechatManager.isPluginInstalled()` 的 `dataDir`/`getAppRoot()` 路径解析。
