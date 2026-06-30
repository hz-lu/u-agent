import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { resolvePortableRoot } from "./portable-root.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const usbRoot = resolvePortableRoot(projectRoot);
const releaseRoot = path.join(usbRoot, "release");
const now = new Date();
const version = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, "0"),
  String(now.getDate()).padStart(2, "0"),
  String(now.getHours()).padStart(2, "0"),
  String(now.getMinutes()).padStart(2, "0"),
  String(now.getSeconds()).padStart(2, "0")
].join("");
const packageName = `OpenClawPro-AgentHub-Windows-Portable-${version}`;
const zipPath = path.join(releaseRoot, `${packageName}.zip`);
const manifestPath = path.join(releaseRoot, `${packageName}.manifest.json`);
const runtimeManifestRel = "runtime/PORTABLE-RUNTIME-MANIFEST.json";
const runtimeManifestPath = path.join(usbRoot, runtimeManifestRel);

function fail(message) {
  console.error(message);
  process.exit(1);
}

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

function readJsonRequired(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Unable to read runtime manifest: ${filePath}\n${error.message}`);
  }
}

const runtimeManifest = readJsonRequired(runtimeManifestPath);
const windowsRuntimeSpec = runtimeManifest?.platforms?.["windows-x64"];
if (!windowsRuntimeSpec) fail("runtime manifest is missing platforms.windows-x64");

const sharedRequiredPaths = Array.isArray(runtimeManifest.sharedRequiredPaths) ? runtimeManifest.sharedRequiredPaths : [];
const windowsRequiredPaths = Array.isArray(windowsRuntimeSpec.requiredPaths) ? windowsRuntimeSpec.requiredPaths : [];
const requiredPaths = Array.from(new Set([runtimeManifestRel, ...sharedRequiredPaths, ...windowsRequiredPaths]));
const forbiddenRuntimePaths = Array.isArray(runtimeManifest.forbiddenRuntimePaths) ? runtimeManifest.forbiddenRuntimePaths : [];
const cifuModelName = "\u8bcd\u7b26\u79d1\u6280";

const sourceEntries = [
  runtimeManifestRel,
  "win-unpacked",
  "runtime/openclaw.zip",
  "runtime/openclaw.cmd",
  "runtime/node.exe",
  "runtime/node_modules",
  "runtime/python3",
  "runtime/HermesPortable",
  "runtime/feishu-plugin.zip",
  "skills",
  "extensions",
  "OpenClawPro U盘便携版.exe"
];

const forbiddenZipPrefixes = [
  `${packageName}/.license`,
  `${packageName}/data/.openclaw/chat-history`,
  `${packageName}/data/.openclaw/openclaw-weixin/accounts`,
  `${packageName}/data/.openclaw/openclaw-weixin/accounts.json`,
  `${packageName}/data/.openclaw/memory`,
  `${packageName}/data/.openclaw/usb-device-key.json`,
  `${packageName}/data/.hermes/auth.json`,
  `${packageName}/data/.hermes/auth.lock`,
  `${packageName}/data/.hermes/memories/MEMORY.md`,
  `${packageName}/data/.hermes/memories/USER.md`,
  `${packageName}/data/.hermes/reports`,
  `${packageName}/data/.hermes/state.db`,
  `${packageName}/data/.hermes/response_store.db`,
  `${packageName}/data/.hermes/kanban.db`
];

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

function validateOpenClawRuntime() {
  const distRoot = path.join(usbRoot, "runtime", "node_modules", "openclaw", "dist");
  const entryCandidates = [path.join(distRoot, "entry.mjs"), path.join(distRoot, "entry.js")];
  const entry = entryCandidates.find((candidate) => fs.existsSync(candidate));
  if (!entry) fail(`Required OpenClaw build output is missing: ${entryCandidates.join(" or ")}`);

  const files = listFiles(distRoot).filter((file) => /\.(?:html|js|mjs|css)$/i.test(file));
  const scriptReferencePattern = /\b(?:import|export)\s+(?:[^"'`;]*?\s+from\s+)?["'](\.{1,2}\/[^"']+?\.(?:js|mjs|css|json|wasm))["']|import\(\s*["'](\.{1,2}\/[^"']+?\.(?:js|mjs|css|json|wasm))["']\s*\)/g;
  const markupReferencePattern = /\b(?:src|href)=["'](\.{1,2}\/[^"']+?\.(?:js|mjs|css|json|wasm))["']/g;
  const missing = [];
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const referencePattern = /\.(?:js|mjs)$/i.test(file) ? scriptReferencePattern : markupReferencePattern;
    for (const match of source.matchAll(referencePattern)) {
      const reference = match[1] || match[2];
      const target = path.resolve(path.dirname(file), reference.split(/[?#]/, 1)[0]);
      if (!fs.existsSync(target)) missing.push({ from: file, reference });
    }
  }
  if (missing.length) fail(`OpenClaw runtime dist is incomplete:\n${JSON.stringify(missing.slice(0, 30), null, 2)}`);
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function createCleanOpenClawConfig() {
  return {
    gateway: {
      mode: "local",
      bind: "loopback",
      port: 18789,
      auth: {
        token: "openclaw-local-token"
      },
      controlUi: {
        allowedOrigins: [
          "file://",
          "http://localhost",
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://localhost:18789",
          "http://127.0.0.1:18789",
          "app://",
          "null"
        ]
      }
    },
    skills: {
      load: {
        extraDirs: ["skills"]
      },
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
      allow: ["qwen", "memory-core", "browser", "canvas", "device-pair", "file-transfer", "phone-control", "talk-voice", "openclaw-weixin"],
      entries: {
        qwen: { enabled: true },
        "memory-core": { enabled: true },
        browser: { enabled: true },
        canvas: { enabled: true },
        "device-pair": { enabled: true },
        "file-transfer": { enabled: true },
        "phone-control": { enabled: true },
        "talk-voice": { enabled: true },
        "openclaw-weixin": { enabled: true, config: {} }
      }
    },
    channels: {
      "openclaw-weixin": {}
    },
    meta: {
      lastTouchedVersion: "2026.6.5",
      lastTouchedAt: new Date().toISOString()
    }
  };
}

function cleanDataFiles() {
  const hermesConfig = [
    "# Managed by OpenClawPro Agent Hub. Kept inside the USB data/.hermes directory.",
    "memory:",
    "  memory_enabled: true",
    "  user_profile_enabled: true",
    "  memory_char_limit: 2200",
    "  user_char_limit: 1375",
    "  provider: \"\"",
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

  return new Map([
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
    ["data/.hermes/tmp/.gitkeep", ""],
    ["data/.hermes/cron/.gitkeep", ""],
    ["data/.hermes/sandboxes/.gitkeep", ""]
  ]);
}

function releaseDocs() {
  const readme = [
    "# OpenClawPro Agent Hub Windows Portable",
    "",
    "这是一个初始化版 Windows 便携包。解压到任意 U 盘根目录后，双击 `OpenClawPro U盘便携版.exe` 或 `win-unpacked/OpenClawPro.exe` 启动。",
    "",
    "## 包含内容",
    "- Windows 桌面程序：`win-unpacked/`",
    "- OpenClaw 运行时：`runtime/openclaw.zip`、`runtime/openclaw.cmd`、`runtime/node.exe`",
    "- Hermes Windows 运行时：`runtime/HermesPortable/`",
    "- 初始化数据目录：`data/`",
    "- 技能目录：`skills/`",
    "- 插件目录：`extensions/`",
    "",
    "## 不包含内容",
    "- 当前 U 盘授权文件 `.license`",
    "- API Key / 模型密钥",
    "- 微信账号登录态",
    "- 聊天记录、Hermes 记忆、日志、缓存、历史报告",
    "",
    "首次使用时请在程序里完成授权、模型配置和微信扫码。",
    "",
    "建议解压到 U 盘根目录，避免 Windows 长路径限制影响 Hermes Python 依赖文件。",
    ""
  ].join("\n");

  const manifest = {
    name: packageName,
    createdAt: new Date().toISOString(),
    platform: "windows-x64",
    initialized: true,
    excludesUserData: true,
    includes: {
      app: "win-unpacked",
      runtimeManifest: runtimeManifestRel,
      openclawRuntime: "runtime/openclaw.zip",
      hermesRuntime: "runtime/HermesPortable",
      skills: "skills",
      cleanData: "data"
    },
    excluded: [
      ".license",
      "API keys",
      "WeChat accounts/session state",
      "chat history",
      "Hermes auth/memory/log/cache/report databases"
    ],
    notes: [
      "Extract to a short USB root path such as X:\\ to avoid Windows long path limits."
    ]
  };

  return new Map([
    ["README-PORTABLE.md", readme],
    ["RELEASE-MANIFEST.json", `${JSON.stringify(manifest, null, 2)}\n`]
  ]);
}

function shouldSkipSource(relPath) {
  const rel = relPath.replace(/\\/g, "/");
  const parts = rel.split("/");
  const base = parts[parts.length - 1];
  if (base === "__pycache__" || base === ".pytest_cache" || base === ".mypy_cache") return true;
  if (base.endsWith(".pyc") || base.endsWith(".pyo")) return true;
  if (rel.includes("/.git/") || rel.startsWith(".git/")) return true;
  if (rel.includes("/.cache/") || rel.startsWith(".cache/")) return true;
  if (forbiddenRuntimePaths.some((prefix) => rel === prefix || rel.startsWith(`${prefix}/`))) return true;
  if (rel.includes("/tests/") || rel.includes("/benchmarks/")) return true;
  return false;
}

function validateWindowsReleaseInputs() {
  const findings = [];
  const launchers = Array.isArray(windowsRuntimeSpec.launchers) ? windowsRuntimeSpec.launchers : [];
  if (!launchers.some((relPath) => exists(relPath))) {
    findings.push(`No Windows launcher found from runtime manifest: ${launchers.join(" or ")}`);
  }
  const forbiddenPresent = forbiddenRuntimePaths.filter((relPath) => exists(relPath));
  if (forbiddenPresent.length) {
    findings.push(`Forbidden runtime user-data paths must be moved under data/ before release:\n${forbiddenPresent.join("\n")}`);
  }
  const missingRequired = [
    ...(!hasUsablePath(runtimeManifestRel) ? [runtimeManifestRel] : []),
    ...sharedRequiredPaths.filter((relPath) => !exists(relPath)),
    ...windowsRequiredPaths.filter((relPath) => !hasUsablePath(relPath))
  ];
  if (missingRequired.length) {
    findings.push(`Required portable files are missing:\n${missingRequired.map((relPath) => `- ${path.join(usbRoot, relPath)}`).join("\n")}`);
  }
  if (findings.length) {
    fail(findings.join("\n\n"));
  }
}

function listSourceFiles(relEntry) {
  const source = path.join(usbRoot, relEntry);
  if (!fs.existsSync(source)) return [];
  const stat = fs.statSync(source);
  if (stat.isFile()) return [{ source, zipRel: relEntry.replace(/\\/g, "/"), size: stat.size }];
  const files = [];
  const stack = [source];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(usbRoot, full).replace(/\\/g, "/");
      if (shouldSkipSource(rel)) continue;
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        files.push({ source: full, zipRel: rel, size: fs.statSync(full).size });
      }
    }
  }
  return files;
}

