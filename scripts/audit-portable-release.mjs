import fs from "node:fs";
import path from "node:path";
import { resolvePortableRoot } from "./portable-root.mjs";

const usbRoot = resolvePortableRoot();

function exists(relPath) {
  return fs.existsSync(path.join(usbRoot, relPath));
}

function readJsonSafe(relPath) {
  try {
    const file = path.join(usbRoot, relPath);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function countChildren(relPath) {
  const dir = path.join(usbRoot, relPath);
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).length;
}

const openClawConfig = readJsonSafe("data/.openclaw/openclaw.json");
const extraDirs = openClawConfig?.skills?.load?.extraDirs || [];
const rootDrive = path.parse(usbRoot).root.replace(/\\$/, "").toLowerCase();
const absolutePathsOutsideRoot = [];

function inspectValue(value, location) {
  if (typeof value === "string") {
    const looksAbsoluteWin = /^[A-Za-z]:[\\/]/.test(value);
    const looksAbsolutePosix = value.startsWith("/");
    if (looksAbsoluteWin) {
      const valueDrive = value.slice(0, 2).toLowerCase();
      if (valueDrive !== rootDrive) absolutePathsOutsideRoot.push({ location, value });
    } else if (looksAbsolutePosix && process.platform === "win32") {
      absolutePathsOutsideRoot.push({ location, value });
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectValue(item, `${location}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      inspectValue(child, `${location}.${key}`);
    }
  }
}
inspectValue(openClawConfig || {}, "openclaw");

const checks = {
  windowsApp: exists("win-unpacked/OpenClawPro.exe"),
  windowsAppResources: exists("win-unpacked/resources/app/dist/main/index.js"),
  windowsLauncher: exists("OpenClawPro U盘便携版.exe") || exists("win-unpacked/OpenClawPro.exe"),
  openClawZip: exists("runtime/openclaw.zip"),
  openClawCommandOnUsb: exists("runtime/openclaw.cmd"),
  openClawNodeOnUsb: exists("runtime/node.exe"),
  hermesWindowsRuntime: exists("runtime/HermesPortable/venv/Scripts/hermes.exe"),
  hermesWindowsPython: exists("runtime/HermesPortable/venv/Scripts/python.exe"),
  hermesWindowsNode: exists("runtime/HermesPortable/node/node.exe"),
  hermesMacArm64Runtime: exists("runtime/macos-arm64/HermesPortable/venv/bin/hermes") || exists("runtime/HermesPortable-macos-arm64/venv/bin/hermes"),
  hermesMacX64Runtime: exists("runtime/macos-x64/HermesPortable/venv/bin/hermes") || exists("runtime/HermesPortable-macos-x64/venv/bin/hermes"),
  hermesLinuxX64Runtime: exists("runtime/linux-x64/HermesPortable/venv/bin/hermes") || exists("runtime/HermesPortable-linux-x64/venv/bin/hermes"),
  hermesLinuxArm64Runtime: exists("runtime/linux-arm64/HermesPortable/venv/bin/hermes") || exists("runtime/HermesPortable-linux-arm64/venv/bin/hermes"),
  macLauncher: exists("OpenClawPro.command") || exists("macos/OpenClawPro.app"),
  linuxLauncher: exists("OpenClawPro.sh") || exists("linux/OpenClawPro"),
  dataDir: exists("data"),
  openClawData: exists("data/.openclaw/openclaw.json"),
  hermesData: exists("data/.hermes"),
  skillsDir: exists("skills"),
  hermesSkillMirror: exists("data/.hermes/skills/openclaw"),
  legacyHermesDataInRuntime: exists("runtime/HermesPortable/data") || exists("runtime/HermesPortable/_home"),
  noForeignAbsolutePaths: absolutePathsOutsideRoot.length === 0,
};

const report = {
  checkedAt: new Date().toISOString(),
  usbRoot,
  summary: {
    windowsPortableUsable: checks.windowsApp && checks.openClawZip && checks.openClawNodeOnUsb && checks.hermesWindowsRuntime && checks.dataDir,
    zeroInstallWindowsMostlyReady: checks.windowsApp && checks.openClawZip && checks.openClawNodeOnUsb && checks.hermesWindowsPython && checks.hermesWindowsNode,
    strictZeroTraceReady: checks.dataDir && !checks.legacyHermesDataInRuntime,
    threePlatformNativeReady: checks.hermesWindowsRuntime && checks.hermesMacArm64Runtime && checks.hermesMacX64Runtime && checks.hermesLinuxX64Runtime && checks.hermesLinuxArm64Runtime && checks.macLauncher && checks.linuxLauncher,
    universalZipReady: false,
  },
  checks,
  counts: {
    rootRuntimeEntries: countChildren("runtime"),
    skills: countChildren("skills"),
    hermesMirroredOpenClawSkills: countChildren("data/.hermes/skills/openclaw"),
  },
  openClawSkillExtraDirs: extraDirs,
  absolutePathsOutsideRoot,
  gaps: [],
};

if (!checks.openClawCommandOnUsb) report.gaps.push("runtime/openclaw.cmd is missing; current app may extract/use host cache before OpenClaw CLI is fully USB-local.");
if (checks.legacyHermesDataInRuntime) report.gaps.push("runtime/HermesPortable still contains data/_home; strict zero-trace packaging should remove or migrate these into data/.hermes.");
if (!report.summary.threePlatformNativeReady) report.gaps.push("macOS arm64/x64 and Linux x64/arm64 runtimes/launchers are not bundled.");
if (!report.summary.universalZipReady) report.gaps.push("No generated universal zip manifest/package was found.");
if (!checks.noForeignAbsolutePaths) report.gaps.push("Config contains absolute paths outside the current portable root.");

console.log(JSON.stringify(report, null, 2));
