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
修复模型配置页两个交互问题：列表编辑态切换不关闭，以及推荐模型里的词符科技保存后没有作为独立模型配置出现在列表中。

## 已完成
- 点击推荐模型卡片时，会先关闭当前“已配置模型”的编辑面板，避免旧编辑表单一直挂着。
- 点击已配置模型列表中的其他模型时，如果当前正在编辑另一个模型，会自动取消旧编辑态。
- 收窄默认词符科技识别逻辑：只有 `isCifuDefault`、默认 value 或纯标签 `词符科技` 才会被视为默认置顶项。
- 推荐模型里的词符科技保存时会按普通推荐模型新增独立配置，例如 `词符科技 / minimax-m3`，不会覆盖默认置顶词符科技。
- 重新构建 Windows 壳，并刷新 `D:\share\1\o\1` release 目录。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `docs/codex-handoff/2026-06-30-model-config-edit-state.md`

## 关键决策
- 默认置顶词符科技和推荐卡新增的词符科技模型是两类配置：默认项永远存在、不可删除；推荐新增项是普通推荐模型，可以独立出现在列表并参与切换。
- 切换模型时不强行保存编辑草稿，直接关闭旧编辑态，避免用户误以为还在编辑当前点击的模型。

## 待继续
- 需要用户在桌面程序里实际验证：编辑词符科技后点击其他模型，编辑面板应关闭；在推荐模型卡片中新增词符科技后，列表下方应出现独立配置项。
- 如果用户希望未保存编辑草稿切换前弹出确认，可后续再加。

## 验证结果
- `npm run package:windows-shell`：通过，Electron 下载超时但复用现有壳，app dist 已更新。
- `npm run release:windows-dir`：通过。
- `openclaw config validate --json`：通过，`valid: true`。
- 静态确认 release 包内 `main-DIeui7ZO.js` 已包含本轮逻辑。

## 如果需要下一台 Codex 接手，提示词
请在 `D:\github\u-agent` 继续开发。模型配置页逻辑位于 `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`。当前已修复编辑态切换和词符科技推荐卡新增逻辑，并已构建同步到 `D:\share\1\o\1`。如果用户反馈词符科技新增仍不显示，优先检查 `normalizeSelectedModels()` 的 `isCifuModel()` 判断是否又把 provider 为 `cifu` 的普通推荐项归并到默认置顶项。
