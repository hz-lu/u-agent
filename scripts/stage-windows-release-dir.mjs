import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const releaseRoot = path.resolve(process.env.WINDOWS_RELEASE_ROOT || "D:\\share\\1\\o\\1");
const runtimeSource = process.env.WINDOWS_RELEASE_RUNTIME_SOURCE
  ? path.resolve(process.env.WINDOWS_RELEASE_RUNTIME_SOURCE)
  : "F:\\runtime";
const cifuModelName = "请填写模型名称";
const cifuProvider = "cifu";
const weixinPluginId = "openclaw-weixin";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function assertInside(root, target) {
  const normalizedRoot = path.resolve(root);
  const normalizedTarget = path.resolve(target);
  if (normalizedTarget !== normalizedRoot && !normalizedTarget.startsWith(`${normalizedRoot}${path.sep}`)) {
    fail(`Unsafe path outside release root: ${normalizedTarget}`);
  }
}

function removeChild(name) {
  const target = path.join(releaseRoot, name);
  assertInside(releaseRoot, target);
  fs.rmSync(target, { recursive: true, force: true });
}

function copyDir(source, target) {
  if (!fs.existsSync(source)) fail(`Missing source directory: ${source}`);
  assertInside(releaseRoot, target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

function copyFile(source, target) {
  if (!fs.existsSync(source)) fail(`Missing source file: ${source}`);
  assertInside(releaseRoot, target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function writeFile(relPath, content) {
  const target = path.join(releaseRoot, relPath);
  assertInside(releaseRoot, target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
}

function touch(relPath) {
  writeFile(relPath, "");
}

function createOpenClawConfig() {
  const modelRef = `${cifuProvider}/${cifuModelName}`;
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
        [cifuProvider]: {
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
        model: { primary: modelRef },
        models: {
          [modelRef]: {
            alias: modelRef
          }
        }
      }
    },
    plugins: {
      allow: [
        "qwen",
        "memory-core",
        "browser",
        "canvas",
        "device-pair",
        "file-transfer",
        "phone-control",
        "talk-voice",
        weixinPluginId
      ],
      entries: {
        qwen: { enabled: true },
        "memory-core": { enabled: true },
        browser: { enabled: true },
        canvas: { enabled: true },
        "device-pair": { enabled: true },
        "file-transfer": { enabled: true },
        "phone-control": { enabled: true },
        "talk-voice": { enabled: true },
        [weixinPluginId]: { enabled: true, config: {} }
      }
    },
    channels: {
      [weixinPluginId]: {}
    }
  };
}

function writeCleanData() {
  removeChild("data");
  writeFile("data/.openclaw/openclaw.json", `${JSON.stringify(createOpenClawConfig(), null, 2)}\n`);
  writeFile("data/.openclaw/openclaw-weixin/accounts.json", "[]\n");
  touch("data/.openclaw/logs/.gitkeep");
  touch("data/.openclaw/tmp/.gitkeep");
  touch("data/.openclaw/workspace/.gitkeep");

  writeFile("data/.hermes/config.yaml", [
    "# Managed by OpenClawPro Agent Hub. Kept inside the portable data/.hermes directory.",
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
  ].join("\n"));
  for (const dir of ["home", "config", "cache", "logs", "memories", "skills", "tmp", "cron", "sandboxes"]) {
    touch(`data/.hermes/${dir}/.gitkeep`);
  }
}

function ensureRuntime() {
  const runtimeRoot = path.join(releaseRoot, "runtime");
  const required = [
    "openclaw.zip",
    "openclaw.cmd",
    "node.exe",
    "node_modules/openclaw/openclaw.mjs",
    "node_modules/openclaw/package.json",
    "node_modules/openclaw/dist",
    "python3",
    "HermesPortable/venv/Scripts/hermes.exe",
    "HermesPortable/venv/Scripts/python.exe",
    "HermesPortable/node/node.exe",
    "HermesPortable/hermes-agent/pyproject.toml"
  ];
  const missing = required.filter((rel) => !fs.existsSync(path.join(runtimeRoot, rel)));
  if (missing.length && fs.existsSync(runtimeSource)) {
    console.log(`[release-dir] runtime incomplete, copying from ${runtimeSource}`);
    removeChild("runtime");
    copyDir(runtimeSource, runtimeRoot);
  }
  const manifestSource = path.join(projectRoot, "runtime", "PORTABLE-RUNTIME-MANIFEST.json");
  if (fs.existsSync(manifestSource)) {
    copyFile(manifestSource, path.join(runtimeRoot, "PORTABLE-RUNTIME-MANIFEST.json"));
  }
  const stillMissing = required.filter((rel) => !fs.existsSync(path.join(runtimeRoot, rel)));
  if (stillMissing.length) {
    fail(`Runtime is incomplete:\n${stillMissing.map((rel) => `- runtime/${rel}`).join("\n")}`);
  }
}

function writeReleaseDocs() {
  writeFile("README-PORTABLE.md", [
    "# OpenClawPro Agent Hub Windows Portable",
    "",
    "这是一个初始化的 Windows 便携版本。把整个目录复制到任意 U 盘根目录或短路径目录后，双击 `启动OpenClawPro.bat` 或 `win-unpacked/OpenClawPro.exe` 启动。",
    "",
    "## 包含内容",
    "- `win-unpacked/`：Windows 桌面程序壳。",
    "- `runtime/`：OpenClaw、Hermes、Node、Python 等便携运行时。",
    "- `skills/`：OpenClaw 与 Hermes 共用技能目录。",
    "- `extensions/`：离线插件目录，包含微信插件。",
    "- `data/`：初始化数据模板，不包含用户历史数据。",
    "",
    "## 不包含内容",
    "- API Key、授权文件、微信登录态。",
    "- 聊天历史、Hermes 记忆、日志、缓存、报告数据库。",
    "",
    "首次使用时，请在程序里完成模型 API Key、授权和微信扫码登录。",
    "建议复制到 U 盘根目录或较短路径，避免 Windows 长路径限制影响 Python 依赖。",
    ""
  ].join("\n"));

  writeFile("RELEASE-MANIFEST.json", `${JSON.stringify({
    ok: true,
    platform: "windows-x64",
    releaseRoot,
    createdAt: new Date().toISOString(),
    initialized: true,
    excludesUserData: true,
    includesRuntime: true,
    includesWechatPlugin: true,
    start: ["启动OpenClawPro.bat", "win-unpacked/OpenClawPro.exe"]
  }, null, 2)}\n`);
}

function verifyWechatPlugin() {
  const bundled = path.join(releaseRoot, "extensions", weixinPluginId, "openclaw.plugin.json");
  const mirrored = path.join(releaseRoot, "data", ".openclaw", "extensions", weixinPluginId, "openclaw.plugin.json");
  if (!fs.existsSync(bundled)) fail(`Bundled WeChat plugin missing: ${bundled}`);
  copyDir(path.join(releaseRoot, "extensions", weixinPluginId), path.join(releaseRoot, "data", ".openclaw", "extensions", weixinPluginId));
  if (!fs.existsSync(mirrored)) fail(`Mirrored WeChat plugin missing: ${mirrored}`);
}

function runVerification(script, label) {
  const result = spawnSync(process.execPath, [path.join(projectRoot, "scripts", script)], {
    cwd: projectRoot,
    encoding: "utf8",
    windowsHide: true,
    timeout: 120000,
    env: {
      ...process.env,
      AGENT_HUB_ROOT: releaseRoot
    }
  });
  if (result.stdout?.trim()) console.log(result.stdout.trim());
  if (result.stderr?.trim()) console.error(result.stderr.trim());
  if (result.status !== 0) fail(`${label} failed with exit code ${result.status}`);
}

function main() {
  fs.mkdirSync(releaseRoot, { recursive: true });
  ensureRuntime();
  for (const name of ["win-unpacked", "skills", "extensions"]) removeChild(name);
  copyDir(path.join(projectRoot, "win-unpacked"), path.join(releaseRoot, "win-unpacked"));
  copyDir(path.join(projectRoot, "skills"), path.join(releaseRoot, "skills"));
  copyDir(path.join(projectRoot, "extensions"), path.join(releaseRoot, "extensions"));
  fs.rmSync(path.join(releaseRoot, "OpenClawPro.exe"), { force: true });
  writeFile("启动OpenClawPro.bat", "@echo off\r\nstart \"\" \"%~dp0win-unpacked\\OpenClawPro.exe\"\r\n");
  writeCleanData();
  verifyWechatPlugin();
  writeReleaseDocs();
  runVerification("verify-openclaw-runtime.mjs", "OpenClaw runtime verification");
  runVerification("verify-hermes-runtime.mjs", "Hermes runtime verification");
  console.log(JSON.stringify({
    ok: true,
    releaseRoot,
    runtime: path.join(releaseRoot, "runtime"),
    app: path.join(releaseRoot, "win-unpacked", "OpenClawPro.exe"),
    wechatPlugin: path.join(releaseRoot, "data", ".openclaw", "extensions", weixinPluginId),
    createdAt: new Date().toISOString()
  }, null, 2));
}

main();
