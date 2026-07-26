# AI Chat Multi-Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring main-branch skill management and `/skill` invocation behavior to the macOS portable application, add non-sending multi-selection, and route complete skill sets OpenClaw-first with safe Hermes fallback.

**Architecture:** The USB-root `skills/` directory remains canonical. Metadata discovery and repository reconciliation run in child processes, while the Electron main process exposes structured catalog and request-preparation IPC. The renderer owns pending skill chips and delegates all availability and routing decisions to the main process before using the existing OpenClaw or Hermes conversation paths.

**Tech Stack:** Electron 35, Node.js CommonJS workers, Vue 3 compiled renderer source, OpenClaw Gateway RPC/CLI, bundled Hermes Python, Node regression scripts.

## Global Constraints

- Use `src/openclaw-shell-app/` as source of truth; regenerate root `dist/` through `npm run build:renderer`.
- Do not merge or cherry-pick `origin/main`.
- Preserve all macOS portable/exFAT scripts and current Hermes readiness, attachments, IME, preview, model, history, and background-result behavior.
- Do not recursively scan, hash, or copy skill trees in Electron main.
- Do not use main's 15-second full reconciliation loop.
- Selection never sends automatically; one or more skills remain editable as chips until the user sends.
- Route a selected set atomically; never split a set across Agents or silently invoke a subset.
- Do not fall back after OpenClaw has accepted a request.
- Keep `uclaw/`, `data/`, `logs/`, `node_modules/`, and release user state out of commits.

## File Map

- `src/openclaw-shell-app/dist/main/skill-metadata.cjs`: parse metadata, discover nested packages, and invalidate session skill snapshots.
- `src/openclaw-shell-app/dist/main/skill-repository-worker.cjs`: reconcile Agent-owned skills into canonical `skills/` and emit structured results.
- `src/openclaw-shell-app/dist/main/chat-skill-routing.cjs`: pure catalog normalization, complete-set routing, and OpenClaw multi-skill request construction.
- `src/openclaw-shell-app/dist/main/index.js`: schedule workers, query official Agent catalogs, prepare skill requests, and expose IPC.
- `src/openclaw-shell-app/dist/preload/index.js`: expose narrow chat-skill IPC methods.
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`: skill picker, pending chips, mode catalogs, send acceptance, routing, and history metadata.
- `src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css`: picker and chip layout only.
- `scripts/restore-openclaw-shell.mjs`: preserve the same source behavior when restoring the shell.
- `scripts/build-openclaw-shell-app.mjs`: assert and copy both worker modules into `dist/`.
- `scripts/verify-skill-metadata.mjs`: executable metadata/snapshot tests.
- `scripts/verify-portable-skill-repository.mjs`: executable repository and scheduling tests.
- `scripts/verify-chat-skill-commands.mjs`: executable catalog, input, multi-skill, routing, and log-redaction tests.
- `scripts/verify-ai-chat-skill-runtime.mjs`: extend existing macOS regression assertions.
- `package.json`: add focused verification commands.
- `docs/codex-handoff/2026-07-26-macos-chat-multi-skill.md`: final implementation handoff.

---

### Task 1: Child-Process Skill Metadata

**Files:**
- Create: `src/openclaw-shell-app/dist/main/skill-metadata.cjs`
- Create: `scripts/verify-skill-metadata.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `parseSkillMeta(skillFilePath) -> { name, description, emoji, raw } | null`
- Produces: `discoverSkillPackages(rootDir, maxDepth = 6) -> { packages, invalidDirectories }`
- Produces: `stripSessionSkillSnapshots(sessions) -> number`

- [ ] **Step 1: Write the failing metadata regression script**

Create fixtures in a temporary directory from the test itself and assert quoted YAML, literal `|`, folded `>`, body fallback, depth-six discovery, invalid top-level directories, and snapshot-only invalidation:

