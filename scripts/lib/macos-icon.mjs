import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    windowsHide: true
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
}

function isCurrent(source, target) {
  if (!fs.existsSync(target)) return false;
  return fs.statSync(target).mtimeMs >= fs.statSync(source).mtimeMs;
}

export function ensureMacIcon(projectRoot, targetIcns = path.join(projectRoot, "assets", "icon.icns")) {
  const sourceIcon = path.join(projectRoot, "assets", "icon.ico");
  if (!fs.existsSync(sourceIcon)) {
    throw new Error(`Missing macOS icon source: ${sourceIcon}`);
  }
  if (isCurrent(sourceIcon, targetIcns)) return targetIcns;

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openclawpro-icon-"));
  const iconset = path.join(tempRoot, "OpenClawPro.iconset");
  const basePng = path.join(tempRoot, "icon.png");
  fs.mkdirSync(iconset, { recursive: true });
  fs.mkdirSync(path.dirname(targetIcns), { recursive: true });

  run("sips", ["-s", "format", "png", sourceIcon, "--out", basePng], projectRoot);
  const icons = [
    ["icon_16x16.png", 16],
    ["icon_16x16@2x.png", 32],
    ["icon_32x32.png", 32],
    ["icon_32x32@2x.png", 64],
    ["icon_128x128.png", 128],
    ["icon_128x128@2x.png", 256],
    ["icon_256x256.png", 256],
    ["icon_256x256@2x.png", 512],
    ["icon_512x512.png", 512],
    ["icon_512x512@2x.png", 1024]
  ];
  for (const [name, size] of icons) {
    run("sips", ["-z", String(size), String(size), basePng, "--out", path.join(iconset, name)], projectRoot);
  }
  run("iconutil", ["-c", "icns", iconset, "-o", targetIcns], projectRoot);
  fs.rmSync(tempRoot, { recursive: true, force: true });
  return targetIcns;
}
