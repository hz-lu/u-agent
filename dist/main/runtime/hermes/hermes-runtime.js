import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawnSync } from "node:child_process";
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
const connectorRequiredFields = {
    telegram: ["botToken"],
    discord: ["botToken"],
    slack: ["appToken", "botToken"],
    whatsapp: ["sessionName"],
    signal: ["phoneNumber"],
    email: ["imapUrl", "smtpUrl", "username"],
    cli: []
};
const sandboxRequiredFields = {
    local: [],
    docker: ["socket"],
    ssh: ["host", "user"],
    singularity: ["image"],
    modal: ["tokenId"]
};
function appendLimited(current, text, limit) {
    const next = current + text;
    return next.length > limit ? next.slice(-limit) : next;
}
function truncateForUi(text, limit = 24000) {
    if (text.length <= limit)
        return text;
    const half = Math.floor(limit / 2);
    return `${text.slice(0, half)}\n\n[中间内容已折叠，完整内容已保存到 U 盘 data/.hermes/runs 目录。]\n\n${text.slice(-half)}`;
}
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
        return this.normalizeConfig(this.store.read());
    }
    writeConfig(config) {
        const normalized = this.normalizeConfig(config);
        this.store.write(normalized);
        this.writePortableArtifacts(normalized);
        return this.store.read();
    }
    testConnector(id) {
        const config = this.readConfig();
        const connector = config.connectors.find((item) => item.id === id);
        if (!connector)
            return { ok: false, message: `Connector ${id} is not available.` };
        const missing = this.missingRequiredFields(connector.fields, connectorRequiredFields[id]);
        connector.status = missing.length ? "error" : "configured";
        this.writeConfig(config);
        const details = [
            `enabled=${connector.enabled}`,
            `required=${connectorRequiredFields[id].join(",") || "none"}`,
            `missing=${missing.join(",") || "none"}`,
            `artifact=${path.join(this.dataRoot, "connectors", `${id}.json`)}`
        ];
        const reportPath = this.writeTestReport("connectors", id, {
            ok: !missing.length,
            type: "connector",
            id,
            label: connector.label,
            enabled: connector.enabled,
            missing,
            artifact: path.join(this.dataRoot, "connectors", `${id}.json`)
        });
        if (missing.length) {
            return {
                ok: false,
                message: `${connector.label} missing required fields: ${missing.join(", ")}`,
                path: reportPath,
                details
            };
        }
        return {
            ok: true,
            message: `${connector.label} configuration is ready.`,
            path: reportPath,
            details
        };
    }
    testSandbox(id) {
        const config = this.readConfig();
        const sandbox = config.sandboxes.find((item) => item.id === id);
        if (!sandbox)
            return { ok: false, message: `Sandbox ${id} is not available.` };
        const missing = this.missingRequiredFields(sandbox.fields, sandboxRequiredFields[id]);
        const details = [
            `enabled=${sandbox.enabled}`,
            `required=${sandboxRequiredFields[id].join(",") || "none"}`,
            `missing=${missing.join(",") || "none"}`,
            `artifact=${path.join(this.dataRoot, "sandboxes", "backends.json")}`
        ];
        if (missing.length) {
            const reportPath = this.writeTestReport("sandboxes", id, {
                ok: false,
                type: "sandbox",
                id,
                enabled: sandbox.enabled,
                missing,
                artifact: path.join(this.dataRoot, "sandboxes", "backends.json")
            });
            return {
                ok: false,
                message: `${id} sandbox missing required fields: ${missing.join(", ")}`,
                path: reportPath,
                details
            };
        }
        if (id === "docker" && sandbox.fields.socket && !fs.existsSync(sandbox.fields.socket)) {
            const reportPath = this.writeTestReport("sandboxes", id, {
                ok: false,
                type: "sandbox",
                id,
                enabled: sandbox.enabled,
                missing,
                error: `Docker socket was not found: ${sandbox.fields.socket}`,
                artifact: path.join(this.dataRoot, "sandboxes", "backends.json")
            });
            return {
                ok: false,
                message: `Docker socket was not found: ${sandbox.fields.socket}`,
                path: reportPath,
                details
            };
        }
        const reportPath = this.writeTestReport("sandboxes", id, {
            ok: true,
            type: "sandbox",
            id,
            enabled: sandbox.enabled,
            missing,
            artifact: path.join(this.dataRoot, "sandboxes", "backends.json")
        });
        return {
            ok: true,
            message: `${id} sandbox configuration is ready.`,
            path: reportPath,
            details
        };
    }
    addSchedule(input) {
        const config = this.readConfig();
        const schedule = {
            id: `schedule-${Date.now()}`,
            title: input.title.trim() || "Untitled automation",
            naturalLanguage: input.naturalLanguage.trim(),
            cron: input.cron?.trim() || this.inferCron(input.naturalLanguage),
            enabled: input.enabled ?? true
        };
        config.schedules = [schedule, ...config.schedules];
        this.writeConfig(config);
        return schedule;
    }
    removeSchedule(id) {
        const config = this.readConfig();
        config.schedules = config.schedules.filter((item) => item.id !== id);
        return this.writeConfig(config);
    }
    exportConfig() {
        const config = this.readConfig();
        const exportsDir = path.join(this.dataRoot, "exports");
        fs.mkdirSync(exportsDir, { recursive: true });
        const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
        const target = path.join(exportsDir, `hermes-config-${stamp}.json`);
        fs.writeFileSync(target, `${JSON.stringify(this.redactConfig(config), null, 2)}\n`, "utf8");
        return { ok: true, message: "Hermes config exported with secrets redacted.", path: target };
    }
    importConfig(filePath) {
        const resolved = path.resolve(filePath);
        if (!fs.existsSync(resolved))
            return { ok: false, message: `File does not exist: ${resolved}` };
        const parsed = JSON.parse(fs.readFileSync(resolved, "utf8"));
        const current = this.readConfig();
        const normalized = this.normalizeConfig(parsed, current);
        const config = this.writeConfig(normalized);
        return { ok: true, message: "Hermes config imported.", path: resolved, config };
    }
    async getStatus() {
        this.ensurePortableDirs();
        const memoryReport = this.readMemoryReport() || this.createMemoryReportSnapshot();
        const growthReport = this.readSkillGrowthReport();
        const skillReport = this.readSkillReport() || this.createSkillReportSnapshot();
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
                `configServer=${configServerPresent ? "present" : "missing"}`,
                `skills.source=${skillReport.sourceCount}`,
                `skills.visible=${skillReport.visibleCount}`,
                `skills.commands=${skillReport.commandCount}`,
                `skills.report=${skillReport.reportPath}`,
                `skills.growth=${growthReport?.ok ? "ready" : "not-verified"}`,
                `skills.growthReport=${growthReport?.reportPath || this.skillGrowthReportPath()}`,
                `memory.enabled=${memoryReport.memoryEnabled}`,
                `memory.userProfile=${memoryReport.userProfileEnabled}`,
                `memory.entries=${memoryReport.memoryEntryCount}`,
                `memory.userEntries=${memoryReport.userEntryCount}`,
                `memory.report=${memoryReport.reportPath}`
            ],
            capabilities: {
                sourcePresent,
                hermesCliPresent: !!hermesExe,
                pythonPresent: !!python,
                nodePresent: !!node,
                configServerPresent,
                memoryReady: memoryReport.ok,
                memoryWritable: memoryReport.memoryWritable && memoryReport.userWritable,
                memorySnapshotReady: memoryReport.ok,
                skillsReady: fs.existsSync(path.join(this.dataRoot, "skills")),
                skillsVisible: skillReport.ok && skillReport.visibleCount > 0,
                skillsUsageTracked: skillReport.usageTracked,
                autoSkillGrowthReady: !!growthReport?.ok,
                connectorsReady: fs.existsSync(path.join(this.dataRoot, "connectors")),
                schedulesReady: fs.existsSync(path.join(this.dataRoot, "cron")),
                sandboxesReady: fs.existsSync(path.join(this.dataRoot, "sandboxes"))
            },
            hermesSkills: skillReport,
            hermesMemory: memoryReport,
            hermesSkillGrowth: growthReport || undefined
        };
    }
    async start() {
        this.ensurePortableDirs();
        this.migrateLegacyData();
        this.writePortableArtifacts();
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
        const runId = `hermes-chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const runDir = path.join(this.dataRoot, "runs", runId);
        const responsePath = path.join(runDir, "response.json");
        const requestPath = path.join(runDir, "request.json");
        fs.mkdirSync(runDir, { recursive: true });
        const payload = JSON.stringify({
            model: "hermes-agent",
            messages: [...messages.slice(-20), { role: "user", content: message }],
            stream: false
        });
        await fs.promises.writeFile(requestPath, JSON.stringify({ startedAt: new Date().toISOString(), message, messageCount: messages.length }, null, 2), "utf8");
        return new Promise((resolve) => {
            let settled = false;
            let rawTail = "";
            let spool = Promise.resolve();
            const finish = async (result) => {
                if (settled)
                    return;
                settled = true;
                try {
                    await spool;
                }
                catch {
                }
                resolve(result);
            };
            const appendResponse = (chunk) => {
                rawTail = appendLimited(rawTail, chunk, 1024 * 1024);
                spool = spool.then(() => fs.promises.appendFile(responsePath, chunk, "utf8")).catch((error) => {
                    this.logSink({ agent: "hermes", level: "stderr", message: `Hermes response spool failed: ${error.message}`, at: new Date().toISOString() });
                });
            };
            const finishError = (rawText) => {
                const classified = this.classifyChatError(rawText, runId, runDir);
                finish({ ...classified, error: `${classified.error}\n\n技术日志：${runDir}` });
            };
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
                res.setEncoding("utf8");
                res.on("data", (chunk) => appendResponse(String(chunk)));
                res.on("end", async () => {
                    await spool;
                    try {
                        const json = JSON.parse(rawTail);
                        const reply = json.choices?.[0]?.message?.content || json.reply || rawTail;
                        const ok = (res.statusCode || 0) < 400;
                        finish(ok
                            ? { ok: true, reply: truncateForUi(reply), runId, runDir }
                            : (() => {
                                const classified = this.classifyChatError(rawTail, runId, runDir);
                                return { ...classified, error: `${classified.error}\n\n技术日志：${runDir}` };
                            })());
                    }
                    catch {
                        const errorText = rawTail || `HTTP ${res.statusCode}`;
                        finishError(errorText);
                    }
                });
            });
            req.on("timeout", () => {
                req.destroy(new Error("Hermes chat request timed out after 120 seconds."));
            });
            req.on("error", (error) => {
                finishError(error.message);
            });
            req.write(payload);
            req.end();
        });
    }
    classifyChatError(rawText, runId, runDir) {
        const raw = String(rawText || "");
        const lower = raw.toLowerCase();
        const has = (items) => items.some((item) => lower.includes(item.toLowerCase()) || raw.includes(item));
        const withLog = (error) => ({ ok: false, error, runId, runDir });
        if (has(["insufficient_quota", "quota", "billing", "balance", "payment required", "resource_exhausted", "402", "额度", "余额", "欠费", "充值"])) {
            return withLog("当前模型 API 额度不足或账户余额已用完，Hermes 无法继续调用模型。请充值 token/API 套餐，或在模型配置中切换到其他可用模型后重试。");
        }
        if (has(["invalid_api_key", "unauthorized", "forbidden", "permission denied", "401", "403", "api key", "鉴权", "认证", "权限", "密钥无效"])) {
            return withLog("当前模型 API Key 无效、已过期，或没有访问该模型的权限。请在模型配置中重新填写 API Key，并先测试连接。");
        }
        if (has(["rate limit", "too many requests", "429", "限流", "频率", "请求过多"])) {
            return withLog("模型服务当前限流，Hermes 暂时没有拿到可用回复。请稍后重试，或切换到更高限额的模型/API 套餐。");
        }
        if (has(["econnreset", "enotfound", "etimedout", "fetch failed", "network", "socket hang up", "timeout", "网络", "超时", "代理"])) {
            return withLog("Hermes 连接模型服务失败，可能是网络、代理或服务端暂时不可用。请检查网络和 Base URL 后重试。");
        }
        if (has(["model not found", "invalid model", "not found", "404", "模型不存在", "模型名称"])) {
            return withLog("当前配置的模型名称或 Base URL 不正确，Hermes 无法调用该模型。请检查模型配置并测试连接。");
        }
        return withLog(`Hermes 本次没有完成请求。可能是模型额度、API Key、网络、Base URL 或模型服务异常。\n\n最近错误：${raw.slice(-1200)}`);
    }
    syncAndVerifySkills(options = {}) {
        this.ensurePortableDirs();
        const reportPath = this.skillReportPath();
        const mirrorRoot = path.join(this.dataRoot, "skills", "openclaw");
        try {
            const sync = this.syncOpenClawSkillsToHermes();
            const verification = this.verifyHermesSkillVisibility();
            const visibleNames = new Set([...verification.names, ...verification.commands.map((command) => command.replace(/^\//, ""))].map((name) => this.skillSlug(name)));
            const missingNames = sync.names.filter((name) => !visibleNames.has(this.skillSlug(name))).slice(0, 50);
            const report = {
                ok: verification.ok,
                checkedAt: new Date().toISOString(),
                sourceCount: sync.sourceCount,
                copied: sync.copied,
                mirroredCount: sync.mirroredCount,
                visibleCount: verification.names.length,
                commandCount: verification.commands.length,
                invocationCommand: "",
                invocationLoaded: false,
                invocationStatus: "not-run",
                usageTracked: fs.existsSync(path.join(this.dataRoot, "skills", ".usage.json")),
                mirrorRoot,
                path: mirrorRoot,
                reportPath,
                sampleCommands: verification.commands.slice(0, 20),
                missingNames,
                unchanged: sync.unchanged
            };
            this.writeJson(reportPath, report);
            if (!options.silent) {
                this.logSink({
                    agent: "hermes",
                    level: report.ok ? "system" : "error",
                    message: `Hermes skills verified: source=${report.sourceCount}, mirrored=${report.mirroredCount}, visible=${report.visibleCount}, commands=${report.commandCount}`,
                    at: new Date().toISOString()
                });
            }
            return report;
        }
        catch (error) {
            const report = {
                ok: false,
                checkedAt: new Date().toISOString(),
                sourceCount: 0,
                mirroredCount: this.countSkillFiles(mirrorRoot),
                visibleCount: 0,
                commandCount: 0,
                usageTracked: fs.existsSync(path.join(this.dataRoot, "skills", ".usage.json")),
                mirrorRoot,
                reportPath,
                sampleCommands: [],
                missingNames: [],
                error: error instanceof Error ? error.message : String(error)
            };
            this.writeJson(reportPath, report);
            this.logSink({
                agent: "hermes",
                level: "error",
                message: `Hermes skills verification failed: ${report.error}`,
                at: new Date().toISOString()
            });
            return report;
        }
    }
    verifyMemory(options = {}) {
        this.ensurePortableDirs();
        this.writeHermesConfigYaml(this.readConfig());
        const reportPath = this.memoryReportPath();
        const memoryDir = path.join(this.dataRoot, "memories");
        const memoryFile = path.join(memoryDir, "MEMORY.md");
        const userFile = path.join(memoryDir, "USER.md");
        const configPath = path.join(this.dataRoot, "config.yaml");
        const python = this.findPython();
        const sourceRoot = path.join(this.runtimeRoot, "hermes-agent");
        try {
            if (!python)
                throw new Error("Hermes portable Python was not found.");
            if (!fs.existsSync(path.join(sourceRoot, "tools", "memory_tool.py"))) {
                throw new Error(`Hermes memory_tool.py was not found under ${sourceRoot}.`);
            }
            const marker = `openclaw-hermes-memory-verify-${Date.now()}`;
            const script = [
                "import json, pathlib, sys",
                `sys.path.insert(0, ${JSON.stringify(sourceRoot)})`,
                "from tools.memory_tool import MemoryStore, get_memory_dir",
                "store = MemoryStore(memory_char_limit=2200, user_char_limit=1375)",
                "store.load_from_disk()",
                `marker = ${JSON.stringify(marker)}`,
                "memory_content = f'{marker} memory persistence probe'",
                "user_content = f'{marker} user profile probe'",
                "memory_add = store.add('memory', memory_content)",
                "user_add = store.add('user', user_content)",
                "store.load_from_disk()",
                "memory_seen = memory_content in store.memory_entries",
                "user_seen = user_content in store.user_entries",
                "memory_remove = store.remove('memory', marker)",
                "user_remove = store.remove('user', marker)",
                "store.load_from_disk()",
                "memory_dir = get_memory_dir()",
                "payload = {",
                "  'ok': bool(memory_seen and user_seen and memory_add.get('success') and user_add.get('success')),",
                "  'memoryDir': str(memory_dir),",
                "  'memoryFile': str(memory_dir / 'MEMORY.md'),",
                "  'userFile': str(memory_dir / 'USER.md'),",
                "  'memoryEntryCount': len(store.memory_entries),",
                "  'userEntryCount': len(store.user_entries),",
                "  'memoryFileExists': (memory_dir / 'MEMORY.md').exists(),",
                "  'userFileExists': (memory_dir / 'USER.md').exists(),",
                "  'memoryWritable': bool(memory_add.get('success') and memory_seen),",
                "  'userWritable': bool(user_add.get('success') and user_seen),",
                "  'memorySnapshotReady': store.format_for_system_prompt('memory') is not None,",
                "  'userSnapshotReady': store.format_for_system_prompt('user') is not None,",
                "  'testEntryRemoved': bool(memory_remove.get('success') and user_remove.get('success'))",
                "}",
                "print(json.dumps(payload, ensure_ascii=False))"
            ].join("\n");
            const result = spawnSync(python, ["-c", script], {
                cwd: this.dataRoot,
                env: this.buildHermesEnv(),
                encoding: "utf8",
                windowsHide: true,
                timeout: 45000
            });
            if (result.status !== 0) {
                throw new Error((result.stderr || result.stdout || `Hermes memory verification exited with ${result.status}`).trim());
            }
            const parsed = JSON.parse((result.stdout || "{}").trim());
            const report = {
                ok: !!parsed.ok,
                checkedAt: new Date().toISOString(),
                memoryEnabled: true,
                userProfileEnabled: true,
                memoryDir,
                memoryFile,
                userFile,
                configPath,
                reportPath,
                memoryEntryCount: Number(parsed.memoryEntryCount || 0),
                userEntryCount: Number(parsed.userEntryCount || 0),
                memoryFileExists: !!parsed.memoryFileExists,
                userFileExists: !!parsed.userFileExists,
                memoryWritable: !!parsed.memoryWritable,
                userWritable: !!parsed.userWritable,
                memorySnapshotReady: !!parsed.memorySnapshotReady,
                userSnapshotReady: !!parsed.userSnapshotReady,
                testEntryRemoved: !!parsed.testEntryRemoved
            };
            this.writeJson(reportPath, report);
            if (!options.silent) {
                this.logSink({
                    agent: "hermes",
                    level: report.ok ? "system" : "error",
                    message: `Hermes memory verified: memoryEntries=${report.memoryEntryCount}, userEntries=${report.userEntryCount}, report=${report.reportPath}`,
                    at: new Date().toISOString()
                });
            }
            return report;
        }
        catch (error) {
            const report = {
                ok: false,
                checkedAt: new Date().toISOString(),
                memoryEnabled: true,
                userProfileEnabled: true,
                memoryDir,
                memoryFile,
                userFile,
                configPath,
                reportPath,
                memoryEntryCount: 0,
                userEntryCount: 0,
                memoryFileExists: fs.existsSync(memoryFile),
                userFileExists: fs.existsSync(userFile),
                memoryWritable: false,
                userWritable: false,
                memorySnapshotReady: false,
                userSnapshotReady: false,
                testEntryRemoved: false,
                error: error instanceof Error ? error.message : String(error)
            };
            this.writeJson(reportPath, report);
            this.logSink({
                agent: "hermes",
                level: "error",
                message: `Hermes memory verification failed: ${report.error}`,
                at: new Date().toISOString()
            });
            return report;
        }
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
            path.join(this.dataRoot, "exports"),
            path.join(this.dataRoot, "reports"),
            path.join(this.dataRoot, "reports", "skills"),
            path.join(this.dataRoot, "reports", "memory"),
            path.join(this.dataRoot, "reports", "connectors"),
            path.join(this.dataRoot, "reports", "sandboxes"),
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
        const config = this.readConfig();
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
    syncOpenClawSkillsToHermes() {
        const mirrorRoot = path.join(this.dataRoot, "skills", "openclaw");
        const skillSources = this.findOpenClawSkillSources();
        const manifestPath = path.join(mirrorRoot, ".openclaw_sync_manifest.json");
        const usedTargets = new Set();
        const manifestSkills = skillSources.map((source) => ({
            name: source.name,
            key: source.key,
            source: source.path,
            targetName: this.uniqueTargetName(this.safeFileName(source.key || source.name), usedTargets),
            skillMtimeMs: source.skillMtimeMs
        }));
        const manifest = {
            version: 3,
            syncedAt: new Date().toISOString(),
            sourceRoots: [this.paths.skillsRoot],
            mirrorRoot,
            skills: manifestSkills
        };
        const oldManifest = this.readJsonSafe(manifestPath);
        const unchanged = !!oldManifest && JSON.stringify({ ...oldManifest, syncedAt: manifest.syncedAt }) === JSON.stringify(manifest);
        if (unchanged) {
            return { sourceCount: skillSources.length, copied: 0, mirroredCount: skillSources.length, names: skillSources.map((source) => source.name), unchanged: true };
        }
        fs.rmSync(mirrorRoot, { recursive: true, force: true });
        fs.mkdirSync(mirrorRoot, { recursive: true });
        const copiedNames = [];
        for (const source of skillSources) {
            const targetName = manifestSkills.find((row) => row.source === source.path)?.targetName || this.safeFileName(source.key || source.name);
            const target = path.join(mirrorRoot, targetName);
            if (source.isDirectory) {
                fs.cpSync(source.path, target, {
                    recursive: true,
                    filter: (sourcePath) => this.shouldCopySkillPath(source.path, sourcePath)
                });
            }
            else {
                fs.mkdirSync(target, { recursive: true });
                fs.copyFileSync(source.path, path.join(target, "SKILL.md"));
            }
            copiedNames.push(source.name);
        }
        this.writeJson(manifestPath, manifest);
        fs.writeFileSync(path.join(mirrorRoot, "DESCRIPTION.md"), "# OpenClaw Skills\n\nThese skills are mirrored from the portable OpenClaw skills directory and verified through Hermes native skill command scanning.\n", "utf8");
        return { sourceCount: skillSources.length, copied: copiedNames.length, mirroredCount: skillSources.length, names: copiedNames, unchanged: false };
    }
    verifyHermesSkillVisibility() {
        const python = this.findPython();
        const sourceRoot = path.join(this.runtimeRoot, "hermes-agent");
        if (!python)
            throw new Error("Hermes portable Python was not found.");
        if (!fs.existsSync(path.join(sourceRoot, "agent", "skill_commands.py"))) {
            throw new Error(`Hermes skill_commands.py was not found under ${sourceRoot}.`);
        }
        const script = [
            "import json, sys",
            `sys.path.insert(0, ${JSON.stringify(sourceRoot)})`,
            "from agent.skill_commands import reload_skills, get_skill_commands",
            "result = reload_skills()",
            "commands = get_skill_commands()",
            "names = sorted(set((info or {}).get('name') or key.lstrip('/') for key, info in commands.items()))",
            "print(json.dumps({'ok': True, 'reload': result, 'commands': sorted(commands.keys()), 'names': names}, ensure_ascii=False))"
        ].join("; ");
        const result = spawnSync(python, ["-c", script], {
            cwd: this.dataRoot,
            env: this.buildHermesEnv(),
            encoding: "utf8",
            windowsHide: true,
            timeout: 45000
        });
        if (result.status !== 0) {
            throw new Error((result.stderr || result.stdout || `Hermes skill scan exited with ${result.status}`).trim());
        }
        const parsed = JSON.parse((result.stdout || "{}").trim());
        return {
            ok: !!parsed.ok,
            names: Array.isArray(parsed.names) ? parsed.names.map(String) : [],
            commands: Array.isArray(parsed.commands) ? parsed.commands.map(String) : []
        };
    }
    findOpenClawSkillSources() {
        const sources = [];
        const disabled = this.readDisabledOpenClawSkills();
        if (!fs.existsSync(this.paths.skillsRoot))
            return sources;
        for (const entry of fs.readdirSync(this.paths.skillsRoot, { withFileTypes: true })) {
            const sourcePath = path.join(this.paths.skillsRoot, entry.name);
            if (entry.isDirectory()) {
                const skillFile = path.join(sourcePath, "SKILL.md");
                if (!fs.existsSync(skillFile))
                    continue;
                const name = this.readSkillName(skillFile, entry.name);
                if (disabled.has(name) || disabled.has(entry.name))
                    continue;
                const stat = fs.statSync(skillFile);
                sources.push({ path: sourcePath, key: entry.name, name, isDirectory: true, skillMtimeMs: Math.round(stat.mtimeMs) });
            }
            else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
                const name = this.readSkillName(sourcePath, entry.name.replace(/\.md$/i, ""));
                if (disabled.has(name) || disabled.has(entry.name))
                    continue;
                const stat = fs.statSync(sourcePath);
                sources.push({ path: sourcePath, key: entry.name.replace(/\.md$/i, ""), name, isDirectory: false, skillMtimeMs: Math.round(stat.mtimeMs) });
            }
        }
        return sources;
    }
    readDisabledOpenClawSkills() {
        const configPath = path.join(this.paths.dataRoot, ".openclaw", "openclaw.json");
        const disabled = new Set();
        if (!fs.existsSync(configPath))
            return disabled;
        try {
            const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
            const entries = config?.skills?.entries || {};
            for (const [name, entry] of Object.entries(entries)) {
                if (entry?.enabled === false)
                    disabled.add(name);
            }
        }
        catch {
            return disabled;
        }
        return disabled;
    }
    readSkillName(skillFile, fallback) {
        try {
            const content = fs.readFileSync(skillFile, "utf8");
            const match = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/);
            const frontmatter = match ? match[1] : content.slice(0, 2048);
            const nameMatch = frontmatter.match(/^name:\s*["']?([^"'\r\n]+)["']?\s*$/m);
            return (nameMatch?.[1] || fallback).trim();
        }
        catch {
            return fallback;
        }
    }
    countSkillFiles(root) {
        if (!fs.existsSync(root))
            return 0;
        let count = 0;
        for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
            const full = path.join(root, entry.name);
            if (entry.isDirectory())
                count += this.countSkillFiles(full);
            else if (entry.isFile() && entry.name === "SKILL.md")
                count += 1;
        }
        return count;
    }
    readSkillReport() {
        const reportPath = this.skillReportPath();
        if (!fs.existsSync(reportPath))
            return null;
        try {
            return JSON.parse(fs.readFileSync(reportPath, "utf8"));
        }
        catch {
            return null;
        }
    }
    createSkillReportSnapshot() {
        const mirrorRoot = path.join(this.dataRoot, "skills", "openclaw");
        return {
            ok: false,
            checkedAt: new Date().toISOString(),
            sourceCount: this.findOpenClawSkillSources().length,
            mirroredCount: this.countSkillFiles(mirrorRoot),
            visibleCount: 0,
            commandCount: 0,
            usageTracked: fs.existsSync(path.join(this.dataRoot, "skills", ".usage.json")),
            mirrorRoot,
            path: mirrorRoot,
            reportPath: this.skillReportPath(),
            sampleCommands: [],
            missingNames: [],
            error: "Skill visibility has not been verified yet."
        };
    }
    readJsonSafe(filePath) {
        try {
            if (!fs.existsSync(filePath))
                return null;
            return JSON.parse(fs.readFileSync(filePath, "utf8"));
        }
        catch {
            return null;
        }
    }
    skillReportPath() {
        return path.join(this.dataRoot, "reports", "skills", "visibility-last.json");
    }
    skillGrowthReportPath() {
        return path.join(this.dataRoot, "reports", "skills", "growth-last.json");
    }
    memoryReportPath() {
        return path.join(this.dataRoot, "reports", "memory", "persistence-last.json");
    }
    readSkillGrowthReport() {
        const reportPath = this.skillGrowthReportPath();
        if (!fs.existsSync(reportPath))
            return null;
        try {
            return JSON.parse(fs.readFileSync(reportPath, "utf8"));
        }
        catch {
            return null;
        }
    }
    readMemoryReport() {
        const reportPath = this.memoryReportPath();
        if (!fs.existsSync(reportPath))
            return null;
        try {
            return JSON.parse(fs.readFileSync(reportPath, "utf8"));
        }
        catch {
            return null;
        }
    }
    createMemoryReportSnapshot() {
        const memoryDir = path.join(this.dataRoot, "memories");
        return {
            ok: false,
            checkedAt: new Date().toISOString(),
            memoryEnabled: true,
            userProfileEnabled: true,
            memoryDir,
            memoryFile: path.join(memoryDir, "MEMORY.md"),
            userFile: path.join(memoryDir, "USER.md"),
            configPath: path.join(this.dataRoot, "config.yaml"),
            reportPath: this.memoryReportPath(),
            memoryEntryCount: 0,
            userEntryCount: 0,
            memoryFileExists: fs.existsSync(path.join(memoryDir, "MEMORY.md")),
            userFileExists: fs.existsSync(path.join(memoryDir, "USER.md")),
            memoryWritable: false,
            userWritable: false,
            memorySnapshotReady: false,
            userSnapshotReady: false,
            testEntryRemoved: false,
            error: "Memory persistence has not been verified yet."
        };
    }
    writeJson(filePath, payload) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    }
    safeFileName(value) {
        return String(value || "skill").replace(/[\\/:*?"<>|]/g, "_").trim() || "skill";
    }
    skillSlug(value) {
        return String(value || "")
            .toLowerCase()
            .replace(/[\s_]+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
    }
    shouldCopySkillPath(rootDir, sourcePath) {
        const rel = path.relative(rootDir, sourcePath).replace(/\\/g, "/");
        const excluded = new Set([".git", ".github", ".hub", ".archive", "node_modules", "__pycache__", ".venv", "venv", "dist", "build", ".next", ".cache"]);
        return !rel.split("/").some((part) => excluded.has(part));
    }
    uniqueTargetName(name, used) {
        let candidate = name;
        let index = 2;
        while (used.has(candidate.toLowerCase())) {
            candidate = `${name}-${index}`;
            index += 1;
        }
        used.add(candidate.toLowerCase());
        return candidate;
    }
    writePortableArtifacts(config = this.readConfig()) {
        this.ensurePortableDirs();
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
        this.writeHermesConfigYaml(config);
        fs.writeFileSync(path.join(this.dataRoot, "config", "model.json"), `${JSON.stringify(this.redactConfig(config).model, null, 2)}\n`, "utf8");
        fs.writeFileSync(path.join(this.dataRoot, "cron", "schedules.json"), `${JSON.stringify(config.schedules, null, 2)}\n`, "utf8");
        fs.writeFileSync(path.join(this.dataRoot, "sandboxes", "backends.json"), `${JSON.stringify(config.sandboxes, null, 2)}\n`, "utf8");
        fs.writeFileSync(path.join(this.dataRoot, "config", "features.json"), `${JSON.stringify({
            memoryEnabled: config.memoryEnabled,
            autoSkillEnabled: config.autoSkillEnabled
        }, null, 2)}\n`, "utf8");
        for (const connector of config.connectors) {
            fs.writeFileSync(path.join(this.dataRoot, "connectors", `${connector.id}.json`), `${JSON.stringify({ ...connector, fields: this.redactFields(connector.fields) }, null, 2)}\n`, "utf8");
        }
    }
    writeHermesConfigYaml(config = this.readConfig()) {
        fs.mkdirSync(this.dataRoot, { recursive: true });
        const yaml = [
            "# Managed by OpenClawPro Agent Hub. Kept inside the USB data/.hermes directory.",
            "memory:",
            `  memory_enabled: ${config.memoryEnabled !== false ? "true" : "false"}`,
            `  user_profile_enabled: ${config.memoryEnabled !== false ? "true" : "false"}`,
            "  memory_char_limit: 2200",
            "  user_char_limit: 1375",
            "  provider: \"\"",
            "skills:",
            `  auto_skill_enabled: ${config.autoSkillEnabled !== false ? "true" : "false"}`,
            "  external_dirs:",
            `    - ${JSON.stringify(this.paths.skillsRoot)}`,
            "paths:",
            `  home: ${JSON.stringify(path.join(this.dataRoot, "home"))}`,
            `  logs: ${JSON.stringify(path.join(this.dataRoot, "logs"))}`,
            `  memories: ${JSON.stringify(path.join(this.dataRoot, "memories"))}`,
            `  skills: ${JSON.stringify(path.join(this.dataRoot, "skills"))}`,
            ""
        ].join("\n");
        fs.writeFileSync(path.join(this.dataRoot, "config.yaml"), yaml, "utf8");
    }
    normalizeConfig(config, fallback = defaultHermesConfig) {
        const safeConfig = config || fallback;
        const fallbackByConnector = new Map(fallback.connectors.map((item) => [item.id, item]));
        const inputByConnector = new Map((safeConfig.connectors || []).map((item) => [item.id, item]));
        const connectors = defaultHermesConfig.connectors.map((template) => {
            const fallbackItem = fallbackByConnector.get(template.id) || template;
            const input = inputByConnector.get(template.id);
            return {
                ...template,
                ...fallbackItem,
                ...input,
                fields: {
                    ...template.fields,
                    ...fallbackItem.fields,
                    ...input?.fields
                }
            };
        });
        const fallbackBySandbox = new Map(fallback.sandboxes.map((item) => [item.id, item]));
        const inputBySandbox = new Map((safeConfig.sandboxes || []).map((item) => [item.id, item]));
        const sandboxes = defaultHermesConfig.sandboxes.map((template) => {
            const fallbackItem = fallbackBySandbox.get(template.id) || template;
            const input = inputBySandbox.get(template.id);
            return {
                ...template,
                ...fallbackItem,
                ...input,
                fields: {
                    ...template.fields,
                    ...fallbackItem.fields,
                    ...input?.fields
                }
            };
        });
        return {
            model: {
                ...defaultHermesConfig.model,
                ...fallback.model,
                ...safeConfig.model
            },
            connectors,
            schedules: Array.isArray(safeConfig.schedules) ? safeConfig.schedules : [],
            sandboxes,
            memoryEnabled: safeConfig.memoryEnabled ?? fallback.memoryEnabled ?? true,
            autoSkillEnabled: safeConfig.autoSkillEnabled ?? fallback.autoSkillEnabled ?? true
        };
    }
    missingRequiredFields(fields, required) {
        return required.filter((field) => !(fields[field] || "").trim());
    }
    writeTestReport(kind, id, payload) {
        const dir = path.join(this.dataRoot, "reports", kind);
        fs.mkdirSync(dir, { recursive: true });
        const target = path.join(dir, `${id}-last-test.json`);
        fs.writeFileSync(target, `${JSON.stringify({
            checkedAt: new Date().toISOString(),
            ...payload
        }, null, 2)}\n`, "utf8");
        return target;
    }
    inferCron(text) {
        const normalized = text.toLowerCase();
        if (normalized.includes("hour") || normalized.includes("每小时"))
            return "0 * * * *";
        if (normalized.includes("week") || normalized.includes("每周"))
            return "0 9 * * 1";
        if (normalized.includes("month") || normalized.includes("每月"))
            return "0 9 1 * *";
        if (normalized.includes("night") || normalized.includes("晚") || normalized.includes("夜"))
            return "0 22 * * *";
        return "0 9 * * *";
    }
    redactConfig(config) {
        return {
            ...config,
            model: { ...config.model, apiKey: this.redactSecret(config.model.apiKey) },
            connectors: config.connectors.map((connector) => ({
                ...connector,
                fields: this.redactFields(connector.fields)
            }))
        };
    }
    redactFields(fields) {
        return Object.fromEntries(Object.entries(fields).map(([key, value]) => [
            key,
            /token|key|secret|password/i.test(key) ? this.redactSecret(value) : value
        ]));
    }
    redactSecret(value) {
        if (!value)
            return "";
        if (value.length <= 6)
            return "***";
        return `${value.slice(0, 3)}...${value.slice(-3)}`;
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
