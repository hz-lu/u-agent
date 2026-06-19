import fs from "node:fs";
import path from "node:path";

export function resolvePortableRoot(startDir = process.cwd()) {
  if (process.env.AGENT_HUB_ROOT?.trim()) {
    return path.resolve(process.env.AGENT_HUB_ROOT);
  }

  let current = path.resolve(startDir);
  while (true) {
    if (isPortableRoot(current)) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  const driveRoot = path.parse(path.resolve(startDir)).root;
  if (isPortableRoot(driveRoot)) return driveRoot;

  if (process.platform === "win32") {
    for (let code = 67; code <= 90; code += 1) {
      const candidate = `${String.fromCharCode(code)}:\\`;
      if (isPortableRoot(candidate)) return candidate;
    }
  }

  return driveRoot || path.resolve(startDir);
}

export function isPortableRoot(candidate) {
  if (!candidate || !fs.existsSync(candidate)) return false;
  return ["runtime", "data", "skills", "extensions"].every((name) => fs.existsSync(path.join(candidate, name)));
}
