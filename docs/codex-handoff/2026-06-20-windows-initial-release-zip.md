# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长（持久记忆 + 自动生成技能）、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并和现有程序前端界面无缝融合。保留 OpenClaw 原有功能与体验，同时让 Hermes 在首页、AI 会话、模型配置、环境检查、技能管理等模块自然协同，为用户提供清晰、可操作、可验证的体验。

## 当前目标
生成一个正式 Windows 初始化 release zip：解压到任意 U 盘根目录后可即插即用，并且不携带当前 U 盘上的现有用户数据。

## 已完成
- 新增 `scripts/build-windows-release.mjs`，从当前可运行 U 盘产物直接生成 Windows portable release zip。
- release 包包含 `win-unpacked/`、OpenClaw runtime、Hermes Windows runtime、`skills/`、`extensions/` 和干净初始化 `data/`。
- release 包不包含 `.license`、API Key、模型密钥、微信账号登录态、聊天记录、Hermes auth、Hermes memory、日志、缓存、历史验证报告。
- 已生成本地 release 包：`E:\release\OpenClawPro-AgentHub-Windows-Portable-20260620204949.zip`。
- 已生成外部 manifest：`E:\release\OpenClawPro-AgentHub-Windows-Portable-20260620204949.manifest.json`。

## 改动文件
- `scripts/build-windows-release.mjs`
- `docs/codex-handoff/2026-06-20-windows-initial-release-zip.md`

## 关键决策
- `.license` 绑定当前 U 盘序列号，属于现有授权状态，不能放进“任意 U 盘初始化包”；新 U 盘首次使用需要按正常流程激活。
- 不直接复制 `E:\data`，而是在 zip 内生成干净初始化 `data/.openclaw/openclaw.json` 和 `data/.hermes/config.yaml`。
- release zip 不提交 Git 仓库，避免把 1.3GB 大二进制塞进源码历史；它应作为 GitHub Release asset 上传。
- 由于 Hermes Python 依赖存在很长文件名，建议用户解压到 U 盘根目录这类短路径，避免 Windows 长路径限制。

## 待继续
- 如需 GitHub 页面直接下载，需要把 `E:\release\OpenClawPro-AgentHub-Windows-Portable-20260620204949.zip` 上传为 GitHub Release asset。
- 可新增自动上传脚本，或在有 `gh` / GitHub token 的环境下执行 release 创建和 asset 上传。
- 后续继续补齐 macOS/Linux 运行时和 Universal zip。

## 验证结果
- `node --check scripts/build-windows-release.mjs` 通过。
- `node scripts/build-windows-release.mjs` 成功生成 zip。
- zip 大小：约 1326.4 MB，文件数 30589。
- zip 内容审计通过：
  - 包含 `win-unpacked/OpenClawPro.exe`
  - 包含顶层 `OpenClawPro U盘便携版.exe`
  - 包含 `runtime/openclaw.zip`、`runtime/openclaw.cmd`、`runtime/node.exe`
  - 包含 `runtime/HermesPortable/venv/Scripts/hermes.exe`
  - 包含 `runtime/HermesPortable/venv/Scripts/python.exe`
  - 包含 `runtime/HermesPortable/node/node.exe`
  - 包含 83 个 `SKILL.md`
  - 不包含 `.license`
  - `data/.openclaw/openclaw-weixin/accounts.json` 为空数组
  - `models.providers` 为空对象，`primary` 为空字符串
  - 未发现 `sk-...` API Key 或 auth token
  - 不包含聊天记录、Hermes memory 内容、Hermes reports

## 如果需要下一台 Codex 接手，提示词
继续在 `E:\source\openclawpro-agent-hub` 开发。当前已生成 Windows 初始化 release zip：`E:\release\OpenClawPro-AgentHub-Windows-Portable-20260620204949.zip`。这是本地 release artifact，不要提交进 Git。脚本为 `scripts/build-windows-release.mjs`，采用直接写 zip 的方式生成干净初始化 `data/`，不带 `.license`、API Key、微信账号、聊天记录、Hermes auth/memory/log/cache/report。下一步如果用户需要 GitHub 可下载，需要创建 GitHub Release 并上传该 zip 为 asset。每个阶段结束后执行 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push`，并新增 `docs/codex-handoff/YYYY-MM-DD-xxx.md`，handoff 必须包含“总体目标”。
