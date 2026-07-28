# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

修复 macOS U 盘中 Hermes 已显示启动但对话失败，以及 OpenClaw 首次对话仍沿用旧的 95 个技能快照的问题。

## 已完成

- 定位 Hermes 对话失败根因：U 盘 Hermes Python 源文件包含 NUL 字节，不是模型、Key 或 Base URL 问题。
- 增加 Hermes 全量 Python 源文件完整性校验，构建/交付检查会拒绝含 NUL 字节或不可读取路径的 runtime。
- Hermes 对话现在会把 `source code string cannot contain null bytes` 明确归类为运行时损坏，并给出只替换 `runtime/HermesPortable` 的修复动作。
- OpenClaw 在 Gateway 每次启动前清除持久化技能快照，保留会话和聊天历史，确保第一条对话重新生成当前技能 prompt。
- 已从源码重新生成 macOS 程序壳，并同步到本机 `release/macos-usb-root-exfat/OpenClawPro.app`。
- OpenClaw 官方 CLI 实测识别 283 个技能，其中 240 个满足当前依赖并对模型可见；旧回答 95 来自刷新前的历史快照。

## 改动文件

- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/verify-macos-hermes-runtime.mjs`
- `scripts/verify-hermes-start-single-flight.mjs`
- `scripts/verify-openclaw-chat-skill-sync.mjs`
- `docs/codex-handoff/2026-07-28-macos-hermes-corruption-openclaw-snapshot.md`

## 关键决策

- 不删除 OpenClaw 聊天历史，只删除可重建的 `skillsSnapshot` 字段。
- 不在正常应用启动路径全盘扫描 6200 多个 Python 文件，避免恢复 exFAT 慢盘卡顿；全量扫描放在 release/runtime verifier 中，对话运行时错误则做准确分类。
- 技能数量区分“磁盘包数量”“OpenClaw 可解析数量”和“当前依赖满足、模型可见数量”，不再把技能管理页目录数冒充可用数。
- 当前 U 盘不再继续写入：只读 `diskutil verifyVolume` 已确认 exFAT 文件系统严重损坏。

## 待继续

- 先修复或重新格式化当前 U 盘，推荐换健康介质后再复制 release。
- 只从本机 `release/macos-usb-root-exfat` 复制到健康 U 盘，不复用当前损坏 U 盘中的 runtime。
- 在健康 U 盘上验证 Hermes 启动和真实 one-shot 对话。
- 在 OpenClaw 新启动后的第一条消息验证技能快照已刷新；以 `/skill` 和官方 `skills list --json` 为准，不以旧聊天回答为准。
- 对 43 个当前不可用技能按 `missing.env`、`missing.bins`、`missing.config` 补依赖；重复名称或无效 metadata 的技能应单独治理。

## 验证结果

- `node scripts/verify-hermes-start-single-flight.mjs`：通过。
- `node scripts/verify-openclaw-chat-skill-sync.mjs`：通过。
- `node scripts/verify-ai-chat-skill-runtime.mjs`：通过。
- `node scripts/verify-skill-metadata.mjs`：通过。
- 本机 release Hermes verifier：6208 个 `.py`，0 个 NUL，0 个不可读取路径，通过。
- U 盘 Hermes verifier：仅能读取 4901 个 `.py`，149 个含 NUL，23 个路径返回 EIO/EINVAL，失败。
- `diskutil verifyVolume /Volumes/OPENCLAW`：失败，`fsck_exfat` exit 203，卷被判定为 corrupt and needs to be repaired。
- `npm run package:macos-shell`：通过。
- 打包后 `OpenClawPro.app` 主进程 `node --check`：通过。

## 如果需要下一台 Codex 接手，提示词

继续 `/Users/ly/data/codex/u-agent` 的 `feat/macos-portable-app` 分支。先读取本 handoff。不要向当前损坏的 `/Volumes/OPENCLAW` 写入。先确认用户已更换或重建健康 U 盘，再从 `release/macos-usb-root-exfat` 部署并做 Hermes 真对话、OpenClaw 第一条对话技能快照和 `/skill` 数量验证。保持 `src/openclaw-shell-app/dist` 为源码基准，不直接合并主干，不提交 runtime、release、用户 data 或本地目录 `mac_release_07_22/`、`uclaw/`。
