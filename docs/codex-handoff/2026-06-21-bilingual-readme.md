# Codex Handoff

## 总体目标
基于已开发的 U 盘便携版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并与现有程序前端界面无缝融合，让用户在前端界面上获得良好的 OpenClaw + Hermes 协作体验。

## 当前目标
README 需要支持中文，不能只有英文版；同时继续保持英文协作者可读。

## 已完成
- 将 `README.md` 改为中文优先的双语文档。
- 中文部分完整描述项目定位、核心能力、当前版本范围、便携目录、零痕迹数据策略、技能安装与共用、主要界面、release 打包、开发、验证命令、源码结构和安全注意事项。
- 保留英文摘要区，包含功能、当前 release 范围、打包命令、开发命令和安全说明。

## 改动文件
- `README.md`
- `docs/codex-handoff/2026-06-21-bilingual-readme.md`

## 关键决策
- README 以中文为主，顶部提供 English 锚点，满足主要用户阅读习惯。
- 英文部分保留为摘要而不是完整重复，避免 README 过长且难维护。
- README 描述当前工程能力，不写开发过程流水账。

## 待继续
- 后续三平台 runtime 和 Universal zip 真正完成后，需要更新“当前版本范围”表格。
- 正式模型 API/token 平台上线后，需要更新 README 中购买入口相关说明。

## 验证结果
- 已确认 README 包含中文入口、中文核心能力、release 打包说明和 English 章节。
- `git diff --stat` 显示 README 更新规模符合预期。

## 如果需要下一台 Codex 接手，提示词
请在 `E:\source\openclawpro-agent-hub` 继续开发。README 已改为中文优先的双语版本，当前 Windows 便携版能力已在 README 中说明。后续如果新增三平台 Universal 包、正式模型 API/token 平台或 Hermes 官方能力闭环，需要同步更新 README 和 handoff。
