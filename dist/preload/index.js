import { contextBridge, ipcRenderer } from "electron";
const api = {
    listStatus: () => ipcRenderer.invoke("agent:list-status"),
    startAgent: (agent) => ipcRenderer.invoke("agent:start", agent),
    stopAgent: (agent) => ipcRenderer.invoke("agent:stop", agent),
    restartAgent: (agent) => ipcRenderer.invoke("agent:restart", agent),
    readLogs: () => ipcRenderer.invoke("agent:logs"),
    readHermesConfig: () => ipcRenderer.invoke("hermes:read-config"),
    writeHermesConfig: (config) => ipcRenderer.invoke("hermes:write-config", config),
    openHermes: (target) => ipcRenderer.invoke("hermes:open", target),
    startHermesDashboard: () => ipcRenderer.invoke("hermes:start-dashboard"),
    startHermesApi: () => ipcRenderer.invoke("hermes:start-api"),
    sendChat: (request) => ipcRenderer.invoke("chat:send", request),
    onLog: (callback) => {
        const listener = (_, line) => callback(line);
        ipcRenderer.on("agent:log", listener);
        return () => ipcRenderer.removeListener("agent:log", listener);
    },
    onOpenUrl: (callback) => {
        const listener = (_, payload) => callback(payload);
        ipcRenderer.on("agent:open-url", listener);
        return () => ipcRenderer.removeListener("agent:open-url", listener);
    }
};
contextBridge.exposeInMainWorld("agentHub", api);
