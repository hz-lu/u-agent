# AI 会话多技能功能实施计划（中文版）

> 实施时必须按任务逐项执行，每个任务都要先写失败测试，再做最小实现，通过验证后单独提交。

## 目标

把远程主干中最新的技能管理、技能同步和 `/skill` 会话调用能力迁移到 macOS 便携版，并增加以下完整能力：

- 输入 `/skill` 后显示可搜索的技能列表。
- 选择技能时不立即发送，只在输入框上方生成可删除的技能标签。
- 支持同时选择多个技能，再继续输入任务和添加附件。
- OpenClaw、Hermes 和协同模式都能使用技能。
- 协同模式优先 OpenClaw；OpenClaw 不可用或尚未接受任务时，才安全回退 Hermes。
- 整组技能只能由一个 Agent 执行，不能拆分、漏掉或重复执行。
- 技能扫描和复制不阻塞 Electron 主进程，不重新引入 exFAT U 盘卡顿。

## 总体架构

U 盘根目录的 `skills/` 是用户可见的统一技能仓库。OpenClaw 和 Hermes 自己安装到内部目录的技能，由独立 Node 子进程同步回统一仓库。技能元数据也由子进程扫描和解析，Electron 主进程只接收结构化结果。

主进程负责查询 OpenClaw、Hermes 官方真正可调用的技能列表，并根据会话模式准备调用请求。渲染进程只负责技能搜索、标签选择、草稿和界面显示，不自行判断某个 Agent 是否支持技能。

## 全局约束

- `src/openclaw-shell-app/` 是唯一源码基准。
- 根目录 `dist/` 必须通过 `npm run build:renderer` 从源码生成。
- 不 merge、不中途 cherry-pick `origin/main`。
- 不删除或覆盖 macOS 便携版、exFAT、启动器和 release 脚本。
- 保留现有 Hermes 启动等待、中断分类、后台结果恢复、附件、图片预览、输入法回车、模型同步和聊天历史行为。
- Electron 主进程禁止递归扫描、计算整个技能目录指纹或复制技能文件。
- 不采用主干每 15 秒全量扫描技能目录的方案。
- 选择技能绝不能直接发送消息。
- 不对技能多选设置应用层固定数量上限，但相同技能必须去重。
- 任何 Agent 缺少整组技能中的一个时，都不能偷偷执行剩余子集。
- OpenClaw 已经接受任务后禁止自动改由 Hermes 重跑，防止文件写入、安装等副作用重复发生。
- 不提交 `uclaw/`、`data/`、`logs/`、`node_modules/` 和 release 用户数据。

## 文件职责

- `src/openclaw-shell-app/dist/main/skill-metadata.cjs`
  解析技能元数据、发现嵌套技能包、清理 OpenClaw 会话中的旧 `skillsSnapshot`。
- `src/openclaw-shell-app/dist/main/skill-repository-worker.cjs`
  在后台同步统一技能仓库，处理新增、更新、删除和冲突。
- `src/openclaw-shell-app/dist/main/chat-skill-routing.cjs`
  纯逻辑模块，负责技能去重、完整可用性判断、协同路由和 OpenClaw 多技能请求生成。
- `src/openclaw-shell-app/dist/main/index.js`
  管理后台子进程、查询两个 Agent 的官方技能目录、准备调用请求并注册 IPC。
- `src/openclaw-shell-app/dist/preload/index.js`
  向渲染进程开放最小化、结构化的技能 IPC。
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
  实现 `/skill` 菜单、技能标签、多选、发送确认和三种模式调用。
- `src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css`
  只增加技能选择菜单和标签样式，不修改全局布局。
- `scripts/restore-openclaw-shell.mjs`
  保证恢复壳后仍保留同样能力，不能成为另一套独立实现。
- `scripts/build-openclaw-shell-app.mjs`
  校验并复制新增后台模块。
- `scripts/verify-skill-metadata.mjs`
  测试技能元数据和会话快照处理。
- `scripts/verify-portable-skill-repository.mjs`
  测试统一技能仓库及慢盘调度策略。
- `scripts/verify-chat-skill-commands.mjs`
  测试技能目录、选择、多技能请求和协同路由。
