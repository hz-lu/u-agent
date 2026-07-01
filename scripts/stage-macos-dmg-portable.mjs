import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const appName = "OpenClawPro";
const volumeName = process.env.MACOS_DMG_VOLUME_NAME || appName;
const dmgSize = process.env.MACOS_DMG_SIZE || "4g";
const buildRoot = path.resolve(process.env.MACOS_DMG_BUILD_ROOT || path.join(projectRoot, "release", "macos-dmg-build-root"));
const releaseRoot = path.resolve(process.env.MACOS_DMG_RELEASE_ROOT || path.join(projectRoot, "release", "macos-dmg-usb-root"));
const mountPoint = path.resolve(process.env.MACOS_DMG_MOUNT_POINT || path.join(projectRoot, "release", ".macos-dmg-mount"));
const rootLauncherApp = path.join(releaseRoot, `${appName}.app`);
const dmgPath = path.join(releaseRoot, `${appName}.dmg`);
const sparsePath = path.join(releaseRoot, `${appName}.sparseimage`);

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

function isMounted(targetMountPoint) {
  const result = runCapture("mount", []);
  return result.status === 0 && (result.stdout || "").split("\n").some((line) => line.includes(` on ${targetMountPoint} `));
}

function detachMount(targetMountPoint, force = false) {
  if (!isMounted(targetMountPoint)) return;
  const args = ["detach", targetMountPoint];
  if (force) args.push("-force");
  const result = runCapture("hdiutil", args);
  if (result.status !== 0 && !force) detachMount(targetMountPoint, true);
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
    `MOUNT_DIR="$USB_ROOT/.${appName}-Mount"`,
    "",
    "mkdir -p \"$USB_ROOT/Add-Skills-Here\" \"$USB_ROOT/Add-Plugins-Here\" \"$USB_ROOT/My-Files\" \"$USB_ROOT/Exported-Files\"",
    "mkdir -p \"$MOUNT_DIR\"",
    "",
    "is_mounted() {",
    "  mount | grep -F \" on $MOUNT_DIR \" >/dev/null 2>&1",
    "}",
    "",
    "if ! is_mounted; then",
    "  echo \"attach dmg: $DMG_PATH -> $MOUNT_DIR\"",
    "  hdiutil attach \"$DMG_PATH\" -readwrite -noverify -nobrowse -mountpoint \"$MOUNT_DIR\" >/dev/null",
    "fi",
    "",
    "PORTABLE_ROOT=\"$MOUNT_DIR\"",
    "mkdir -p \"$PORTABLE_ROOT/skills\" \"$PORTABLE_ROOT/extensions\" \"$PORTABLE_ROOT/workspace\" \"$PORTABLE_ROOT/exports\"",
    "",
    "sync_into_dmg() {",
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
    "  [ -d \"$PORTABLE_ROOT/exports\" ] && ditto \"$PORTABLE_ROOT/exports\" \"$USB_ROOT/Exported-Files\"",
    "  [ -d \"$PORTABLE_ROOT/data/.agent-hub/exports\" ] && ditto \"$PORTABLE_ROOT/data/.agent-hub/exports\" \"$USB_ROOT/Exported-Files/agent-hub\"",
    "  [ -d \"$PORTABLE_ROOT/data/.hermes/exports\" ] && ditto \"$PORTABLE_ROOT/data/.hermes/exports\" \"$USB_ROOT/Exported-Files/hermes\"",
    "  true",
    "}",
    "",
    "sync_into_dmg \"$USB_ROOT/Add-Skills-Here\" \"$PORTABLE_ROOT/skills\"",
    "sync_into_dmg \"$USB_ROOT/Add-Plugins-Here\" \"$PORTABLE_ROOT/extensions\"",
    "sync_exports_out",
    "",
    "if [ -L \"$PORTABLE_ROOT/USB-My-Files\" ] || [ ! -e \"$PORTABLE_ROOT/USB-My-Files\" ]; then",
    "  rm -f \"$PORTABLE_ROOT/USB-My-Files\"",
    "  ln -s \"$USB_ROOT/My-Files\" \"$PORTABLE_ROOT/USB-My-Files\"",
    "fi",
    "if [ -L \"$PORTABLE_ROOT/workspace/My-Files\" ] || [ ! -e \"$PORTABLE_ROOT/workspace/My-Files\" ]; then",
    "  rm -f \"$PORTABLE_ROOT/workspace/My-Files\"",
    "  ln -s \"$USB_ROOT/My-Files\" \"$PORTABLE_ROOT/workspace/My-Files\"",
    "fi",
    "if [ -L \"$PORTABLE_ROOT/USB-Exported-Files\" ] || [ ! -e \"$PORTABLE_ROOT/USB-Exported-Files\" ]; then",
    "  rm -f \"$PORTABLE_ROOT/USB-Exported-Files\"",
    "  ln -s \"$USB_ROOT/Exported-Files\" \"$PORTABLE_ROOT/USB-Exported-Files\"",
    "fi",
    "",
    "export AGENT_HUB_ROOT=\"$PORTABLE_ROOT\"",
    "export AGENT_HUB_USB_ROOT=\"$USB_ROOT\"",
    "export AGENT_HUB_EXTERNAL_FILES=\"$USB_ROOT/My-Files\"",
    "export AGENT_HUB_EXPORTS=\"$USB_ROOT/Exported-Files\"",
    "",
    "echo \"launch app: $PORTABLE_ROOT/$APP_NAME.app\"",
    "open -W \"$PORTABLE_ROOT/$APP_NAME.app\"",
    "echo \"app exited; syncing exports\"",
    "sync_exports_out",
    "hdiutil detach \"$MOUNT_DIR\" >/dev/null || hdiutil detach \"$MOUNT_DIR\" -force >/dev/null || true",
    "echo \"launcher done\"",
    ""
  ].join("\n");
}

