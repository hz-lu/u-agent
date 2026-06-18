import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { checkTcpPort } from "../services/net.js";
import { ProcessSupervisor } from "../services/process-supervisor.js";
export class OpenClawRuntime {
    paths;
    supervisor = new ProcessSupervisor("openclaw");
    dataRoot;
    runtimeRoot;
    logSink = () => { };
    constructor(paths) {
        this.paths = paths;
        this.runtimeRoot = paths.runtimeRoot;
        this.dataRoot = paths.agentData("openclaw");
        this.supervisor.on("log", (line) => this.logSink(line));
    }
    onLog(callback) {
        this.logSink = callback;
    }
    async getStatus() {
        const ready = await checkTcpPort(18789);
        const command = this.findOpenClawCommand();
        const node = this.findNode();
        const zip = path.join(this.runtimeRoot, "openclaw.zip");
        const state = command || fs.existsSync(zip) ? (ready ? "running" : this.supervisor.state) : "missing";
        return {
            id: "openclaw",
            state,
            ready,
            pid: this.supervisor.pid,
            runtimeRoot: this.runtimeRoot,
            dataRoot: this.dataRoot,
            portableRoot: this.paths.appRoot,
            ports: { gateway: 18789 },
            urls: { gateway: "http://127.0.0.1:18789" },
            lastError: this.supervisor.lastError,
            startedAt: this.supervisor.startedAt,
            diagnostics: [
                `portableRoot=${this.paths.appRoot}`,
                `runtimeRoot=${this.runtimeRoot}`,
                `dataRoot=${this.dataRoot}`,
                `openclaw=${command || "missing"}`,
                `node=${node || "missing"}`,
                `zip=${fs.existsSync(zip) ? "present" : "missing"}`
            ],
            capabilities: {
                commandPresent: !!command,
                nodePresent: !!node,
                zipPresent: fs.existsSync(zip),
                dataReady: fs.existsSync(this.dataRoot),
                gatewayReady: ready
            }
        };
    }
    async start() {
        this.ensureRuntime();
        const command = this.findOpenClawCommand();
        if (!command) {
            this.logSink({ agent: "openclaw", level: "error", message: "OpenClaw runtime command is missing.", at: new Date().toISOString() });
            return this.getStatus();
        }
        this.supervisor.start({
            command,
            args: ["gateway", "start", "--host", "127.0.0.1", "--port", "18789"],
            cwd: this.runtimeRoot,
            env: this.buildEnv()
        });
        return this.getStatus();
    }
    async stop() {
        this.supervisor.stop();
        return this.getStatus();
    }
    async restart() {
        await this.stop();
        await new Promise((resolve) => setTimeout(resolve, 800));
        return this.start();
    }
    async chat(message) {
        return { ok: false, error: `OpenClaw chat passthrough is not implemented in this rebuilt hub yet. Message: ${message}` };
    }
    ensureRuntime() {
        fs.mkdirSync(this.runtimeRoot, { recursive: true });
        fs.mkdirSync(this.dataRoot, { recursive: true });
        const command = this.findOpenClawCommand();
        const zip = path.join(this.runtimeRoot, "openclaw.zip");
        if (command || !fs.existsSync(zip))
            return;
        const result = spawnSync("tar.exe", ["-xf", zip, "-C", this.runtimeRoot], { encoding: "utf8", windowsHide: true });
        if (result.status !== 0) {
            this.logSink({ agent: "openclaw", level: "error", message: result.stderr || "Failed to extract openclaw.zip", at: new Date().toISOString() });
        }
    }
    buildEnv() {
        const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") || "Path";
        return {
            ...process.env,
            OPENCLAW_HOME: this.dataRoot,
            XDG_CONFIG_HOME: path.join(this.dataRoot, "config"),
            XDG_CACHE_HOME: path.join(this.dataRoot, "cache"),
            HOME: path.join(this.dataRoot, "home"),
            USERPROFILE: path.join(this.dataRoot, "home"),
            [pathKey]: [this.runtimeRoot, process.env[pathKey] || ""].filter(Boolean).join(path.delimiter)
        };
    }
    findOpenClawCommand() {
        const command = path.join(this.runtimeRoot, process.platform === "win32" ? "openclaw.cmd" : "openclaw");
        return fs.existsSync(command) ? command : null;
    }
    findNode() {
        const candidate = path.join(this.runtimeRoot, process.platform === "win32" ? "node.exe" : "node");
        return fs.existsSync(candidate) ? candidate : null;
    }
}