- `scripts/verify-ai-chat-skill-runtime.mjs`
  扩展现有 macOS AI 会话回归检查。
- `package.json`
  增加聚焦验证命令。
- `docs/codex-handoff/2026-07-26-macos-chat-multi-skill.md`
  记录最终交接结果。

---

## 任务一：技能元数据后台模块

### 改动文件

- 新增 `src/openclaw-shell-app/dist/main/skill-metadata.cjs`
- 新增 `scripts/verify-skill-metadata.mjs`
- 修改 `package.json`

### 对外接口

```js
parseSkillMeta(skillFilePath)
// -> { name, description, emoji, raw } | null

discoverSkillPackages(rootDir, maxDepth = 6)
// -> { packages, invalidDirectories }

stripSessionSkillSnapshots(sessions)
// -> 删除数量
```

### 实施步骤

1. 测试脚本在临时目录创建以下样例：
   - 引号包裹的 YAML 字段。
   - `description: |` 多行描述。
   - `description: >` 折叠描述。
   - 没有 description 时使用正文第一段。
   - 六层以内嵌套技能。
   - 没有 `SKILL.md` 的无效目录。
   - 含会话 ID、消息历史和 `skillsSnapshot` 的会话数据。
2. 执行 `node scripts/verify-skill-metadata.mjs`，确认因模块不存在而失败。
3. 从主干按行为迁移元数据模块，不依赖 Electron。
4. 清理会话快照时只删除 `skillsSnapshot`，保留会话 ID 和聊天历史。
5. 在 `package.json` 增加：

```json
"verify:skill-metadata": "node scripts/verify-skill-metadata.mjs"
```

6. 执行：

```bash
npm run verify:skill-metadata
node --check src/openclaw-shell-app/dist/main/skill-metadata.cjs
```

7. 预期全部通过，提交：

```bash
git add package.json scripts/verify-skill-metadata.mjs src/openclaw-shell-app/dist/main/skill-metadata.cjs
git commit -m "功能：完善技能元数据解析"
```

---

## 任务二：统一技能仓库和 macOS 慢盘调度

### 改动文件

- 新增 `src/openclaw-shell-app/dist/main/skill-repository-worker.cjs`
- 新增 `scripts/verify-portable-skill-repository.mjs`
- 修改 `src/openclaw-shell-app/dist/main/index.js`
- 修改 `scripts/build-openclaw-shell-app.mjs`
- 修改 `package.json`

### 核心行为

后台 Worker 接收标准输入命令：

```text
reconcile
```

完成后输出：

```js
{
  type: "reconciled",
  changed: true,
  imported: 2,
  removed: 0,
  conflicts: [],
  durationMs: 120
}
```

主进程提供：

```js
requestPortableSkillRepositoryReconcile({ force: false, reason: "manual" })
```

### 实施步骤

1. 测试创建临时的统一 `skills/`、OpenClaw 两个技能目录、Hermes 技能目录和状态文件。
2. 验证首次同步能导入技能，第二次无变化，用户修改统一仓库中的技能后不会被内部副本静默覆盖。
3. 验证内部技能删除、同名冲突和状态文件更新。
4. 静态验证 `scan-local-skills` 不再在主进程执行 `readdirSync` 递归扫描。
5. 执行测试，确认新 Worker 不存在时失败。
6. 按主干规则迁移 Worker，但把 15 秒轮询改为事件触发，并增加最低 5 分钟、默认 15 分钟的低频兜底：

```js
const fallbackMs = Math.max(
  300000,
  Number(process.env.SKILL_REPOSITORY_FALLBACK_MS || 900000)
);
```

7. 所有递归文件操作使用 `node:fs/promises`，并发请求合并成一次执行。
8. 以下事件触发同步：
   - 程序启动并且主窗口已经可响应。
   - 打开或刷新技能管理页。
   - 安装、删除、启用、禁用技能完成。
   - 手动同步 Hermes 技能。
9. 删除 `sync-hermes-skills` 当前 `return` 后永远无法执行的旧复制代码。
10. 构建脚本把两个 Worker 都列为必需文件。
11. 在 `package.json` 增加：

