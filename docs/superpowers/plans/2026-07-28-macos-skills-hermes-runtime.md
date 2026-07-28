# macOS Skills And Hermes Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 macOS U 盘版 OpenClaw 技能快照、股票技能运行时和 Hermes 启动链路。

**Architecture:** 选择性迁移远程主干的已验证行为，不合并提交。技能容量、便携 Python、Hermes 生命周期分成三个独立测试单元，最后由 macOS staging 和 release 审计串联验证。

**Tech Stack:** Electron main process、Node.js ESM/CommonJS、OpenClaw Gateway、Python 3.12 arm64、Hermes Agent、exFAT portable layout。

## Global Constraints

- `src/openclaw-shell-app/dist/` 是完整应用源码基准。
- 不修改 UI、模型、微信和现有消息路由。
- 不提交 runtime 二进制、release、用户数据、日志、`.license`、`mac_release_07_22/` 或 `uclaw/`。
- 不依赖宿主机 Python，不在启动主线程解压大型 runtime。
- 每个修复先验证失败，再写最小实现。

---

### Task 1: OpenClaw Skill Capacity And Snapshot Refresh

**Files:**
- Modify: `src/openclaw-shell-app/dist/main/index.js`
- Modify: `src/openclaw-shell-app/dist/main/skill-metadata.cjs`
- Modify: `src/openclaw-shell-app/dist/main/skill-repository-worker.cjs`
- Modify: `scripts/verify-portable-skill-repository.mjs`
- Modify: `scripts/verify-openclaw-chat-skill-sync.mjs`

**Interfaces:**
- Consumes: canonical `skills/` repository reports and OpenClaw session JSON.
- Produces: `skills.limits` with minimum 400 capacity and invalidated `skillsSnapshot` values after real repository changes.

- [ ] Add a failing verification with an old 95-skill snapshot and lower limits.
- [ ] Run `node scripts/verify-portable-skill-repository.mjs` and confirm the new assertion fails.
- [ ] Merge minimum official limits without lowering user-configured values.
- [ ] Invalidate only `skillsSnapshot` after a real repository change.
- [ ] Run the repository, metadata, skill routing and chat sync verifiers.
- [ ] Build the shell and confirm source/dist/restore parity.

### Task 2: macOS Portable Python For Stock Skills

**Files:**
- Modify: `src/openclaw-shell-app/dist/main/index.js`
- Modify: `scripts/build-macos-runtime.mjs`
- Modify: `scripts/stage-macos-portable-test.mjs`
- Modify: `runtime/PORTABLE-RUNTIME-MANIFEST.json`
- Create: `scripts/verify-macos-stock-skill-runtime.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `runtime/macos-arm64/python3` and shared stock skills under `skills/`.
- Produces: OpenClaw Gateway environment with portable Python first in `PATH`, plus a deterministic import/tool probe.

- [ ] Add a failing verifier for missing runtime/python3 modules and host-Python leakage.
- [ ] Run `node scripts/verify-macos-stock-skill-runtime.mjs` and confirm it lists the missing modules.
- [ ] Add runtime build support for Python 3.12 arm64 and the eight required modules.
- [ ] Add Gateway environment variables and portable Python `PATH` precedence.
- [ ] Extend the runtime manifest and staging checks.
- [ ] Run import probes and one stock skill command from the staged layout.

### Task 3: Hermes Runtime Integrity And Single-Flight Startup

**Files:**
- Modify: `src/openclaw-shell-app/dist/main/index.js`
- Modify: `scripts/verify-macos-hermes-runtime.mjs`
- Create: `scripts/verify-hermes-start-single-flight.mjs`
- Modify: `scripts/build-macos-runtime.mjs`
- Modify: `runtime/PORTABLE-RUNTIME-MANIFEST.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: validated `HermesPortable` runtime and concurrent IPC start requests.
- Produces: one shared start Promise, one config process, one API process, and readiness-based status.

- [ ] Add a failing source-level lifecycle verification for three concurrent starts.
- [ ] Add a failing runtime import probe for `typing_extensions`, `pydantic`, `fastapi` and `uvicorn`.
- [ ] Implement `_startPromise`, child identity checks and serialized stop behavior.
- [ ] Require config and API readiness before returning success.
- [ ] Classify active-stop signals as interrupted and preserve diagnostic logs.
- [ ] Run Hermes environment, chat, skill and lifecycle verifiers.

### Task 4: Build And Portable Regression

**Files:**
- Modify: `scripts/audit-portable-release.mjs`
- Create: `docs/codex-handoff/2026-07-28-macos-skills-hermes-runtime.md`

**Interfaces:**
- Consumes: completed Tasks 1-3.
- Produces: staged `release/macos-usb-root-exfat` and a handoff with exact verification evidence.

- [ ] Run `npm run build` and `npm run typecheck`.
- [ ] Run `npm run audit:openclaw-shell` and all focused verifiers.
- [ ] Run `npm run stage:macos-usb-root:final` without copying user data.
- [ ] Verify app/runtime/skills/extensions root layout and runtime probes.
- [ ] Inspect `git status` and `git diff` for unrelated or generated artifacts.
- [ ] Add the handoff, commit with a Chinese message, and push `feat/macos-portable-app`.
