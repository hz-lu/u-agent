import { contextBridge, ipcRenderer } from "electron";
import { AgentId, AgentLogLine, ChatRequest, HermesConfig } from "../shared/types.js";

const api = {
  listStatus: () => ipcRenderer.invoke("agent:list-status"),
  startAgent: (agent: AgentId) => ipcRenderer.invoke("agent:start", agent),
  stopAgent: (agent: AgentId) => ipcRenderer.invoke("agent:stop", agent),
  restartAgent: (agent: AgentId) => ipcRenderer.invoke("agent:restart", agent),
  readLogs: () => ipcRenderer.invoke("agent:logs"),
  readHermesConfig: () => ipcRenderer.invoke("hermes:read-config"),
  writeHermesConfig: (config: HermesConfig) => ipcRenderer.invoke("hermes:write-config", config),
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
