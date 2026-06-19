# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：

- 零安装：Python / Node 运行时自带，不依赖系统任何东西。
- 零痕迹：所有读写劫持到 U 盘 `data/` 目录，宿主机零接触。
- 三平台原生：macOS arm64/x64、Linux x64/arm64、Windows x64。
- Universal 包：单个 zip 带齐三平台 venv，启动器自动识别。
- 自我成长：持久记忆 + 自动生成技能，运行越久越强。
- 多平台接入：Telegram/Discord/Slack/WhatsApp/Signal/Email/CLI，一处启动多处可达。
- 定时自动化：自然语言 cron 调度，无人值守执行报告/备份/简报。
- 子代理委派：隔离子对话 + 独立终端 + Python RPC，零上下文成本流水线。
- 沙箱隔离：本地/Docker/SSH/Singularity/Modal 五种后端。
- 可视化配置中心：选模型/填 Key/测试连接/换模型/查看日志/导入导出。

以上任务均要和现有程序前端界面无缝融合，让用户在前端界面上获得良好操作体验。

## 当前目标
继续完善 Hermes 可视化配置中心，把配置导入从手动粘贴路径升级为系统文件选择器，并让连接器/沙箱测试生成可追踪的本地测试报告。

## 已完成
- 新增 Electron 文件选择器 IPC：`hermes:pick-config-file`。
- 前端 Hermes 配置中心新增“选择”按钮，可直接选择 JSON 配置文件后导入。
- `ActionResult` 增加 `details` 字段，新增 `FilePickResult` 类型。
- Hermes 连接器测试会生成报告：
  - `E:\data\.hermes\reports\connectors\<id>-last-test.json`
- Hermes 沙箱测试会生成报告：
  - `E:\data\.hermes\reports\sandboxes\<id>-last-test.json`
- 前端测试后展示完成/需要处理、错误或成功信息、报告路径、测试细节。
- 继续保持旧 Hermes dist patch 层不回归。

## 改动文件
- `src/shared/types.ts`
- `src/main/index.ts`
- `src/main/runtime/hermes/hermes-runtime.ts`
- `src/preload/index.ts`
- `src/renderer/App.vue`
- `src/renderer/styles.css`
- `dist/**`
- `docs/codex-handoff/2026-06-19-hermes-config-import-test-reports.md`

## 关键决策
- 配置导入使用 Electron 原生 `dialog.showOpenDialog`，不引入新依赖。
- 测试报告写入 U 盘 `data/.hermes/reports`，属于零痕迹数据目录。
- 连接器测试仍保持本地确定性校验，不主动请求外部平台，避免误发用户 token。
- 沙箱测试继续保持轻量 dry-run：必填字段校验，Docker socket 路径存在性校验。

## 待继续
- 增加真实可选连接器连通性测试，并在 UI 上明确“本地检查/真实连通性检查”的区别。
- 增加配置文件保存对话框，让导出路径也可由用户选择。
- 增加沙箱后端真实 dry-run：local command、Docker info、SSH 登录、Singularity image、Modal token。
- 继续推进自然语言 cron 的 Hermes/LLM 解析。
- 使用 Electron 窗口实际检查配置中心布局和导入弹窗体验。

## 验证结果
- `npm run typecheck` 通过。
- `npm run build` 通过。
- 已同步 `dist` 回 `E:\source\openclawpro-agent-hub`。
- 已运行 `node scripts/deploy-to-usb.mjs`，部署到 `E:\win-unpacked\resources\app`，备份目录为 `E:\backups\app-full-source-20260619111106`。
- `node --check E:\win-unpacked\resources\app\dist\main\index.js` 通过。
- `node --check E:\win-unpacked\resources\app\dist\main\runtime\hermes\hermes-runtime.js` 通过。
- `scripts\verify-hermes-runtime.mjs` 通过，Hermes Agent 为 `v0.15.1`，Python `3.12.13`，Node `v24.15.0`，零痕迹环境指向 `E:\data\.hermes`。
- `scripts\verify-openclaw-runtime.mjs` 通过，OpenClaw 配置存在，默认模型配置可读，API Key 仅显示 present。
- 部署后的 `dist/assets` 中未发现旧 Hermes patch/enhance 资产。

## 如果需要下一台 Codex 接手，提示词
请在 `E:\source\openclawpro-agent-hub` 继续开发。当前完整源码工程已经替代旧 dist 补丁层；Hermes 配置中心已有模型配置、连接器/沙箱字段编辑、导入导出、文件选择器、测试报告落盘。下一步建议做真实连接器连通性测试、导出文件保存对话框、沙箱真实 dry-run 或自然语言 cron 解析。每个阶段完成后按 `git status`、`git diff`、`git add ...`、`git commit -m "..."`、`git push` 流程提交，并新增一份包含“总体目标”的 `docs/codex-handoff/YYYY-MM-DD-xxx.md`。
