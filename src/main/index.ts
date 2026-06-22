import { app, BrowserWindow, OpenDialogOptions, dialog, ipcMain, shell } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AgentId, AgentLogLine, ChatMessage, ChatMode, ChatRequest, ChatSessions, ConnectorConfig, SandboxConfig, ScheduleInput } from "../shared/types.js";
import { PortablePaths } from "./portable-paths.js";
import { HermesRuntime } from "./runtime/hermes/hermes-runtime.js";
import { OpenClawRuntime } from "./runtime/openclaw-runtime.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === "development";

let mainWindow: BrowserWindow | null = null;
let paths: PortablePaths;
let hermes: HermesRuntime;
let openclaw: OpenClawRuntime;
let chatSessionsFile: string;
let chatMessagesDir: string;
const logs: AgentLogLine[] = [];
const chatModes: ChatMode[] = ["openclaw", "hermes", "collab"];
const defaultChatSessions: ChatSessions = { openclaw: [], hermes: [], collab: [] };
const chatMessageLimit = 80;
const inlineChatContentLimit = 24000;
const chatPreviewLimit = 2000;

function appendDesktopCrashLog(kind: string, payload: unknown): void {
  try {
    const root = paths?.dataRoot || path.join(process.cwd(), "data");
    const logDir = path.join(root, ".openclaw", "logs");
    fs.mkdirSync(logDir, { recursive: true });
    const text = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
    fs.appendFileSync(path.join(logDir, "desktop-crash.log"), `[${new Date().toISOString()}] ${kind}\n${text}\n\n`, "utf8");
  } catch {
  }
}

function installCrashDiagnostics(): void {
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

function pushLog(line: AgentLogLine): void {
  const message = line.message.length > 12000
    ? `${line.message.slice(0, 5000)}\n...[界面日志已精简，完整日志保存在 U 盘 data 目录]...\n${line.message.slice(-5000)}`
    : line.message;
  logs.push({ ...line, message });
  if (logs.length > 500) logs.shift();
  mainWindow?.webContents.send("agent:log", { ...line, message });
}

function createWindow(): void {
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
  } else {
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

function runtimeFor(agent: AgentId) {
  return agent === "hermes" ? hermes : openclaw;
}

function readChatSessions(): ChatSessions {
  try {
    if (!fs.existsSync(chatSessionsFile)) return defaultChatSessions;
    const parsed = JSON.parse(fs.readFileSync(chatSessionsFile, "utf8"));
    return normalizeChatSessions(parsed, { hydrateFiles: true });
  } catch {
    return defaultChatSessions;
  }
}

function writeChatSessions(input: Partial<Record<ChatMode, ChatMessage[]>> | null | undefined): ChatSessions {
  const sessions = normalizeChatSessions(input, { persistFiles: true });
  fs.mkdirSync(path.dirname(chatSessionsFile), { recursive: true });
  fs.writeFileSync(chatSessionsFile, `${JSON.stringify(sessions, null, 2)}\n`, "utf8");
  cleanUnusedChatMessageFiles(sessions);
  return readChatSessions();
}

function normalizeChatSessions(
  input: Partial<Record<ChatMode, ChatMessage[]>> | null | undefined,
  options: { persistFiles?: boolean; hydrateFiles?: boolean } = {}
): ChatSessions {
  const result: ChatSessions = { openclaw: [], hermes: [], collab: [] };
  for (const mode of chatModes) {
    const messages = Array.isArray(input?.[mode]) ? input[mode] || [] : [];
    result[mode] = messages
      .filter((message) => message?.role === "user" || message?.role === "assistant")
      .slice(-chatMessageLimit)
      .map((message, index) => normalizeChatMessage(mode, message, index, options));
  }
  return result;
}

function normalizeChatMessage(
  mode: ChatMode,
  message: ChatMessage,
  index: number,
  options: { persistFiles?: boolean; hydrateFiles?: boolean }
): ChatMessage {
  const id = safeChatMessageId(message.id || `${mode}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`);
  const hydratedContent = options.hydrateFiles && message.contentFile
    ? readChatMessageFile(message.contentFile, message.content)
    : message.content;
  const content = String(hydratedContent || "");
  const base: ChatMessage = {
    id,
    role: message.role,
    content,
    createdAt: message.createdAt || new Date().toISOString(),
    ...(message.speaker ? { speaker: String(message.speaker).slice(0, 80) } : {})
  };

  if (!options.persistFiles || content.length <= inlineChatContentLimit) {
    return {
      ...base,
      contentChars: content.length
    };
  }

  const contentFile = path.join("chat-messages", `${id}.md`);
  fs.mkdirSync(chatMessagesDir, { recursive: true });
  fs.writeFileSync(path.join(paths.dataRoot, ".agent-hub", contentFile), content, "utf8");
  return {
    ...base,
    content: `${content.slice(0, chatPreviewLimit)}\n\n[全文已保存到 U 盘 data/.agent-hub/${contentFile}]`,
    preview: content.slice(0, chatPreviewLimit),
    contentFile,
    contentChars: content.length
  };
}

function readChatMessageFile(contentFile: string, fallback: string): string {
  const hubRoot = path.resolve(path.join(paths.dataRoot, ".agent-hub"));
  const fullPath = path.resolve(hubRoot, contentFile);
  if (fullPath !== hubRoot && !fullPath.startsWith(`${hubRoot}${path.sep}`)) return fallback;
  try {
    return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8") : fallback;
  } catch {
    return fallback;
  }
}

function cleanUnusedChatMessageFiles(sessions: ChatSessions): void {
  if (!fs.existsSync(chatMessagesDir)) return;
  const used = new Set<string>();
  for (const mode of chatModes) {
    for (const message of sessions[mode]) {
      if (message.contentFile) used.add(path.basename(message.contentFile));
    }
  }
  for (const entry of fs.readdirSync(chatMessagesDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md") && !used.has(entry.name)) {
      fs.rmSync(path.join(chatMessagesDir, entry.name), { force: true });
    }
  }
}

function safeChatMessageId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120) || `message-${Date.now()}`;
}

