import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import extractZip from "extract-zip";
import { downloadArtifact } from "@electron/get";
import { rcedit } from "rcedit";

const projectRoot = path.resolve(import.meta.dirname, "..");
const distRoot = path.join(projectRoot, "dist");
const winUnpackedRoot = path.join(projectRoot, "win-unpacked");
const appRoot = path.join(winUnpackedRoot, "resources", "app");
const executablePath = path.join(winUnpackedRoot, "OpenClawPro.exe");
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

async function extractElectronZip(zipPath) {
  if (process.platform !== "win32") {
    await extractZip(zipPath, { dir: winUnpackedRoot });
    return;
  }

  const tarResult = spawnSync("tar.exe", ["-xf", zipPath, "-C", winUnpackedRoot], {
    cwd: projectRoot,
    stdio: "inherit",
    windowsHide: true
  });
  if (tarResult.status === 0) return;

  console.warn("[windows-shell] tar.exe extract failed, falling back to PowerShell Expand-Archive");
  const psResult = spawnSync("powershell.exe", [
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    "Expand-Archive -LiteralPath $args[0] -DestinationPath $args[1] -Force",
    zipPath,
    winUnpackedRoot
  ], {
    cwd: projectRoot,
    stdio: "inherit",
    windowsHide: true
  });
  if (psResult.status !== 0) {
    fail(`Failed to extract Electron zip: ${zipPath}`);
  }
}

function assertElectronExtracted() {
  const electronExe = path.join(winUnpackedRoot, "electron.exe");
  if (!fs.existsSync(electronExe)) {
    const entries = fs.existsSync(winUnpackedRoot) ? fs.readdirSync(winUnpackedRoot).slice(0, 30).join(", ") : "(missing)";
    fail(`Electron executable is missing after extract: ${electronExe}\nExtracted entries: ${entries}`);
  }
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
  if (!fs.existsSync(electronExe)) fail(`Electron executable is missing after extract: ${electronExe}`);
  fs.renameSync(electronExe, executablePath);
}

function hasWine() {
  if (process.platform === "win32") return true;
  const result = spawnSync("wine", ["--version"], { encoding: "utf8", windowsHide: true });
  return result.status === 0;
}

async function patchExecutableResources() {
  const iconPath = path.join(distRoot, "assets", "icon.ico");
  if (!fs.existsSync(iconPath)) fail(`Windows icon is missing: ${path.relative(projectRoot, iconPath)}`);
  fs.copyFileSync(iconPath, path.join(appRoot, "icon.ico"));

  const canPatch = process.platform === "win32" || hasWine();
  if (!canPatch) {
    console.warn("[windows-shell] skipped exe icon patch: rcedit requires Windows or Wine. Run npm run package:windows-shell on Windows before final testing/release.");
    return { iconPatched: false, iconPath, reason: "rcedit requires Windows or Wine" };
  }

  await rcedit(executablePath, {
    icon: iconPath,
    "version-string": {
      CompanyName: "OpenClawPro",
      FileDescription: "OpenClawPro Agent Hub",
      ProductName: "OpenClawPro",
      OriginalFilename: "OpenClawPro.exe"
    }
  });
  return { iconPatched: true, iconPath };
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

async function main() {
  run("npm", ["run", "build"]);
  assertBuildOutput();

  let shellMode = "downloaded";
  try {
    console.log(`[windows-shell] downloading Electron ${electronVersion} win32-${targetArch}`);
    const zipPath = await downloadArtifact({
      version: electronVersion,
      platform: "win32",
      arch: targetArch,
      artifactName: "electron"
    });
    console.log(`[windows-shell] Electron zip: ${zipPath}`);

    fs.rmSync(winUnpackedRoot, { recursive: true, force: true });
    fs.mkdirSync(winUnpackedRoot, { recursive: true });
    await extractElectronZip(zipPath);
    assertElectronExtracted();
    renameElectronExe();
  } catch (err) {
    if (!fs.existsSync(executablePath)) throw err;
    shellMode = "reused-existing";
    console.warn(`[windows-shell] Electron download/extract failed, reusing existing shell: ${err?.message || err}`);
  }

  fs.rmSync(appRoot, { recursive: true, force: true });
  fs.mkdirSync(appRoot, { recursive: true });
  fs.cpSync(distRoot, path.join(appRoot, "dist"), { recursive: true });
  writeAppPackageJson();
  restoreTrackedPlaceholders();
  const resourcePatch = await patchExecutableResources();

  const report = {
    ok: true,
    winUnpackedRoot,
    executable: executablePath,
    appDist: path.join(appRoot, "dist"),
    icon: resourcePatch,
    electronVersion,
    shellMode,
    platform: "win32",
    arch: targetArch,
    fileCount: countFiles(winUnpackedRoot)
  };

  fs.writeFileSync(path.join(winUnpackedRoot, "BUILD-MANIFEST.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error("[windows-shell] failed:", err?.stack || err?.message || err);
  process.exit(1);
});
