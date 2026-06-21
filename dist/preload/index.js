import { contextBridge, ipcRenderer } from "electron";
const api = {
    listStatus: () => ipcRenderer.invoke("agent:list-status"),
    startAgent: (agent) => ipcRenderer.invoke("agent:start", agent),
    stopAgent: (agent) => ipcRenderer.invoke("agent:stop", agent),
    restartAgent: (agent) => ipcRenderer.invoke("agent:restart", agent),
    readLogs: () => ipcRenderer.invoke("agent:logs"),
    readHermesConfig: () => ipcRenderer.invoke("hermes:read-config"),
    writeHermesConfig: (config) => ipcRenderer.invoke("hermes:write-config", config),
    testHermesConnector: (id) => ipcRenderer.invoke("hermes:test-connector", id),
    testHermesSandbox: (id) => ipcRenderer.invoke("hermes:test-sandbox", id),
    syncHermesSkills: () => ipcRenderer.invoke("hermes:sync-skills"),
    addHermesSchedule: (input) => ipcRenderer.invoke("hermes:add-schedule", input),
    removeHermesSchedule: (id) => ipcRenderer.invoke("hermes:remove-schedule", id),
    exportHermesConfig: () => ipcRenderer.invoke("hermes:export-config"),
    importHermesConfig: (filePath) => ipcRenderer.invoke("hermes:import-config", filePath),
    pickHermesConfigFile: () => ipcRenderer.invoke("hermes:pick-config-file"),
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