```js
const api = require(metadataModule);
assert.equal(api.parseSkillMeta(literalFile).description, "line one\nline two");
assert.equal(api.parseSkillMeta(foldedFile).description, "line one line two");
assert.equal(api.parseSkillMeta(bodyFile).description, "Useful body description.");
assert.equal(api.discoverSkillPackages(root, 6).packages.length, 4);
assert.deepEqual(api.discoverSkillPackages(root, 6).invalidDirectories.map((row) => row.name), ["invalid"]);
const sessions = { main: { sessionId: "keep", messages: [1], skillsSnapshot: { prompt: "drop" } } };
assert.equal(api.stripSessionSkillSnapshots(sessions), 1);
assert.deepEqual(sessions.main, { sessionId: "keep", messages: [1] });
```

- [ ] **Step 2: Run the script and verify it fails**

Run: `node scripts/verify-skill-metadata.mjs`

Expected: failure because `src/openclaw-shell-app/dist/main/skill-metadata.cjs` does not exist.

- [ ] **Step 3: Add the minimum metadata worker module**

Port the behavior of `origin/main:src/openclaw-shell-app/dist/main/skill-metadata.cjs` without importing Electron. Keep the executable JSON output used by child-process discovery:

```js
module.exports = { discoverSkillPackages, parseSkillMeta, stripSessionSkillSnapshots };

if (require.main === module) {
  const rootDir = path.resolve(process.argv[2] || process.cwd());
  const discovery = discoverSkillPackages(rootDir, 6);
  process.stdout.write(`${JSON.stringify({ ok: true, ...discovery })}\n`);
}
```

- [ ] **Step 4: Add and run the focused package command**

Add `"verify:skill-metadata": "node scripts/verify-skill-metadata.mjs"` to `package.json`.

Run: `npm run verify:skill-metadata`

Expected: `Skill metadata checks passed`.

- [ ] **Step 5: Commit the metadata unit**

```bash
git add package.json scripts/verify-skill-metadata.mjs src/openclaw-shell-app/dist/main/skill-metadata.cjs
git commit -m "功能：完善技能元数据解析"
```

---

### Task 2: Canonical Repository Worker and Mac-Safe Scheduling

