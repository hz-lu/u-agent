# macOS Skills And Hermes Runtime Design

## Goal

在不直接合并 `origin/main`、不改变现有 UI/模型/微信/聊天路由的前提下，修复 macOS U 盘版的三项问题：OpenClaw 会话只识别旧的 95 个技能、34 个股票技能缺少可执行依赖、Hermes 运行时损坏且并发启动产生错误状态。

## Source Of Truth

- 完整应用源码以 `src/openclaw-shell-app/dist/` 为准。
- `dist/` 和 `scripts/restore-openclaw-shell.mjs` 必须由现有构建流程从源码同步，不能成为独立补丁层。
- `skills/` 是 OpenClaw 与 Hermes 的共享技能事实源。
- `data/`、日志、用户会话、`.license` 和 U 盘现有 runtime 不进入 Git。

## Root Causes

### OpenClaw 只报告 95 个技能

技能管理数量、有效技能包数量、唯一声明名称、OpenClaw 环境合格数量和当前会话快照数量不是同一指标。当前 95 来自旧会话保存的技能快照及默认提示词容量，不是技能管理漏扫 314 个目录。

修复必须同时完成两件事：把 OpenClaw 官方技能容量提高到 400，并在技能仓库变化后使旧会话快照失效。保留历史消息，不改写用户会话；下一次对话使用刷新后的技能清单。

### 股票技能目录存在但不能执行

复制技能目录只提供技能说明和脚本。macOS runtime 仍缺 `numpy`、`pandas`、`pyarrow`、`akshare` 等 Python 包，OpenClaw Gateway 也没有稳定指向便携 Python。

新增独立的 `runtime/python3`，避免股票技能依赖 Hermes runtime。Gateway 进程设置 `OPENCLAW_PORTABLE_ROOT`、UTF-8、`PYTHONNOUSERSITE=1`，并将便携 Python 的 `bin` 放到 `PATH` 最前。打包和验证必须真实 import 依赖，并执行一个股票技能探针。

### Hermes 显示启动但长期不可用

当前 U 盘备份 runtime 的 Python 本体可运行，但导入任意 `site-packages` 时被 `SIGKILL`，所以配置服务无法监听 `17520`。同时 `HermesManager.start()` 可被并发调用，多次 spawn 会覆盖 `this.proc`，造成状态来回跳变。

正式修复由两部分组成：release 只接收通过 import/readiness 验证的 Hermes runtime；生命周期增加 single-flight，重复启动复用同一 Promise，退出回调只清理自己创建的 child。只有配置服务 `17520` 和 API `8642` 都 ready 才报告成功。

## Components

### Skill Capacity And Snapshot Refresh

- 写入 OpenClaw 配置时合并 `skills.limits`，不覆盖用户已有更高值。
- 技能仓库 worker 只在真实变化时发出变更报告。
- 主进程收到变更后删除会话中的 `skillsSnapshot`，不删除会话或消息。
- 保留事件触发、防抖和低频兜底，禁止恢复高频全盘扫描。

### Portable Python Runtime

- 目录：`runtime/macos-arm64/python3/`。
- 依赖：`pydantic`、`requests`、`PyYAML`、`pytz`、`numpy`、`pandas`、`pyarrow`、`akshare`。
- `runtime/PORTABLE-RUNTIME-MANIFEST.json` 声明文件与 import probe。
- staging 只复制 runtime，不写入用户数据。
- 股票技能探针必须从 U 盘布局下使用便携 Python 运行。

### Hermes Lifecycle

- `start()` 在 `starting` 状态复用 `_startPromise`。
- `stop()` 等待或中断当前启动，并保证状态变更串行。
- config、API 和 CLI child 分开持有，退出处理校验 child identity。
- 主动停止收到 `SIGTERM`/`SIGKILL` 记录为 interrupted，不伪装成 API 或模型错误。
- 环境检查先执行轻量 import probe，失败时直接报告 runtime 损坏及具体包。

## Error Handling

- 技能刷新失败只记录一次错误，不阻断 OpenClaw 对话。
- 股票依赖缺失时明确列出缺少的 Python 模块，不回退宿主机 Python。
- Hermes import probe 失败时禁止显示“启动成功”。
- 所有日志继续写入 U 盘 `data/`，不得打印聊天正文和密钥。

## Verification

1. 创建包含 314 个测试技能和旧 `skillsSnapshot` 的临时环境，刷新后快照被移除且技能限制为 400。
2. macOS 便携 Python 逐项 import 八个依赖，不读取系统 site-packages。
3. 至少一个股票技能工具在 staged U 盘布局下执行成功。
4. 并发调用三次 Hermes start，只产生一个 config server 和一个 API server。
5. Hermes runtime import 失败时，UI 状态为 error，日志包含失败模块，不出现启动成功。
6. 执行构建、类型检查、shell 审计、macOS staging 和 runtime 验证。

## Non-Goals

- 不整体合并或 cherry-pick 主干提交。
- 不重做 UI，不修改模型选择、微信消息、聊天展示或技能选择交互。
- 不让 OpenClaw 股票技能复用 Hermes Python。
- 不在应用启动期间解压大型 runtime。
