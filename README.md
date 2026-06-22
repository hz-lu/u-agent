# OpenClawPro Agent Hub

中文 | [English](#english)

OpenClawPro Agent Hub 是一个面向 U 盘即插即用场景的便携式桌面客户端，把 OpenClaw 与 Hermes Agent 集成在同一个应用里。用户把正式 release 包解压到任意 U 盘后，就可以在桌面界面中完成模型配置、启动/停止 Agent、AI 会话、技能管理、环境检查、日志查看和聊天工具连接。

项目目标不是做一个独立的 Hermes 补丁层，而是在保留原 OpenClaw 桌面体验的基础上，把 Hermes 作为一等 Agent 融入首页控制台、AI 会话、模型配置、环境检查、技能管理、日志和配置入口中。

## 核心能力

- U 盘便携运行 OpenClaw 与 Hermes Agent。
- Windows release 包内置所需 Python、Node.js、OpenClaw、Hermes 运行时。
- 运行数据集中写入 U 盘 `data/` 目录，避免依赖宿主机用户目录。
- 首页统一提供 OpenClaw/Hermes 的启动、停止、重启、状态和日志入口。
- OpenClaw 与 Hermes 共用 U 盘 `skills/` 目录中的技能。
- AI 会话支持 OpenClaw、Hermes、OpenClaw + Hermes 协同三种模式。
- 模型配置统一管理，一次配置即可供 OpenClaw 与 Hermes 使用。
- 支持模型 API Key 配置、模型编辑、连接测试、日志查看、导入导出等配置体验。
- 提供 Hermes 持久记忆、技能同步、技能成长验证、连接器、定时任务、沙箱和 Dashboard 入口。
- 可生成不包含现有用户数据的 Windows 便携 release zip。

## 当前版本范围

当前可交付版本重点是 Windows x64 便携版。

当前 GitHub 仓库保存的是可构建源码和 OpenClaw Shell 基线，不提交本地 `win-unpacked/`、`runtime/`、`data/`、`node_modules/` 等大体积或用户态产物。新机器克隆后可以完成源码构建；正式 Windows U 盘开箱即用包还需要由 release 流程提供完整 runtime 和 launcher 资产。

| 能力 | 状态 |
| --- | --- |
| 原 OpenClaw UI + Hermes 融合源码基线 | 已恢复 |
| 源码构建与功能标记审计 | 已支持 |
| Windows 便携客户端 release 脚本 | 已支持，待接入完整 runtime 资产 |
| Windows 零安装运行 | release 目标，当前 GitHub 源码不内置 runtime |
| U 盘本地 `data/` 数据目录 | 已支持 |
| OpenClaw 运行时 | release 目标，需预置 `runtime/openclaw.*` 与完整 dist |
| Hermes Windows 运行时 | release 目标，需预置 `runtime/HermesPortable/` |
| OpenClaw/Hermes 共用技能 | 已支持 |
| 干净 Windows release zip | 脚本已支持，待 Windows U 盘实包复测 |
| macOS arm64/x64 运行时包 | 尚未打包 |
| Linux x64/arm64 运行时包 | 尚未打包 |
| 三平台 Universal zip | 尚未打包 |

## 便携目录结构

Windows 便携包解压到 U 盘根目录后，推荐结构如下：

```text
X:\
|-- OpenClawPro*.exe
|-- win-unpacked\
|   `-- OpenClawPro.exe
|-- runtime\
|   |-- openclaw.zip
|   |-- openclaw.cmd
|   |-- node.exe
|   `-- HermesPortable\
|-- skills\
|-- extensions\
`-- data\
    |-- .openclaw\
    `-- .hermes\
```

`X:` 表示任意 U 盘盘符。

运行时资产契约维护在 `runtime/PORTABLE-RUNTIME-MANIFEST.json`。该文件只记录必须存在的 launcher、OpenClaw、Node、Hermes、Python 等路径，不提交大体积 runtime 二进制；生成 release 前应先让 `npm run audit:portable` 中对应平台的 manifest 缺失项清零。

仓库会提交必要目录的 `.gitkeep` 骨架，例如 `win-unpacked/`、`runtime/`、`data/`、`skills/`、`extensions/`。克隆后不需要手动猜目录，只需要把 Windows 程序壳和 runtime 二进制补到 manifest 指定路径。真实用户数据、日志、缓存、`win-unpacked` 二进制、runtime 二进制仍会被 `.gitignore` 排除，不应提交。

## 零痕迹数据策略

运行状态会尽量重定向到 U 盘：

```text
data/.openclaw/    OpenClaw 配置、插件状态、聊天状态、日志
data/.hermes/      Hermes home、配置、缓存、日志、记忆、技能、定时任务、沙箱
skills/            OpenClaw 与 Hermes 共用技能安装目录
extensions/        便携插件/扩展目录
```

Hermes 启动时会使用 U 盘本地环境变量，例如：

```text
HOME=data/.hermes/home
USERPROFILE=data/.hermes/home
XDG_CONFIG_HOME=data/.hermes/config
XDG_CACHE_HOME=data/.hermes/cache
HERMES_HOME=data/.hermes
HERMES_LOG_DIR=data/.hermes/logs
HERMES_MEMORY_PATH=data/.hermes/memories
HERMES_SKILLS_PATH=data/.hermes/skills
TMP=data/.hermes/tmp
TEMP=data/.hermes/tmp
```

release 打包脚本会创建初始化 `data/`，并排除以下已有用户数据：

- `.license`
- API Key 和模型服务密钥
- 微信账号登录状态
- 聊天历史
- Hermes 认证文件
- Hermes 记忆
- 日志、缓存、报告、运行时数据库

## 技能安装与共用

把技能安装到 U 盘根目录的 `skills/`：

```text
X:\skills\my-skill\SKILL.md
X:\skills\my-skill\...
```

也可以放单文件 Markdown 技能：

```text
X:\skills\my-skill.md
```

OpenClaw 会直接读取该目录。要让 Hermes 使用同一批技能：

1. 打开桌面程序。
2. 进入“技能管理”。
3. 确认目标技能已启用。
4. 点击 Hermes 技能同步操作。
5. 如需验证，重新运行“环境检查”中的 Hermes 技能可见性检查。

同步后，启用的 OpenClaw 技能会镜像到：

```text
data/.hermes/skills/openclaw/
```

建议始终把 `skills/` 作为统一安装入口。除非你明确要创建 Hermes 专属技能，否则不要手动把共用技能装进 `data/.hermes/skills/`。

## 主要界面

### 首页控制台

首页提供 OpenClaw 与 Hermes 的运行控制：

- 启动
- 停止
- 重启
- 状态
- 日志
- Hermes 配置中心
- Hermes Dashboard
- Hermes Agent API

### AI 会话

AI 会话支持三种模式：

- OpenClaw：通过 OpenClaw Gateway 对话。
- Hermes：直接与 Hermes Agent 对话。
- 协同：OpenClaw 先生成草案或执行任务，再由 Hermes 复核、增强或汇总。

Hermes 与协同会话状态会在切换页面后保留。

### 模型配置

模型配置是统一的。用户只需要配置一次模型服务和 API Key，OpenClaw 与 Hermes 就可以共用同一套配置。已配置模型支持编辑、删除、切换当前模型；页面顶部预留了官方模型 API/token 购买入口。

### 环境检查

环境检查会展示 OpenClaw 运行时、Hermes 运行时、Python/Node、端口、持久记忆、技能可见性和技能成长验证状态。

比较重的 Hermes 检查，例如记忆验证和技能扫描，会尽量做成显式操作或脚本，避免 UI 自动刷新时卡死。

### 聊天工具

聊天工具包含微信连接能力。重新扫码可能会重启 OpenClaw Gateway 以加载账号配置；重启后 UI 会恢复 Gateway 状态，并让 AI 会话重新连接。

## 生成正式 release 包

生成干净 Windows 便携 zip：

```powershell
cd E:\source\openclawpro-agent-hub
node scripts\build-windows-release.mjs
```

生成产物位于：

```text
E:\release\OpenClawPro-AgentHub-Windows-Portable-YYYYMMDDHHMMSS.zip
```

该 zip 适合作为 GitHub Release 附件上传，不应提交进 Git 仓库。

推荐使用方式：

1. 下载 release zip。
2. 解压到 U 盘根目录，例如 `F:\`。
3. 尽量保持路径短，避免 Windows Python 依赖遇到长路径问题。
4. 启动顶层 `OpenClawPro*.exe` 启动器，或启动 `win-unpacked\OpenClawPro.exe`。
5. 在 UI 中完成激活、模型配置和连接器设置。

## 开发

安装依赖并构建：

```powershell
cd E:\source\openclawpro-agent-hub
npm install
npm run typecheck
npm run build
```

部署构建产物到当前 U 盘应用目录：

```powershell
npm run deploy:usb
```

从原始 OpenClaw 壳恢复并注入当前 Hermes 集成：

```powershell
npm run restore:openclaw-shell
```

## 验证命令

```powershell
npm run scan:usb
npm run audit:portable
npm run verify:openclaw
npm run verify:hermes
npm run verify:hermes-memory
npm run verify:hermes-skills
npm run verify:hermes-skill-growth
```

常用直接检查：

```powershell
node --check scripts\restore-openclaw-shell.mjs
node --check scripts\build-windows-release.mjs
node --check E:\win-unpacked\resources\app\dist\main\index.js
```

## 源码结构

```text
src/
|-- main/        Electron 主进程和运行时管理
|-- preload/     安全 IPC 桥
|-- renderer/    Vue 前端界面
`-- shared/      共享类型和平台工具

scripts/
|-- restore-openclaw-shell.mjs
|-- build-windows-release.mjs
|-- audit-portable-release.mjs
|-- verify-hermes-runtime.mjs
|-- verify-hermes-memory.mjs
|-- verify-hermes-skills.mjs
|-- verify-hermes-skill-growth.mjs
`-- verify-openclaw-runtime.mjs
```

## 安全注意事项

- 不要把 release zip 提交到 Git。
- 不要提交 `.license`。
- 不要提交已使用 U 盘里的 `data/`。
- 不要提交 API Key、模型服务 token、微信账号状态、聊天历史或 Hermes 记忆文件。
- 使用 `scripts/build-windows-release.mjs` 生成干净可分发包。

---

## English

OpenClawPro Agent Hub is a portable desktop client that brings OpenClaw and Hermes Agent into one USB-first application. Copy the release package to a USB drive, launch the client, configure models and keys from the UI, then use OpenClaw, Hermes, skills, chat, automation, logs, and connector features from the same interface.

The project preserves the original OpenClaw desktop experience while integrating Hermes Agent as a first-class runtime across the home console, AI chat, model configuration, environment checks, skill management, logs, and configuration entry points.

### Features

- Runs OpenClaw and Hermes Agent from a portable USB layout.
- Bundles the required Windows runtime files for Python, Node.js, OpenClaw, and Hermes.
- Keeps application state under the USB `data/` directory.
- Provides unified start, stop, restart, status, log, and configuration controls.
- Lets OpenClaw and Hermes share skills from the USB `skills/` directory.
- Supports OpenClaw chat, Hermes chat, and OpenClaw + Hermes collaborative chat.
- Uses one model configuration for both OpenClaw and Hermes where applicable.
- Provides model editing, API key setup, connection testing, log viewing, import/export flows, and a placeholder entry for an official token/API purchase platform.
- Includes Hermes memory, skill sync, skill growth verification, connector, schedule, sandbox, and dashboard entry points.
- Builds a clean Windows portable release zip without existing user data.

### Current Release Scope

The current working release target is Windows x64 portable.

| Capability | Status |
| --- | --- |
| Windows portable app | Available |
| Zero install on Windows | Available |
| USB-local data directory | Available |
| OpenClaw runtime | Available |
| Hermes Windows runtime | Available |
| Shared OpenClaw/Hermes skills | Available |
| Clean Windows release zip | Available |
| macOS arm64/x64 runtime bundle | Not yet bundled |
| Linux x64/arm64 runtime bundle | Not yet bundled |
| Universal three-platform zip | Not yet bundled |

### Release Package

Build a clean Windows portable release zip:

```powershell
cd E:\source\openclawpro-agent-hub
node scripts\build-windows-release.mjs
```

The generated artifact is written to:

```text
E:\release\OpenClawPro-AgentHub-Windows-Portable-YYYYMMDDHHMMSS.zip
```

The zip is intended to be uploaded as a GitHub Release asset, not committed into the Git repository.

### Development

```powershell
cd E:\source\openclawpro-agent-hub
npm install
npm run typecheck
npm run build
npm run restore:openclaw-shell
```

### Security Notes

- Do not commit release zips to Git.
- Do not commit `.license`.
- Do not commit `data/` from a used USB drive.
- Do not commit API keys, model provider tokens, WeChat account state, chat history, or Hermes memory files.
- Use `scripts/build-windows-release.mjs` to create clean distributable packages.
