import fs from "node:fs";
import path from "node:path";
import { resolvePortableRoot } from "./portable-root.mjs";

const usbRoot = resolvePortableRoot();

function exists(relPath) {
  return fs.existsSync(path.join(usbRoot, relPath));
}

function hasUsablePath(relPath) {
  const fullPath = path.join(usbRoot, relPath);
  if (!fs.existsSync(fullPath)) return false;
  const stat = fs.statSync(fullPath);
  if (stat.isFile()) return path.basename(fullPath) !== ".gitkeep";
  if (!stat.isDirectory()) return true;
  const stack = [fullPath];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const child = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(child);
      else if (entry.isFile() && entry.name !== ".gitkeep") return true;
    }
  }
  return false;
}

function readJsonSafe(relPath) {
  try {
    const file = path.join(usbRoot, relPath);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return null;
  }
}

function hasUtf8Bom(relPath) {
  const file = path.join(usbRoot, relPath);
  if (!fs.existsSync(file)) return false;
  const bytes = fs.readFileSync(file);
  return bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
}

function validateOpenClawConfigShape(config) {
  const findings = [];
  if (!config || typeof config !== "object") {
    findings.push("data/.openclaw/openclaw.json is missing or is not valid JSON.");
    return findings;
  }
  const meta = config.meta;
  if (!meta || typeof meta !== "object") {
    findings.push("OpenClaw config meta must be an object with lastTouchedVersion and lastTouchedAt.");
  } else {
    if (typeof meta.lastTouchedVersion !== "string" || !meta.lastTouchedVersion) {
      findings.push("OpenClaw config meta.lastTouchedVersion is required.");
    }
    if (typeof meta.lastTouchedAt !== "string" || !meta.lastTouchedAt) {
      findings.push("OpenClaw config meta.lastTouchedAt is required.");
    }
    if ("release" in meta || "initializedAt" in meta) {
      findings.push("OpenClaw config meta uses release/initializedAt, which is rejected by OpenClaw 2026.6.5.");
    }
  }
  const configuredExtraDirs = config.skills?.load?.extraDirs;
  if (Array.isArray(configuredExtraDirs)) {
    for (const [index, value] of configuredExtraDirs.entries()) {
      if (typeof value !== "string") continue;
      if (/^[A-Za-z]:[\\/]/.test(value) || value.startsWith("/")) {
        findings.push(`OpenClaw skills.load.extraDirs[${index}] must be portable relative path, got ${value}`);
      }
    }
  }
  return findings;
}

function countChildren(relPath) {
  const dir = path.join(usbRoot, relPath);
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).length;
}

function anyExists(relPaths) {
  return relPaths.some((relPath) => exists(relPath));
}

function releaseFileMatches(pattern) {
  const releaseDir = path.join(usbRoot, "release");
  if (!fs.existsSync(releaseDir)) return false;
  return fs.readdirSync(releaseDir).some((name) => pattern.test(name));
}

const openClawConfig = readJsonSafe("data/.openclaw/openclaw.json");
const runtimeManifest = readJsonSafe("runtime/PORTABLE-RUNTIME-MANIFEST.json");
const extraDirs = openClawConfig?.skills?.load?.extraDirs || [];
const openClawConfigFindings = validateOpenClawConfigShape(openClawConfig);
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

function auditRuntimeManifest(manifest) {
  if (!manifest || typeof manifest !== "object") {
    return {
      present: false,
      platforms: {},
      sharedMissing: [],
      dataTemplateMissing: [],
      forbiddenPresent: []
    };
  }

  const sharedRequiredPaths = Array.isArray(manifest.sharedRequiredPaths) ? manifest.sharedRequiredPaths : [];
  const dataTemplatePaths = Array.isArray(manifest.dataTemplatePaths) ? manifest.dataTemplatePaths : [];
  const forbiddenRuntimePaths = Array.isArray(manifest.forbiddenRuntimePaths) ? manifest.forbiddenRuntimePaths : [];
  const platforms = {};

  for (const [platform, spec] of Object.entries(manifest.platforms || {})) {
    const requiredPaths = Array.isArray(spec?.requiredPaths) ? spec.requiredPaths : [];
    const launchers = Array.isArray(spec?.launchers) ? spec.launchers : [];
    platforms[platform] = {
      required: requiredPaths.length,
      missingRequired: requiredPaths.filter((relPath) => !hasUsablePath(relPath)),
      launcherReady: launchers.length > 0 && launchers.some((relPath) => exists(relPath)),
      launchers
    };
  }

  return {
    present: true,
    schemaVersion: manifest.schemaVersion || null,
    platforms,
    sharedMissing: sharedRequiredPaths.filter((relPath) => !exists(relPath)),
    dataTemplateMissing: dataTemplatePaths.filter((relPath) => !hasUsablePath(relPath)),
    forbiddenPresent: forbiddenRuntimePaths.filter((relPath) => exists(relPath))
  };
}