function writeRootLauncherApp() {
  fs.rmSync(rootLauncherApp, { recursive: true, force: true });
  const contentsRoot = path.join(rootLauncherApp, "Contents");
  const macosRoot = path.join(contentsRoot, "MacOS");
  fs.mkdirSync(macosRoot, { recursive: true });
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
  writeFile(rootLauncherApp, `Contents/MacOS/${appName}`, rootLauncherScript(), 0o755);
}

function createWritableDmg() {
  detachMount(mountPoint, true);
  fs.rmSync(dmgPath, { force: true });
  fs.rmSync(sparsePath, { force: true });
  fs.rmSync(mountPoint, { recursive: true, force: true });
  fs.mkdirSync(mountPoint, { recursive: true });

  run("hdiutil", [
    "create",
    "-size", dmgSize,
    "-fs", "Journaled HFS+",
    "-volname", volumeName,
    sparsePath
  ]);

  run("hdiutil", ["attach", sparsePath, "-readwrite", "-noverify", "-nobrowse", "-mountpoint", mountPoint]);
  try {
    run("ditto", [buildRoot, mountPoint]);
    run("xattr", ["-dr", "com.apple.quarantine", mountPoint], { stdio: "ignore" });
  } finally {
    detachMount(mountPoint, true);
  }
  run("hdiutil", ["convert", sparsePath, "-format", "UDRW", "-o", dmgPath]);
  fs.rmSync(sparsePath, { force: true });
  fs.rmSync(mountPoint, { recursive: true, force: true });
}

function main() {
  if (process.platform !== "darwin") fail("stage:macos-dmg:rw must be run on macOS.");
  fs.rmSync(releaseRoot, { recursive: true, force: true });
  fs.mkdirSync(releaseRoot, { recursive: true });
  for (const dir of ["Add-Skills-Here", "Add-Plugins-Here", "My-Files", "Exported-Files"]) {
    ensureDir(releaseRoot, dir);
  }

  preparePortableBuildRoot();
  createWritableDmg();
  writeRootLauncherApp();
  fs.rmSync(buildRoot, { recursive: true, force: true });

  console.log(JSON.stringify({
    ok: true,
    releaseRoot,
    dmgPath,
    dmgSize,
    launcher: rootLauncherApp
  }, null, 2));
}

main();
