import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const distRoot = path.join(projectRoot, "dist");
const macosRoot = path.resolve(process.env.MACOS_SHELL_ROOT || path.join(projectRoot, "macos"));
const appName = "OpenClawPro";
const appBundle = path.join(macosRoot, `${appName}.app`);
const electronApp = path.join(projectRoot, "node_modules", "electron", "dist", "Electron.app");
const appResources = path.join(appBundle, "Contents", "Resources");
const appRoot = path.join(appResources, "app");

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

function assertFile(filePath, label = filePath) {
  if (!fs.existsSync(filePath)) fail(`Missing ${label}: ${filePath}`);
}

function assertBuildOutput() {
  for (const required of [
    path.join(distRoot, "main", "index.js"),
    path.join(distRoot, "main", "index.cjs"),
    path.join(distRoot, "preload", "index.cjs"),
    path.join(distRoot, "assets", "main", "index.html")
  ]) {
    assertFile(required, `build output ${path.relative(projectRoot, required)}`);
  }
}

function writeInfoPlist() {
  const plistPath = path.join(appBundle, "Contents", "Info.plist");
  const plist = fs.readFileSync(plistPath, "utf8")
    .replace(/<key>CFBundleDisplayName<\/key>\s*<string>[^<]*<\/string>/, `<key>CFBundleDisplayName</key>\n\t<string>${appName}</string>`)
    .replace(/<key>CFBundleExecutable<\/key>\s*<string>[^<]*<\/string>/, `<key>CFBundleExecutable</key>\n\t<string>${appName}</string>`)
    .replace(/<key>CFBundleIdentifier<\/key>\s*<string>[^<]*<\/string>/, "<key>CFBundleIdentifier</key>\n\t<string>com.openclawpro.agenthub</string>")
    .replace(/<key>CFBundleName<\/key>\s*<string>[^<]*<\/string>/, `<key>CFBundleName</key>\n\t<string>${appName}</string>`)
    .replace(/<key>CFBundleIconFile<\/key>\s*<string>[^<]*<\/string>/, "<key>CFBundleIconFile</key>\n\t<string>electron.icns</string>");
  fs.writeFileSync(plistPath, plist, "utf8");
}

function renameExecutable() {
  const macosDir = path.join(appBundle, "Contents", "MacOS");
  const electronBin = path.join(macosDir, "Electron");
  const targetBin = path.join(macosDir, appName);
  if (fs.existsSync(electronBin)) fs.renameSync(electronBin, targetBin);
  assertFile(targetBin, "macOS app executable");
  fs.chmodSync(targetBin, 0o755);
}

function writeAppPackageJson() {
  const packageJson = {
    name: "openclawpro-agent-hub",
    productName: "OpenClawPro",
    version: "2.0.0",
    description: "OpenClawPro portable Agent Hub",
    main: "dist/main/index.cjs",
    author: "wjb",
    license: "MIT",
    type: "commonjs",
    dependencies: {}
  };
  fs.writeFileSync(path.join(appRoot, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
}

function countFiles(root) {
  let count = 0;
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile()) count += 1;
    }
  }
  return count;
}

function main() {
  if (process.platform !== "darwin") {
    fail("package:macos-shell must be run on macOS because it uses the local Electron.app bundle.");
  }
  run("npm", ["run", "build"]);
  assertBuildOutput();
  assertFile(electronApp, "local Electron.app");

  fs.rmSync(macosRoot, { recursive: true, force: true });
  fs.mkdirSync(macosRoot, { recursive: true });
  fs.cpSync(electronApp, appBundle, { recursive: true, verbatimSymlinks: true });
  renameExecutable();
  writeInfoPlist();

  fs.rmSync(appRoot, { recursive: true, force: true });
  fs.mkdirSync(appRoot, { recursive: true });
  fs.cpSync(distRoot, path.join(appRoot, "dist"), { recursive: true });
  writeAppPackageJson();

  const report = {
    ok: true,
    appBundle,
    appDist: path.join(appRoot, "dist"),
    electronSource: electronApp,
    platform: "darwin",
    arch: process.arch,
    fileCount: countFiles(appBundle)
  };
  fs.writeFileSync(path.join(macosRoot, "BUILD-MANIFEST.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
}

main();
