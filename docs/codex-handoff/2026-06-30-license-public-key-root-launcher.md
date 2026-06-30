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
将客户端授权验签公钥替换为用户提供的新 Ed25519 公钥，并重新生成 Windows release，使 U 盘根目录可直接双击 `OpenClawPro U盘便携版.exe` 启动。

## 已完成
- 将 `LICENSE_PUBLIC_KEY_PEM` 中的公钥替换为：
  `MCowBQYDK2VwAyEA29uQxiQyam4tRMJfeul/MEZX8NOYVp6AM35bYGavo8I=`
- 新增 `scripts/build-windows-root-launcher.mjs`，生成小体积根目录启动器 `OpenClawPro U盘便携版.exe`。
- 根目录启动器只负责启动同目录下的 `win-unpacked/OpenClawPro.exe`，不是孤立 Electron 壳。
- `npm run release:windows-dir` 已改为：
  - 删除旧 `OpenClawPro.exe`
  - 删除 `启动OpenClawPro.bat`
  - 生成 `OpenClawPro U盘便携版.exe`
  - 刷新 README 与 manifest 的启动入口
- 已重新构建 Windows 壳并刷新 `D:\share\1\o\1`。

## 改动文件
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `package.json`
- `scripts/build-windows-root-launcher.mjs`
- `scripts/stage-windows-release-dir.mjs`
- `scripts/build-windows-release.mjs`
- `docs/codex-handoff/2026-06-30-license-public-key-root-launcher.md`

## 关键决策
- 不再把完整 Electron exe 复制到 release 根目录，避免缺少 `resources` 的孤立 exe 被误启动。
- 根目录启动体验通过一个 26KB 左右的转发启动器实现，保留用户习惯的 `OpenClawPro U盘便携版.exe`。
- 授权算法仍是当前 Ed25519 JSON `.license` 方案，只替换客户端公钥；授权工具必须使用对应私钥签发 `.license`。

## 待继续
- 用户需要用对应新私钥生成 `.license`，放到 U 盘根目录测试授权。
- 如果后续决定切换到 HMAC-SHA256，需要另行改客户端 `.license` 校验逻辑。
- 如果要把 F 盘测试包也同步，需要复制 `D:\share\1\o\1` 的根目录启动器和最新 `win-unpacked` 到 F 盘。

## 验证结果
- `npm run package:windows-root-launcher -- "D:\github\u-agent\OpenClawPro U盘便携版.exe"`：通过。
- `npm run package:windows-shell`：通过；Electron 下载超时但复用现有壳，app dist 已更新。
- `npm run release:windows-dir`：通过，生成 `D:\share\1\o\1\OpenClawPro U盘便携版.exe`。
- 静态检查确认以下文件均包含新公钥且不含旧公钥：
  - `src/openclaw-shell-app/dist/main/index.js`
  - `dist/main/index.cjs`
  - `win-unpacked/resources/app/dist/main/index.cjs`
  - `D:\share\1\o\1\win-unpacked\resources\app\dist\main\index.cjs`
- `openclaw config validate --json`：通过，`valid: true`。
- `npm run audit:portable`：Windows 启动器识别通过；三平台/Universal zip 仍未完成。

## 如果需要下一台 Codex 接手，提示词
请在 `D:\github\u-agent` 继续开发。当前已把授权公钥替换为 `MCowBQYDK2VwAyEA29uQxiQyam4tRMJfeul/MEZX8NOYVp6AM35bYGavo8I=`，并新增根目录启动器生成脚本 `scripts/build-windows-root-launcher.mjs`。release 目录 `D:\share\1\o\1` 已刷新，根目录入口是 `OpenClawPro U盘便携版.exe`。如需验证授权，请用对应私钥签发当前 Ed25519 JSON `.license`，放在 U 盘根目录。
