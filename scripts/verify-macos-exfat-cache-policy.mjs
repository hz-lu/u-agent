import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const mainSource = fs.readFileSync(
  path.join(projectRoot, "src", "openclaw-shell-app", "dist", "main", "index.js"),
  "utf8"
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const switchName of [
  "disable-http-cache",
  "disable-gpu-shader-disk-cache",
  "disable-gpu-program-cache",
  "disk-cache-size",
  "media-cache-size"
]) {
  assert(mainSource.includes(`appendSwitch("${switchName}"`), `missing Chromium switch: ${switchName}`);
}

assert(mainSource.includes('appendSwitch("disable-features", "DIPS,SharedStorageAPI")'), "portable Chromium storage features must be disabled");
assert(mainSource.includes('electron.app.setPath("userData", electronDataDir)'), "persistent Electron state must remain under portable data");
assert(mainSource.includes('electron.app.setPath("sessionData", path$1.join(electronDataDir, "session"))'), "session data must remain under portable data");

console.log("macOS exFAT Chromium cache policy checks passed");