**Files:**
- Create: `src/openclaw-shell-app/dist/main/skill-repository-worker.cjs`
- Create: `scripts/verify-portable-skill-repository.mjs`
- Modify: `src/openclaw-shell-app/dist/main/index.js`
- Modify: `scripts/build-openclaw-shell-app.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `discoverSkillPackages()` from Task 1.
- Produces: worker stdin command `reconcile\n`.
- Produces: worker stdout event `{ type: "reconciled", changed, imported, removed, conflicts, durationMs }`.
- Produces: `requestPortableSkillRepositoryReconcile({ force = false, reason = "manual" }) -> Promise<result>`.

- [ ] **Step 1: Write failing repository tests**

Build a temporary portable root with `skills/`, OpenClaw managed/workspace roots, Hermes root, and manifest path. Spawn the worker and assert:

```js
assert.equal(first.imported, 3);
assert(fs.existsSync(path.join(root, "skills", "openclaw-made", "SKILL.md")));
assert(fs.existsSync(path.join(root, "skills", "hermes-made", "SKILL.md")));
assert.equal(second.changed, false);
assert.equal(conflict.conflicts.length, 1);
assert.equal(fs.readFileSync(userEditedCanonical, "utf8"), userEditedText);
```

Also statically assert that main starts no `setInterval(...15000...)`, calls the worker after explicit skill actions, and contains no `readdirSync` loop in the `scan-local-skills` handler.

- [ ] **Step 2: Run the test and verify it fails**

Run: `node scripts/verify-portable-skill-repository.mjs`

Expected: failure because the worker and scheduler markers are absent.

- [ ] **Step 3: Port and constrain the repository worker**

Port main's canonical reconciliation rules, but replace its unconditional 15-second timer with command-driven execution plus a slow fallback configured by `SKILL_REPOSITORY_FALLBACK_MS` and clamped to at least 300000 ms:

```js
const fallbackMs = Math.max(300000, Number(process.env.SKILL_REPOSITORY_FALLBACK_MS || 900000));
await reconcile();
const timer = setInterval(() => {
  if (!stopping && Date.now() - lastCompletedAt >= fallbackMs) reconcile(false);
}, fallbackMs);
process.stdin.on("data", (chunk) => {
  if (String(chunk).split(/\r?\n/).some((line) => line.trim() === "reconcile")) reconcile(true);
});
```

Keep full file I/O asynchronous with `node:fs/promises`. Coalesce concurrent requests and preserve user-modified canonical conflicts.

- [ ] **Step 4: Add the main-process scheduler**

Spawn the worker only after the app window has loaded. Resolve concurrent callers from the next `reconciled` event, and terminate it during app shutdown. Replace synchronous `scan-local-skills` traversal with worker reconciliation followed by metadata child-process output.

Explicitly trigger reconciliation from skill scan/refresh, toggle, install completion, delete, and Hermes sync. Remove the unreachable old block after the existing `return getHermesManager().syncOpenClawSkillsToHermes(...)` because the new worker owns that behavior.

- [ ] **Step 5: Preserve build output**

Add both worker paths to `scripts/build-openclaw-shell-app.mjs` required-file assertions. The existing recursive source copy then carries them into root `dist/main/`.

Add `"verify:skill-repository": "node scripts/verify-portable-skill-repository.mjs"` to `package.json`.

- [ ] **Step 6: Run focused tests and syntax checks**

Run:

```bash
npm run verify:skill-metadata
npm run verify:skill-repository
node --check src/openclaw-shell-app/dist/main/skill-repository-worker.cjs
node --check src/openclaw-shell-app/dist/main/index.js
```

Expected: all commands exit zero.

- [ ] **Step 7: Commit the repository unit**

```bash
git add package.json scripts/build-openclaw-shell-app.mjs scripts/verify-portable-skill-repository.mjs src/openclaw-shell-app/dist/main/index.js src/openclaw-shell-app/dist/main/skill-repository-worker.cjs
git commit -m "优化：后台统一同步共享技能"
```

---

### Task 3: Official Catalogs and Multi-Skill Request Preparation

**Files:**
- Create: `src/openclaw-shell-app/dist/main/chat-skill-routing.cjs`
- Create: `scripts/verify-chat-skill-commands.mjs`
- Modify: `src/openclaw-shell-app/dist/main/index.js`
- Modify: `src/openclaw-shell-app/dist/preload/index.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `ipcListChatSkills({ mode, force }) -> Promise<{ ok, mode, source, skills }>`.
- Produces: `ipcPrepareChatSkillRequest(payload) -> Promise<PreparedSkillRequest>`.
- `PreparedSkillRequest`: `{ ok, requestedMode, executionAgent, selectedSkills, displayInstruction, runtimeMessage, fallbackReason, availability }`.
- Produces: pure `routeCompleteSkillSet(mode, selectedSkills, catalogs) -> routing result` for executable tests.

- [ ] **Step 1: Write failing main/preload contract tests**

Assert source markers for OpenClaw `commands.list`, official CLI fallback, Hermes official command bridge, multi-skill prompt construction, atomic availability, and redacted logs:

```js
assert(main.includes('gatewayRpcViaMain("commands.list"'));
assert(main.includes('from agent.skill_commands import get_skill_commands'));
assert(main.includes('build_preloaded_skills_prompt'));
assert(main.includes('electron.ipcMain.handle("prepare-chat-skill-request"'));
assert(preload.includes('ipcPrepareChatSkillRequest'));
assert(!main.includes('expandedSkillPrompt='));
```

Require `chat-skill-routing.cjs` directly to verify:

```js
assert.equal(route("collab", ["a", "b"], openClawBoth, hermesBoth).executionAgent, "openclaw");
assert.equal(route("collab", ["a", "b"], openClawA, hermesBoth).executionAgent, "hermes");
assert.equal(route("collab", ["a", "b"], openClawA, hermesB).ok, false);
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node scripts/verify-chat-skill-commands.mjs`

Expected: failure because chat-skill IPC and multi-skill bridge are absent.

- [ ] **Step 3: Add official catalog discovery**

Port main's OpenClaw resolution order:

1. Gateway `commands.list` filtered to `source === "skill"`.
2. Portable `openclaw skills list --json`.
3. Canonical catalog marked `invocable: false` when neither official source confirms it.

Port Hermes `reload_skills()` and `get_skill_commands()` bridge. Return per-entry availability rather than treating a canonical name as proof of invocation.

Implement deduplication, complete-set availability, Agent choice, and OpenClaw multi-skill message construction in `chat-skill-routing.cjs`. Keep this module free of Electron and filesystem access so tests exercise real routing code rather than source markers alone.

