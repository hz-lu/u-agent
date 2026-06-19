import { contextBridge, ipcRenderer } from "electron";
import { AgentId, AgentLogLine, ChatRequest, ConnectorConfig, HermesConfig, SandboxConfig, ScheduleInput } from "../shared/types.js";

const api = {
  listStatus: () => ipcRenderer.invoke("agent:list-status"),
  startAgent: (agent: AgentId) => ipcRenderer.invoke("agent:start", agent),
  stopAgent: (agent: AgentId) => ipcRenderer.invoke("agent:stop", agent),
  restartAgent: (agent: AgentId) => ipcRenderer.invoke("agent:restart", agent),
  readLogs: () => ipcRenderer.invoke("agent:logs"),
  readHermesConfig: () => ipcRenderer.invoke("hermes:read-config"),
  writeHermesConfig: (config: HermesConfig) => ipcRenderer.invoke("hermes:write-config", config),
  testHermesConnector: (id: ConnectorConfig["id"]) => ipcRenderer.invoke("hermes:test-connector", id),
  testHermesSandbox: (id: SandboxConfig["id"]) => ipcRenderer.invoke("hermes:test-sandbox", id),
  addHermesSchedule: (input: ScheduleInput) => ipcRenderer.invoke("hermes:add-schedule", input),
  removeHermesSchedule: (id: string) => ipcRenderer.invoke("hermes:remove-schedule", id),
  exportHermesConfig: () => ipcRenderer.invoke("hermes:export-config"),
  importHermesConfig: (filePath: string) => ipcRenderer.invoke("hermes:import-config", filePath),
  pickHermesConfigFile: () => ipcRenderer.invoke("hermes:pick-config-file"),
  openHermes: (target: "config" | "dashboard" | "api") => ipcRenderer.invoke("hermes:open", target),
  startHermesDashboard: () => ipcRenderer.invoke("hermes:start-dashboard"),
  startHermesApi: () => ipcRenderer.invoke("hermes:start-api"),
  sendChat: (request: ChatRequest) => ipcRenderer.invoke("chat:send", request),
  onLog: (callback: (line: AgentLogLine) => void) => {
    const listener = (_: unknown, line: AgentLogLine) => callback(line);
    ipcRenderer.on("agent:log", listener);
    return () => ipcRenderer.removeListener("agent:log", listener);
  },
  onOpenUrl: (callback: (payload: { agent: AgentId; url: string; target: string }) => void) => {
    const listener = (_: unknown, payload: { agent: AgentId; url: string; target: string }) => callback(payload);
    ipcRenderer.on("agent:open-url", listener);
    return () => ipcRenderer.removeListener("agent:open-url", listener);
  }
};

contextBridge.exposeInMainWorld("agentHub", api);

export type AgentHubApi = typeof api;
