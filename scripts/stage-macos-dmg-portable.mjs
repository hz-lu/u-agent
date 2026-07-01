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
  writeFile(buildRoot, "DMG-CONTENTS-MANIFEST.json", `${JSON.stringify({
    ok: true,
    layout: "writable-dmg-contents",
    createdAt: new Date().toISOString(),
    app: `${appName}.app`,
    runtime: "runtime",
    data: "data",
    skills: "skills",
    extensions: "extensions",
    workspace: "workspace",
    exports: "exports"
  }, null, 2)}\n`);
}

function writeRootLauncher() {
  writeFile(releaseRoot, `${appName}.command`, [
    "#!/bin/bash",
    "set -euo pipefail",
    "USB_ROOT=\"$(cd \"$(dirname \"$0\")\" && pwd)\"",
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
    "}",
    "",
    "sync_exports_out() {",
    "  mkdir -p \"$USB_ROOT/Exported-Files\"",
    "  [ -d \"$PORTABLE_ROOT/exports\" ] && ditto \"$PORTABLE_ROOT/exports\" \"$USB_ROOT/Exported-Files\"",
    "  [ -d \"$PORTABLE_ROOT/data/.agent-hub/exports\" ] && ditto \"$PORTABLE_ROOT/data/.agent-hub/exports\" \"$USB_ROOT/Exported-Files/agent-hub\"",
    "  [ -d \"$PORTABLE_ROOT/data/.hermes/exports\" ] && ditto \"$PORTABLE_ROOT/data/.hermes/exports\" \"$USB_ROOT/Exported-Files/hermes\"",
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
    "open -W \"$PORTABLE_ROOT/$APP_NAME.app\"",
    "sync_exports_out",
    "hdiutil detach \"$MOUNT_DIR\" >/dev/null || hdiutil detach \"$MOUNT_DIR\" -force >/dev/null || true",
    ""
  ].join("\n"), 0o755);
}

function writeRootReadme() {
  writeFile(releaseRoot, "README-MACOS-DMG-PORTABLE.md", [
    "# OpenClawPro macOS U盘可写 DMG 便携版",
    "",
    "把本目录内所有内容复制到 exFAT U 盘根目录后，双击 `OpenClawPro.command` 启动。",
    "",
    "## 根目录文件",
    "- `OpenClawPro.command`：启动器，会挂载可写 DMG 并启动程序。",
    "- `OpenClawPro.dmg`：完整程序、runtime、data、skills、extensions 所在的可写磁盘镜像。",
    "- `Add-Skills-Here/`：手动新增 skill 放这里，启动时会同步进 DMG 内的 `skills/`。",
    "- `Add-Plugins-Here/`：手动新增插件放这里，启动时会同步进 DMG 内的 `extensions/`。",
    "- `My-Files/`：大文件、用户材料放这里，不复制进 DMG，只通过软链接给程序读取。",
    "- `Exported-Files/`：程序退出后会把 DMG 内的导出结果同步到这里。",
    "",
    "## 使用注意",
    "- 正常退出 OpenClawPro 后再弹出 U 盘。",
    "- 不要在程序运行或 DMG 仍挂载时直接拔 U 盘。",
    "- 如果 macOS 阻止打开，可右键打开 `OpenClawPro.command`，或执行 `xattr -dr com.apple.quarantine /Volumes/<U盘名>`。",
    ""
  ].join("\n"));
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

function writeReleaseManifest() {
  const stat = fs.statSync(dmgPath);
  writeFile(releaseRoot, "DMG-USB-MANIFEST.json", `${JSON.stringify({
    ok: true,
    layout: "usb-root-writable-dmg",
    createdAt: new Date().toISOString(),
    dmg: `${appName}.dmg`,
    dmgSize,
    dmgBytes: stat.size,
    launcher: `${appName}.command`,
    externalDirs: [
      "Add-Skills-Here",
      "Add-Plugins-Here",
      "My-Files",
      "Exported-Files"
    ],
    mountedPortableRoot: `.${appName}-Mount`
  }, null, 2)}\n`);
}

function main() {
  if (process.platform !== "darwin") fail("stage:macos-dmg:rw must be run on macOS.");
  fs.rmSync(releaseRoot, { recursive: true, force: true });
  fs.mkdirSync(releaseRoot, { recursive: true });
  for (const dir of ["Add-Skills-Here", "Add-Plugins-Here", "My-Files", "Exported-Files"]) {
    ensureDir(releaseRoot, dir);
    touch(releaseRoot, `${dir}/.gitkeep`);
  }

  preparePortableBuildRoot();
  createWritableDmg();
  writeRootLauncher();
  writeRootReadme();
  writeReleaseManifest();
  fs.rmSync(buildRoot, { recursive: true, force: true });

  console.log(JSON.stringify({
    ok: true,
    releaseRoot,
    dmgPath,
    dmgSize,
    launcher: path.join(releaseRoot, `${appName}.command`)
  }, null, 2));
}

main();