function validateGeneratedTextFiles(files) {
  const findings = [];
  const patterns = [
    { name: "OpenAI-style API key", re: /sk-[A-Za-z0-9_-]{20,}/ },
    { name: "license payload", re: /"payload"\s*:\s*"[A-Za-z0-9_-]{20,}".*"signature"/s },
    { name: "WeChat account state", re: /im-bot|context-tokens|sync\.json/ },
    { name: "Hermes auth token", re: /"access_token"|"refresh_token"|"id_token"/ }
  ];
  for (const [rel, text] of files) {
    for (const pattern of patterns) {
      if (pattern.re.test(text)) findings.push({ path: rel, kind: pattern.name });
    }
  }
  return findings;
}

function buildZip() {
  const generated = new Map([...cleanDataFiles(), ...releaseDocs()]);
  const findings = validateGeneratedTextFiles(generated);
  if (findings.length) fail(JSON.stringify({ ok: false, findings }, null, 2));

  const files = [];
  for (const entry of sourceEntries) files.push(...listSourceFiles(entry));
  for (const prefix of forbiddenZipPrefixes) {
    const normalized = prefix.replace(`${packageName}/`, "");
    if (files.some((file) => file.zipRel === normalized || file.zipRel.startsWith(`${normalized}/`))) {
      fail(`Forbidden source entry would be included: ${normalized}`);
    }
  }

  mkdirp(releaseRoot);
  fs.rmSync(zipPath, { force: true });
  const generatedPayload = Object.fromEntries(generated);
  const fileListPath = path.join(releaseRoot, `${packageName}.files.json`);
  fs.writeFileSync(fileListPath, JSON.stringify({ packageName, files, generated: generatedPayload }, null, 2), "utf8");

  const python = path.join(usbRoot, "runtime", "HermesPortable", "venv", "Scripts", "python.exe");
  const script = [
    "import json, zipfile, os, sys",
    `spec_path = ${JSON.stringify(fileListPath)}`,
    `zip_path = ${JSON.stringify(zipPath)}`,
    "spec = json.load(open(spec_path, 'r', encoding='utf-8'))",
    "package_name = spec['packageName']",
    "count = 0",
    "with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_STORED, allowZip64=True) as zf:",
    "    for item in spec['files']:",
    "        arc = package_name + '/' + item['zipRel'].replace('\\\\', '/')",
    "        zf.write(item['source'], arc)",
    "        count += 1",
    "        if count % 5000 == 0:",
    "            print(f'[zip] {count} source files', flush=True)",
    "    for rel, text in spec['generated'].items():",
    "        zf.writestr(package_name + '/' + rel, text)",
    "        count += 1",
    "print(f'[zip] done {count} files', flush=True)"
  ].join("\n");
  const result = spawnSync(python, ["-c", script], {
    encoding: "utf8",
    windowsHide: true,
    timeout: 60 * 60 * 1000
  });
  fs.rmSync(fileListPath, { force: true });
  if (result.status !== 0) fail(`zip failed:\n${result.stdout}\n${result.stderr}`);
  if (result.stdout.trim()) console.log(result.stdout.trim());

  const stats = fs.statSync(zipPath);
  const manifest = {
    ok: true,
    packageName,
    zipPath,
    sizeBytes: stats.size,
    sizeMb: Math.round(stats.size / 1024 / 1024 * 10) / 10,
    fileCount: files.length + generated.size,
    createdAt: new Date().toISOString(),
    initialized: true,
    excludesUserData: true
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(manifest, null, 2));
}

validateWindowsReleaseInputs();

validateOpenClawRuntime();
buildZip();
