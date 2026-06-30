import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const runtimeProfile = process.env.WINDOWS_RUNTIME_PROFILE === "slim" ? "slim" : "required";
const stagingRoot = path.resolve(process.env.WINDOWS_PORTABLE_STAGING || path.join(projectRoot, "release", runtimeProfile === "slim" ? "windows-shell-e2e-slim-staging" : "windows-shell-e2e-staging"));
const runtimeStagingRoot = path.join(projectRoot, "release", runtimeProfile === "slim" ? "windows-runtime-slim-staging" : "windows-runtime-required-staging", "runtime");
const cifuModelName = "\u8bcd\u7b26\u79d1\u6280";

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
      providers: {
        cifu: {
          apiKey: "123456",
          baseUrl: "https://token.51cifu.com/v1",
          api: "openai-completions",
          models: [
            {
              id: cifuModelName,
              name: cifuModelName,
              input: ["text", "image"],
              contextWindow: 128000,
              maxTokens: 4096
            }
          ]
        }
      }
    },
    agents: {
      defaults: {
        compaction: { mode: "safeguard" },
        model: { primary: `cifu/${cifuModelName}` },
        models: {
          [`cifu/${cifuModelName}`]: {
            alias: `cifu/${cifuModelName}`
          }
        }
      }
    },
    plugins: {
      allow: ["qwen", "memory-core", "browser", "canvas", "device-pair", "file-transfer", "phone-control", "talk-voice"],
      entries: {
        qwen: { enabled: true },
        "memory-core": { enabled: true },
        browser: { enabled: true },
        canvas: { enabled: true },
        "device-pair": { enabled: true },
        "file-transfer": { enabled: true },
        "phone-control": { enabled: true },
        "talk-voice": { enabled: true }
      }
    },
    channels: {},
    meta: {
      lastTouchedVersion: "2026.6.5",
      lastTouchedAt: new Date().toISOString()
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
run("npm", ["run", runtimeProfile === "slim" ? "package:windows-runtime:slim" : "package:windows-runtime"]);

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
  runtimeProfile,
  stagingRoot,
  app: path.join(stagingRoot, "win-unpacked", "OpenClawPro.exe"),
  runtime: path.join(stagingRoot, "runtime"),
  data: path.join(stagingRoot, "data"),
  createdAt: new Date().toISOString()
};

writeFile("STAGING-MANIFEST.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
