import fs from "node:fs";
import path from "node:path";
import { resolvePortableRoot } from "./portable-root.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const sourceApp = path.join(projectRoot, "src", "openclaw-shell-app");
const usbRoot = resolvePortableRoot(projectRoot);
const targetApp = path.resolve(
  process.env.OPENCLAW_TARGET_APP?.trim()
    || path.join(usbRoot, "win-unpacked", "resources", "app")
);
const backupsRoot = path.join(usbRoot, "backups");

function timestamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("");
}

function assertSourceApp() {
  const required = [
    path.join(sourceApp, "package.json"),
    path.join(sourceApp, "dist", "main", "index.js"),
    path.join(sourceApp, "dist", "main", "chat-skill-routing.cjs"),
    path.join(sourceApp, "dist", "main", "skill-metadata.cjs"),
    path.join(sourceApp, "dist", "main", "skill-repository-worker.cjs"),
    path.join(sourceApp, "dist", "preload", "index.js"),
    path.join(sourceApp, "dist", "assets", "assets", "main-DIeui7ZO.js"),
    path.join(sourceApp, "dist", "assets", "main-CAx6YYDG.css"),
    path.join(sourceApp, "dist", "assets", "main", "index.html")
  ];
  const missing = required.filter((filePath) => !fs.existsSync(filePath));
  if (missing.length) throw new Error(`Canonical source app is incomplete:\n${missing.join("\n")}`);
}

function backupExistingTarget() {
  if (!fs.existsSync(targetApp)) return null;
  fs.mkdirSync(backupsRoot, { recursive: true });
  const backup = path.join(backupsRoot, `app-before-source-restore-${timestamp()}`);
  fs.renameSync(targetApp, backup);
  return backup;
}

assertSourceApp();
fs.mkdirSync(path.dirname(targetApp), { recursive: true });
const stagingApp = `${targetApp}.source-restore-${process.pid}`;
fs.rmSync(stagingApp, { recursive: true, force: true });
fs.cpSync(sourceApp, stagingApp, { recursive: true });

let backup = null;
try {
  backup = backupExistingTarget();
  fs.renameSync(stagingApp, targetApp);
} catch (error) {
  fs.rmSync(stagingApp, { recursive: true, force: true });
  if (backup && !fs.existsSync(targetApp)) fs.renameSync(backup, targetApp);
  throw error;
}

console.log(`Restored canonical OpenClaw shell source to ${targetApp}`);
if (backup) console.log(`Backed up previous app to ${backup}`);
console.log("No renderer or main-process patch layer was applied.");