```json
"verify:skill-repository": "node scripts/verify-portable-skill-repository.mjs"
```

12. 执行：

```bash
npm run verify:skill-metadata
npm run verify:skill-repository
node --check src/openclaw-shell-app/dist/main/skill-repository-worker.cjs
node --check src/openclaw-shell-app/dist/main/index.js
```

13. 提交：

```bash
git add package.json scripts/build-openclaw-shell-app.mjs scripts/verify-portable-skill-repository.mjs src/openclaw-shell-app/dist/main/index.js src/openclaw-shell-app/dist/main/skill-repository-worker.cjs
git commit -m "优化：后台统一同步共享技能"
```

---

## 任务三：官方技能目录和多技能请求准备

### 改动文件

- 新增 `src/openclaw-shell-app/dist/main/chat-skill-routing.cjs`
- 新增 `scripts/verify-chat-skill-commands.mjs`
- 修改 `src/openclaw-shell-app/dist/main/index.js`
- 修改 `src/openclaw-shell-app/dist/preload/index.js`
- 修改 `package.json`

### IPC 接口

```js
ipcListChatSkills({ mode, force })
// -> { ok, mode, source, skills }

ipcPrepareChatSkillRequest({
  mode,
  selectedSkills,
  instruction
})
// -> {
//   ok,
//   requestedMode,
//   executionAgent,
//   selectedSkills,
//   displayInstruction,
//   runtimeMessage,
//   fallbackReason,
//   availability
// }
```

### OpenClaw 技能目录顺序

1. Gateway 官方 `commands.list`，只保留 `source === "skill"`。
2. 便携 Node 执行官方 `openclaw skills list --json`。
3. 统一技能仓库只作为降级展示来源。

只有前两项能够证明 OpenClaw 真的可以调用技能。仅存在于统一仓库的技能可显示为“待同步/不可调用”，但不能让 OpenClaw 赢得协同路由。

### Hermes 技能目录

使用捆绑 Python 调用官方：

```python
reload_skills()
get_skill_commands()
resolve_skill_command_key()
build_skill_invocation_message()
build_preloaded_skills_prompt()
```

单技能使用 `build_skill_invocation_message()`；多技能使用 `build_preloaded_skills_prompt()`。只要有一个技能缺失，就拒绝整组请求。

### OpenClaw 多技能请求

单技能继续使用官方 slash 命令。多技能生成一条请求：

```text
Use all of the following skills together for this request:
- "skill-a"
- "skill-b"

User input:
<用户原始任务>
```

不能拼接多个 slash 命令，也不能拆成多条消息。

### 协同路由规则

```text
OpenClaw 官方可调用全部技能，并且 Gateway 就绪
  -> OpenClaw

否则 Hermes 官方可调用全部技能
  -> Hermes

否则
  -> 发送前拒绝，并分别列出两个 Agent 缺少的技能
```

### 验证与提交

```bash
npm run verify:skill-metadata
npm run verify:skill-repository
node scripts/verify-chat-skill-commands.mjs
node --check src/openclaw-shell-app/dist/main/chat-skill-routing.cjs
node --check src/openclaw-shell-app/dist/main/index.js
node --check src/openclaw-shell-app/dist/preload/index.js
```

预期全部通过，提交：

```bash
git add package.json scripts/verify-chat-skill-commands.mjs src/openclaw-shell-app/dist/main/chat-skill-routing.cjs src/openclaw-shell-app/dist/main/index.js src/openclaw-shell-app/dist/preload/index.js
git commit -m "功能：接入官方技能命令与多技能路由"
```

---

## 任务四：选择技能但不立即发送的多选 UI

### 改动文件

