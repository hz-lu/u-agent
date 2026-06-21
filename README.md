# OpenClawPro Agent Hub

OpenClawPro Agent Hub is a portable desktop client that brings OpenClaw and Hermes Agent into one USB-first application. It is designed for a plug-and-play workflow: copy the release package to a USB drive, launch the client, configure models and keys from the UI, then use OpenClaw, Hermes, skills, chat, automation, and connector features from the same interface.

The project preserves the original OpenClaw desktop experience while adding Hermes Agent as a first-class runtime. Hermes is not a separate patch layer or a hidden add-on; it is integrated into the home console, AI chat, model configuration, environment checks, skill management, logs, and configuration panels.

## What It Does

- Runs OpenClaw and Hermes Agent from a portable USB layout.
- Bundles the required Windows runtime files for Python, Node.js, OpenClaw, and Hermes.
- Keeps application state under the USB `data/` directory instead of the host machine.
- Provides a unified desktop UI for starting, stopping, restarting, checking, and configuring agents.
- Lets OpenClaw and Hermes share the same installed skills from the USB `skills/` directory.
- Supports OpenClaw chat, Hermes chat, and OpenClaw + Hermes collaborative chat modes.
- Provides model configuration, API key setup, connection testing, log viewing, and import/export flows.
- Includes Hermes memory, skill sync, skill growth verification, connector, schedule, sandbox, and dashboard entry points.
- Builds a clean Windows portable release zip that excludes existing user data.

## Current Release Scope

The current working release target is Windows x64 portable.

| Capability | Status |
| --- | --- |
| Windows portable app | Available |
| Zero install on Windows | Available |
| USB-local data directory | Available |
| OpenClaw runtime | Available |
| Hermes Windows runtime | Available |
| Shared OpenClaw/Hermes skills | Available |
| Clean Windows release zip | Available |
| macOS arm64/x64 runtime bundle | Not yet bundled |
| Linux x64/arm64 runtime bundle | Not yet bundled |
| Universal three-platform zip | Not yet bundled |

## Portable Layout

A usable Windows portable package is expected to look like this at the USB root:

```text
X:\
|-- OpenClawPro*.exe
|-- win-unpacked\
|   `-- OpenClawPro.exe
|-- runtime\
|   |-- openclaw.zip
|   |-- openclaw.cmd
|   |-- node.exe
|   `-- HermesPortable\
|-- skills\
|-- extensions\
`-- data\
    |-- .openclaw\
    `-- .hermes\
```

`X:` means any USB drive letter.

## Data And Zero-Trace Policy

Runtime state is redirected to the USB drive:

```text
data/.openclaw/    OpenClaw configuration, plugin state, chat state, logs
data/.hermes/      Hermes home, config, cache, logs, memories, skills, cron, sandboxes
skills/            Shared skill installation directory
extensions/        Portable extension/plugin directory
```

Hermes is launched with USB-local environment variables such as:

```text
HOME=data/.hermes/home
USERPROFILE=data/.hermes/home
XDG_CONFIG_HOME=data/.hermes/config
XDG_CACHE_HOME=data/.hermes/cache
HERMES_HOME=data/.hermes
HERMES_LOG_DIR=data/.hermes/logs
HERMES_MEMORY_PATH=data/.hermes/memories
HERMES_SKILLS_PATH=data/.hermes/skills
TMP=data/.hermes/tmp
TEMP=data/.hermes/tmp
```

The release packager creates an initialized `data/` directory and intentionally excludes:

- `.license`
- API keys and model provider secrets
- WeChat account login state
- chat history
- Hermes auth files
- Hermes memories
- logs, caches, reports, and runtime databases

## Using Skills

Install skills into the USB root `skills/` directory:

```text
X:\skills\my-skill\SKILL.md
X:\skills\my-skill\...
```

or as a single Markdown skill:

```text
X:\skills\my-skill.md
```

OpenClaw reads this directory directly. To make the same skills available to Hermes:

