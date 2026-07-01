import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const appName = "OpenClawPro";
const volumeName = process.env.MACOS_DMG_VOLUME_NAME || appName;
const buildRoot = path.resolve(process.env.MACOS_DMG_BUILD_ROOT || path.join(projectRoot, "release", "macos-dmg-build-root"));
const releaseRoot = path.resolve(process.env.MACOS_DMG_RELEASE_ROOT || path.join(projectRoot, "release", "macos-dmg-usb-root"));
const rootLauncherApp = path.join(releaseRoot, `${appName}.app`);
const dmgPath = path.join(releaseRoot, `${appName}.dmg`);
const launcherSource = path.join(projectRoot, "scripts", "macos-root-launcher.c");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || projectRoot,
    env: { ...process.env, ...(options.env || {}) },
    stdio: options.stdio || "inherit",
    encoding: options.encoding || "utf8",
    shell: process.platform === "win32",
    windowsHide: true
  });
  if (result.status !== 0) fail(`${command} ${args.join(" ")} failed`);
  return result;
}

function runCapture(command, args) {
  return spawnSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8",
    windowsHide: true
  });
}

function assertInside(root, target) {
  const normalizedRoot = path.resolve(root);
  const normalizedTarget = path.resolve(target);
  if (normalizedTarget !== normalizedRoot && !normalizedTarget.startsWith(`${normalizedRoot}${path.sep}`)) {
    fail(`Unsafe path outside release root: ${normalizedTarget}`);
  }
}

