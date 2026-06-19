import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { AgentLogLine, AgentStatus, ChatResponse } from "../../shared/types.js";
import { PortablePaths } from "../portable-paths.js";
import { checkTcpPort } from "../services/net.js";
import { ProcessSupervisor } from "../services/process-supervisor.js";
import { AgentRuntime } from "./agent-runtime.js";

export class OpenClawRuntime implements AgentRuntime {
  private readonly supervisor = new ProcessSupervisor("openclaw");
  private readonly dataRoot: string;
  private readonly runtimeRoot: string;
  private logSink: (line: AgentLogLine) => void = () => {};

  constructor(private readonly paths: PortablePaths) {
    this.runtimeRoot = paths.runtimeRoot;
    this.dataRoot = paths.agentData("openclaw");
    this.supervisor.on("log", (line) => this.logSink(line));
  }

  onLog(callback: (line: AgentLogLine) => void): void {
    this.logSink = callback;
  }

  async getStatus(): Promise<AgentStatus> {
    this.rewritePortableConfigPaths();
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

  async start(): Promise<AgentStatus> {
    this.ensureRuntime();
    this.rewritePortableConfigPaths();
    const command = this.findOpenClawCommand();
    if (!command) {
      this.logSink({ agent: "openclaw", level: "error", message: "OpenClaw runtime command is missing.", at: new Date().toISOString() });
      return this.getStatus();
    }
    this.supervisor.start({
      command,
      args: ["gateway", "--allow-unconfigured"],
      cwd: this.runtimeRoot,
      env: this.buildEnv()
    });
    return this.getStatus();
  }

  async stop(): Promise<AgentStatus> {
    this.supervisor.stop();
    return this.getStatus();
  }

  async restart(): Promise<AgentStatus> {
    await this.stop();
    await new Promise((resolve) => setTimeout(resolve, 800));
    return this.start();
  }

  async chat(message: string, messages: Array<{ role: string; content: string }> = []): Promise<ChatResponse> {
    this.rewritePortableConfigPaths();
    const config = this.readOpenClawConfig();
    const modelRef = config?.agents?.defaults?.model?.primary || "";
    const [providerId, modelIdFromRef] = String(modelRef).split("/");
    const provider = providerId ? config?.models?.providers?.[providerId] : null;
    const model = modelIdFromRef || provider?.models?.[0]?.id;

    if (!provider || !provider.baseUrl || !model) {
      return {
        ok: false,
        error: "OpenClaw model config is incomplete. Please configure a provider and primary model in data/.openclaw/openclaw.json."
      };
    }

    if (provider.api && provider.api !== "openai-completions") {
      return { ok: false, error: `Unsupported OpenClaw provider api: ${provider.api}` };
    }

    const url = this.resolveChatCompletionsUrl(provider.baseUrl);
    const payload = JSON.stringify({
      model,
      messages: [...messages, { role: "user", content: message }],
      stream: false
    });

    return this.requestJson(url, payload, {
      Authorization: provider.apiKey ? `Bearer ${provider.apiKey}` : "",
      ...(provider.headers || {})
    });
  }

  private ensureRuntime(): void {
    fs.mkdirSync(this.runtimeRoot, { recursive: true });
    fs.mkdirSync(this.dataRoot, { recursive: true });
    const command = this.findOpenClawCommand();
    const zip = path.join(this.runtimeRoot, "openclaw.zip");
    if (command || !fs.existsSync(zip)) return;
    const result = spawnSync("tar.exe", ["-xf", zip, "-C", this.runtimeRoot], { encoding: "utf8", windowsHide: true });
    if (result.status !== 0) {
      this.logSink({ agent: "openclaw", level: "error", message: result.stderr || "Failed to extract openclaw.zip", at: new Date().toISOString() });
    }
  }

  private rewritePortableConfigPaths(): void {
    const configFile = path.join(this.dataRoot, "openclaw.json");
    if (!fs.existsSync(configFile)) return;
    try {
      const config = JSON.parse(fs.readFileSync(configFile, "utf8"));
      let changed = false;
      const extraDirs = config?.skills?.load?.extraDirs;
      if (Array.isArray(extraDirs)) {
        const normalized = extraDirs.map((entry: unknown) => {
          if (typeof entry !== "string") return entry;
          const normalizedEntry = entry.replace(/\\/g, "/");
          if (/^[A-Za-z]:\/skills\/?$/.test(normalizedEntry) || normalizedEntry === "skills" || normalizedEntry.endsWith("/skills")) {
            return "skills";
          }
          return entry;
        });
        if (JSON.stringify(normalized) !== JSON.stringify(extraDirs)) {
          config.skills.load.extraDirs = normalized;
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(configFile, `${JSON.stringify(config, null, 2)}\n`, "utf8");
      }
    } catch (error) {
      this.logSink({
        agent: "openclaw",
        level: "warn",
        message: `Failed to rewrite portable config paths: ${error instanceof Error ? error.message : String(error)}`,
        at: new Date().toISOString()
      });
    }
  }

  private buildEnv(): NodeJS.ProcessEnv {
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

  private readOpenClawConfig(): any {
    const file = path.join(this.dataRoot, "openclaw.json");
    if (!fs.existsSync(file)) return null;
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      return null;
    }
  }

  private resolveChatCompletionsUrl(baseUrl: string): URL {
    const trimmed = baseUrl.replace(/\/+$/, "");
    if (trimmed.endsWith("/chat/completions")) return new URL(trimmed);
    return new URL(`${trimmed}/chat/completions`);
  }

  private requestJson(url: URL, payload: string, headers: Record<string, string>): Promise<ChatResponse> {
    return new Promise((resolve) => {
      const transport = url.protocol === "https:" ? https : http;
      const requestHeaders = Object.fromEntries(Object.entries({
        "Content-Type": "application/json",
        "Content-Length": String(Buffer.byteLength(payload)),
        ...headers
      }).filter(([, value]) => value));

      const req = transport.request({
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: "POST",
        headers: requestHeaders,
        timeout: 120000
      }, (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => raw += chunk);
        res.on("end", () => {
          try {
            const json = JSON.parse(raw || "{}");
            const reply = json.choices?.[0]?.message?.content || json.choices?.[0]?.text || json.reply;
            if ((res.statusCode || 0) >= 400) {
              resolve({ ok: false, error: json.error?.message || json.error || raw || `HTTP ${res.statusCode}` });
              return;
            }
            resolve({ ok: true, reply: reply || raw });
          } catch (error) {
            resolve({ ok: false, error: error instanceof Error ? error.message : String(error) });
          }
        });
      });
      req.on("error", (error) => resolve({ ok: false, error: error.message }));
      req.on("timeout", () => {
        req.destroy();
        resolve({ ok: false, error: "OpenClaw model request timed out." });
      });
      req.write(payload);
      req.end();
    });
  }

  private findOpenClawCommand(): string | null {
    const command = path.join(this.runtimeRoot, process.platform === "win32" ? "openclaw.cmd" : "openclaw");
    return fs.existsSync(command) ? command : null;
  }

  private findNode(): string | null {
    const candidate = path.join(this.runtimeRoot, process.platform === "win32" ? "node.exe" : "node");
    return fs.existsSync(candidate) ? candidate : null;
  }
}
