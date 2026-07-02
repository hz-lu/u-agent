# Codex Handoff

## 总体目标
基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标
先面向 Apple Silicon Mac 做可复制到任意 U 盘根目录的瘦身 release 包，目录保持：

```text
U盘根目录/
  OpenClawPro.app
  runtime/
  data/
  skills/
  extensions/
```

暂不适配 Intel Mac，先解决完整 runtime 直接拷贝到 exFAT U 盘时海量小文件导致极慢、掉盘和不可测的问题。

## 已完成
- 修改 `scripts/stage-macos-portable-test.mjs`，macOS final USB root release 默认使用 slim runtime profile。
- release 不再复制整个 `runtime/`，只投影 Apple Silicon Mac 当前运行需要的根级 runtime 布局：
  - `runtime/node`
  - `runtime/openclaw`
  - `runtime/node_modules/openclaw`
  - `runtime/HermesPortable`
- 移除 macOS release 中的 Windows、Linux、macOS x64 占位 runtime 目录。
- 为根级 OpenClaw runtime 生成便携启动脚本，确保 `runtime/openclaw` 调用 `runtime/node` 和 `runtime/node_modules/openclaw/openclaw.mjs`。
- 对 Hermes Python venv 做便携化处理：
  - 重写 `venv/bin/python`、`python3`、`python3.12` 为 wrapper，设置 `PYTHONHOME` 和 `PYTHONPATH`。
  - 重写 console script shebang 为 `/usr/bin/env python3`。
  - 重写 `pyvenv.cfg`，移除构建机绝对路径依赖。
- 对 exFAT 做兼容处理：
  - release 中符号链接实体化或移除坏链接。
  - 最终检查剩余 symlink 为 0。
- 过滤运行时非必要内容：
  - OpenClaw: docs、src、patches、skills、test/tests、README、LICENSE、CHANGELOG、markdown、`.d.ts`、`.ts`、source map 等。
  - Hermes: `__pycache__`、`.pyc`、tests、docs、website、build、optional-skills、optional-mcps、packaging、ui-tui、pyi、部分 dist-info 记录等。
- 生成并验证新的 release：
  - `release/macos-usb-root-exfat`
  - 根目录只有 `OpenClawPro.app`、`runtime`、`data`、`skills`、`extensions`。
  - 总大小约 1.4G。
  - runtime 约 640M。
  - 总文件数约 25939。
  - symlink 数为 0。

## 改动文件
- `scripts/stage-macos-portable-test.mjs`
- `docs/codex-handoff/2026-07-02-macos-slim-usb-runtime.md`

## 关键决策
- macOS 当前阶段只支持 Apple Silicon，先不带 Intel Mac runtime。
- 不再把全平台 runtime 直接复制进 macOS U 盘包。
- macOS U 盘包采用根级 runtime 布局，匹配当前主进程源码实际检查路径。
- Hermes 源码不能完全删除，当前主进程仍依赖：
  - `HermesPortable/hermes-agent/pyproject.toml`
  - `tools/memory_tool.py`
  - `agent/skill_commands.py`
- 微信插件不依赖在线下载，仍保留 `extensions/openclaw-weixin` 并在 release 中镜像到 `data/.openclaw/extensions/openclaw-weixin`。
- 不做 Developer ID 公证签名。当前脚本使用 ad-hoc 签名并清理 quarantine；本机生成、U 盘复制场景通常可打开，但跨机器仍可能需要用户右键打开一次。

## 待继续
- 用一块新的、稳定的 U 盘或移动 SSD 测试复制瘦身后的 `release/macos-usb-root-exfat/`。
- 在真实 U 盘上验证：
  - 双击根目录 `OpenClawPro.app` 可启动。
  - UI 是原 OpenClaw UI。
  - OpenClaw Gateway 可启动。
  - Hermes Dashboard 可启动。
  - Hermes 日志能写到 `data/.hermes/logs`。
  - 模型配置保存后 OpenClaw 与 Hermes 共用。
  - 微信插件能从 `extensions/openclaw-weixin` 离线镜像到 `data/.openclaw/extensions/openclaw-weixin`。
- 后续可继续压缩 Electron app 体积，当前 `OpenClawPro.app` 因 exFAT 实体化 symlink 后约 737M。
- 如果要做到完全无 Gatekeeper 提示，需要后续接入 Developer ID 签名与 notarization。

## 验证结果
- `node --check scripts/stage-macos-portable-test.mjs` 通过。
- `npm run stage:macos-usb-root:final` 通过。
- release 根目录检查通过，只包含五项。
- `release/macos-usb-root-exfat/runtime/openclaw --help` 返回 0。
- `release/macos-usb-root-exfat/runtime/HermesPortable/venv/bin/python --version` 返回 `Python 3.12.13`。
- `release/macos-usb-root-exfat/runtime/HermesPortable/venv/bin/hermes --version` 返回 `Hermes Agent v0.17.0`。
- Hermes Dashboard 启动探测通过，输出 `HERMES_DASHBOARD_READY port=19119`。
- release 中 symlink 数为 0。

## 如果需要下一台 Codex 接手，提示词
请继续接手 `/Users/ly/data/codex/u-agent`，优先读取最新 handoff：`docs/codex-handoff/2026-07-02-macos-slim-usb-runtime.md`。当前目标是用新的瘦身 macOS Apple Silicon U 盘 release 做真实端到端测试。不要再把完整全平台 runtime 直接铺到 exFAT U 盘；使用 `npm run stage:macos-usb-root:final` 生成 `release/macos-usb-root-exfat/`，该目录根部应只有 `OpenClawPro.app`、`runtime`、`data`、`skills`、`extensions`。测试前先检查 symlink 为 0、OpenClaw CLI、Hermes CLI、Hermes Dashboard 启动探测，然后再复制到新 U 盘根目录。
