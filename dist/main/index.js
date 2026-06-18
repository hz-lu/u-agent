import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PortablePaths } from "./portable-paths.js";
import { HermesRuntime } from "./runtime/hermes/hermes-runtime.js";
import { OpenClawRuntime } from "./runtime/openclaw-runtime.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === "development";
let mainWindow = null;
let paths;
let hermes;
let openclaw;
const logs = [];
function pushLog(line) {
    logs.push(line);
    if (logs.length > 500)
        logs.shift();
    mainWindow?.webContents.send("agent:log", line);
}
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1320,
        height: 860,
        minWidth: 1120,
        minHeight: 720,
        backgroundColor: "#0f172a",
        title: "OpenClawPro Agent Hub",
        webPreferences: {
            preload: path.join(__dirname, "..", "preload", "index.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });
    mainWindow.setMenuBarVisibility(false);
    if (isDev) {
        mainWindow.loadURL("http://127.0.0.1:5173");
    }
    else {
        mainWindow.loadFile(path.join(__dirname, "..", "assets", "index.html"));
    }
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith("http://127.0.0.1:")) {
            mainWindow?.webContents.send("agent:open-url", { agent: "hermes", url, target: "embedded" });
            return { action: "deny" };
        }
        shell.openExternal(url);
        return { action: "deny" };
    });
}
function runtimeFor(agent) {
    return agent === "hermes" ? hermes : openclaw;
}
function registerIpc() {
    ipcMain.handle("agent:list-status", async () => ({
        openclaw: await openclaw.getStatus(),
        hermes: await hermes.getStatus()
    }));
    ipcMain.handle("agent:start", async (_, agent) => runtimeFor(agent).start());
    ipcMain.handle("agent:stop", async (_, agent) => runtimeFor(agent).stop());
    ipcMain.handle("agent:restart", async (_, agent) => runtimeFor(agent).restart());
    ipcMain.handle("agent:logs", async () => logs);
    ipcMain.handle("hermes:read-config", async () => hermes.readConfig());
    ipcMain.handle("hermes:write-config", async (_, config) => hermes.writeConfig(config));
    ipcMain.handle("hermes:test-connector", async (_, id) => hermes.testConnector(id));
    ipcMain.handle("hermes:test-sandbox", async (_, id) => hermes.testSandbox(id));
    ipcMain.handle("hermes:add-schedule", async (_, input) => hermes.addSchedule(input));
    ipcMain.handle("hermes:remove-schedule", async (_, id) => hermes.removeSchedule(id));
    ipcMain.handle("hermes:export-config", async () => hermes.exportConfig());
    ipcMain.handle("hermes:import-config", async (_, filePath) => hermes.importConfig(filePath));
    ipcMain.handle("hermes:open", async (_, target) => hermes.open(target));
    ipcMain.handle("hermes:start-dashboard", async () => hermes.startDashboard(true));
    ipcMain.handle("hermes:start-api", async () => hermes.startApiServer(true));
    ipcMain.handle("chat:send", async (_, request) => {
        if (request.agent === "hermes")
            return hermes.chat(request.message, request.messages || []);
        return openclaw.chat(request.message);
    });
}
app.whenReady().then(() => {
    paths = new PortablePaths();
    paths.ensureBaseDirs();
    hermes = new HermesRuntime(paths, () => mainWindow);
    openclaw = new OpenClawRuntime(paths);
    hermes.onLog(pushLog);
    openclaw.onLog(pushLog);
    registerIpc();
    createWindow();
});
app.on("before-quit", () => {
    hermes?.stop();
    openclaw?.stop();
});
app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        app.quit();
});
app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0)
        createWindow();
});
