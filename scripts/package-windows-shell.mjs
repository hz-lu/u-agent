import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import extractZip from "extract-zip";
import { downloadArtifact } from "@electron/get";

const projectRoot = path.resolve(import.meta.dirname, "..");
const distRoot = path.join(projectRoot, "dist");
const winUnpackedRoot = path.join(projectRoot, "win-unpacked");
const appRoot = path.join(winUnpackedRoot, "resources", "app");
const electronVersion = process.env.ELECTRON_VERSION || readPackageVersion("electron");
const targetArch = process.env.ELECTRON_TARGET_ARCH || "x64";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readPackageVersion(name) {
  const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, "node_modules", name, "package.json"), "utf8"));
  return pkg.version;
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

function assertBuildOutput() {
  for (const required of [
    path.join(distRoot, "main", "index.js"),
    path.join(distRoot, "main", "index.cjs"),
    path.join(distRoot, "preload", "index.cjs"),
    path.join(distRoot, "assets", "main", "index.html")
  ]) {
    if (!fs.existsSync(required)) fail(`Build output is missing: ${path.relative(projectRoot, required)}`);
  }
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

function restoreTrackedPlaceholders() {
  for (const relPath of [
    ".gitkeep",
    "resources/.gitkeep",
    "resources/app/.gitkeep",
    "resources/app/dist/.gitkeep"
  ]) {
    const filePath = path.join(winUnpackedRoot, relPath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "placeholder\n", "utf8");
  }
}

function renameElectronExe() {
  const electronExe = path.join(winUnpackedRoot, "electron.exe");
  const targetExe = path.join(winUnpackedRoot, "OpenClawPro.exe");
  if (!fs.existsSync(electronExe)) fail(`Electron executable is missing after extract: ${electronExe}`);
  fs.renameSync(electronExe, targetExe);
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

run("npm", ["run", "build"]);
assertBuildOutput();

console.log(`[windows-shell] downloading Electron ${electronVersion} win32-${targetArch}`);
const zipPath = await downloadArtifact({
  version: electronVersion,
  platform: "win32",
  arch: targetArch,
  artifactName: "electron"
});

fs.rmSync(winUnpackedRoot, { recursive: true, force: true });
fs.mkdirSync(winUnpackedRoot, { recursive: true });
await extractZip(zipPath, { dir: winUnpackedRoot });
renameElectronExe();

fs.rmSync(appRoot, { recursive: true, force: true });
fs.mkdirSync(appRoot, { recursive: true });
fs.cpSync(distRoot, path.join(appRoot, "dist"), { recursive: true });
writeAppPackageJson();
restoreTrackedPlaceholders();

const report = {
  ok: true,
  winUnpackedRoot,
  executable: path.join(winUnpackedRoot, "OpenClawPro.exe"),
  appDist: path.join(appRoot, "dist"),
  electronVersion,
  platform: "win32",
  arch: targetArch,
  fileCount: countFiles(winUnpackedRoot)
};

fs.writeFileSync(path.join(winUnpackedRoot, "BUILD-MANIFEST.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
