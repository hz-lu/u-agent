import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { BrowserWindow, shell } from "electron";
import { detectRuntimePlatform } from "../../../shared/platform.js";
import {
  ActionResult,
  AgentLogLine,
  AgentStatus,
  ChatResponse,
  ConfigImportResult,
  ConnectorConfig,
  HermesConfig,
  SandboxConfig,
  ScheduleConfig,
  ScheduleInput
} from "../../../shared/types.js";
import { PortablePaths } from "../../portable-paths.js";
import { JsonStore } from "../../services/json-store.js";
import { checkTcpPort } from "../../services/net.js";
import { ProcessSupervisor } from "../../services/process-supervisor.js";
import { AgentRuntime } from "../agent-runtime.js";

const defaultHermesConfig: HermesConfig = {
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

const connectorRequiredFields: Record<ConnectorConfig["id"], string[]> = {
  telegram: ["botToken"],
  discord: ["botToken"],
  slack: ["appToken", "botToken"],
  whatsapp: ["sessionName"],
  signal: ["phoneNumber"],
  email: ["imapUrl", "smtpUrl", "username"],
  cli: []
};

const sandboxRequiredFields: Record<SandboxConfig["id"], string[]> = {
  local: [],
  docker: ["socket"],
  ssh: ["host", "user"],
  singularity: ["image"],
  modal: ["tokenId"]
};

export class HermesRuntime implements AgentRuntime {
  private readonly dashboard = new ProcessSupervisor("hermes");
  private readonly gateway = new ProcessSupervisor("hermes");
  private readonly configServer = new ProcessSupervisor("hermes");
  private readonly runtimeRoot: string;
  private readonly legacyRuntimeRoot: string;
  private readonly dataRoot: string;
  private readonly store: JsonStore<HermesConfig>;
  private logSink: (line: AgentLogLine) => void = () => {};
  private readonly apiServerKey = process.env.HERMES_API_SERVER_KEY || "openclaw-local-hermes";

  constructor(
    private readonly paths: PortablePaths,
    private readonly getMainWindow: () => BrowserWindow | null
  ) {
    this.legacyRuntimeRoot = path.join(paths.runtimeRoot, "HermesPortable");
    this.runtimeRoot = fs.existsSync(this.legacyRuntimeRoot) ? this.legacyRuntimeRoot : paths.agentRuntime("hermes");
    this.dataRoot = paths.agentData("hermes");
    this.store = new JsonStore(path.join(this.dataRoot, "config", "hub.json"), defaultHermesConfig);
    for (const supervisor of [this.dashboard, this.gateway, this.configServer]) {
      supervisor.on("log", (line) => this.logSink(line));
    }
  }

  onLog(callback: (line: AgentLogLine) => void): void {
    this.logSink = callback;
  }

  readConfig(): HermesConfig {
    return this.normalizeConfig(this.store.read());
  }

  writeConfig(config: HermesConfig): HermesConfig {
    const normalized = this.normalizeConfig(config);
    this.store.write(normalized);
    this.writePortableArtifacts(normalized);
    return this.store.read();
  }

  testConnector(id: ConnectorConfig["id"]): ActionResult {
    const config = this.readConfig();
    const connector = config.connectors.find((item) => item.id === id);
    if (!connector) return { ok: false, message: `Connector ${id} is not available.` };

    const missing = this.missingRequiredFields(connector.fields, connectorRequiredFields[id]);
    connector.status = missing.length ? "error" : "configured";
    this.writeConfig(config);

    if (missing.length) {
      return { ok: false, message: `${connector.label} missing required fields: ${missing.join(", ")}` };
    }
    return {
      ok: true,
      message: `${connector.label} configuration is ready.`,
      path: path.join(this.dataRoot, "connectors", `${id}.json`)
    };
  }

  testSandbox(id: SandboxConfig["id"]): ActionResult {
    const config = this.readConfig();
    const sandbox = config.sandboxes.find((item) => item.id === id);
    if (!sandbox) return { ok: false, message: `Sandbox ${id} is not available.` };

    const missing = this.missingRequiredFields(sandbox.fields, sandboxRequiredFields[id]);
    if (missing.length) return { ok: false, message: `${id} sandbox missing required fields: ${missing.join(", ")}` };
    if (id === "docker" && sandbox.fields.socket && !fs.existsSync(sandbox.fields.socket)) {
      return { ok: false, message: `Docker socket was not found: ${sandbox.fields.socket}` };
    }
    return {
      ok: true,
      message: `${id} sandbox configuration is ready.`,
      path: path.join(this.dataRoot, "sandboxes", "backends.json")
    };
  }

  addSchedule(input: ScheduleInput): ScheduleConfig {
    const config = this.readConfig();
    const schedule: ScheduleConfig = {
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

  removeSchedule(id: string): HermesConfig {
    const config = this.readConfig();
    config.schedules = config.schedules.filter((item) => item.id !== id);
    return this.writeConfig(config);
  }

  exportConfig(): ActionResult {
    const config = this.readConfig();
    const exportsDir = path.join(this.dataRoot, "exports");
    fs.mkdirSync(exportsDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
    const target = path.join(exportsDir, `hermes-config-${stamp}.json`);
    fs.writeFileSync(target, `${JSON.stringify(this.redactConfig(config), null, 2)}\n`, "utf8");
    return { ok: true, message: "Hermes config exported with secrets redacted.", path: target };
  }

  importConfig(filePath: string): ConfigImportResult {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) return { ok: false, message: `File does not exist: ${resolved}` };
    const parsed = JSON.parse(fs.readFileSync(resolved, "utf8")) as HermesConfig;
    const current = this.readConfig();
    const normalized = this.normalizeConfig(parsed, current);
    const config = this.writeConfig(normalized);
    return { ok: true, message: "Hermes config imported.", path: resolved, config };
  }

  async getStatus(): Promise<AgentStatus> {
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

  async start(): Promise<AgentStatus> {
    this.ensurePortableDirs();
    this.migrateLegacyData();
    this.writePortableArtifacts();
    await this.startConfigServer(false);
    await this.startDashboard(false);
    return this.getStatus();
  }

  async stop(): Promise<AgentStatus> {
    this.dashboard.stop();
    this.gateway.stop();
    this.configServer.stop();
    return this.getStatus();
  }

  async restart(): Promise<AgentStatus> {
    await this.stop();
    await new Promise((resolve) => setTimeout(resolve, 800));
    return this.start();
  }

  async open(target: "config" | "dashboard" | "api" = "dashboard"): Promise<boolean> {
    if (target === "config") await this.startConfigServer(false);
    if (target === "dashboard") await this.startDashboard(false);
    if (target === "api") await this.startApiServer(false);
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

  async startDashboard(open = true): Promise<AgentStatus> {
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
    if (open) await this.open("dashboard");
    return this.getStatus();
  }

  async startConfigServer(open = true): Promise<AgentStatus> {
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
    if (open) await this.open("config");
    return this.getStatus();
  }

  async startApiServer(open = true): Promise<AgentStatus> {
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
    if (open) await this.open("api");
    return this.getStatus();
  }

  async chat(message: string, messages: Array<{ role: string; content: string }> = []): Promise<ChatResponse> {
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
          } catch {
            resolve({ ok: false, error: raw || `HTTP ${res.statusCode}` });
          }
        });
      });
      req.on("error", (error) => resolve({ ok: false, error: error.message }));
      req.write(payload);
      req.end();
    });
  }

  private ensurePortableDirs(): void {
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
      path.join(this.dataRoot, "tmp")
    ]) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private migrateLegacyData(): void {
    const legacy = path.join(this.runtimeRoot, "data");
    if (!fs.existsSync(legacy)) return;
    for (const entry of fs.readdirSync(legacy)) {
      if (entry.endsWith(".lock")) continue;
      const source = path.join(legacy, entry);
      const target = path.join(this.dataRoot, entry);
      if (!fs.existsSync(target)) fs.cpSync(source, target, { recursive: true });
    }
  }

  private buildHermesEnv(): NodeJS.ProcessEnv {
    const config = this.readConfig();
    const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") || "Path";
    const venvScripts = path.join(this.runtimeRoot, "venv", process.platform === "win32" ? "Scripts" : "bin");
    const nodeDir = this.findNode() ? path.dirname(this.findNode()!) : path.join(this.runtimeRoot, "node");
    const pythonDir = this.findPython() ? path.dirname(this.findPython()!) : path.join(this.runtimeRoot, "python");

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

  private writePortableArtifacts(config = this.readConfig()): void {
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
    fs.writeFileSync(path.join(this.dataRoot, "config", "model.json"), `${JSON.stringify(this.redactConfig(config).model, null, 2)}\n`, "utf8");
    fs.writeFileSync(path.join(this.dataRoot, "cron", "schedules.json"), `${JSON.stringify(config.schedules, null, 2)}\n`, "utf8");
    fs.writeFileSync(path.join(this.dataRoot, "sandboxes", "backends.json"), `${JSON.stringify(config.sandboxes, null, 2)}\n`, "utf8");
    fs.writeFileSync(path.join(this.dataRoot, "config", "features.json"), `${JSON.stringify({
      memoryEnabled: config.memoryEnabled,
      autoSkillEnabled: config.autoSkillEnabled
    }, null, 2)}\n`, "utf8");

    for (const connector of config.connectors) {
      fs.writeFileSync(
        path.join(this.dataRoot, "connectors", `${connector.id}.json`),
        `${JSON.stringify({ ...connector, fields: this.redactFields(connector.fields) }, null, 2)}\n`,
        "utf8"
      );
    }
  }

  private normalizeConfig(config: HermesConfig, fallback = defaultHermesConfig): HermesConfig {
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

  private missingRequiredFields(fields: Record<string, string>, required: string[]): string[] {
    return required.filter((field) => !(fields[field] || "").trim());
  }

  private inferCron(text: string): string {
    const normalized = text.toLowerCase();
    if (normalized.includes("hour") || normalized.includes("每小时")) return "0 * * * *";
    if (normalized.includes("week") || normalized.includes("每周")) return "0 9 * * 1";
    if (normalized.includes("month") || normalized.includes("每月")) return "0 9 1 * *";
    if (normalized.includes("night") || normalized.includes("晚") || normalized.includes("夜")) return "0 22 * * *";
    return "0 9 * * *";
  }

  private redactConfig(config: HermesConfig): HermesConfig {
    return {
      ...config,
      model: { ...config.model, apiKey: this.redactSecret(config.model.apiKey) },
      connectors: config.connectors.map((connector) => ({
        ...connector,
        fields: this.redactFields(connector.fields)
      }))
    };
  }

  private redactFields(fields: Record<string, string>): Record<string, string> {
    return Object.fromEntries(Object.entries(fields).map(([key, value]) => [
      key,
      /token|key|secret|password/i.test(key) ? this.redactSecret(value) : value
    ]));
  }

  private redactSecret(value: string): string {
    if (!value) return "";
    if (value.length <= 6) return "***";
    return `${value.slice(0, 3)}...${value.slice(-3)}`;
  }

  private findHermesExe(): string | null {
    const candidate = process.platform === "win32"
      ? path.join(this.runtimeRoot, "venv", "Scripts", "hermes.exe")
      : path.join(this.runtimeRoot, "venv", "bin", "hermes");
    return fs.existsSync(candidate) ? candidate : null;
  }

  private findPython(): string | null {
    const candidates = process.platform === "win32"
      ? [
          path.join(this.runtimeRoot, "venv", "Scripts", "python.exe"),
          path.join(this.runtimeRoot, "python", "cpython-3.12.13-windows-x86_64-none", "python.exe")
        ]
      : [path.join(this.runtimeRoot, "venv", "bin", "python")];
    return candidates.find((candidate) => fs.existsSync(candidate)) || null;
  }

  private findNode(): string | null {
    const candidates = [
      path.join(this.runtimeRoot, "node", process.platform === "win32" ? "node.exe" : "bin/node"),
      path.join(this.runtimeRoot, "node-windows-x64", "node.exe")
    ];
    return candidates.find((candidate) => fs.existsSync(candidate)) || null;
  }
}
