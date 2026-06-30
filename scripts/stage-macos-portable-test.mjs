import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const releaseRoot = path.resolve(process.env.MACOS_RELEASE_ROOT || path.join(projectRoot, "release", "macos-portable-staging"));
const platformId = process.env.MACOS_PORTABLE_PLATFORM || (process.arch === "arm64" ? "macos-arm64" : "macos-x64");
const appName = "OpenClawPro";
const sourceMacosRoot = path.join(projectRoot, "macos");
const requiredRuntimePaths = [
  `runtime/${platformId}/node/bin/node`,
  `runtime/${platformId}/openclaw/bin/openclaw`,
  `runtime/${platformId}/openclaw/node_modules/openclaw/dist`,
  `runtime/${platformId}/HermesPortable/venv/bin/hermes`,
  `runtime/${platformId}/HermesPortable/venv/bin/python`
];

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
  fs.cpSync(source, target, { recursive: true, verbatimSymlinks: true });
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
  const cifuProvider = "cifu";
  const cifuModelName = "请填写模型名称";
  const modelRef = `${cifuProvider}/${cifuModelName}`;
  return {
    gateway: {
      mode: "local",
      bind: "loopback",
      port: 18789,
      auth: { token: "openclaw-local-token" },
      controlUi: {
        allowedOrigins: [
          "file://",
          "http://localhost",
          "http://127.0.0.1",
          "app://",
          "null"
        ]
      }
    },
    skills: {
      load: { extraDirs: ["skills"] },
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
        models: { [modelRef]: { alias: modelRef } }
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
        "openclaw-weixin"
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
        "openclaw-weixin": { enabled: true, config: {} }
      }
    },
    channels: { "openclaw-weixin": {} }
  };
}

function writeCleanData() {
  removeChild("data");
  writeFile("data/.openclaw/openclaw.json", `${JSON.stringify(createOpenClawConfig(), null, 2)}\n`);
  writeFile("data/.openclaw/openclaw-weixin/accounts.json", "[]\n");
  for (const dir of ["logs", "tmp", "workspace"]) touch(`data/.openclaw/${dir}/.gitkeep`);
  writeFile("data/.hermes/config.yaml", [
    "# Managed by OpenClawPro Agent Hub. Kept inside portable data/.hermes.",
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

function writeLauncher() {
  const launcher = path.join(releaseRoot, "OpenClawPro.command");
  fs.writeFileSync(launcher, [
    "#!/bin/bash",
    "set -e",
    "DIR=\"$(cd \"$(dirname \"$0\")\" && pwd)\"",
    "export AGENT_HUB_ROOT=\"$DIR\"",
    "open \"$DIR/macos/OpenClawPro.app\"",
    ""
  ].join("\n"), "utf8");
  fs.chmodSync(launcher, 0o755);
}

function verifyWechatPlugin() {
  const source = path.join(releaseRoot, "extensions", "openclaw-weixin");
  const target = path.join(releaseRoot, "data", ".openclaw", "extensions", "openclaw-weixin");
  if (!fs.existsSync(path.join(source, "openclaw.plugin.json"))) fail(`Bundled WeChat plugin missing: ${source}`);
  copyDir(source, target);
}

function readManifestRequiredPaths() {
  const manifestPath = path.join(projectRoot, "runtime", "PORTABLE-RUNTIME-MANIFEST.json");
  if (!fs.existsSync(manifestPath)) return requiredRuntimePaths;
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    return manifest?.platforms?.[platformId]?.requiredPaths || requiredRuntimePaths;
  } catch {
    return requiredRuntimePaths;
  }
}

function runtimeReport() {
  const required = readManifestRequiredPaths();
  const missing = required.filter((rel) => !fs.existsSync(path.join(releaseRoot, rel)));
  return { platformId, ok: missing.length === 0, required, missing };
}

function writeReleaseDocs(report) {
  writeFile("README-MACOS-PORTABLE.md", [
    "# OpenClawPro Agent Hub macOS Portable",
    "",
    "这是 macOS 便携测试目录。双击 `OpenClawPro.command` 或 `macos/OpenClawPro.app` 启动。",
    "",
    "## 当前目录",
    "- `macos/OpenClawPro.app`：macOS Electron 程序壳。",
    "- `runtime/`：macOS OpenClaw/Hermes/Node/Python 运行时目录。",
    "- `skills/`：OpenClaw 与 Hermes 共用技能目录。",
    "- `extensions/`：离线插件目录。",
    "- `data/`：初始化数据模板，不包含用户历史数据。",
    "",
    "## Runtime 状态",
    report.ok ? "- runtime 检查通过。" : "- runtime 仍不完整，OpenClaw/Hermes 进程会在启动时显示缺失项。",
    ...report.missing.map((item) => `  - 缺少 ${item}`),
    "",
    "首次测试可先确认 UI、授权页、模型配置页面、日志和环境检查页面是否正常。要完整测试 OpenClaw Gateway 与 Hermes，需要补齐上面的 runtime 文件。",
    ""
  ].join("\n"));
  writeFile("RELEASE-MANIFEST.json", `${JSON.stringify({
    ok: true,
    platform: platformId,
    releaseRoot,
    createdAt: new Date().toISOString(),
    includesRuntime: report.ok,
    excludesUserData: true,
    start: ["OpenClawPro.command", "macos/OpenClawPro.app"],
    runtime: report
  }, null, 2)}\n`);
}

function main() {
  if (process.platform !== "darwin") {
    fail("stage:macos-portable must be run on macOS.");
  }
  run("npm", ["run", "package:macos-shell"]);
  fs.rmSync(releaseRoot, { recursive: true, force: true });
  fs.mkdirSync(releaseRoot, { recursive: true });
  for (const name of ["macos", "runtime", "skills", "extensions"]) removeChild(name);
  copyDir(sourceMacosRoot, path.join(releaseRoot, "macos"));
  copyDir(path.join(projectRoot, "runtime"), path.join(releaseRoot, "runtime"));
  copyFile(path.join(projectRoot, "runtime", "PORTABLE-RUNTIME-MANIFEST.json"), path.join(releaseRoot, "runtime", "PORTABLE-RUNTIME-MANIFEST.json"));
  copyDir(path.join(projectRoot, "skills"), path.join(releaseRoot, "skills"));
  copyDir(path.join(projectRoot, "extensions"), path.join(releaseRoot, "extensions"));
  writeCleanData();
  verifyWechatPlugin();
  writeLauncher();
  const report = runtimeReport();
  writeReleaseDocs(report);
  console.log(JSON.stringify({
    ok: true,
    releaseRoot,
    app: path.join(releaseRoot, "macos", `${appName}.app`),
    launcher: path.join(releaseRoot, "OpenClawPro.command"),
    runtime: report
  }, null, 2));
}

main();
