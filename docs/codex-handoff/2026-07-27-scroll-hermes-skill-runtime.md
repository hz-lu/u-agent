# 2026-07-27 Windows 页面滚动、Hermes 状态与股票 Skill 运行时修复

## 总体目标

在保留 OpenClaw 原有功能和界面体验的基础上，将 Hermes Agent 无缝集成到 U 盘便携版中，实现 OpenClaw、Hermes 与协同模式可独立或协作运行，共享模型、技能、记忆和工具能力，并达到 Windows/macOS/Linux 三平台原生、零安装、零痕迹、可复制到任意 U 盘即插即用的正式产品标准。

## 当前目标

修复 Windows 端首页、模型配置和环境检查无法滚动，OpenClaw 对话自动抢回底部，Hermes 长任务缺少过程反馈、环境状态假阴性，以及 OpenClaw 股票 Skill 找不到便携 Python/依赖的问题。

## 本轮完成

- 首页、模型配置、环境检查建立稳定的页面级滚动；首页 Flex 一级区块禁止收缩，避免卡片被压扁而不产生滚动距离。
- OpenClaw 对话取消不可取消的平滑滚动动画。用户向上离开底部后，流式更新不再持续抢占滚轮。
- Hermes 心跳和阶段进度写入对话区的执行过程消息；协同模式继续隐藏 Hermes 内部过程。
- Hermes 环境检查改用真实端口探测，不再只读快速缓存快照。
- Hermes 持久记忆和自我成长从 `data/.hermes/config.yaml` 读取真实启用状态；技能状态使用根 `skills` 轻量计数作为报告缺失时的兜底。
- OpenClaw Gateway 环境增加 `runtime/python3`、`OPENCLAW_PORTABLE_ROOT` 和 UTF-8 Python 环境变量，确保 Skill 使用 U 盘 Python。
- Windows runtime 合同新增股票 Skill 所需 Python 与依赖目录；runtime 打包会验证 `pydantic/requests/yaml/pytz/numpy/pandas/pyarrow/akshare`，缺失时直接失败。
- F 盘便携 Python 已安装 `requests/PyYAML/pytz/pyarrow/akshare` 及其依赖。

## 验证结果

- `npm run typecheck`：通过。
- `npm run build`：通过。
- `npm run audit:openclaw-shell`：51/51 通过（补强审计后需再次执行）。
- F 盘 Hermes runtime 验证：通过；配置端口和 API 端口可检测。
- F 盘 Hermes 持久记忆验证：通过，MEMORY/USER 可写。
- F 盘 Hermes Skill 验证：314 个源包完成镜像，286 个官方命令可见。
- Windows 共享 Skill 闭环：OpenClaw 245 个 prompt 可见，Hermes 286 个命令可见，多 Skill 解析通过。
- 股票 Skill 真实调用：`tool_check_trading_status` 成功返回 A 股交易状态。
- 真实 Electron 窗口验证：首页、模型配置、环境检查均可滚动；Hermes 记忆、自我成长、技能状态显示正常。

## 运行目录同步

最新 `dist` 已同步到 `F:\win-unpacked\resources\app\dist`，三个关键文件 SHA-256 与构建目录一致。F 盘 `runtime/python3` 已补齐本轮股票 Skill 依赖。Electron 二进制壳未变，不需要重打 `OpenClawPro.exe`。

## 后续建议

- 在配置完整模型额度的测试环境中，分别发送一个 Hermes 长任务和 OpenClaw 股票查询，确认对话过程反馈及最终结果的产品体验。
- 正式 release 必须从包含 `runtime/python3` 及上述依赖的 runtime 源构建；旧 runtime zip 会被新合同拒绝，不能继续作为完整发行包使用。
