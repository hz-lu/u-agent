import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { AgentLogLine, AgentStatus, ChatResponse, ModelConfig } from "../../shared/types.js";
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
    const integrity = this.inspectRuntime();
    const ready = await checkTcpPort(18789);
    const critical = integrity.issues.some((issue) => issue.level === "error");
    const state = ready ? "running" : critical ? "error" : integrity.command ? this.supervisor.state : "missing";
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
        `openclaw=${integrity.command || "missing"}`,
        `node=${integrity.node || "missing"}`,
        `zip=${integrity.zipPresent ? "present" : "missing"}`,
        `openclaw.dist=${integrity.distDir || "missing"}`,
        `openclaw.entry=${integrity.entry || "missing"}`,
        ...integrity.issues.map((issue) => `${issue.level}:${issue.code}=${issue.message}${issue.path ? ` (${issue.path})` : ""}`)
      ],
      capabilities: {
        commandPresent: !!integrity.command,
        nodePresent: !!integrity.node,
        zipPresent: integrity.zipPresent,
        expandedPackagePresent: integrity.packagePresent,
        distPresent: !!integrity.distDir,
        entryPresent: !!integrity.entry,
        assetReferencesValid: integrity.missingReferences.length === 0,
        runtimeComplete: integrity.ok,
        dataReady: fs.existsSync(this.dataRoot),
        gatewayReady: ready
      }
    };
  }

  async start(): Promise<AgentStatus> {
    this.ensureRuntimeDirs();
    this.rewritePortableConfigPaths();
    const integrity = this.inspectRuntime();
    const command = integrity.command;
    if (!command) {
      this.logSink({
        agent: "openclaw",
        level: "error",
        message: "OpenClaw runtime is not expanded. Release packages must include runtime/openclaw.cmd, runtime/node.exe, and runtime/node_modules/openclaw/dist. Startup will not unpack openclaw.zip on the UI path.",
        at: new Date().toISOString()
      });
      return this.getStatus();
    }
    const errors = integrity.issues.filter((issue) => issue.level === "error");
    if (errors.length) {
      for (const issue of errors) {
        this.logSink({
          agent: "openclaw",
          level: "error",
          message: `${issue.message}${issue.path ? ` (${issue.path})` : ""}`,
          at: new Date().toISOString()
        });
      }
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

  readModelConfig(): ModelConfig {
    this.rewritePortableConfigPaths();
    const config = this.readOpenClawConfig();
    const { providerId, modelId } = this.resolvePrimaryModel(config);
    const provider = providerId ? config?.models?.providers?.[providerId] : null;
    return {
      provider: providerId,
      model: modelId || provider?.models?.[0]?.id || "",
      baseUrl: provider?.baseUrl || "",
      apiKey: provider?.apiKey || ""
    };
  }

  writeModelConfig(input: ModelConfig): ModelConfig {
    this.ensureRuntimeDirs();
    const config = this.readOpenClawConfig() || this.createDefaultOpenClawConfig();
    config.models ||= { mode: "replace", providers: {} };
    config.models.providers ||= {};
    config.agents ||= {};
    config.agents.defaults ||= {};
    config.agents.defaults.model ||= { primary: "" };
    const providerId = this.safeProviderId(input.provider || "openai-compatible");
    const model = input.model.trim();
    const providers = config.models.providers;
    const existing = providers[providerId] || {};
    providers[providerId] = {
      ...existing,
      api: existing.api || "openai-completions",
      baseUrl: input.baseUrl.trim(),
      apiKey: input.apiKey,
      models: this.upsertModel(existing.models, model)
    };
    config.agents.defaults.model.primary = model ? `${providerId}/${model}` : "";
    this.writeOpenClawConfig(config);
    return this.readModelConfig();
  }

  async chat(message: string, messages: Array<{ role: string; content: string }> = []): Promise<ChatResponse> {
    this.rewritePortableConfigPaths();
    const config = this.readOpenClawConfig();
    const { providerId, modelId: modelIdFromRef } = this.resolvePrimaryModel(config);
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

  private ensureRuntimeDirs(): void {
    fs.mkdirSync(this.runtimeRoot, { recursive: true });
    fs.mkdirSync(this.dataRoot, { recursive: true });
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

  private writeOpenClawConfig(config: any): void {
    fs.mkdirSync(this.dataRoot, { recursive: true });
    fs.writeFileSync(path.join(this.dataRoot, "openclaw.json"), `${JSON.stringify(config, null, 2)}\n`, "utf8");
  }

  private createDefaultOpenClawConfig(): any {
    const cifuModelName = "\u8bcd\u7b26\u79d1\u6280";
    const cifuModelRef = `cifu/${cifuModelName}`;
    return {
      gateway: {
        mode: "local",
        bind: "loopback",
        port: 18789,
        auth: { token: "openclaw-local-token" }
      },
      skills: {
        load: { extraDirs: ["skills"] },
        entries: {}
      },
      models: {
        mode: "replace",
        providers: {
          cifu: {
            apiKey: "123456",
            baseUrl: "https://token.51cifu.com/v1",
            api: "openai-completions",
            models: [
              {
                id: cifuModelName,
                name: cifuModelName,
                isCifuDefault: 1,
                input: ["text", "image"],
                contextWindow: 128000,
                maxTokens: 4096
              }
            ]
          }
        }
      },
      agents: {
        defaults: {
          compaction: { mode: "safeguard" },
          model: { primary: cifuModelRef },
          models: {
            [cifuModelRef]: {
              alias: cifuModelRef
            }
          }
        }
      },
      plugins: {
        allow: ["qwen", "memory-core", "browser", "canvas", "device-pair", "file-transfer", "phone-control", "talk-voice"],
        entries: {
          qwen: { enabled: true },
          "memory-core": { enabled: true },
          browser: { enabled: true },
          canvas: { enabled: true },
          "device-pair": { enabled: true },
          "file-transfer": { enabled: true },
          "phone-control": { enabled: true },
          "talk-voice": { enabled: true }
        }
      },
      channels: {},
      meta: {
        lastTouchedVersion: "2026.6.5",
        lastTouchedAt: new Date().toISOString()
      }
    };
  }

  private resolvePrimaryModel(config: any): { providerId: string; modelId: string } {
    const modelRef = String(config?.agents?.defaults?.model?.primary || "");
    const separator = modelRef.indexOf("/");
    if (separator < 0) return { providerId: modelRef, modelId: "" };
    return {
      providerId: modelRef.slice(0, separator),
      modelId: modelRef.slice(separator + 1)
    };
  }

  private safeProviderId(value: string): string {
    return value.trim().replace(/\s+/g, "-") || "openai-compatible";
  }

  private upsertModel(models: unknown, model: string): Array<Record<string, string>> {
    const current = Array.isArray(models) ? models.filter((item) => item && typeof item === "object") as Array<Record<string, string>> : [];
    if (!model) return current;
    if (current.some((item) => item.id === model)) return current;
    return [{ id: model, label: model }, ...current];
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

  private inspectRuntime(): OpenClawRuntimeIntegrity {
    const command = this.findOpenClawCommand();
    const node = this.findNode();
    const zip = path.join(this.runtimeRoot, "openclaw.zip");
    const packageRoot = path.join(this.runtimeRoot, "node_modules", "openclaw");
    const distDir = path.join(packageRoot, "dist");
    const entryCandidates = [
      path.join(distDir, "entry.mjs"),
      path.join(distDir, "entry.js")
    ];
    const entry = entryCandidates.find((candidate) => fs.existsSync(candidate)) || null;
    const issues: OpenClawRuntimeIssue[] = [];

    if (!command) {
      issues.push({
        level: "error",
        code: "missing-command",
        message: `OpenClaw command is missing; expected ${process.platform === "win32" ? "runtime/openclaw.cmd" : "runtime/openclaw"}.`,
        path: path.join(this.runtimeRoot, process.platform === "win32" ? "openclaw.cmd" : "openclaw")
      });
    }
    if (!node) {
      issues.push({
        level: "error",
        code: "missing-node",
        message: `OpenClaw bundled Node runtime is missing; expected ${process.platform === "win32" ? "runtime/node.exe" : "runtime/node"}.`,
        path: path.join(this.runtimeRoot, process.platform === "win32" ? "node.exe" : "node")
      });
    }
    if (!fs.existsSync(packageRoot)) {
      issues.push({
        level: "error",
        code: "missing-openclaw-package",
        message: "OpenClaw npm package is missing from runtime/node_modules/openclaw. The release must include the expanded runtime, not rely on startup extraction.",
        path: packageRoot
      });
    } else if (!fs.existsSync(distDir)) {
      issues.push({
        level: "error",
        code: "missing-openclaw-dist",
        message: "OpenClaw build output is missing from runtime/node_modules/openclaw/dist.",
        path: distDir
      });
    } else if (!entry) {
      issues.push({
        level: "error",
        code: "missing-openclaw-entry",
        message: "OpenClaw build output is incomplete: missing dist/entry.(m)js.",
        path: distDir
      });
    }

    const missingReferences = fs.existsSync(distDir) ? this.findMissingDistReferences(distDir) : [];
    for (const missing of missingReferences.slice(0, 20)) {
      issues.push({
        level: "error",
        code: "missing-dist-reference",
        message: `OpenClaw dist references a missing asset: ${missing.reference}`,
        path: missing.from
      });
    }
    if (missingReferences.length > 20) {
      issues.push({
        level: "error",
        code: "missing-dist-reference-overflow",
        message: `OpenClaw dist has ${missingReferences.length - 20} additional missing asset references.`
      });
    }

    if (!command && fs.existsSync(zip)) {
      issues.push({
        level: "warn",
        code: "zip-only-runtime",
        message: "runtime/openclaw.zip exists, but startup no longer extracts large runtime archives. Build the release with an expanded runtime directory.",
        path: zip
      });
    }

    return {
      ok: !issues.some((issue) => issue.level === "error"),
      command,
      node,
      zipPresent: fs.existsSync(zip),
      packagePresent: fs.existsSync(packageRoot),
      distDir: fs.existsSync(distDir) ? distDir : null,
      entry,
      missingReferences,
      issues
    };
  }

  private findMissingDistReferences(distDir: string): Array<{ from: string; reference: string }> {
    const files = this.listFiles(distDir).filter((file) => /\.(?:html|js|mjs|css)$/i.test(file));
    const missing: Array<{ from: string; reference: string }> = [];
    const referencePattern = /["'`](?!https?:|data:|node:|#)(\.{1,2}\/[^"'`]+?\.(?:js|mjs|css|json|wasm))["'`]/g;
    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      for (const match of source.matchAll(referencePattern)) {
        const reference = match[1];
        const target = path.resolve(path.dirname(file), reference.split(/[?#]/, 1)[0]);
        if (!fs.existsSync(target)) missing.push({ from: file, reference });
      }
    }
    return missing;
  }

  private listFiles(root: string): string[] {
    const files: string[] = [];
    const stack = [root];
    while (stack.length) {
      const dir = stack.pop()!;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (entry.isFile()) files.push(full);
      }
    }
    return files;
  }
}

interface OpenClawRuntimeIssue {
  level: "error" | "warn";
  code: string;
  message: string;
  path?: string;
}

interface OpenClawRuntimeIntegrity {
  ok: boolean;
  command: string | null;
  node: string | null;
  zipPresent: boolean;
  packagePresent: boolean;
  distDir: string | null;
  entry: string | null;
  missingReferences: Array<{ from: string; reference: string }>;
  issues: OpenClawRuntimeIssue[];
}
