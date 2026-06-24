import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { builtinModules } from "node:module";
import { spawnSync } from "node:child_process";
import { resolvePortableRoot } from "./portable-root.mjs";

const usbRoot = resolvePortableRoot();
const runtimeRoot = path.join(usbRoot, "runtime");
const dataRoot = path.join(usbRoot, "data", ".openclaw");
const configFile = path.join(dataRoot, "openclaw.json");

function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(false));
    socket.connect(port, "127.0.0.1");
  });
}

function readConfig() {
  if (!fs.existsSync(configFile)) return null;
  try {
    return JSON.parse(fs.readFileSync(configFile, "utf8"));
  } catch {
    return null;
  }
}

const config = readConfig();
const modelRef = config?.agents?.defaults?.model?.primary || "";
const [providerId, modelId] = String(modelRef).split("/");
const provider = providerId ? config?.models?.providers?.[providerId] : null;
const distRoot = path.join(runtimeRoot, "node_modules", "openclaw", "dist");
const entryCandidates = [path.join(distRoot, "entry.mjs"), path.join(distRoot, "entry.js")];

function listFiles(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile()) files.push(full);
    }
  }
  return files;
}

function findMissingDistReferences() {
  const files = listFiles(distRoot).filter((file) => /\.(?:html|js|mjs|css)$/i.test(file));
  const missing = [];
  const scriptReferencePattern = /\b(?:import|export)\s+(?:[^"'`;]*?\s+from\s+)?["'](\.{1,2}\/[^"']+?\.(?:js|mjs|css|json|wasm))["']|import\(\s*["'](\.{1,2}\/[^"']+?\.(?:js|mjs|css|json|wasm))["']\s*\)/g;
  const markupReferencePattern = /\b(?:src|href)=["'](\.{1,2}\/[^"']+?\.(?:js|mjs|css|json|wasm))["']/g;
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const referencePattern = /\.(?:js|mjs)$/i.test(file) ? scriptReferencePattern : markupReferencePattern;
    for (const match of source.matchAll(referencePattern)) {
      const reference = match[1] || match[2];
      const target = path.resolve(path.dirname(file), reference.split(/[?#]/, 1)[0]);
      if (!fs.existsSync(target)) missing.push({ from: file, reference });
    }
  }
  return missing;
}

function getPackageName(specifier) {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
}

function findMissingPackageImports() {
  const builtins = new Set([...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);
  const files = listFiles(distRoot).filter((file) => /\.(?:js|mjs)$/i.test(file));
  const missingByPackage = new Map();
  const importPattern = /(?:^|[;\n])\s*(?:import\s+(?:[^"'`;]*?\s+from\s+)?|export\s+(?:[^"'`;]*?\s+from\s+))["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1] || match[2];
      if (!specifier) continue;
      if (specifier.startsWith(".") || specifier.startsWith("/") || /^[a-zA-Z][a-zA-Z+.-]*:/.test(specifier)) continue;
      if (builtins.has(specifier)) continue;

      const packageName = getPackageName(specifier);
      if (packageName === "openclaw") continue;
      const packageJson = path.join(openclawPackage, "node_modules", ...packageName.split("/"), "package.json");
      if (!fs.existsSync(packageJson)) {
        const items = missingByPackage.get(packageName) || [];
        if (items.length < 5) items.push({ from: file, specifier });
        missingByPackage.set(packageName, items);
      }
    }
  }

  return [...missingByPackage.entries()].map(([packageName, imports]) => ({ packageName, imports }));
}

function findRunnableNode() {
  if (nodeRuntime && process.platform === "win32") return nodeRuntime;
  return process.execPath || nodeRuntime;
}

function runOpenClawCliSmoke() {
  if (!fs.existsSync(openclawPackageEntry)) {
    return { ok: false, skipped: true, command: null, status: null, stdout: "", stderr: "OpenClaw package entry is missing." };
  }
  const nodeCommand = findRunnableNode();
  if (!nodeCommand) {
    return { ok: false, skipped: true, command: null, status: null, stdout: "", stderr: "No runnable Node command found." };
  }
  const args = [openclawPackageEntry, "gateway", "run", "--help"];
  const result = spawnSync(nodeCommand, args, {
    cwd: runtimeRoot,
    encoding: "utf8",
    windowsHide: true,
    timeout: 15000,
    env: {
      ...process.env,
      OPENCLAW_HOME: dataRoot,
      XDG_CONFIG_HOME: path.join(dataRoot, "config"),
      XDG_CACHE_HOME: path.join(dataRoot, "cache"),
      HOME: path.join(dataRoot, "home"),
      USERPROFILE: path.join(dataRoot, "home")
    }
  });
  return {
    ok: result.status === 0,
    skipped: false,
    command: `${nodeCommand} ${args.join(" ")}`,
    status: result.status,
    stdout: (result.stdout || "").slice(-4000),
    stderr: (result.stderr || result.error?.message || "").slice(-4000)
  };
}

const openclawCommandCandidates = [path.join(runtimeRoot, "openclaw.cmd"), path.join(runtimeRoot, "openclaw")];
const nodeRuntimeCandidates = [path.join(runtimeRoot, "node.exe"), path.join(runtimeRoot, "node")];
const openclawCmd = openclawCommandCandidates.find((candidate) => fs.existsSync(candidate)) || null;
const nodeRuntime = nodeRuntimeCandidates.find((candidate) => fs.existsSync(candidate)) || null;
const openclawPackage = path.join(runtimeRoot, "node_modules", "openclaw");
const openclawPackageEntry = path.join(openclawPackage, "openclaw.mjs");
const openclawPackageJson = path.join(openclawPackage, "package.json");
const openclawEntry = entryCandidates.find((candidate) => fs.existsSync(candidate)) || null;
const missingDistReferences = findMissingDistReferences();
const missingPackageImports = findMissingPackageImports();
const cliSmoke = runOpenClawCliSmoke();
const runtimeErrors = [];
const runtimeWarnings = [];

if (!openclawCmd) runtimeErrors.push(`Missing OpenClaw command: ${openclawCommandCandidates.join(" or ")}`);
if (!nodeRuntime) runtimeErrors.push(`Missing bundled Node runtime: ${nodeRuntimeCandidates.join(" or ")}`);
if (!fs.existsSync(openclawPackage)) runtimeErrors.push(`Missing OpenClaw package: ${openclawPackage}`);
if (fs.existsSync(openclawPackage) && !fs.existsSync(openclawPackageEntry)) runtimeErrors.push(`Missing OpenClaw package entry: ${openclawPackageEntry}`);
if (fs.existsSync(openclawPackage) && !fs.existsSync(openclawPackageJson)) runtimeErrors.push(`Missing OpenClaw package.json: ${openclawPackageJson}`);
if (fs.existsSync(openclawPackage) && !fs.existsSync(distRoot)) runtimeErrors.push(`Missing OpenClaw dist: ${distRoot}`);
if (fs.existsSync(distRoot) && !openclawEntry) runtimeErrors.push(`Missing OpenClaw dist/entry.(m)js under: ${distRoot}`);
for (const item of missingDistReferences.slice(0, 20)) {
  runtimeErrors.push(`Missing OpenClaw dist asset referenced by ${item.from}: ${item.reference}`);
}
if (missingDistReferences.length > 20) {
  runtimeErrors.push(`${missingDistReferences.length - 20} additional missing OpenClaw dist asset references.`);
}
for (const item of missingPackageImports.slice(0, 20)) {
  const examples = item.imports
    .slice(0, 3)
    .map((entry) => `${path.relative(runtimeRoot, entry.from)} imports ${entry.specifier}`)
    .join("; ");
  runtimeWarnings.push(`OpenClaw optional/static package import "${item.packageName}" is not present under node_modules/openclaw/node_modules (${examples}).`);
}
if (missingPackageImports.length > 20) {
  runtimeWarnings.push(`${missingPackageImports.length - 20} additional OpenClaw static package imports are not present.`);
}
if (!cliSmoke.ok) {
  runtimeErrors.push(`OpenClaw Gateway CLI smoke test failed: ${cliSmoke.stderr || cliSmoke.stdout || `exit ${cliSmoke.status}`}`);
}

const report = {
  checkedAt: new Date().toISOString(),
  runtimeRoot,
  dataRoot,
  files: {
    openclawCmd: Boolean(openclawCmd),
    openclawZip: fs.existsSync(path.join(runtimeRoot, "openclaw.zip")),
    nodeExe: Boolean(nodeRuntime),
    openclawPackage: fs.existsSync(openclawPackage),
    openclawPackageEntry: fs.existsSync(openclawPackageEntry),
    openclawPackageJson: fs.existsSync(openclawPackageJson),
    openclawDist: fs.existsSync(distRoot),
    openclawEntry: Boolean(openclawEntry),
    config: fs.existsSync(configFile)
  },
  runtimeIntegrity: {
    ok: runtimeErrors.length === 0,
    command: openclawCmd,
    node: nodeRuntime,
    distRoot,
    entry: openclawEntry,
    missingDistReferences,
    missingPackageImports,
    cliSmoke,
    errors: runtimeErrors,
    warnings: runtimeWarnings
  },
  gateway: {
    port: config?.gateway?.port || 18789,
    ready: await checkPort(config?.gateway?.port || 18789)
  },
  model: {
    primary: modelRef || null,
    provider: providerId || null,
    model: modelId || provider?.models?.[0]?.id || null,
    api: provider?.api || null,
    baseUrl: provider?.baseUrl || null,
    apiKeyPresent: Boolean(provider?.apiKey)
  }
};

console.log(JSON.stringify(report, null, 2));

if (!report.runtimeIntegrity.ok) {
  process.exitCode = 1;
}
