import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const rendererPath = path.join(root, "src", "openclaw-shell-app", "dist", "assets", "assets", "main-DIeui7ZO.js");
const source = fs.readFileSync(rendererPath, "utf8");
const failures = [];

function requireMarker(marker, label) {
  if (!source.includes(marker)) failures.push(`${label}: missing ${marker}`);
}

requireMarker("const OPENCLAW_DRAFT_TIMEOUT_MS = 18e5", "long-running OpenClaw draft timeout");
requireMarker("async function waitForOpenClawDraft(startedAt, sessionKey = \"\")", "timestamp-scoped draft wait");
requireMarker("await store.loadSessionMessages(targetSessionKey, 200, { force: true })", "authoritative history refresh");
requireMarker("message.timestamp >= startedAt", "current-request draft selection");
requireMarker("waitForOpenClawDraft(openClawStartedAt", "collaboration start-time tracking");
requireMarker('const collabOpenClawSessionKey = "openclawpro-collab"', "normalized collaboration session key");

if (source.includes("waitForOpenClawDraft(beforeLength, 13e4")) {
  failures.push("legacy array-length/130-second draft wait remains");
}
if (source.includes('const collabOpenClawSessionKey = "agent:main:openclawpro-collab"')) {
  failures.push("collaboration send and receive paths still use different session keys");
}

console.log(JSON.stringify({ ok: failures.length === 0, failures }, null, 2));
if (failures.length) process.exit(1);