- [ ] **Step 4: Add official Hermes multi-skill preparation**

Extend the Python bridge `invoke` action to accept `commands`. Use `build_skill_invocation_message()` for one command and `build_preloaded_skills_prompt()` for multiple commands:

```python
identifiers = [str(item).lstrip('/') for item in payload.get('commands') or []]
if len(identifiers) == 1:
    key = resolve_skill_command_key(identifiers[0])
    message = build_skill_invocation_message(key, instruction, task_id=task_id) if key else None
else:
    prompt, loaded, missing = build_preloaded_skills_prompt(identifiers, task_id=task_id)
    message = "\n\n".join(part for part in (prompt, instruction) if part)
```

Return `loaded` and `missing`; reject before oneshot when `missing` is non-empty.

- [ ] **Step 5: Add OpenClaw request construction and atomic routing**

For one OpenClaw skill, preserve its official alias. For multiple skills, construct one message:

```text
Use all of the following skills together for this request:
- "skill-a"
- "skill-b"

User input:
<original instruction>
```

Deduplicate by invocation identity. In collaboration mode choose OpenClaw only when it officially reports every skill; otherwise choose Hermes only when it officially reports every skill; otherwise return a structured missing-skills error.

- [ ] **Step 6: Expose narrow preload methods**

Add:

```js
ipcListChatSkills: (payload) => electron.ipcRenderer.invoke("list-chat-skills", payload),
ipcPrepareChatSkillRequest: (payload) => electron.ipcRenderer.invoke("prepare-chat-skill-request", payload),
```

- [ ] **Step 7: Run focused tests and syntax checks**

Run:

```bash
npm run verify:skill-metadata
npm run verify:skill-repository
node scripts/verify-chat-skill-commands.mjs
node --check src/openclaw-shell-app/dist/main/index.js
node --check src/openclaw-shell-app/dist/preload/index.js
```

Expected: all commands exit zero.

- [ ] **Step 8: Commit the service unit**

```bash
git add package.json scripts/verify-chat-skill-commands.mjs src/openclaw-shell-app/dist/main/chat-skill-routing.cjs src/openclaw-shell-app/dist/main/index.js src/openclaw-shell-app/dist/preload/index.js
git commit -m "功能：接入官方技能命令与多技能路由"
```

---

### Task 4: Non-Sending Multi-Selection UI

**Files:**
- Modify: `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- Modify: `src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css`
- Modify: `scripts/verify-chat-skill-commands.mjs`
- Modify: `scripts/verify-ai-chat-skill-runtime.mjs`

**Interfaces:**
- ChatInput calls async `submit(text, attachments, selectedSkills) -> Promise<{ accepted, error? }>` only from explicit send.
- ChatInput emits `requestSkills(mode, force)` for lazy loading.
- ChatInput receives `skills`, `skillMode`, and `skillsLoading`.
- ChatInput owns its draft until `submit()` resolves with `accepted: true`.

- [ ] **Step 1: Extend failing renderer assertions**

Assert that selection mutates `selectedSkills`, does not emit `send`, supports removal/deduplication, keeps focus, and passes selections only from `handleSend()`:

```js
assert(renderer.includes("const selectedSkills = ref([])"));
assert(renderer.includes("function selectSkill(skill)"));
assert(renderer.includes("function removeSelectedSkill"));
assert(renderer.includes("selectedSkills.value.some"));
assert(renderer.includes("await props.submit("));
assert(!selectSkillBody.includes("props.submit("));
```

Retain existing IME, attachment preview, Escape, and no-polling assertions.

- [ ] **Step 2: Run the renderer tests and verify they fail**

Run:

```bash
node scripts/verify-chat-skill-commands.mjs
node scripts/verify-ai-chat-skill-runtime.mjs
```

Expected: new selection assertions fail while existing regression assertions still pass.

- [ ] **Step 3: Add pending skill state to ChatInput**

Add an async `submit` function prop and `/skill` to the command menu in all three modes. Detect `/ski`, `/skil`, and `/skill`, lazily request skills, and filter by name/command/description. `selectSkill()` adds a deduplicated chip, clears only the slash query, closes the menu, and focuses the textarea.

Allow send when any of text, attachments, or selected skills is present. Await `props.submit(text, attachments, selectedSkills)`. Clear state only after it returns `{ accepted: true }`; preserve it for `{ accepted: false }` or thrown IPC errors. Replace the parent vnode's `onSend` binding with `submit: handleSend` so no code relies on Vue event return values.

- [ ] **Step 4: Add restrained picker/chip styles**

Use existing colors, border radius, spacing, and typography. Add stable-height wrapping containers for `.selected-skill-list`, `.selected-skill-chip`, `.skill-command-menu`, loading, empty, and unavailable rows. Do not change global page overflow, app dimensions, or other module styles.

- [ ] **Step 5: Run static and build verification**

Run:

```bash
node scripts/verify-chat-skill-commands.mjs
node scripts/verify-ai-chat-skill-runtime.mjs
npm run build:renderer
npm run build:main
```

Expected: source and generated dist checks pass.

- [ ] **Step 6: Commit the renderer unit**

```bash
git add scripts/verify-ai-chat-skill-runtime.mjs scripts/verify-chat-skill-commands.mjs src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css dist
git commit -m "功能：支持会话多选技能后发送"
```

---

### Task 5: Mode Execution, Safe Fallback, and History Metadata

**Files:**
- Modify: `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- Modify: `src/openclaw-shell-app/dist/main/index.js`
- Modify: `scripts/verify-chat-skill-commands.mjs`
- Modify: `scripts/verify-ai-chat-skill-runtime.mjs`

