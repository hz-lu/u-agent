import { app } from "electron";
import fs from "node:fs";
import path from "node:path";

export class PortablePaths {
  readonly appRoot: string;
  readonly runtimeRoot: string;
  readonly dataRoot: string;
  readonly skillsRoot: string;
  readonly extensionsRoot: string;

  constructor(appRoot = PortablePaths.resolveAppRoot()) {
    this.appRoot = appRoot;
    this.runtimeRoot = path.join(appRoot, "runtime");
    this.dataRoot = path.join(appRoot, "data");
    this.skillsRoot = path.join(appRoot, "skills");
    this.extensionsRoot = path.join(appRoot, "extensions");
  }

  static resolveAppRoot(): string {
    if (process.env.AGENT_HUB_ROOT) return path.resolve(process.env.AGENT_HUB_ROOT);
    if (!app.isPackaged) return PortablePaths.resolveDevPortableRoot();
    if (process.platform === "darwin") {
      return path.resolve(path.dirname(app.getPath("exe")), "..", "..", "..");
    }
    return path.resolve(path.dirname(app.getPath("exe")), "..");
  }

  private static resolveDevPortableRoot(): string {
    const cwd = path.resolve(process.cwd());
    const driveRoot = path.parse(cwd).root;
    const portableMarkers = ["runtime", "data", "skills", "extensions"];
    if (portableMarkers.every((name) => fs.existsSync(path.join(driveRoot, name)))) return driveRoot;
    return cwd;
  }

  ensureBaseDirs(): void {
    for (const dir of [this.runtimeRoot, this.dataRoot, this.skillsRoot, this.extensionsRoot]) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  agentData(agent: string): string {
    const dir = path.join(this.dataRoot, `.${agent}`);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  agentRuntime(agent: string): string {
    const preferred = path.join(this.runtimeRoot, agent);
    fs.mkdirSync(preferred, { recursive: true });
    return preferred;
  }
}
