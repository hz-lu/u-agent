import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PortablePaths } from "./portable-paths.js";
import { HermesRuntime } from "./runtime/hermes/hermes-runtime.js";
import { OpenClawRuntime } from "./runtime/openclaw-runtime.js";
import { JsonStore } from "./services/json-store.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === "development";
let mainWindow = null;
let paths;
let hermes;
let openclaw;
let chatStore;
const logs = [];
const chatModes = ["openclaw", "hermes", "collab"];
const defaultChatSessions = { openclaw: [], hermes: [], collab: [] };
function appendDesktopCrashLog(kind, payload) {
    try {
        const root = paths?.dataRoot || path.join(process.cwd(), "data");
        const logDir = path.join(root, ".openclaw", "logs");
        fs.mkdirSync(logDir, { recursive: true });
        const text = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
        fs.appendFileSync(path.join(logDir, "desktop-crash.log"), `[${new Date().toISOString()}] ${kind}\n${text}\n\n`, "utf8");
    }
    catch {
    }
}
function installCrashDiagnostics() {
    process.on("uncaughtException", (error) => {
        appendDesktopCrashLog("uncaughtException", { message: error.message, stack: error.stack || "" });
    });
    process.on("unhandledRejection", (reason) => {
        const error = reason instanceof Error ? { message: reason.message, stack: reason.stack || "" } : { reason: String(reason) };
        appendDesktopCrashLog("unhandledRejection", error);
    });
    app.on("render-process-gone", (_event, webContents, details) => {
        appendDesktopCrashLog("render-process-gone", { url: webContents.getURL(), details });
    });
    app.on("child-process-gone", (_event, details) => {
        appendDesktopCrashLog("child-process-gone", details);
    });
}
function pushLog(line) {
    const message = line.message.length > 12000
        ? `${line.message.slice(0, 5000)}\n...[界面日志已精简，完整日志保存在 U 盘 data 目录]...\n${line.message.slice(-5000)}`
        : line.message;
    logs.push({ ...line, message });
    if (logs.length > 500)
        logs.shift();
    mainWindow?.webContents.send("agent:log", { ...line, message });
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
function normalizeChatSessions(input) {
    const result = { openclaw: [], hermes: [], collab: [] };
    for (const mode of chatModes) {
        const messages = Array.isArray(input?.[mode]) ? input[mode] || [] : [];
        result[mode] = messages
            .filter((message) => message?.role === "user" || message?.role === "assistant")
            .map((message) => ({
            role: message.role,
            content: String(message.content || "").slice(0, 24000),
            ...(message.speaker ? { speaker: String(message.speaker).slice(0, 80) } : {})
        }))
            .slice(-80);
    }
    return result;
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
    ipcMain.handle("chat:read-sessions", async () => normalizeChatSessions(chatStore.read()));
    ipcMain.handle("chat:write-sessions", async (_, sessions) => chatStore.write(normalizeChatSessions(sessions)));
    ipcMain.handle("openclaw:read-model-config", async () => openclaw.readModelConfig());
    ipcMain.handle("openclaw:write-model-config", async (_, config) => openclaw.writeModelConfig(config));
    ipcMain.handle("openclaw:gateway-status", async () => openclaw.getStatus());
    ipcMain.handle("hermes:read-config", async () => hermes.readConfig());
    ipcMain.handle("hermes:write-config", async (_, config) => hermes.writeConfig(config));
    ipcMain.handle("hermes:test-connector", async (_, id) => hermes.testConnector(id));
    ipcMain.handle("hermes:test-sandbox", async (_, id) => hermes.testSandbox(id));
    ipcMain.handle("hermes:sync-skills", async () => hermes.syncAndVerifySkills({ silent: false }));
    ipcMain.handle("hermes:add-schedule", async (_, input) => hermes.addSchedule(input));
    ipcMain.handle("hermes:remove-schedule", async (_, id) => hermes.removeSchedule(id));
    ipcMain.handle("hermes:export-config", async () => hermes.exportConfig());
    ipcMain.handle("hermes:import-config", async (_, filePath) => hermes.importConfig(filePath));
    ipcMain.handle("hermes:pick-config-file", async () => {
        const options = {
            title: "选择 Hermes 配置 JSON",
            properties: ["openFile"],
            filters: [{ name: "JSON", extensions: ["json"] }]
        };
        const result = mainWindow ? await dialog.showOpenDialog(mainWindow, options) : await dialog.showOpenDialog(options);
        if (result.canceled || !result.filePaths[0])
            return { ok: false, message: "未选择配置文件。" };
        return { ok: true, message: "已选择配置文件。", filePath: result.filePaths[0] };
    });
    ipcMain.handle("hermes:open", async (_, target) => hermes.open(target));
    ipcMain.handle("hermes:start-dashboard", async () => hermes.startDashboard(true));
    ipcMain.handle("hermes:start-api", async () => hermes.startApiServer(true));
    ipcMain.handle("chat:send", async (_, request) => {
        if (request.agent === "hermes")
            return hermes.chat(request.message, request.messages || []);
        return openclaw.chat(request.message);
    });
}
installCrashDiagnostics();
app.whenReady().then(() => {
    paths = new PortablePaths();
    paths.ensureBaseDirs();
    chatStore = new JsonStore(path.join(paths.dataRoot, ".agent-hub", "chat-sessions.json"), defaultChatSessions);
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
