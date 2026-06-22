export type AgentId = "openclaw" | "hermes";

export type ChatMode = AgentId | "collab";

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  speaker?: string;
  createdAt?: string;
  contentFile?: string;
  preview?: string;
  contentChars?: number;
}

export type ChatSessions = Record<ChatMode, ChatMessage[]>;

export type RuntimeState = "missing" | "idle" | "starting" | "running" | "stopping" | "error";

export interface AgentLogLine {
  agent: AgentId;
  level: "system" | "stdout" | "stderr" | "error" | "warn";
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
  hermesSkills?: HermesSkillReport;
  hermesMemory?: HermesMemoryReport;
  hermesSkillGrowth?: HermesSkillGrowthReport;
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
  runId?: string;
  runDir?: string;
}

export interface ActionResult {
  ok: boolean;
  message: string;
  path?: string;
  details?: string[];
}

export interface HermesSkillReport {
  ok: boolean;
  checkedAt: string;
  sourceCount: number;
  copied?: number;
  mirroredCount: number;
  visibleCount: number;
  commandCount: number;
  invocationCommand?: string;
  invocationLoaded?: boolean;
  invocationStatus?: "not-run" | "passed" | "failed";
  usageTracked: boolean;
  mirrorRoot: string;
  path?: string;
  reportPath: string;
  sampleCommands: string[];
  missingNames: string[];
  unchanged?: boolean;
  error?: string;
}

export interface HermesMemoryReport {
  ok: boolean;
  checkedAt: string;
  memoryEnabled: boolean;
  userProfileEnabled: boolean;
  memoryDir: string;
  memoryFile: string;
  userFile: string;
  configPath: string;
  reportPath: string;
  memoryEntryCount: number;
  userEntryCount: number;
  memoryFileExists: boolean;
  userFileExists: boolean;
  memoryWritable: boolean;
  userWritable: boolean;
  memorySnapshotReady: boolean;
  userSnapshotReady: boolean;
  testEntryRemoved: boolean;
  error?: string;
}

export interface HermesSkillGrowthReport {
  ok: boolean;
  checkedAt: string;
  skillName?: string;
  hermesSkillDir?: string;
  openClawSkillDir?: string;
  officialCreated?: boolean;
  officialVisible?: boolean;
  officialAgentCreated?: boolean;
  openClawSynced?: boolean;
  cleanupDeleted?: boolean;
  cleanupStillVisible?: boolean;
  reportPath: string;
  error?: string;
}

export interface ConfigImportResult extends ActionResult {
  config?: HermesConfig;
}

export interface FilePickResult extends ActionResult {
  filePath?: string;
}

export interface ScheduleInput {
  title: string;
  naturalLanguage: string;
  cron?: string;
  enabled?: boolean;
}