- 修改 `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- 修改 `src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css`
- 修改 `scripts/verify-chat-skill-commands.mjs`
- 修改 `scripts/verify-ai-chat-skill-runtime.mjs`

### 输入组件接口

```js
submit(text, attachments, selectedSkills)
// -> Promise<{ accepted, error? }>
```

输入组件只有在 `submit()` 返回 `{ accepted: true }` 后，才清空文字、附件和技能标签。发送前验证失败、IPC 错误或 Agent 拒绝时，草稿完整保留。

### 交互要求

1. 三种模式的命令菜单都显示 `/skill`。
2. 输入 `/ski`、`/skil`、`/skill` 时异步打开技能列表。
3. 支持按名称、命令和描述搜索。
4. 点击技能只生成标签，不调用 `submit()`。
5. 选中后清除输入框中的 `/skill` 查询，并保持输入焦点。
6. 可以再次输入 `/skill` 继续追加技能。
7. 相同技能只保留一个标签。
8. 每个标签可以单独删除。
9. 文字、附件和技能标签任意一项存在时允许发送。
10. 中文输入法候选确认回车不能发送消息。

不能依赖 Vue 事件的返回值。ChatInput 使用显式异步 `submit` 属性，父组件把现有 `handleSend` 作为该属性传入。

### 样式约束

- 复用当前 UI 的颜色、字号、间距和圆角。
- 标签和菜单允许换行，不得撑坏输入框宽度。
- 不修改全局 `overflow`、窗口尺寸或其他页面滚动逻辑。
- 加载、空列表、不可调用状态有稳定高度，不能引发界面跳动。

### 验证与提交

```bash
node scripts/verify-chat-skill-commands.mjs
node scripts/verify-ai-chat-skill-runtime.mjs
npm run build:renderer
npm run build:main
```

重点断言：选择函数中没有发送调用，只有显式发送函数调用 `await props.submit(...)`。

提交：

```bash
git add scripts/verify-ai-chat-skill-runtime.mjs scripts/verify-chat-skill-commands.mjs src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css dist
git commit -m "功能：支持会话多选技能后发送"
```

---

## 任务五：三种模式执行、安全回退和历史记录

### 改动文件

- 修改 `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- 修改 `src/openclaw-shell-app/dist/main/index.js`
- 修改 `scripts/verify-chat-skill-commands.mjs`
- 修改 `scripts/verify-ai-chat-skill-runtime.mjs`

### OpenClaw 发送结果

扩展现有接口，但不改变普通调用方：

```js
store.sendMessage(runtimeText, attachments, {
  displayText,
  skills,
  executionAgent,
  fallbackReason
})
// -> Promise<{ accepted, queued, error }>
```

`displayText` 用于本地消息和历史记录，`runtimeText` 只发给 Gateway。这样用户界面不会显示内部改写提示词。

典型返回：

```js
{ accepted: true, queued: false }
{ accepted: false, queued: true, error: "OpenClaw 尚未完全启动" }
{ accepted: false, queued: false, error: "发送失败" }
```

### 三种模式

- OpenClaw 模式：发送准备好的 OpenClaw 请求，界面显示原始任务和技能标签。
- Hermes 模式：发送官方生成的 Hermes 单技能或多技能消息，继续使用现有启动等待和后台结果恢复。
- 协同模式：有技能选择时，不再执行普通“OpenClaw 草案 + Hermes 复核”双阶段流程，而是把整组技能交给路由选中的唯一 Agent。
- 协同模式没有选择技能时，保持现有双阶段流程完全不变。

### 安全回退

只有同时满足以下条件才允许 OpenClaw 回退 Hermes：

- OpenClaw 返回 `accepted: false`。
- OpenClaw 返回 `queued: false`。
- Hermes 官方目录确认拥有全部选中技能。
- 尚未出现 OpenClaw 流式事件、持久化结果或工具执行。

消息已经排队、已接受、开始流式回复，或者接受后超时，都不能回退。

### 历史记录

用户消息只保存：

```js
{
  content: "用户原始任务",
  attachments: [],
  skills: [{ id, name, command }],
  executionAgent: "openclaw",
  fallbackReason: ""
}
```

不保存 `runtimeMessage`、Hermes 展开的技能正文或组合提示词。日志只记录技能数量、技能命令名、执行 Agent、路由原因和耗时，不打印用户对话内容。

### 验证与提交

```bash
node scripts/verify-chat-skill-commands.mjs
node scripts/verify-ai-chat-skill-runtime.mjs
node scripts/verify-openclaw-chat-skill-sync.mjs
node scripts/verify-macos-ui-hermes-regressions.mjs
node scripts/verify-hermes-skill-install-flow.mjs
npm run build:renderer
npm run build:main
```

