import fs from "node:fs";
import path from "node:path";

const usbRoot = process.env.AGENT_HUB_ROOT || "E:\\";
const legacyData = path.join(usbRoot, "runtime", "HermesPortable", "data");
const legacyHome = path.join(usbRoot, "runtime", "HermesPortable", "_home");
const targetData = path.join(usbRoot, "data", ".hermes");
const targetHome = path.join(targetData, "home");

const skipNames = new Set(["gateway.lock", "auth.lock"]);

function copyMissing(source, target) {
  if (!fs.existsSync(source)) return { files: 0, dirs: 0 };
  const stat = fs.statSync(source);
  if (skipNames.has(path.basename(source))) return { files: 0, dirs: 0 };

  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    let files = 0;
    let dirs = 1;
    for (const entry of fs.readdirSync(source)) {
      const copied = copyMissing(path.join(source, entry), path.join(target, entry));
      files += copied.files;
      dirs += copied.dirs;
    }
    return { files, dirs };
  }

  if (!fs.existsSync(target)) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    return { files: 1, dirs: 0 };
  }
  return { files: 0, dirs: 0 };
}

fs.mkdirSync(targetData, { recursive: true });
for (const dir of [
  "cache",
  "config",
  "logs",
  "memories",
  "skills",
  "cron",
  "sessions",
  "pairing",
  "hooks",
  "image_cache",
  "audio_cache",
  "tmp",
  "connectors",
  "sandboxes"
]) {
  fs.mkdirSync(path.join(targetData, dir), { recursive: true });
}

const dataCopied = copyMissing(legacyData, targetData);
const homeCopied = copyMissing(legacyHome, targetHome);

const manifest = {
  migratedAt: new Date().toISOString(),
  legacyData,
  legacyHome,
  targetData,
  targetHome,
  copied: {
    data: dataCopied,
    home: homeCopied
  },
  note: "Existing files in data/.hermes were preserved. Lock files were not copied."
};

fs.writeFileSync(path.join(targetData, "migration-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
console.log(JSON.stringify(manifest, null, 2));
