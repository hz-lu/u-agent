import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { shell } from "electron";
import { detectRuntimePlatform } from "../../../shared/platform.js";
import { JsonStore } from "../../services/json-store.js";
import { checkTcpPort } from "../../services/net.js";
import { ProcessSupervisor } from "../../services/process-supervisor.js";
const defaultHermesConfig = {
    model: {
        provider: "openai-compatible",
        model: "hermes-agent",
        baseUrl: "",
        apiKey: ""
    },
    connectors: [
        { id: "telegram", label: "Telegram", enabled: false, fields: { botToken: "" }, status: "not-configured" },
        { id: "discord", label: "Discord", enabled: false, fields: { botToken: "" }, status: "not-configured" },
        { id: "slack", label: "Slack", enabled: false, fields: { appToken: "", botToken: "" }, status: "not-configured" },
        { id: "whatsapp", label: "WhatsApp", enabled: false, fields: { sessionName: "" }, status: "not-configured" },
        { id: "signal", label: "Signal", enabled: false, fields: { phoneNumber: "" }, status: "not-configured" },
        { id: "email", label: "Email", enabled: false, fields: { imapUrl: "", smtpUrl: "", username: "" }, status: "not-configured" },
        { id: "cli", label: "CLI", enabled: true, fields: {}, status: "configured" }
    ],
    schedules: [],
    sandboxes: [
        { id: "local", enabled: true, fields: {} },
        { id: "docker", enabled: false, fields: { socket: "" } },
        { id: "ssh", enabled: false, fields: { host: "", user: "" } },
        { id: "singularity", enabled: false, fields: { image: "" } },
        { id: "modal", enabled: false, fields: { tokenId: "" } }
    ],
    memoryEnabled: true,
    autoSkillEnabled: true
};
export class HermesRuntime {
    paths;
    getMainWindow;
    dashboard = new ProcessSupervisor("hermes");
    gateway = new ProcessSupervisor("hermes");
    configServer = new ProcessSupervisor("hermes");
    runtimeRoot;
    legacyRuntimeRoot;
    dataRoot;
    store;
    logSink = () => { };
    apiServerKey = process.env.HERMES_API_SERVER_KEY || "openclaw-local-hermes";
    constructor(paths, getMainWindow) {
        this.paths = paths;
        this.getMainWindow = getMainWindow;
        this.legacyRuntimeRoot = path.join(paths.runtimeRoot, "HermesPortable");
        this.runtimeRoot = fs.existsSync(this.legacyRuntimeRoot) ? this.legacyRuntimeRoot : paths.agentRuntime("hermes");
        this.dataRoot = paths.agentData("hermes");
        this.store = new JsonStore(path.join(this.dataRoot, "config", "hub.json"), defaultHermesConfig);
        for (const supervisor of [this.dashboard, this.gateway, this.configServer]) {
            supervisor.on("log", (line) => this.logSink(line));
        }
    }
    onLog(callback) {
        this.logSink = callback;
    }
    readConfig() {
        return this.store.read();
    }
    writeConfig(config) {
        this.store.write(config);
        this.writePortableEnv(config);
        return this.store.read();
    }
    async getStatus() {
        const configReady = await checkTcpPort(17520);
        const dashboardReady = await checkTcpPort(9119);
        const apiReady = await checkTcpPort(8642);
        const hermesExe = this.findHermesExe();
        const python = this.findPython();
        const node = this.findNode();
        const sourcePresent = fs.existsSync(path.join(this.runtimeRoot, "hermes-agent", "pyproject.toml"));
        const configServerPresent = fs.existsSync(path.join(this.runtimeRoot, "lib", "config_server.py"));
        const ready = dashboardReady || apiReady || configReady;
        const runtimePresent = !!hermesExe || !!python || configServerPresent;
        const state = runtimePresent ? (ready ? "running" : this.dashboard.state) : "missing";
        return {
            id: "hermes",
            state,
            ready,
            pid: this.dashboard.pid || this.gateway.pid || this.configServer.pid,
            runtimeRoot: this.runtimeRoot,
            dataRoot: this.dataRoot,
            portableRoot: this.paths.appRoot,
            ports: { config: 17520, dashboard: 9119, api: 8642 },
            urls: {
                config: "http://127.0.0.1:17520",
                dashboard: "http://127.0.0.1:9119",
                api: "http://127.0.0.1:8642"
            },
            lastError: this.dashboard.lastError || this.gateway.lastError || this.configServer.lastError,
            startedAt: this.dashboard.startedAt || this.gateway.startedAt || this.configServer.startedAt,
            diagnostics: [
                `platform=${detectRuntimePlatform()}`,
                `portableRoot=${this.paths.appRoot}`,
                `runtimeRoot=${this.runtimeRoot}`,
                `dataRoot=${this.dataRoot}`,
                `hermes=${hermesExe || "missing"}`,
                `python=${python || "missing"}`,
                `node=${node || "missing"}`,
                `source=${sourcePresent ? "present" : "missing"}`,
                `configServer=${configServerPresent ? "present" : "missing"}`
            ],
            capabilities: {
                sourcePresent,
                hermesCliPresent: !!hermesExe,
                pythonPresent: !!python,
                nodePresent: !!node,
                configServerPresent,
                memoryReady: fs.existsSync(path.join(this.dataRoot, "memories")),
                skillsReady: fs.existsSync(path.join(this.dataRoot, "skills")),
                connectorsReady: fs.existsSync(path.join(this.dataRoot, "connectors")),
                schedulesReady: fs.existsSync(path.join(this.dataRoot, "cron")),
                sandboxesReady: fs.existsSync(path.join(this.dataRoot, "sandboxes"))
            }
        };
    }
    async start() {
        this.ensurePortableDirs();
        this.migrateLegacyData();
        this.writePortableEnv();
        await this.startConfigServer(false);
        await this.startDashboard(false);
        return this.getStatus();
    }
    async stop() {
        this.dashboard.stop();
        this.gateway.stop();
        this.configServer.stop();
        return this.getStatus();
    }
    async restart() {
        await this.stop();
        await new Promise((resolve) => setTimeout(resolve, 800));
        return this.start();
    }
    async open(target = "dashboard") {
        if (target === "config")
            await this.startConfigServer(false);
        if (target === "dashboard")
            await this.startDashboard(false);
        if (target === "api")
            await this.startApiServer(false);
        const status = await this.getStatus();
        const url = status.urls[target];
        const win = this.getMainWindow();
        if (win && !win.isDestroyed()) {
            win.webContents.send("agent:open-url", { agent: "hermes", url, target });
            return true;
        }
        await shell.openExternal(url);
        return true;
    }
    async startDashboard(open = true) {
        if (!(await checkTcpPort(9119))) {
            const hermes = this.findHermesExe();
            if (hermes) {
                this.dashboard.start({
                    command: hermes,
                    args: ["dashboard", "--host", "127.0.0.1", "--port", "9119", "--no-open"],
                    cwd: this.runtimeRoot,
                    env: { ...this.buildHermesEnv(), HERMES_WEB_DIST: path.join(this.runtimeRoot, "hermes-agent", "hermes_cli", "web_dist") }
                });
            }
        }
        if (open)
            await this.open("dashboard");
        return this.getStatus();
    }
    async startConfigServer(open = true) {
        if (!(await checkTcpPort(17520))) {
            const python = this.findPython();
            const configServer = path.join(this.runtimeRoot, "lib", "config_server.py");
            if (python && fs.existsSync(configServer)) {
                this.configServer.start({
                    command: python,
                    args: [configServer],
                    cwd: this.runtimeRoot,
                    env: this.buildHermesEnv()
                });
            }
        }
        if (open)
            await this.open("config");
        return this.getStatus();
    }
    async startApiServer(open = true) {
        if (!(await checkTcpPort(8642))) {
            const hermes = this.findHermesExe();
            if (hermes) {
                this.gateway.start({
                    command: hermes,
                    args: ["gateway", "--accept-hooks", "run"],
                    cwd: this.runtimeRoot,
                    env: {
                        ...this.buildHermesEnv(),
                        API_SERVER_ENABLED: "true",
                        API_SERVER_HOST: "127.0.0.1",
                        API_SERVER_PORT: "8642",
                        API_SERVER_KEY: this.apiServerKey,
                        API_SERVER_MODEL_NAME: "hermes-agent",
                        HERMES_ACCEPT_HOOKS: "1"
                    }
                });
            }
        }
        if (open)
            await this.open("api");
        return this.getStatus();
    }
    async chat(message, messages = []) {
        await this.startApiServer(false);
        if (!(await checkTcpPort(8642, "127.0.0.1", 2000))) {
            return { ok: false, error: "Hermes Agent API is not ready on 127.0.0.1:8642." };
        }
        const payload = JSON.stringify({
            model: "hermes-agent",
            messages: [...messages, { role: "user", content: message }],
            stream: false
        });
        return new Promise((resolve) => {
            const req = http.request({
                hostname: "127.0.0.1",
                port: 8642,
                path: "/v1/chat/completions",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(payload),
                    Authorization: `Bearer ${this.apiServerKey}`
                },
                timeout: 120000
            }, (res) => {
                let raw = "";
                res.setEncoding("utf8");
                res.on("data", (chunk) => raw += chunk);
                res.on("end", () => {
                    try {
                        const json = JSON.parse(raw);
                        const reply = json.choices?.[0]?.message?.content || json.reply || raw;
                        resolve({ ok: (res.statusCode || 0) < 400, reply, error: (res.statusCode || 0) >= 400 ? raw : undefined });
                    }
                    catch {
                        resolve({ ok: false, error: raw || `HTTP ${res.statusCode}` });
                    }
                });
            });
            req.on("error", (error) => resolve({ ok: false, error: error.message }));
            req.write(payload);
            req.end();
        });
    }
    ensurePortableDirs() {
        for (const dir of [
            this.dataRoot,
            path.join(this.dataRoot, "home"),
            path.join(this.dataRoot, "cache"),
            path.join(this.dataRoot, "config"),
            path.join(this.dataRoot, "logs"),
            path.join(this.dataRoot, "memories"),
            path.join(this.dataRoot, "skills"),
            path.join(this.dataRoot, "cron"),
            path.join(this.dataRoot, "connectors"),
            path.join(this.dataRoot, "sandboxes"),
            path.join(this.dataRoot, "tmp")
        ]) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    migrateLegacyData() {
        const legacy = path.join(this.runtimeRoot, "data");
        if (!fs.existsSync(legacy))
            return;
        for (const entry of fs.readdirSync(legacy)) {
            if (entry.endsWith(".lock"))
                continue;
            const source = path.join(legacy, entry);
            const target = path.join(this.dataRoot, entry);
            if (!fs.existsSync(target))
                fs.cpSync(source, target, { recursive: true });
        }
    }
    buildHermesEnv() {
        const config = this.store.read();
        const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") || "Path";
        const venvScripts = path.join(this.runtimeRoot, "venv", process.platform === "win32" ? "Scripts" : "bin");
        const nodeDir = this.findNode() ? path.dirname(this.findNode()) : path.join(this.runtimeRoot, "node");
        const pythonDir = this.findPython() ? path.dirname(this.findPython()) : path.join(this.runtimeRoot, "python");
        return {
            ...process.env,
            HOME: path.join(this.dataRoot, "home"),
            USERPROFILE: path.join(this.dataRoot, "home"),
            XDG_CONFIG_HOME: path.join(this.dataRoot, "config"),
            XDG_CACHE_HOME: path.join(this.dataRoot, "cache"),
            HERMES_HOME: this.dataRoot,
            HERMES_LOG_DIR: path.join(this.dataRoot, "logs"),
            HERMES_MEMORY_PATH: path.join(this.dataRoot, "memories"),
            HERMES_SKILLS_PATH: path.join(this.dataRoot, "skills"),
            HERMES_MODEL: config.model.model,
            HERMES_API_KEY: config.model.apiKey,
            HERMES_BASE_URL: config.model.baseUrl,
            HERMES_BROWSER_OPENED: "1",
            PYTHONIOENCODING: "utf-8",
            PYTHONUTF8: "1",
            PIP_CACHE_DIR: path.join(this.dataRoot, "cache", "pip"),
            npm_config_cache: path.join(this.dataRoot, "cache", "npm"),
            TMP: path.join(this.dataRoot, "tmp"),
            TEMP: path.join(this.dataRoot, "tmp"),
            [pathKey]: [venvScripts, nodeDir, pythonDir, process.env[pathKey] || ""].filter(Boolean).join(path.delimiter)
        };
    }
    writePortableEnv(config = this.store.read()) {
        fs.mkdirSync(path.join(this.dataRoot, "config"), { recursive: true });
        const lines = [
            "HERMES_HOME=" + this.dataRoot,
            "HERMES_MEMORY_PATH=" + path.join(this.dataRoot, "memories"),
            "HERMES_SKILLS_PATH=" + path.join(this.dataRoot, "skills"),
            "HERMES_LOG_DIR=" + path.join(this.dataRoot, "logs"),
            "HERMES_MODEL=" + config.model.model,
            "HERMES_BASE_URL=" + config.model.baseUrl,
            "HERMES_API_KEY=" + config.model.apiKey
        ];
        fs.writeFileSync(path.join(this.dataRoot, "config", ".env"), `${lines.join("\n")}\n`, "utf8");
    }
    findHermesExe() {
        const candidate = process.platform === "win32"
            ? path.join(this.runtimeRoot, "venv", "Scripts", "hermes.exe")
            : path.join(this.runtimeRoot, "venv", "bin", "hermes");
        return fs.existsSync(candidate) ? candidate : null;
    }
    findPython() {
        const candidates = process.platform === "win32"
            ? [
                path.join(this.runtimeRoot, "venv", "Scripts", "python.exe"),
                path.join(this.runtimeRoot, "python", "cpython-3.12.13-windows-x86_64-none", "python.exe")
            ]
            : [path.join(this.runtimeRoot, "venv", "bin", "python")];
        return candidates.find((candidate) => fs.existsSync(candidate)) || null;
    }
    findNode() {
        const candidates = [
            path.join(this.runtimeRoot, "node", process.platform === "win32" ? "node.exe" : "bin/node"),
            path.join(this.runtimeRoot, "node-windows-x64", "node.exe")
        ];
        return candidates.find((candidate) => fs.existsSync(candidate)) || null;
    }
}