提交：

```bash
git add scripts/verify-ai-chat-skill-runtime.mjs scripts/verify-chat-skill-commands.mjs src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js src/openclaw-shell-app/dist/main/index.js dist
git commit -m "修复：稳定路由会话技能调用"
```

---

## 任务六：恢复脚本一致性、完整验证和 release

### 改动文件

- 修改 `scripts/restore-openclaw-shell.mjs`
- 修改 `scripts/audit-openclaw-shell-features.mjs`
- 修改 `scripts/verify-ai-chat-skill-runtime.mjs`
- 新增 `docs/codex-handoff/2026-07-26-macos-chat-multi-skill.md`
- 重新生成 `dist/`
- 重新生成 `release/macos-usb-root-exfat/OpenClawPro.app`

### 恢复脚本要求

恢复后的程序必须同样包含：

- `skill-metadata.cjs`
- `skill-repository-worker.cjs`
- `chat-skill-routing.cjs`
- `list-chat-skills`
- `prepare-chat-skill-request`
- `build_preloaded_skills_prompt`
- `selectedSkills`
- `executionAgent`

同时确认恢复脚本没有重新加入 15 秒技能轮询，没有删除输入法、附件、Hermes 等待、中断识别和 Esc 图片预览能力。

### 完整静态验证

```bash
npm run verify:skill-metadata
npm run verify:skill-repository
node scripts/verify-chat-skill-commands.mjs
node scripts/verify-ai-chat-skill-runtime.mjs
node scripts/verify-openclaw-chat-skill-sync.mjs
node scripts/verify-macos-ui-hermes-regressions.mjs
node scripts/verify-hermes-skill-install-flow.mjs
npm run verify:hermes-skills
npm run audit:openclaw-shell
npm run build
git diff --check
```

### macOS U 盘 release 验证

```bash
npm run stage:macos-usb-root:final
npm run audit:portable -- release/macos-usb-root-exfat
```

确认 App 中包含最新构建和三个后台模块，同时不会覆盖已有的 `data/`、`skills/`、`extensions/` 和 `.license`。

### UI 冒烟测试

在 OpenClaw、Hermes、协同三种模式分别确认：

1. `/skill` 列表打开时程序不卡顿。
2. 选择技能不会发送消息。
3. 可以添加和删除多个技能标签。
4. 文字、图片和技能能一起发送。
5. 中文输入法确认候选时不会误发送。
6. OpenClaw 优先和 Hermes 回退显示的执行方与真实执行一致。
7. 切换页面后聊天、滚动和后台任务状态正常。
8. Hermes 日志中没有技能正文和用户对话内容。

### Handoff 和最终提交

Handoff 必须包含：总体目标、当前目标、已完成、改动文件、关键决策、待继续、验证结果、下一台 Codex 接手提示词，并注明提交 ID 和仍需 Windows 实机验证的事项。

最终执行：

```bash
git status
git diff
git add package.json src/openclaw-shell-app scripts dist docs/codex-handoff/2026-07-26-macos-chat-multi-skill.md
git commit -m "功能：完成共享技能管理和会话调用"
git push origin feat/macos-portable-app
git status --short --branch
```

预期当前分支与远程一致，只保留原有未跟踪目录 `uclaw/`。

## 完成标准

只有同时达到以下条件，才能宣布本阶段完成：

- 技能管理页能显示统一仓库中的嵌套技能和重复名称包，并明确无效目录。
- OpenClaw 和 Hermes 官方技能目录都能真实验证技能可调用性。
- `/skill` 在三种会话模式均可使用。
- 选择技能不发送，支持多选、删除和继续编辑。
- 单技能和多技能在两个 Agent 中都有真实执行链路。
- 协同模式完整执行 OpenClaw 优先及安全 Hermes 回退。
- 不会重复执行带副作用的任务。
- 不在 Electron 主进程执行慢速递归技能 I/O。
- 现有 macOS 聊天、模型、附件、输入法、预览、启动和历史功能全部通过回归检查。
- 源码、构建结果、恢复脚本和 macOS release 行为一致。
- 阶段代码和 handoff 已提交并推送。
