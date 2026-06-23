import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const stagingRoot = path.resolve(process.env.WINDOWS_PORTABLE_STAGING || path.join(projectRoot, "release", "windows-shell-e2e-staging"));
const runtimeStagingRoot = path.join(projectRoot, "release", "windows-runtime-required-staging", "runtime");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
    windowsHide: true
  });
  if (result.status !== 0) fail(`${command} ${args.join(" ")} failed`);
}

function copyDir(sourceRel, targetRel) {
  const source = path.join(projectRoot, sourceRel);
  if (!fs.existsSync(source)) fail(`Missing source directory: ${source}`);
  fs.cpSync(source, path.join(stagingRoot, targetRel), { recursive: true });
}

function writeFile(relPath, content) {
  const filePath = path.join(stagingRoot, relPath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function createCleanOpenClawConfig() {
  return {
    gateway: {
      mode: "local",
      bind: "loopback",
      port: 18789,
      auth: { token: "openclaw-local-token" }
    },
    skills: {
      load: { extraDirs: ["skills"] },
      entries: {}
    },
    models: {
      mode: "replace",
      providers: {}
    },
    agents: {
      defaults: {
        compaction: { mode: "safeguard" },
        model: { primary: "" },
        models: {}
      }
    },
    plugins: {
      allow: ["openclaw-weixin", "qwen", "memory-core"],
      entries: {
        "openclaw-weixin": { enabled: true, config: {} },
        qwen: { enabled: true }
      }
    },
    channels: {
      "openclaw-weixin": { accounts: {} }
    },
    meta: {
      release: "windows-shell-e2e-staging",
      initializedAt: new Date().toISOString()
    }
  };
}

function writeCleanDataTemplates() {
  const hermesConfig = [
    "# Managed by OpenClawPro Agent Hub.",
    "memory:",
    "  memory_enabled: true",
    "  user_profile_enabled: true",
    "skills:",
    "  auto_skill_enabled: true",
    "  external_dirs:",
    "    - \"skills\"",
    "paths:",
    "  home: \"data/.hermes/home\"",
    "  logs: \"data/.hermes/logs\"",
    "  memories: \"data/.hermes/memories\"",
    "  skills: \"data/.hermes/skills\"",
    ""
  ].join("\n");

  const files = new Map([
    ["data/.openclaw/openclaw.json", `${JSON.stringify(createCleanOpenClawConfig(), null, 2)}\n`],
    ["data/.openclaw/openclaw-weixin/accounts.json", "[]\n"],
    ["data/.openclaw/logs/.gitkeep", ""],
    ["data/.openclaw/tmp/.gitkeep", ""],
    ["data/.openclaw/workspace/.gitkeep", ""],
    ["data/.hermes/config.yaml", hermesConfig],
    ["data/.hermes/home/.gitkeep", ""],
    ["data/.hermes/config/.gitkeep", ""],
    ["data/.hermes/cache/.gitkeep", ""],
    ["data/.hermes/logs/.gitkeep", ""],
    ["data/.hermes/memories/.gitkeep", ""],
    ["data/.hermes/skills/.gitkeep", ""],
    ["data/.hermes/tmp/.gitkeep", ""]
  ]);

  for (const [relPath, content] of files) writeFile(relPath, content);
}

run("npm", ["run", "package:windows-shell"]);
run("npm", ["run", "package:windows-runtime"]);

if (!fs.existsSync(runtimeStagingRoot)) {
  fail([
    `Runtime staging not found: ${runtimeStagingRoot}`,
    "The Windows app shell was generated successfully, but the portable runtime is still missing.",
    "Put OpenClawPro-AgentHub-Windows-Runtime-Required.zip in the project root or release/ directory, then run npm run stage:windows-portable again."
  ].join("\n"));
}

fs.rmSync(stagingRoot, { recursive: true, force: true });
fs.mkdirSync(stagingRoot, { recursive: true });

copyDir("win-unpacked", "win-unpacked");
fs.cpSync(runtimeStagingRoot, path.join(stagingRoot, "runtime"), { recursive: true });
copyDir("skills", "skills");
copyDir("extensions", "extensions");
writeCleanDataTemplates();

const report = {
  ok: true,
  stagingRoot,
  app: path.join(stagingRoot, "win-unpacked", "OpenClawPro.exe"),
  runtime: path.join(stagingRoot, "runtime"),
  data: path.join(stagingRoot, "data"),
  createdAt: new Date().toISOString()
};

writeFile("STAGING-MANIFEST.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
