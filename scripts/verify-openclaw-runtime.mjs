import fs from "node:fs";
import path from "node:path";
import net from "node:net";
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
  const referencePattern = /["'`](?!https?:|data:|node:|#)(\.{1,2}\/[^"'`]+?\.(?:js|mjs|css|json|wasm))["'`]/g;
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(referencePattern)) {
      const reference = match[1];
      const target = path.resolve(path.dirname(file), reference.split(/[?#]/, 1)[0]);
      if (!fs.existsSync(target)) missing.push({ from: file, reference });
    }
  }
  return missing;
}

const openclawCommandCandidates = [path.join(runtimeRoot, "openclaw.cmd"), path.join(runtimeRoot, "openclaw")];
const nodeRuntimeCandidates = [path.join(runtimeRoot, "node.exe"), path.join(runtimeRoot, "node")];
const openclawCmd = openclawCommandCandidates.find((candidate) => fs.existsSync(candidate)) || null;
const nodeRuntime = nodeRuntimeCandidates.find((candidate) => fs.existsSync(candidate)) || null;
const openclawPackage = path.join(runtimeRoot, "node_modules", "openclaw");
const openclawEntry = entryCandidates.find((candidate) => fs.existsSync(candidate)) || null;
const missingDistReferences = findMissingDistReferences();
const runtimeErrors = [];

if (!openclawCmd) runtimeErrors.push(`Missing OpenClaw command: ${openclawCommandCandidates.join(" or ")}`);
if (!nodeRuntime) runtimeErrors.push(`Missing bundled Node runtime: ${nodeRuntimeCandidates.join(" or ")}`);
if (!fs.existsSync(openclawPackage)) runtimeErrors.push(`Missing OpenClaw package: ${openclawPackage}`);
if (fs.existsSync(openclawPackage) && !fs.existsSync(distRoot)) runtimeErrors.push(`Missing OpenClaw dist: ${distRoot}`);
if (fs.existsSync(distRoot) && !openclawEntry) runtimeErrors.push(`Missing OpenClaw dist/entry.(m)js under: ${distRoot}`);
for (const item of missingDistReferences.slice(0, 20)) {
  runtimeErrors.push(`Missing OpenClaw dist asset referenced by ${item.from}: ${item.reference}`);
}
if (missingDistReferences.length > 20) {
  runtimeErrors.push(`${missingDistReferences.length - 20} additional missing OpenClaw dist asset references.`);
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
    errors: runtimeErrors
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