1. Open the desktop app.
2. Go to Skill Management.
3. Confirm the skill is enabled.
4. Click the Hermes skill sync action.
5. Re-run Environment Check if you want to verify Hermes skill visibility.

The sync mirrors enabled OpenClaw skills into:

```text
data/.hermes/skills/openclaw/
```

Use `skills/` as the single installation entry point. Do not manually install shared skills directly into `data/.hermes/skills/` unless you are intentionally creating Hermes-only skills.

## Main UI Areas

### Home Console

The home console provides OpenClaw and Hermes runtime controls:

- start
- stop
- restart
- status
- logs
- Hermes config center
- Hermes dashboard
- Hermes Agent API

### AI Chat

The AI chat page supports three modes:

- OpenClaw mode: talks through the OpenClaw Gateway.
- Hermes mode: talks to Hermes Agent directly.
- Collaborative mode: OpenClaw drafts or executes first, then Hermes reviews, enriches, or finalizes the answer.

Hermes and collaborative chat state is preserved when switching pages.

### Model Configuration

Model configuration is unified. Configure the model and provider once, then OpenClaw and Hermes can use the same model settings where applicable.

### Environment Check

Environment checks show OpenClaw runtime status, Hermes runtime status, Python/Node availability, ports, memory readiness, skill visibility, and skill growth verification state.

Heavy Hermes checks, such as memory verification and skill scanning, are kept as explicit actions or scripts so the UI does not freeze during automatic refresh.

### Chat Tools

The chat tools area includes WeChat integration. Re-scanning WeChat can restart the OpenClaw Gateway to reload account configuration; after restart, the UI restores Gateway state and reconnects AI chat automatically.

## Release Package

Build a clean Windows portable release zip:

```powershell
cd E:\source\openclawpro-agent-hub
node scripts\build-windows-release.mjs
```

The generated artifact is written to:

```text
E:\release\OpenClawPro-AgentHub-Windows-Portable-YYYYMMDDHHMMSS.zip
```

The zip is intended to be uploaded as a GitHub Release asset, not committed into the Git repository.

Recommended installation:

1. Download the release zip.
2. Extract it to the USB root, for example `F:\`.
3. Keep the extraction path short to avoid Windows long path issues in Python dependencies.
4. Launch the top-level `OpenClawPro*.exe` launcher or `win-unpacked\OpenClawPro.exe`.
5. Complete activation, model configuration, and connector setup in the UI.

## Development

Install dependencies and build:

```powershell
cd E:\source\openclawpro-agent-hub
npm install
npm run typecheck
npm run build
```

Deploy the built app to the current USB application directory:

```powershell
npm run deploy:usb
```

Restore and patch the original OpenClaw shell with the current Hermes integration:

```powershell
npm run restore:openclaw-shell
```

## Verification Commands

```powershell
npm run scan:usb
npm run audit:portable
npm run verify:openclaw
npm run verify:hermes
npm run verify:hermes-memory
npm run verify:hermes-skills
npm run verify:hermes-skill-growth
```

Useful direct checks:

```powershell
node --check scripts\restore-openclaw-shell.mjs
node --check scripts\build-windows-release.mjs
node --check E:\win-unpacked\resources\app\dist\main\index.js
```

## Source Structure

```text
src/
|-- main/        Electron main process and runtime managers
|-- preload/     Secure IPC bridge
|-- renderer/    Vue UI
`-- shared/      Shared types and platform helpers

scripts/
|-- restore-openclaw-shell.mjs
|-- build-windows-release.mjs
|-- audit-portable-release.mjs
|-- verify-hermes-runtime.mjs
|-- verify-hermes-memory.mjs
|-- verify-hermes-skills.mjs
|-- verify-hermes-skill-growth.mjs
`-- verify-openclaw-runtime.mjs
```

## Security Notes

- Do not commit release zips to Git.
- Do not commit `.license`.
- Do not commit `data/` from a used USB drive.
- Do not commit API keys, model provider tokens, WeChat account state, chat history, or Hermes memory files.
- Use `scripts/build-windows-release.mjs` to create clean distributable packages.
