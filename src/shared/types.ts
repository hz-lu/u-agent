export type AgentId = "openclaw" | "hermes";

export type RuntimeState = "missing" | "idle" | "starting" | "running" | "stopping" | "error";

export interface AgentLogLine {
  agent: AgentId;
  level: "system" | "stdout" | "stderr" | "error";
  message: string;
  at: string;
}

export interface AgentStatus {
  id: AgentId;
  state: RuntimeState;
  ready: boolean;
  pid: number | null;
  runtimeRoot: string;
  dataRoot: string;
  portableRoot: string;
  ports: Record<string, number>;
  urls: Record<string, string>;
  lastError?: string;
  startedAt?: string;
  diagnostics: string[];
  capabilities: Record<string, boolean>;
}

export interface ModelConfig {
  provider: string;
  model: string;
  baseUrl: string;
  apiKey: string;
}

export interface ConnectorConfig {
  id: "telegram" | "discord" | "slack" | "whatsapp" | "signal" | "email" | "cli";
  label: string;
  enabled: boolean;
  fields: Record<string, string>;
  status: "not-configured" | "configured" | "running" | "error";
}

export interface ScheduleConfig {
  id: string;
  title: string;
  naturalLanguage: string;
  cron: string;
  enabled: boolean;
  lastRun?: string;
}

export interface SandboxConfig {
  id: "local" | "docker" | "ssh" | "singularity" | "modal";
  enabled: boolean;
  fields: Record<string, string>;
}

export interface HermesConfig {
  model: ModelConfig;
  connectors: ConnectorConfig[];
  schedules: ScheduleConfig[];
  sandboxes: SandboxConfig[];
  memoryEnabled: boolean;
  autoSkillEnabled: boolean;
}

export interface ChatRequest {
  agent: AgentId;
  message: string;
  messages?: Array<{ role: "system" | "user" | "assistant"; content: string }>;
}

export interface ChatResponse {
  ok: boolean;
  reply?: string;
  error?: string;
}

export interface ActionResult {
  ok: boolean;
  message: string;
  path?: string;
}

export interface ConfigImportResult extends ActionResult {
  config?: HermesConfig;
}

export interface ScheduleInput {
  title: string;
  naturalLanguage: string;
  cron?: string;
  enabled?: boolean;
}