const runtimeManifestAudit = auditRuntimeManifest(runtimeManifest);

const checks = {
  portableRuntimeManifest: runtimeManifestAudit.present,
  windowsApp: exists("win-unpacked/OpenClawPro.exe"),
  windowsAppResources: exists("win-unpacked/resources/app/dist/main/index.js"),
  windowsLauncher: exists("OpenClawPro U盘便携版.exe") || exists("win-unpacked/OpenClawPro.exe"),
  openClawZip: exists("runtime/openclaw.zip"),
  openClawCommandOnUsb: exists("runtime/openclaw.cmd"),
  openClawNodeOnUsb: exists("runtime/node.exe"),
  openClawPackageEntry: exists("runtime/node_modules/openclaw/openclaw.mjs"),
  openClawPackageJson: exists("runtime/node_modules/openclaw/package.json"),
  openClawDist: exists("runtime/node_modules/openclaw/dist"),
  hermesWindowsRuntime: exists("runtime/HermesPortable/venv/Scripts/hermes.exe"),
  hermesWindowsPython: exists("runtime/HermesPortable/venv/Scripts/python.exe"),
  hermesWindowsNode: exists("runtime/HermesPortable/node/node.exe"),
  hermesWindowsSource: exists("runtime/HermesPortable/hermes-agent/pyproject.toml"),
  hermesMacArm64Runtime: exists("runtime/macos-arm64/HermesPortable/venv/bin/hermes") || exists("runtime/HermesPortable-macos-arm64/venv/bin/hermes"),
  hermesMacX64Runtime: exists("runtime/macos-x64/HermesPortable/venv/bin/hermes") || exists("runtime/HermesPortable-macos-x64/venv/bin/hermes"),
  hermesLinuxX64Runtime: exists("runtime/linux-x64/HermesPortable/venv/bin/hermes") || exists("runtime/HermesPortable-linux-x64/venv/bin/hermes"),
  hermesLinuxArm64Runtime: exists("runtime/linux-arm64/HermesPortable/venv/bin/hermes") || exists("runtime/HermesPortable-linux-arm64/venv/bin/hermes"),
  macLauncher: exists("OpenClawPro.command") || exists("OpenClawPro.app") || exists("macos/OpenClawPro.app"),
  linuxLauncher: exists("OpenClawPro.sh") || exists("linux/OpenClawPro"),
  universalManifest: anyExists([
    "RELEASE-MANIFEST.json",
    "UNIVERSAL-MANIFEST.json",
    "release/RELEASE-MANIFEST.json",
    "release/UNIVERSAL-MANIFEST.json"
  ]) || releaseFileMatches(/(?:Universal|AllPlatforms).*\.manifest\.json$/i),
  universalZipPackage: releaseFileMatches(/(?:Universal|AllPlatforms).*\.zip$/i),
  dataDir: exists("data"),
  openClawData: exists("data/.openclaw/openclaw.json"),
  hermesData: exists("data/.hermes"),
  openClawConfigNoBom: !hasUtf8Bom("data/.openclaw/openclaw.json"),
  openClawConfigShape: openClawConfigFindings.length === 0,
  skillsDir: exists("skills"),
  hermesSkillMirror: exists("data/.hermes/skills/openclaw"),
  legacyHermesDataInRuntime: exists("runtime/HermesPortable/data") || exists("runtime/HermesPortable/_home"),
  noForeignAbsolutePaths: absolutePathsOutsideRoot.length === 0,
};

