# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并与现有前端界面无缝融合，保证 OpenClaw 原有体验稳定。

## 当前目标
修复模型配置页面出现两条相同的默认置顶“词符科技 / 请填写模型名称”配置项的问题，并让默认置顶项使用明确 flag 标识。

## 已完成
- 将默认置顶词符科技模型统一标记为 `isCifuDefault: 1`。
- 前端模型归一化只通过 `isCifuDefault === true || isCifuDefault === 1` 识别默认置顶项，不再通过 label、value、provider/modelName 猜测。
- 从 OpenClaw 配置恢复模型列表时，只有模型条目自身带 `isCifuDefault` 才会被识别为默认置顶项。
- 保存模型配置到 OpenClaw 配置时，默认置顶项会把 `isCifuDefault: 1` 写入 `models[]`，避免重启后身份丢失。
- 新增的词符科技推荐模型不带该 flag，因此会作为普通模型配置保留，不会被归并到默认项。
- 按用户要求，本次没有修改或刷新 `D:\share\1\o\1` release 目录。

## 改动文件
- `src/main/runtime/openclaw-runtime.ts`
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/main/index.js`
- `dist/assets/assets/main-DIeui7ZO.js`
- `dist/main/index.js`
- `docs/codex-handoff/2026-07-01-cifu-default-flag.md`

## 关键决策
- 默认置顶项身份必须由显式字段 `isCifuDefault: 1` 表达，不能靠“词符科技”名称、`cifu-tech-default` value 或 `cifu/请填写模型名称` 组合推断。
- 新增词符科技推荐模型是普通配置项，除非显式带 `isCifuDefault`，否则不能被锁定、置顶或归并。
- release 目录正在被用户拷贝，当前阶段只提交源码和仓库内构建产物，不触碰 release 输出目录。

## 待继续
- 用户确认 release 拷贝结束后，再按需要重新构建并刷新 release 目录。
- 如已有 U 盘上的旧数据里存在重复默认项，建议在新版启动后由归一化逻辑保存一次模型配置，或手动清理旧 `localStorage`/旧模型配置残留。

## 验证结果
- `node --check src/openclaw-shell-app/dist/main/index.js` 通过。
- `node --check dist/main/index.js` 通过。
- `node --check src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js` 通过。
- `node --check dist/assets/assets/main-DIeui7ZO.js` 通过。
- `git diff --check` 通过。
- 搜索确认没有残留 `value === cifuDefaultModel`、`isPlaceholderCifu`、`isCifuDefault: true` 等旧判断。

## 如果需要下一台 Codex 接手，提示词
请继续在 `D:\github\u-agent` 开发。当前刚完成“词符科技默认置顶模型使用 `isCifuDefault: 1` 显式标识”的修复，注意不要再用 label/value/provider/modelName 猜默认项。用户要求在拷贝 release 时不要触碰 `D:\share\1\o\1`。下一步如用户允许，可以重新构建并刷新 release；否则只在源码仓库内工作。提交前运行 `node --check` 检查两个 main bundle 和两个 renderer bundle，并执行 `git diff --check`。
