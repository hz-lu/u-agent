# OpenClawPro Agent Hub

> **U 盘便携版 OpenClaw + Hermes Agent 集成客户端**
>
> 在现有 OpenClawPro U 盘客户端基础上，重建为完整 Electron / Vue / TypeScript 源码工程，并把 Hermes Agent 融合进同一套前端体验、运行时管理、配置中心和便携数据目录。

[中文](#中文) | [English](#english)

---

<a id="中文"></a>

## 中文

### 这是什么

OpenClawPro Agent Hub 是一个面向 U 盘即插即用场景的 AI Agent 桌面客户端。它不是旧版本里挂在打包产物上的 Hermes 补丁层，而是一个完整源码工程：Electron 主进程负责运行时、进程、端口、日志和零痕迹环境；Vue 前端负责 OpenClaw / Hermes 双引擎切换、配置中心、会话测试和诊断展示。

当前工程直接服务于这块 U 盘：

```text
E:\source\openclawpro-agent-hub   源码工程
E:\win-unpacked\resources\app     已部署 Electron app
E:\runtime                        Python / Node / Agent 运行时
E:\data\.openclaw                 OpenClaw 数据
E:\data\.hermes                   Hermes 数据
E:\backups                        每次部署前的 app 备份
```

### 总体目标

基于已开发的 U 盘便捷版 OpenClaw，实现 Hermes Agent 的完整融合：

| 目标 | 说明 |
|------|------|
| 零安装 | Python / Node 运行时自带，不依赖系统环境 |
| 零痕迹 | 所有读写劫持到 U 盘 `data/` 目录，宿主机零接触 |
| 三平台原生 | macOS arm64/x64、Linux x64/arm64、Windows x64 |
| Universal 包 | 单个 zip 带齐三平台 venv，启动器自动识别 |
| 自我成长 | 持久记忆 + 自动生成技能，运行越久越强 |
| 多平台接入 | Telegram / Discord / Slack / WhatsApp / Signal / Email / CLI |
| 定时自动化 | 自然语言 cron 调度，无人值守执行报告、备份、简报 |
| 子代理委派 | 隔离子对话 + 独立终端 + Python RPC |
| 沙箱隔离 | local / Docker / SSH / Singularity / Modal 五种后端 |
| 可视化配置中心 | 选模型、填 Key、测试连接、换模型、查看日志、导入导出 |

所有能力都必须与现有前端界面无缝融合，让用户在同一个客户端里完成配置、启动、诊断、聊天和自动化管理。

### 当前能力

| 模块 | 状态 | 说明 |
|------|------|------|
| OpenClaw runtime | 已接入 | 复用 `E:\runtime`，读取 `E:\data\.openclaw\openclaw.json` |
| OpenClaw chat | 已接入 | 通过 OpenAI-compatible `/chat/completions` 调用默认 provider |
| Hermes runtime | 已接入 | 复用 `E:\runtime\HermesPortable` |
| Hermes 零痕迹环境 | 已接入 | `HOME`、`XDG_CONFIG_HOME`、缓存、日志、记忆、技能目录指向 `E:\data\.hermes` |
| Hermes 配置中心 | 已接入 | 模型、Key、连接器、定时任务、沙箱、导入导出 |
| Hermes dashboard / API | 已接入 | 前端可启动并内嵌打开 |
| 旧 Hermes patch 层 | 已移除 | 不再使用 `hermes-enhance.js`、`real-hermes-ui.js` 等 dist 注入文件 |
| Universal 三平台包 | 进行中 | 当前重点在 Windows U 盘源码版，macOS/Linux runtime 待补齐 |

### 快速开始

开发和构建建议在本地高速磁盘完成依赖安装，再把构建产物同步回 U 盘源码目录。避免把大型 `node_modules` 写入 U 盘。

```powershell
# 1. 进入源码工程
cd E:\source\openclawpro-agent-hub

# 2. 安装依赖
npm install

# 3. 类型检查
npm run typecheck

# 4. 构建 Electron app
npm run build

# 5. 部署到当前 U 盘客户端
npm run deploy:usb
```

如果当前 shell 里没有 `node` / `npm`，可以使用系统 Node 的绝对路径：

```powershell
$env:Path='C:\Program Files\nodejs;' + $env:Path
& 'C:\Program Files\nodejs\npm.cmd' run typecheck
& 'C:\Program Files\nodejs\npm.cmd' run build
```

### 运行与部署

部署脚本会把完整源码构建后的 app 写入：

```text
E:\win-unpacked\resources\app
```

并在覆盖前备份当前 app：

```text
E:\backups\app-full-source-YYYYMMDDHHMMSS
```

启动客户端：

```powershell
E:\win-unpacked\OpenClawPro.exe
```

### 文件结构

```text
openclawpro-agent-hub/
├── src/
│   ├── main/                    Electron 主进程
│   │   ├── runtime/             OpenClaw / Hermes runtime 管理
│   │   ├── services/            进程、端口、JSON 存储服务
│   │   └── portable-paths.ts    U 盘路径识别与目录管理
│   ├── preload/                 安全 IPC 暴露
│   ├── renderer/                Vue 前端界面
│   └── shared/                  前后端共享类型
├── scripts/
│   ├── deploy-to-usb.mjs        部署完整 app 到 U 盘打包目录
│   ├── scan-usb.mjs             扫描当前 U 盘基线
│   ├── verify-hermes-runtime.mjs
│   ├── verify-openclaw-runtime.mjs
│   ├── migrate-hermes-data.mjs
│   └── fetch-hermes.mjs
├── docs/
│   ├── CURRENT_USB_BASELINE.md
│   └── codex-handoff/           阶段性交接文档
├── dist/                        构建产物
└── package.json
```

### U 盘运行时布局

```text
E:\
├── win-unpacked/                Electron 壳与部署后的 app
├── source/openclawpro-agent-hub 源码工程
├── runtime/
│   ├── node.exe                 OpenClaw 侧 Node runtime
│   └── HermesPortable/          Hermes Agent runtime
└── data/
    ├── .openclaw/               OpenClaw 配置、模型、记忆
    └── .hermes/                 Hermes home、cache、config、logs、skills、cron、sandboxes
```

### Hermes 配置中心

前端 Hermes 页面已经支持：

- 选择 provider / model / base URL，填写 API Key。
- 保存配置到 U 盘 `data/.hermes`。
- Telegram、Discord、Slack、WhatsApp、Signal、Email、CLI 连接器字段编辑与本地测试。
- 持久记忆与自动生成技能开关。
- 自然语言定时任务添加，cron 可手动填，也可基础自动推断。
- local、Docker、SSH、Singularity、Modal 沙箱后端字段编辑与测试。
- 配置导入 / 导出，导出时会脱敏 token 和 API Key。
- Dashboard / Agent API / Config 页面内嵌打开。

### 零痕迹策略

Hermes 启动时会重写运行环境：

```text
HOME=E:\data\.hermes\home
USERPROFILE=E:\data\.hermes\home
XDG_CONFIG_HOME=E:\data\.hermes\config
XDG_CACHE_HOME=E:\data\.hermes\cache
HERMES_HOME=E:\data\.hermes
HERMES_LOG_DIR=E:\data\.hermes\logs
HERMES_MEMORY_PATH=E:\data\.hermes\memories
HERMES_SKILLS_PATH=E:\data\.hermes\skills
TMP=E:\data\.hermes\tmp
TEMP=E:\data\.hermes\tmp
```

OpenClaw 数据保存在：

```text
E:\data\.openclaw
```

### 验证命令

```powershell
npm run scan:usb
npm run verify:hermes
npm run verify:openclaw
```

也可以直接检查部署后的主进程文件：

```powershell
node --check E:\win-unpacked\resources\app\dist\main\index.js
node --check E:\win-unpacked\resources\app\dist\main\runtime\hermes\hermes-runtime.js
node --check E:\win-unpacked\resources\app\dist\main\runtime\openclaw-runtime.js
```

### 开发流程

每完成一个阶段，需要执行并记录：

```powershell
git status
git diff
git add ...
git commit -m "..."
git push
```

每个阶段新增一份 handoff：

```text
docs/codex-handoff/YYYY-MM-DD-xxx.md
```

handoff 固定结构：

```markdown
# Codex Handoff

## 总体目标
...

## 当前目标
...

## 已完成
...

## 改动文件
...

## 关键决策
...

## 待继续
...

## 验证结果
...

## 如果需要下一台 Codex 接手，提示词
...
```

### FAQ

**Q: 这个项目还依赖旧 Hermes 补丁吗？**  
不依赖。旧的 dist 注入式 Hermes patch 层已经移除，当前 app 从源码构建并完整部署。

**Q: API Key 会提交到仓库吗？**  
不会。源码只实现读取和写入 U 盘数据目录，handoff 与导出配置都会避免泄露密钥。导出配置会脱敏敏感字段。

**Q: 为什么建议在本地磁盘构建？**  
U 盘写入大量 `node_modules` 慢且容易损耗。推荐在本地构建目录安装依赖、构建，再同步 `dist` 回 U 盘源码。

**Q: 现在支持 macOS / Linux 吗？**  
源码结构按三平台目标设计，但当前 U 盘实例主要完成 Windows x64 运行时接入。macOS arm64/x64、Linux x64/arm64 的 Hermes venv、Node runtime 和启动器仍需继续补齐。

**Q: Hermes 连接器测试会真的请求外部平台吗？**  
当前阶段先做本地确定性校验和配置落盘，不主动把 token 发到外部平台。后续会增加可选真实连通性测试。

---

<a id="english"></a>

## English

### What is this

OpenClawPro Agent Hub is a portable USB AI Agent desktop client. It rebuilds the existing OpenClawPro USB app as a complete Electron / Vue / TypeScript source project and integrates Hermes Agent into the same UI, runtime management, portable data model, diagnostics, and configuration center.

This is not a dist-injected Hermes patch layer. The deployed app is built from this source tree and replaces the full `resources/app` folder.

### Main Goal

Integrate Hermes Agent into the existing portable OpenClaw USB client with:

| Goal | Description |
|------|-------------|
| Zero install | Bundled Python / Node runtimes, no system dependency |
| Zero trace | Redirect all writes to USB `data/` |
| Native 3-platform support | macOS arm64/x64, Linux x64/arm64, Windows x64 |
| Universal package | One zip with all platform venvs and auto-detect launchers |
| Self growth | Persistent memory and auto-generated skills |
| Multi-platform connectors | Telegram / Discord / Slack / WhatsApp / Signal / Email / CLI |
| Scheduled automation | Natural-language cron for reports, backups, briefings |
| Sub-agent delegation | Isolated child conversations, terminals, Python RPC |
| Sandbox isolation | local / Docker / SSH / Singularity / Modal backends |
| Visual config center | Model, key, connection test, model switching, logs, import/export |

Every feature should feel native inside the existing client UI.

### Quick Start

```powershell
cd E:\source\openclawpro-agent-hub
npm install
npm run typecheck
npm run build
npm run deploy:usb
```

Launch:

```powershell
E:\win-unpacked\OpenClawPro.exe
```

### Diagnostics

```powershell
npm run scan:usb
npm run verify:hermes
npm run verify:openclaw
```

### Current Status

- OpenClaw runtime and OpenAI-compatible chat passthrough are implemented.
- Hermes runtime, dashboard, API startup, zero-trace env redirection, and config center are implemented.
- Old Hermes dist patch assets are removed.
- Windows x64 USB instance is the current verified target.
- macOS/Linux universal runtimes and launchers are still in progress.