function registerIpc(): void {
  ipcMain.handle("agent:list-status", async () => ({
    openclaw: await openclaw.getStatus(),
    hermes: await hermes.getStatus()
  }));
  ipcMain.handle("agent:start", async (_, agent: AgentId) => runtimeFor(agent).start());
  ipcMain.handle("agent:stop", async (_, agent: AgentId) => runtimeFor(agent).stop());
  ipcMain.handle("agent:restart", async (_, agent: AgentId) => runtimeFor(agent).restart());
  ipcMain.handle("agent:logs", async () => logs);
  ipcMain.handle("chat:read-sessions", async () => readChatSessions());
  ipcMain.handle("chat:write-sessions", async (_, sessions) => writeChatSessions(sessions));
  ipcMain.handle("openclaw:read-model-config", async () => openclaw.readModelConfig());
  ipcMain.handle("openclaw:write-model-config", async (_, config) => openclaw.writeModelConfig(config));
  ipcMain.handle("openclaw:gateway-status", async () => openclaw.getStatus());
  ipcMain.handle("hermes:read-config", async () => hermes.readConfig());
  ipcMain.handle("hermes:write-config", async (_, config) => hermes.writeConfig(config));
  ipcMain.handle("hermes:test-connector", async (_, id: ConnectorConfig["id"]) => hermes.testConnector(id));
  ipcMain.handle("hermes:test-sandbox", async (_, id: SandboxConfig["id"]) => hermes.testSandbox(id));
  ipcMain.handle("hermes:sync-skills", async () => hermes.syncAndVerifySkills({ silent: false }));
  ipcMain.handle("hermes:add-schedule", async (_, input: ScheduleInput) => hermes.addSchedule(input));
  ipcMain.handle("hermes:remove-schedule", async (_, id: string) => hermes.removeSchedule(id));
  ipcMain.handle("hermes:export-config", async () => hermes.exportConfig());
  ipcMain.handle("hermes:import-config", async (_, filePath: string) => hermes.importConfig(filePath));
  ipcMain.handle("hermes:pick-config-file", async () => {
    const options: OpenDialogOptions = {
      title: "选择 Hermes 配置 JSON",
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }]
    };
    const result = mainWindow ? await dialog.showOpenDialog(mainWindow, options) : await dialog.showOpenDialog(options);
    if (result.canceled || !result.filePaths[0]) return { ok: false, message: "未选择配置文件。" };
    return { ok: true, message: "已选择配置文件。", filePath: result.filePaths[0] };
  });
  ipcMain.handle("hermes:open", async (_, target: "config" | "dashboard" | "api") => hermes.open(target));
  ipcMain.handle("hermes:start-dashboard", async () => hermes.startDashboard(true));
  ipcMain.handle("hermes:start-api", async () => hermes.startApiServer(true));
  ipcMain.handle("chat:send", async (_, request: ChatRequest) => {
    if (request.agent === "hermes") return hermes.chat(request.message, request.messages || []);
    return openclaw.chat(request.message, request.messages || []);
  });
}

installCrashDiagnostics();

app.whenReady().then(() => {
  paths = new PortablePaths();
  paths.ensureBaseDirs();
  chatSessionsFile = path.join(paths.dataRoot, ".agent-hub", "chat-sessions.json");
  chatMessagesDir = path.join(paths.dataRoot, ".agent-hub", "chat-messages");
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
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