const report = {
  checkedAt: new Date().toISOString(),
  usbRoot,
  summary: {
    windowsPortableUsable: checks.windowsApp && checks.openClawZip && checks.openClawNodeOnUsb && checks.openClawPackageEntry && checks.openClawDist && checks.hermesWindowsRuntime && checks.hermesWindowsSource && checks.dataDir,
    zeroInstallWindowsMostlyReady: checks.windowsApp && checks.openClawZip && checks.openClawNodeOnUsb && checks.openClawPackageEntry && checks.openClawDist && checks.hermesWindowsPython && checks.hermesWindowsNode && checks.hermesWindowsSource,
    strictZeroTraceReady: checks.dataDir && !checks.legacyHermesDataInRuntime && runtimeManifestAudit.forbiddenPresent.length === 0,
    threePlatformNativeReady: checks.hermesWindowsRuntime && checks.hermesMacArm64Runtime && checks.hermesMacX64Runtime && checks.hermesLinuxX64Runtime && checks.hermesLinuxArm64Runtime && checks.macLauncher && checks.linuxLauncher,
    universalZipReady: checks.universalManifest && checks.universalZipPackage,
  },
  checks,
  runtimeManifest: runtimeManifestAudit,
  counts: {
    rootRuntimeEntries: countChildren("runtime"),
    skills: countChildren("skills"),
    hermesMirroredOpenClawSkills: countChildren("data/.hermes/skills/openclaw"),
  },
  openClawSkillExtraDirs: extraDirs,
  absolutePathsOutsideRoot,
  gaps: [],
};

if (!checks.portableRuntimeManifest) report.gaps.push("runtime/PORTABLE-RUNTIME-MANIFEST.json is missing; portable runtime expectations are not source-controlled.");
if (!checks.openClawCommandOnUsb) report.gaps.push("runtime/openclaw.cmd is missing; current app may extract/use host cache before OpenClaw CLI is fully USB-local.");
if (checks.legacyHermesDataInRuntime) report.gaps.push("runtime/HermesPortable still contains data/_home; strict zero-trace packaging should remove or migrate these into data/.hermes.");
if (runtimeManifestAudit.forbiddenPresent.length) report.gaps.push(`Runtime manifest forbidden paths are present: ${runtimeManifestAudit.forbiddenPresent.join(", ")}`);
for (const [platform, platformAudit] of Object.entries(runtimeManifestAudit.platforms)) {
  if (platformAudit.missingRequired.length) {
    report.gaps.push(`${platform} runtime manifest missing ${platformAudit.missingRequired.length} required path(s): ${platformAudit.missingRequired.slice(0, 5).join(", ")}${platformAudit.missingRequired.length > 5 ? ", ..." : ""}`);
  }
  if (!platformAudit.launcherReady) report.gaps.push(`${platform} runtime manifest has no available launcher: ${platformAudit.launchers.join(" or ")}`);
}
if (runtimeManifestAudit.sharedMissing.length) report.gaps.push(`Shared portable paths are missing: ${runtimeManifestAudit.sharedMissing.join(", ")}`);
if (runtimeManifestAudit.dataTemplateMissing.length) report.gaps.push(`Portable data templates are missing: ${runtimeManifestAudit.dataTemplateMissing.join(", ")}`);
if (!checks.openClawConfigNoBom) report.gaps.push("data/.openclaw/openclaw.json contains a UTF-8 BOM; OpenClaw JSON.parse can reject it.");
for (const finding of openClawConfigFindings) report.gaps.push(finding);
if (!report.summary.threePlatformNativeReady) report.gaps.push("macOS arm64/x64 and Linux x64/arm64 runtimes/launchers are not bundled.");
if (!checks.universalManifest) report.gaps.push("No generated universal zip manifest was found.");
if (!checks.universalZipPackage) report.gaps.push("No generated universal zip package was found.");
if (!checks.noForeignAbsolutePaths) report.gaps.push("Config contains absolute paths outside the current portable root.");

console.log(JSON.stringify(report, null, 2));