**Interfaces:**
- OpenClaw `store.sendMessage(runtimeText, attachments, { displayText, skills, executionAgent, fallbackReason }) -> Promise<{ accepted, queued, error }>`.
- Hermes background payload accepts `preparedSkillRequest` but logs no runtime prompt.
- Persisted user message skill metadata: `skills: [{ id, name, command }]`, `executionAgent`, optional `fallbackReason`.

- [ ] **Step 1: Add failing execution and history assertions**

Cover:

```js
assert(renderer.includes("executionAgent"));
assert(renderer.includes("fallbackReason"));
assert(renderer.includes("skills: selectedSkills.map"));
assert(renderer.includes("accepted: true"));
assert(renderer.includes("accepted: false"));
assert(renderer.includes("if (openClawResult.accepted)"));
assert(renderer.includes("return runPreparedHermesSkillRequest"));
assert(!renderer.includes("runtimeMessage,") || renderer.includes("delete persisted.runtimeMessage"));
```

- [ ] **Step 2: Make OpenClaw acceptance observable**

Return structured status from `sendMessage()` and `sendOpenClawToGateway()` without changing queue semantics. Use `options.displayText` for the local/history user bubble and `runtimeText` only for the Gateway payload:

```js
return { accepted: true, queued: false };
return { accepted: false, queued: true, error: "OpenClaw 尚未完全启动" };
return { accepted: false, queued: false, error: e.message || "发送失败" };
```

Normal callers may ignore the return value. Selected-skill collaboration uses it to decide whether Hermes fallback remains safe.

- [ ] **Step 3: Execute selected skills in each adapter**

Before sending, call `ipcPrepareChatSkillRequest()` with mode, selected skill identities, and original instruction.

- OpenClaw adapter sends `runtimeMessage` through existing `store.sendMessage()` while displaying original text and chips.
- Hermes adapter passes prepared Hermes `runtimeMessage` into existing readiness-aware background chat.
- Collaboration adapter bypasses the ordinary two-stage draft/review flow when skills are selected and executes the prepared request through exactly one Agent.
- Collaboration without selected skills continues using `sendCollaborativeMessageV2()` unchanged.

- [ ] **Step 4: Enforce safe fallback**

If collaboration preparation chooses OpenClaw, fall back to Hermes only when `store.sendMessage()` returns `accepted: false, queued: false` and the main-process preparation response confirms Hermes supports the complete set. Do not fall back for queued, accepted, streaming, timed-out-after-acceptance, or persisted OpenClaw runs.

- [ ] **Step 5: Persist only display metadata**

Store original text, attachments, selected skill IDs/names/commands, final execution Agent, and concise fallback reason. Keep `runtimeMessage` local to the send call. Ensure progress and logs contain counts and Agent names but no original instruction or expanded skill body.

