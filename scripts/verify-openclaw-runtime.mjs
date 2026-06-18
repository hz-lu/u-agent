import fs from "node:fs";
import path from "node:path";
import net from "node:net";

const usbRoot = process.env.AGENT_HUB_ROOT || "E:\\";
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

const report = {
  checkedAt: new Date().toISOString(),
  runtimeRoot,
  dataRoot,
  files: {
    openclawCmd: fs.existsSync(path.join(runtimeRoot, "openclaw.cmd")),
    openclawZip: fs.existsSync(path.join(runtimeRoot, "openclaw.zip")),
    nodeExe: fs.existsSync(path.join(runtimeRoot, "node.exe")),
    config: fs.existsSync(configFile)
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
