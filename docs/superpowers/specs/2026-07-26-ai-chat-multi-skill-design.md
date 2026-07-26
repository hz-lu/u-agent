# AI Chat Multi-Skill Design

## Goal

Port the latest main-branch skill discovery, management, and `/skill` chat workflow to the macOS portable branch without merging branches or regressing the existing OpenClaw, Hermes, attachment, model, history, startup, and exFAT USB behavior.

The chat workflow must let users select one or more skills, keep editing the task, and send the selected skills and task together. Collaboration mode automatically chooses one Agent for the complete skill set, preferring OpenClaw and falling back to Hermes only when it is safe to do so.

## Constraints

- `src/` remains the source of truth. Generated `dist/` files and `scripts/restore-openclaw-shell.mjs` must remain reproducible from the same source behavior.
- Do not merge or cherry-pick `origin/main`. Main does not contain the macOS portable build and staging files and would remove macOS-specific behavior.
- Preserve Hermes readiness waiting, interrupted-process classification, background result recovery, attachment materialization, image preview, IME-safe Enter handling, model synchronization, chat persistence, and macOS USB launch behavior.
- Preserve the current OpenClaw UI and normal conversation path.
- Do not perform recursive skill discovery, fingerprinting, or copying in the Electron main thread.
- Do not adopt main's 15-second full repository reconciliation loop on exFAT media.
- Do not impose an application-level hard limit on selected skill count. Deduplicate identical selections and report runtime context-limit failures clearly.
- Never invoke part of a selected skill set silently. The selected set is routed and executed as one unit.

## Main-Branch Findings

The relevant main-branch commits are `77c2693`, `7e709b8`, `4155731`, `99f9647`, and `ec88d7f`.

Main contributes three useful behavior groups:

1. A canonical portable skill repository with import from OpenClaw and Hermes private skill directories.
2. Child-process skill metadata parsing and OpenClaw session skill-snapshot refresh.
3. Official OpenClaw and Hermes skill command discovery plus a single-selection `/skill` chat menu.

The main renderer currently sends immediately after selecting one skill and hides `/skill` in collaboration mode. Those behaviors do not meet this design and will not be copied.

## Official Runtime Capabilities

### OpenClaw

OpenClaw's official text command accepts one skill per command:

```text
/skill <name> [input]
```

Its official command resolver rewrites a prompt-based skill invocation to the semantic form:

```text
Use the "<skill>" skill for this request.

User input:
<instruction>
```

OpenClaw has no official dynamic multi-select `/skill` syntax. For one selected skill, the application sends the official slash command. For multiple selected skills, the application sends one client-composed request using the same official prompt semantics for every selected skill. It does not concatenate multiple slash commands or send multiple chat turns.

### Hermes

Hermes officially supports multiple skills through `--skills` and `build_preloaded_skills_prompt()`. It also supports persistent skill bundles, but creating a persistent bundle for every temporary UI selection would add unwanted files and lifecycle state.

For one selected skill, the application uses `resolve_skill_command_key()` and `build_skill_invocation_message()`. For multiple selected skills, it uses `build_preloaded_skills_prompt()` and combines the returned official skills prompt with the user's instruction in one Hermes oneshot request.

## Architecture

The implementation has four bounded responsibilities:

1. **Skill repository worker** reconciles the public USB-root `skills/` repository with Agent-owned install locations outside the Electron main thread.
2. **Skill metadata worker** discovers nested skill packages and parses their metadata outside the Electron main thread.
3. **Chat skill service** asks each Agent for its real command catalog, resolves selected skills, and creates one execution request for the chosen Agent.
4. **Chat input UI** owns pending skill selections independently from text and attachments.

These responsibilities use small structured payloads over IPC. Skill file contents are not sent to the renderer.

## Canonical Skill Repository

The USB-root `skills/` directory is the user-visible canonical repository. The worker imports skills created or downloaded into:

- `data/.openclaw/skills`
- `data/.openclaw/workspace/skills`
- `data/.hermes/skills`

The worker records reconciliation state in `data/.agent-hub/shared-skills.json`. Package path is the management identity; frontmatter skill name remains the Agent invocation identity. This preserves duplicate package visibility while preventing ambiguous Agent commands from being treated as separate invocations.

Reconciliation runs:

- once after application startup, after the main window is responsive;
- after an explicit install, delete, enable, disable, or manual refresh action;
- when the skill management page requests a refresh;
- through a slow fallback timer only when no reconciliation has recently completed.

Only one reconciliation may run at a time. Repeated triggers coalesce into one pending run. Recursive scans and copies execute in the worker process.

## Skill Metadata

Metadata discovery supports nested packages up to six directory levels, inline YAML, quoted values, folded and literal descriptions, and first-useful-paragraph fallback. Invalid directories remain visible in management diagnostics but are not offered in chat.

After the canonical repository changes, persisted OpenClaw `skillsSnapshot` fields are invalidated without deleting session IDs or conversation history. Hermes command caches are explicitly reloaded after synchronization.

## Chat Input Interaction

Typing `/ski`, `/skil`, or `/skill` opens the searchable skill list and lazily requests the active mode's catalog.

Selecting a skill:

- does not send a message;
- adds a removable skill chip above the text area;
- removes the `/skill` query from the editable text;
- keeps focus in the text area;
- allows the user to reopen `/skill` and add more skills;
- ignores an already-selected skill instead of adding a duplicate.

Text, attachments, and selected skill chips are independent input state. Enter remains IME-safe. Sending is allowed when the user has text, attachments, or at least one selected skill.

After a request is accepted by the main process, the input clears text, attachments, and selected skills. If validation or IPC acceptance fails, all input state remains available for retry.

Chat history stores the user's original instruction, attachment metadata, selected skill names, and the final execution Agent. It never stores the expanded Hermes skill body or other generated runtime prompt text.

## Catalogs and Availability

OpenClaw catalog resolution order:

1. Gateway `commands.list`, filtered to `source === "skill"`.
2. Official `openclaw skills list --json` using the portable runtime.
3. Canonical portable catalog as a degraded display fallback.

Only the first two sources prove that OpenClaw can invoke a skill. A skill found only in the canonical fallback may be displayed with an unavailable state but cannot make OpenClaw win collaboration routing.

Hermes catalog resolution uses official `reload_skills()` and `get_skill_commands()` through the bundled Python runtime. Canonical catalog entries that Hermes does not report are not treated as Hermes-available.

Catalog entries contain stable package ID, invocation name, command alias, description, source, Agent availability, and any ambiguity or invalidity reason.

## Execution

### OpenClaw Mode

- One skill: send the official skill slash alias plus the user's instruction.
- Multiple skills: send one request that instructs OpenClaw to use every selected skill for the same task, followed by the original user instruction and attachments.
- The renderer shows the original instruction and chips, not the rewritten request.

### Hermes Mode

- Resolve every selected skill through Hermes official commands before starting oneshot.
- One skill uses `build_skill_invocation_message()`.
- Multiple skills use `build_preloaded_skills_prompt()`.
- Append attachment context and the original instruction after the official skill prompt.
- If any selected skill is missing, do not run a partial set.

### Collaboration Mode

The complete selected set is routed atomically:

1. If OpenClaw officially reports every selected skill and Gateway is ready, use OpenClaw.
2. Otherwise, if Hermes officially reports every selected skill, use Hermes.
3. Otherwise, reject before execution and list missing skills per Agent.

When OpenClaw is chosen, fallback to Hermes is allowed only when OpenClaw fails before accepting or starting the request, including Gateway unavailable, command rejection, or pre-dispatch timeout. No fallback occurs after an accepted request, a tool starts, a response event arrives, or any result is persisted. This prevents duplicate file writes, installations, messages, and other side effects.

The UI records and displays the final execution Agent. When fallback occurs, it also displays the concise fallback reason.

Collaboration messages without selected skills retain the existing collaboration behavior.

## Error Handling

- Catalog loading failure leaves the editor usable and shows a retryable list error.
- Duplicate or ambiguous invocation names are disabled in chat until the user resolves the package conflict.
- Missing skills identify which selected names OpenClaw and Hermes cannot invoke.
- Runtime context overflow reports that too many or overly large skills were selected without deleting the draft.
- Worker failures are logged and surfaced in skill management without blocking normal chat.
- Agent startup and readiness messages reuse the existing progress channel and do not claim success before readiness.
- Logs include command names, counts, routing decisions, and durations, but not user conversation text or expanded skill bodies.

## Source and Build Alignment

Behavior is implemented first in `src/openclaw-shell-app/`. The preload API exposes structured skill catalog and selected-skill chat payload methods. `scripts/build-openclaw-shell-app.mjs` and `scripts/restore-openclaw-shell.mjs` are updated so rebuilding produces the same behavior rather than layering a release-only patch.

Generated `dist/` counterparts are refreshed only through the repository's build process. macOS staging scripts remain intact.

## Verification

Automated regression checks cover:

- nested and duplicate skill metadata;
- canonical repository import, update, deletion, and conflict behavior;
- no recursive repository work in Electron main;
- `/skill` query detection and lazy catalog loading;
- selection does not send;
- multi-selection, deduplication, removal, and draft preservation;
- IME Enter behavior with selected skills;
- OpenClaw official single-skill payload;
- OpenClaw client-composed multi-skill payload;
- Hermes official single- and multi-skill prompt construction;
- collaboration OpenClaw-first routing;
- Hermes routing when OpenClaw lacks any selected skill;
- rejection when neither Agent supports the complete set;
- no fallback after OpenClaw accepts execution;
- history stores skill metadata but not expanded skill contents;
- existing attachments, model selection, history recovery, and Hermes readiness checks.

Static checks run against main-process, preload, renderer, worker, build, and restore files. The final macOS release is staged and audited without replacing user `data/`, `skills/`, `extensions/`, or `.license` content.

## Out of Scope

- Changing OpenClaw or Hermes upstream runtime source to invent a new slash-command grammar.
- Splitting one selected skill set across two Agents.
- Running the same selected task concurrently in both Agents.
- Persisting temporary UI selections as Hermes bundle files.
- Redesigning unrelated OpenClaw UI or chat state.
- Intel macOS packaging in this phase.
