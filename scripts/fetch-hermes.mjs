import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const usbRoot = process.env.AGENT_HUB_ROOT || "E:\\";
const vendorRoot = path.join(projectRoot, "vendor", "hermes-agent");
const existingRuntimeSource = path.join(usbRoot, "runtime", "HermesPortable", "hermes-agent");
const repo = "https://github.com/NousResearch/hermes-agent.git";

fs.mkdirSync(path.dirname(vendorRoot), { recursive: true });

if (fs.existsSync(path.join(vendorRoot, "pyproject.toml"))) {
  console.log(`Hermes vendor already exists: ${vendorRoot}`);
  process.exit(0);
}

if (fs.existsSync(path.join(existingRuntimeSource, "pyproject.toml"))) {
  console.log(`Reusing Hermes source from current portable runtime: ${existingRuntimeSource}`);
  fs.cpSync(existingRuntimeSource, vendorRoot, {
    recursive: true,
    filter(source) {
      const name = path.basename(source);
      return ![".git", "node_modules", ".venv", "__pycache__", ".pytest_cache", ".ruff_cache"].includes(name);
    }
  });
  console.log(`Hermes source copied to ${vendorRoot}`);
  process.exit(0);
}

const gitCandidates = [
  "git",
  "C:\\Program Files\\Git\\cmd\\git.exe",
  "C:\\Program Files\\Git\\bin\\git.exe"
];

for (const git of gitCandidates) {
  const result = spawnSync(git, ["clone", "--depth", "1", repo, vendorRoot], {
    stdio: "inherit",
    windowsHide: true
  });
  if (result.status === 0) process.exit(0);
}

console.error(`Failed to fetch Hermes. Clone manually into ${vendorRoot}`);
process.exit(1);