function writeFile(root, relPath, content, mode = null) {
  const target = path.join(root, relPath);
  assertInside(root, target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
  if (mode !== null) fs.chmodSync(target, mode);
}

function touch(root, relPath) {
  writeFile(root, relPath, "");
}

function ensureDir(root, relPath) {
  const target = path.join(root, relPath);
  assertInside(root, target);
  fs.mkdirSync(target, { recursive: true });
}

function preparePortableBuildRoot() {
  run("node", [path.join("scripts", "stage-macos-portable-test.mjs")], {
    env: {
      MACOS_USB_ROOT_LAYOUT: "1",
      MACOS_RELEASE_ROOT: buildRoot
    }
  });
  ensureDir(buildRoot, "workspace");
  ensureDir(buildRoot, "exports");
  touch(buildRoot, "workspace/.gitkeep");
  touch(buildRoot, "exports/.gitkeep");
}

function rootLauncherScript() {
  return [
    "#!/bin/bash",
    "set -euo pipefail",
    "APP_BUNDLE_DIR=\"$(cd \"$(dirname \"$0\")/../..\" && pwd)\"",
    "USB_ROOT=\"$(cd \"$APP_BUNDLE_DIR/..\" && pwd)\"",
    "STATE_ROOT=\"$USB_ROOT/.OpenClawPro\"",
    "LOG_FILE=\"$USB_ROOT/.OpenClawPro-launch.log\"",
    "exec >>\"$LOG_FILE\" 2>&1",
    "echo \"[$(date '+%Y-%m-%d %H:%M:%S')] OpenClawPro launcher start\"",
    "show_error() {",
    "  local msg=\"$1\"",
    "  echo \"[error] $msg\"",
    "  /usr/bin/osascript -e \"display dialog \\\"$msg\\\" buttons {\\\"OK\\\"} default button \\\"OK\\\" with icon caution\" >/dev/null 2>&1 || true",
    "}",
    "trap 'show_error \"OpenClawPro 启动失败，请查看 U 盘根目录 .OpenClawPro-launch.log\"' ERR",
    `APP_NAME="${appName}"`,
    `DMG_PATH="$USB_ROOT/${appName}.dmg"`,
    "MOUNT_DIR=\"${TMPDIR:-/tmp}/OpenClawPro-Mount-$(id -u)\"",
    "",
    "mkdir -p \"$USB_ROOT/Add-Skills-Here\" \"$USB_ROOT/Add-Plugins-Here\" \"$USB_ROOT/My-Files\" \"$USB_ROOT/Exported-Files\"",
    "mkdir -p \"$STATE_ROOT/data\" \"$STATE_ROOT/skills\" \"$STATE_ROOT/extensions\" \"$STATE_ROOT/workspace\" \"$STATE_ROOT/exports\"",
    "mkdir -p \"$MOUNT_DIR\"",
    "",
    "is_mounted() {",
    "  mount | grep -F \" on $MOUNT_DIR \" >/dev/null 2>&1",
    "}",
    "",
    "if ! is_mounted; then",
    "  echo \"attach dmg: $DMG_PATH -> $MOUNT_DIR\"",
    "  hdiutil attach \"$DMG_PATH\" -readonly -noverify -nobrowse -mountpoint \"$MOUNT_DIR\" >/dev/null",
    "fi",
    "",
    "PORTABLE_ROOT=\"$MOUNT_DIR\"",
    "ARCH=\"$(uname -m)\"",
    "if [ \"$ARCH\" = \"arm64\" ]; then PLATFORM_ID=\"macos-arm64\"; else PLATFORM_ID=\"macos-x64\"; fi",
    "RUNTIME_ROOT=\"$PORTABLE_ROOT/runtime/$PLATFORM_ID\"",
    "if [ ! -d \"$RUNTIME_ROOT\" ]; then RUNTIME_ROOT=\"$PORTABLE_ROOT/runtime\"; fi",
    "",
    "seed_file() {",
    "  local src=\"$1\"",
    "  local dst=\"$2\"",
    "  if [ ! -f \"$dst\" ] && [ -f \"$src\" ]; then",
    "    mkdir -p \"$(dirname \"$dst\")\"",
    "    ditto \"$src\" \"$dst\"",
    "  fi",
    "}",
    "",
    "if [ -d \"$PORTABLE_ROOT/data\" ]; then",
    "  echo \"seed portable data templates\"",
    "  seed_file \"$PORTABLE_ROOT/data/.openclaw/openclaw.json\" \"$STATE_ROOT/data/.openclaw/openclaw.json\"",
    "  seed_file \"$PORTABLE_ROOT/data/.openclaw/openclaw-weixin/accounts.json\" \"$STATE_ROOT/data/.openclaw/openclaw-weixin/accounts.json\"",
    "  seed_file \"$PORTABLE_ROOT/data/.hermes/config.yaml\" \"$STATE_ROOT/data/.hermes/config.yaml\"",
    "  mkdir -p \"$STATE_ROOT/data/.openclaw/logs\" \"$STATE_ROOT/data/.openclaw/tmp\" \"$STATE_ROOT/data/.openclaw/workspace\"",
    "  mkdir -p \"$STATE_ROOT/data/.hermes/home\" \"$STATE_ROOT/data/.hermes/config\" \"$STATE_ROOT/data/.hermes/cache\" \"$STATE_ROOT/data/.hermes/logs\" \"$STATE_ROOT/data/.hermes/memories\" \"$STATE_ROOT/data/.hermes/skills\" \"$STATE_ROOT/data/.hermes/tmp\" \"$STATE_ROOT/data/.hermes/cron\" \"$STATE_ROOT/data/.hermes/sandboxes\"",
    "fi",
    "if [ -d \"$PORTABLE_ROOT/skills\" ]; then ditto \"$PORTABLE_ROOT/skills\" \"$STATE_ROOT/skills\"; fi",
    "if [ -d \"$PORTABLE_ROOT/extensions\" ]; then ditto \"$PORTABLE_ROOT/extensions\" \"$STATE_ROOT/extensions\"; fi",
    "",
    "sync_into_state() {",
    "  local src=\"$1\"",
    "  local dst=\"$2\"",
    "  if [ -d \"$src\" ]; then",
    "    ditto \"$src\" \"$dst\"",
    "  fi",
    "  true",
    "}",
    "",
    "sync_exports_out() {",
    "  mkdir -p \"$USB_ROOT/Exported-Files\"",
    "  [ -d \"$STATE_ROOT/exports\" ] && ditto \"$STATE_ROOT/exports\" \"$USB_ROOT/Exported-Files\"",
    "  [ -d \"$STATE_ROOT/data/.agent-hub/exports\" ] && ditto \"$STATE_ROOT/data/.agent-hub/exports\" \"$USB_ROOT/Exported-Files/agent-hub\"",
    "  [ -d \"$STATE_ROOT/data/.hermes/exports\" ] && ditto \"$STATE_ROOT/data/.hermes/exports\" \"$USB_ROOT/Exported-Files/hermes\"",
    "  true",
    "}",
    "",
    "sync_into_state \"$USB_ROOT/Add-Skills-Here\" \"$STATE_ROOT/skills\"",
    "sync_into_state \"$USB_ROOT/Add-Plugins-Here\" \"$STATE_ROOT/extensions\"",
    "sync_exports_out",
    "",
    "if [ -L \"$STATE_ROOT/USB-My-Files\" ] || [ ! -e \"$STATE_ROOT/USB-My-Files\" ]; then",
    "  rm -f \"$STATE_ROOT/USB-My-Files\"",
    "  ln -s \"$USB_ROOT/My-Files\" \"$STATE_ROOT/USB-My-Files\" || true",
    "fi",
    "if [ -L \"$STATE_ROOT/workspace/My-Files\" ] || [ ! -e \"$STATE_ROOT/workspace/My-Files\" ]; then",
    "  rm -f \"$STATE_ROOT/workspace/My-Files\"",
    "  ln -s \"$USB_ROOT/My-Files\" \"$STATE_ROOT/workspace/My-Files\" || true",
    "fi",
    "if [ -L \"$STATE_ROOT/USB-Exported-Files\" ] || [ ! -e \"$STATE_ROOT/USB-Exported-Files\" ]; then",
    "  rm -f \"$STATE_ROOT/USB-Exported-Files\"",
    "  ln -s \"$USB_ROOT/Exported-Files\" \"$STATE_ROOT/USB-Exported-Files\" || true",
    "fi",
    "",
    "export AGENT_HUB_ROOT=\"$STATE_ROOT\"",
    "export AGENT_HUB_DATA_ROOT=\"$STATE_ROOT/data\"",
    "export AGENT_HUB_USB_ROOT=\"$USB_ROOT\"",
    "export AGENT_HUB_EXTERNAL_FILES=\"$USB_ROOT/My-Files\"",
    "export AGENT_HUB_EXPORTS=\"$USB_ROOT/Exported-Files\"",
    "export OPENCLAW_RUNTIME_ROOT=\"$RUNTIME_ROOT\"",
    "export HERMES_PORTABLE_ROOT=\"$RUNTIME_ROOT/HermesPortable\"",
    "",
    "INNER_EXE=\"$PORTABLE_ROOT/$APP_NAME.app/Contents/MacOS/$APP_NAME\"",
    "if [ ! -x \"$INNER_EXE\" ]; then",
    "  show_error \"OpenClawPro 内部程序不存在或不可执行：$INNER_EXE\"",
    "  exit 1",
    "fi",
    "echo \"launch app: $INNER_EXE\"",
    "\"$INNER_EXE\"",
    "echo \"app exited; syncing exports\"",
    "sync_exports_out",
    "hdiutil detach \"$MOUNT_DIR\" >/dev/null || hdiutil detach \"$MOUNT_DIR\" -force >/dev/null || true",
    "rmdir \"$MOUNT_DIR\" >/dev/null 2>&1 || true",
    "echo \"launcher done\"",
    ""
  ].join("\n");
}

function writeRootLauncherApp() {
  fs.rmSync(rootLauncherApp, { recursive: true, force: true });
  const contentsRoot = path.join(rootLauncherApp, "Contents");
  const macosRoot = path.join(contentsRoot, "MacOS");
  const resourcesRoot = path.join(contentsRoot, "Resources");
  fs.mkdirSync(macosRoot, { recursive: true });
  fs.mkdirSync(resourcesRoot, { recursive: true });
  writeFile(rootLauncherApp, "Contents/Info.plist", [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">",
    "<plist version=\"1.0\">",
    "<dict>",
    "  <key>CFBundleExecutable</key>",
    `  <string>${appName}</string>`,
    "  <key>CFBundleIdentifier</key>",
    "  <string>com.openclawpro.agenthub.launcher</string>",
    "  <key>CFBundleName</key>",
    `  <string>${appName}</string>`,
    "  <key>CFBundleDisplayName</key>",
    `  <string>${appName}</string>`,
    "  <key>CFBundlePackageType</key>",
    "  <string>APPL</string>",
    "  <key>CFBundleShortVersionString</key>",
    "  <string>2.0.0</string>",
    "  <key>CFBundleVersion</key>",
    "  <string>2.0.0</string>",
    "  <key>LSMinimumSystemVersion</key>",
    "  <string>11.0</string>",
    "  <key>NSHighResolutionCapable</key>",
    "  <true/>",
    "</dict>",
    "</plist>",
    ""
  ].join("\n"));
  writeFile(rootLauncherApp, "Contents/Resources/launcher.sh", rootLauncherScript(), 0o755);
  run("clang", [
    "-O2",
    "-Wall",
    "-Wextra",
    "-mmacosx-version-min=11.0",
    launcherSource,
    "-o",
    path.join(macosRoot, appName)
  ]);
  fs.chmodSync(path.join(macosRoot, appName), 0o755);
  run("codesign", ["--force", "--deep", "--sign", "-", rootLauncherApp]);
}

function createDmg() {
  fs.rmSync(dmgPath, { force: true });
  run("xattr", ["-dr", "com.apple.quarantine", buildRoot], { stdio: "ignore" });
  run("hdiutil", [
    "create",
    "-volname", volumeName,
    "-srcfolder", buildRoot,
    "-format", "UDZO",
    "-ov",
    dmgPath
  ]);
}

function main() {
  if (process.platform !== "darwin") fail("stage:macos-dmg:rw must be run on macOS.");
  fs.rmSync(releaseRoot, { recursive: true, force: true });
  fs.mkdirSync(releaseRoot, { recursive: true });
  for (const dir of ["Add-Skills-Here", "Add-Plugins-Here", "My-Files", "Exported-Files"]) {
    ensureDir(releaseRoot, dir);
  }

  preparePortableBuildRoot();
  createDmg();
  writeRootLauncherApp();
  fs.rmSync(buildRoot, { recursive: true, force: true });

  console.log(JSON.stringify({
    ok: true,
    releaseRoot,
    dmgPath,
    launcher: rootLauncherApp
  }, null, 2));
}

main();