- [ ] **Step 6: Run focused and existing regressions**

Run:

```bash
node scripts/verify-chat-skill-commands.mjs
node scripts/verify-ai-chat-skill-runtime.mjs
node scripts/verify-openclaw-chat-skill-sync.mjs
node scripts/verify-macos-ui-hermes-regressions.mjs
node scripts/verify-hermes-skill-install-flow.mjs
npm run build:renderer
npm run build:main
```

Expected: all commands exit zero.

- [ ] **Step 7: Commit the execution unit**

```bash
git add scripts/verify-ai-chat-skill-runtime.mjs scripts/verify-chat-skill-commands.mjs src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js src/openclaw-shell-app/dist/main/index.js dist
git commit -m "修复：稳定路由会话技能调用"
```

---

### Task 6: Restore Parity, Full Verification, Release, and Handoff

**Files:**
- Modify: `scripts/restore-openclaw-shell.mjs`
- Modify: `scripts/audit-openclaw-shell-features.mjs`
- Modify: `scripts/verify-ai-chat-skill-runtime.mjs`
- Modify: `docs/codex-handoff/2026-07-26-macos-chat-multi-skill.md`
- Regenerate: `dist/`
- Regenerate: `release/macos-usb-root-exfat/OpenClawPro.app`

**Interfaces:**
- Restore output must contain the same worker, IPC, picker, routing, and regression markers as source.
- Release staging must preserve existing root `data/`, `skills/`, `extensions/`, and `.license` when deployed incrementally.

- [ ] **Step 1: Write failing source/restore parity assertions**

Extend the audit and regression scripts so they compare markers for:

```text
skill-metadata.cjs
skill-repository-worker.cjs
list-chat-skills
prepare-chat-skill-request
build_preloaded_skills_prompt
selectedSkills
executionAgent
```

Also assert the restore script does not add 15-second skill polling or remove IME, attachment, readiness, interruption, and Escape-preview markers.

- [ ] **Step 2: Run parity checks and verify they fail**

Run:

```bash
npm run audit:openclaw-shell
node scripts/verify-ai-chat-skill-runtime.mjs
```

Expected: failure because restore parity has not yet been updated.

- [ ] **Step 3: Update restore behavior surgically**

Update existing restore transformations so a restored shell includes the two worker modules, IPC methods, pending skill UI, and execution routing. Do not add a second runtime implementation; restoration must reproduce the same source markers and behavior.

- [ ] **Step 4: Run the complete static regression matrix**

Run:

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

Expected: all commands exit zero.

- [ ] **Step 5: Stage and audit the macOS USB release**

Run:

```bash
npm run stage:macos-usb-root:final
npm run audit:portable -- release/macos-usb-root-exfat
```

Expected: staging completes, the app bundle contains the refreshed source build, workers are present, runtime checks pass, and user state roots remain outside the app bundle.

- [ ] **Step 6: Perform UI smoke verification**

Launch the staged app with the existing development license path. Verify in OpenClaw, Hermes, and collaboration modes:

1. `/skill` opens without freezing.
2. Selecting does not send.
3. Multiple chips can be added and removed.
4. Text, image, and selected skills send together.
5. IME Enter does not send during composition.
6. OpenClaw-first and Hermes fallback labels match the actual Agent.
7. Switching pages preserves active chat behavior and scrolling.
8. No expanded skill body or conversation text appears in Hermes logs.

- [ ] **Step 7: Write the required handoff**

Create `docs/codex-handoff/2026-07-26-macos-chat-multi-skill.md` with the required sections: overall goal, current goal, completed work, changed files, key decisions, remaining work, verification results, and next-Codex prompt. Include exact commit IDs and any Windows-only validation still pending.

- [ ] **Step 8: Commit and push the completed phase**

```bash
git add package.json src/openclaw-shell-app scripts dist docs/codex-handoff/2026-07-26-macos-chat-multi-skill.md
git commit -m "功能：完成共享技能管理和会话调用"
git push origin feat/macos-portable-app
git status --short --branch
```

Expected: branch matches its remote; only the pre-existing untracked `uclaw/` remains.
