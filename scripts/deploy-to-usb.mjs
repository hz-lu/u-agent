import fs from "node:fs";
import path from "node:path";
import { resolvePortableRoot } from "./portable-root.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const usbRoot = resolvePortableRoot(projectRoot);
const targetApp = path.join(usbRoot, "win-unpacked", "resources", "app");
const backupsRoot = path.join(usbRoot, "backups");

function timestamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("");
}

const distRoot = path.join(projectRoot, "dist");
if (!fs.existsSync(path.join(distRoot, "main", "index.js"))) {
  console.error("Main build is missing. Run npm run build first.");
  process.exit(1);
}
if (!fs.existsSync(path.join(distRoot, "assets", "index.html")) && !fs.existsSync(path.join(distRoot, "assets", "main", "index.html"))) {
  console.error("Renderer build is missing. Run npm run build first.");
  process.exit(1);
}

fs.mkdirSync(backupsRoot, { recursive: true });
if (fs.existsSync(targetApp)) {
  const backup = path.join(backupsRoot, `app-full-source-${timestamp()}`);
  fs.cpSync(targetApp, backup, { recursive: true });
  console.log(`Backed up current app to ${backup}`);
  fs.rmSync(targetApp, { recursive: true, force: true });
}

fs.mkdirSync(targetApp, { recursive: true });
fs.cpSync(path.join(projectRoot, "dist"), path.join(targetApp, "dist"), { recursive: true });

const packageJson = {
  name: "openclawpro",
  version: "2.0.0",
  description: "OpenClawPro portable Agent Hub",
  main: "dist/main/index.js",
  author: "wjb",
  license: "MIT",
  type: "module",
  dependencies: {}
};
fs.writeFileSync(path.join(targetApp, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");

const assetSource = path.join(projectRoot, "assets");
if (fs.existsSync(assetSource)) {
  fs.cpSync(assetSource, path.join(targetApp, "assets"), { recursive: true });
}

console.log(`Deployed complete source build to ${targetApp}`);
