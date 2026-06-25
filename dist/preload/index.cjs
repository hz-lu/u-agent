"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("uclaw", {
  // 鏂囦欢璺緞鑾峰彇锛圗lectron 娌欑洅妯″紡涓?file.path 涓嶅彲鐢級
  getFilePath: (file) => {
    try {
      return electron.webUtils.getPathForFile(file);
    } catch {
      return null;
    }
  },
  ipcSend: (channel, ...args) => electron.ipcRenderer.send(channel, ...args),
  // 鑷畾涔夌獥鍙ｆ帶鍒?  ipcMinimize: () => electron.ipcRenderer.send("window-minimize"),
  ipcClose: () => electron.ipcRenderer.send("window-close"),
  ipcOpenDashboard: () => electron.ipcRenderer.invoke("open-dashboard"),
  ipcOpenChatWindow: () => electron.ipcRenderer.invoke("open-chat-window"),
  ipcOpenExternalUrl: (url) => electron.ipcRenderer.invoke("open-external-url", url),
  ipcActivationSuccess: () => electron.ipcRenderer.invoke("activation-success"),
  ipcWriteOpenClawConfig: ({ models }, type) => electron.ipcRenderer.invoke("write-openclaw-config", { models }, type),
  ipcWriteLicenseFile: (serial, activationCode, license) => electron.ipcRenderer.invoke("write-license-file", { serial, activationCode, license }),
  // Gateway control
  ipcStartGateway: () => electron.ipcRenderer.invoke("start-gateway"),
  ipcStopGateway: () => electron.ipcRenderer.invoke("stop-gateway"),
  ipcRestartGateway: () => electron.ipcRenderer.invoke("restart-gateway"),
  ipcGetGatewayStatus: () => electron.ipcRenderer.invoke("gateway-status-read"),
  // Gateway boot phase listener
  onGatewayBootPhase: (callback) => electron.ipcRenderer.on("gateway-boot-phase", (_, data) => callback(data)),
  offGatewayBootPhase: (callback) => electron.ipcRenderer.removeListener("gateway-boot-phase", callback),
  // Gateway status listener
  onGatewayStatus: (callback) => electron.ipcRenderer.on("gateway-status", (_, data) => callback(data)),
  offGatewayStatus: (callback) => electron.ipcRenderer.removeListener("gateway-status", callback),
  // Gateway ready listener (WebSocket 鐪熸灏辩华)
  onGatewayReady: (callback) => electron.ipcRenderer.on("gateway-ready", (_, data) => callback(data)),
  offGatewayReady: (callback) => electron.ipcRenderer.removeListener("gateway-ready", callback),
  onGatewayRestarted: (callback) => electron.ipcRenderer.on("gateway-restarted", (_, data) => callback(data)),
  offGatewayRestarted: (callback) => electron.ipcRenderer.removeListener("gateway-restarted", callback),
  // Gateway log listener
  ipcOnGatewayLog: (callback) => electron.ipcRenderer.on("gateway-log", (_, log) => callback(log)),
  // 鎵爜鏈湴skill
  ipcScanLocalSkills: () => electron.ipcRenderer.invoke("scan-local-skills"),
  // 鍚敤/绂佺敤 skill
  ipcToggleSkill: (skillName, enabled) => electron.ipcRenderer.invoke("toggle-skill", { skillName, enabled }),
  ipcSyncHermesSkills: () => electron.ipcRenderer.invoke("sync-hermes-skills"),
  ipcGetHermesLogs: (options) => electron.ipcRenderer.invoke("hermes:getLogs", options),
  ipcGetWeChatDiagnostics: () => electron.ipcRenderer.invoke("wechat:diagnostics"),
  // WeChat plugin
  ipcGetWeChatStatus: () => electron.ipcRenderer.invoke("get-wechat-status"),
  // Start WeChat scan (check gateway then get QR code)
  startWeChatScan: () => electron.ipcRenderer.invoke("wechat-start-login"),
  // WeChat QR code URL listener
  ipcOnWeChatQrUrl: (callback) => electron.ipcRenderer.on("wechat-qr-url", (_, url) => callback(url)),
  ipcOnWeChatQrText: (callback) => electron.ipcRenderer.on("wechat-qr-text", (_, text) => callback(text)),
  // WeChat scan result listener 
  // WeChat status listener
  ipcOnWeChatStatus: (callback) => electron.ipcRenderer.on("wechat-status", (_, status) => callback(status)),
  ipcOffWeChatStatus: (callback) => electron.ipcRenderer.removeListener("wechat-status", callback),
  // Cancel WeChat scan
  cancelWeChatScan: () => electron.ipcRenderer.invoke("openclaw-wechat-cancel"),
  // Check if WeChat plugin is installed
  isWechatPluginInstalled: () => electron.ipcRenderer.invoke("is-wechat-plugin-installed"),
  // Update WeChat plugin (force online install)
  updateWeChatPlugin: () => electron.ipcRenderer.invoke("update-wechat-plugin"),
  // Uninstall and reinstall WeChat plugin
  uninstallAndReinstallWeChat: () => electron.ipcRenderer.invoke("uninstall-reinstall-wechat"),
  wechatInstall: () => electron.ipcRenderer.invoke("wechat-install"),
  wechatUninstall: () => electron.ipcRenderer.invoke("wechat-uninstall"),
  ipcOnWechatLog: (callback) => electron.ipcRenderer.on("wechat-log", (_, msg) => callback(msg)),
  ipcOffWechatLog: (callback) => electron.ipcRenderer.removeListener("wechat-log", callback),
  // 椋炰功锛圠ark锛夋彃浠?  feishuGetStatus: () => electron.ipcRenderer.invoke("feishu-get-status"),
  feishuIsInstalled: () => electron.ipcRenderer.invoke("feishu-is-installed"),
  feishuInstall: (opts) => electron.ipcRenderer.invoke("feishu-install", opts),
  feishuUpdate: () => electron.ipcRenderer.invoke("feishu-update"),
  feishuUninstall: () => electron.ipcRenderer.invoke("feishu-uninstall"),
  feishuInstallWithApp: (appId, appSecret) => electron.ipcRenderer.invoke("feishu-install-with-app", appId, appSecret),
  feishuCancelInstall: () => electron.ipcRenderer.invoke("feishu-cancel-install"),
  feishuAnswerPrompt: (answer) => electron.ipcRenderer.invoke("feishu-answer-prompt", answer),
  ipcOnFeishuStatus: (callback) => {
    electron.ipcRenderer.on("feishu-status", (_, status) => callback(status));
    return () => electron.ipcRenderer.removeAllListeners("feishu-status");
  },
  ipcOnFeishuQrUrl: (callback) => {
    electron.ipcRenderer.on("feishu-qr-url", (_, url) => callback(url));
    return () => electron.ipcRenderer.removeAllListeners("feishu-qr-url");
  },
  ipcOnFeishuQrAscii: (callback) => {
    electron.ipcRenderer.on("feishu-qr-ascii", (_, text) => callback(text));
    return () => electron.ipcRenderer.removeAllListeners("feishu-qr-ascii");
  },
  ipcOnFeishuLog: (callback) => {
    electron.ipcRenderer.on("feishu-log", (_, msg) => callback(msg));
    return () => electron.ipcRenderer.removeAllListeners("feishu-log");
  },
  ipcOnFeishuDone: (callback) => {
    electron.ipcRenderer.on("feishu-done", (_, result) => callback(result));
    return () => electron.ipcRenderer.removeAllListeners("feishu-done");
  },
  ipcOnFeishuPrompt: (callback) => {
    electron.ipcRenderer.on("feishu-prompt", (_, data) => callback(data));
    return () => electron.ipcRenderer.removeAllListeners("feishu-prompt");
  },
  // Desktop error dialog
  ipcShowErrorDialog: (title, message) => electron.ipcRenderer.invoke("show-error-dialog", { title, message }),
  // Desktop confirm dialog
  ipcShowConfirmDialog: (title, message) => electron.ipcRenderer.invoke("show-confirm-dialog", { title, message }),
  // Select download directory
  ipcSelectDownloadDir: (opts) => electron.ipcRenderer.invoke("select-download-dir", opts),
  // Save file to disk
  ipcSaveFile: ({ filepath, buffer }) => electron.ipcRenderer.invoke("save-file", { filepath, buffer }),
  // Download image (to avoid CORS)
  ipcDownloadImage: ({ url }) => electron.ipcRenderer.invoke("download-image", { url }),
  ipcCheckStepSerial: () => electron.ipcRenderer.invoke("check-step-serial"),
  ipcCheckStepLicense: (serial) => electron.ipcRenderer.invoke("check-step-license", serial),
  // Step 3.5: 鐧诲綍鎺ュ彛鏍￠獙
  ipcCheckStepLogin: ({ serial, activation_code }) => electron.ipcRenderer.invoke("check-step-login", { serial, activation_code }),
  // 鑾峰彇鍐呭瓨涓殑 session_cookie
  ipcGetSessionCookie: () => electron.ipcRenderer.invoke("store-get", "session_cookie"),
  // 璁剧疆 HTTP Cookie 鍒?Electron cookie 瀛樺偍
  ipcSetSessionCookie: (value) => electron.ipcRenderer.invoke("set-session-cookie", value),
  ipcSetRuntimeStore: ({ key, value }) => electron.ipcRenderer.invoke("store-set", { key, value }),
  ipcGetRuntimeStore: (key) => electron.ipcRenderer.invoke("store-get", key),
  // data dir
  ipcGetDataDir: () => electron.ipcRenderer.invoke("get-data-dir"),
  ipcReadConfig: () => electron.ipcRenderer.invoke("read-config"),
  // WebSocket 鑱婂ぉ锛歝onnect frame + 鑷姩閰嶅锛堜笌 app/ 鐩綍淇濇寔涓€鑷达級
  createConnectFrame: (nonce, token, password) => electron.ipcRenderer.invoke("create-connect-frame", nonce, token, password),
  autoPairDevice: () => electron.ipcRenderer.invoke("auto-pair-device"),
  reloadGateway: () => electron.ipcRenderer.invoke("reload-gateway"),
  gatewayChatSend: (payload) => electron.ipcRenderer.invoke("gateway-chat-send", payload),
  // default port
  ipcGetDefaultPort: () => electron.ipcRenderer.invoke("get-default-port"),
  // restart app
  ipcRestartApp: () => electron.ipcRenderer.invoke("restart-app"),
  // Environment check
  ipcGetNodeVersion: () => electron.ipcRenderer.invoke("get-node-version"),
  ipcGetNpmVersion: () => electron.ipcRenderer.invoke("get-npm-version"),
  ipcGetOpenClawVersion: () => electron.ipcRenderer.invoke("get-openclaw-version"),
  ipcCheckPort: (port) => {
    if (typeof port !== "number" || !Number.isInteger(port) || port < 1 || port > 65535) {
      return Promise.reject(new Error("Invalid port"));
    }
    return electron.ipcRenderer.invoke("check-port", port);
  },
  // Image sessions
  ipcSaveImageSessions: (sessions, currentSessionId) => electron.ipcRenderer.invoke("save-image-sessions", { sessions, currentSessionId }),
  ipcLoadImageSessions: () => electron.ipcRenderer.invoke("load-image-sessions"),
  // Video sessions
  ipcSaveVideoSessions: (sessions, currentSessionId) => electron.ipcRenderer.invoke("save-video-sessions", { sessions, currentSessionId }),
  ipcLoadVideoSessions: () => electron.ipcRenderer.invoke("load-video-sessions"),
  // Image generation
  generateImage: (params) => electron.ipcRenderer.invoke("generate-image", params),
  // Save image to local media directory
  ipcSaveMediaImage: ({ url, taskId }) => electron.ipcRenderer.invoke("save-media-image", { url, taskId }),
  // Save video to local media directory
  ipcSaveMediaVideo: ({ url, taskId }) => electron.ipcRenderer.invoke("save-media-video", { url, taskId }),
  // Copy local file (from file:// URL) to destination path
  ipcCopyLocalFile: ({ sourceUrl, destPath }) => electron.ipcRenderer.invoke("copy-local-file", { sourceUrl, destPath }),
  // Chat history 鏂囦欢鎸佷箙鍖栵紙瀵归綈 app/ 鐩綍鍐欐硶锛?  saveChatMessage: (sessionKey, message) => electron.ipcRenderer.invoke("save-chat-message", sessionKey, message),
  saveChatMessagesBulk: (sessionKey, messages) => electron.ipcRenderer.invoke("save-chat-messages-bulk", sessionKey, messages),
  loadChatMessages: (sessionKey, limit) => electron.ipcRenderer.invoke("load-chat-messages", sessionKey, limit),
  clearChatMessages: (sessionKey) => electron.ipcRenderer.invoke("clear-chat-messages", sessionKey),
  loadChatProfile: () => electron.ipcRenderer.invoke("load-chat-profile"),
  saveChatProfile: (profile) => electron.ipcRenderer.invoke("save-chat-profile", profile),
  // 鐢ㄦ埛鐘舵€佹寔涔呭寲锛堝榻?app/ 鐩綍锛?  saveUserState: (key, value) => electron.ipcRenderer.invoke("save-user-state", key, value),
  loadUserState: (key) => electron.ipcRenderer.invoke("load-user-state", key),
  deleteUserState: (key) => electron.ipcRenderer.invoke("delete-user-state", key),
  getDataDir: () => electron.ipcRenderer.invoke("get-data-dir"),
  // 閫氱敤濯掍綋鏂囦欢鎿嶄綔锛堝榻?app/ 鐩綍锛?  saveMediaFile: (fileName, base64Data, subDir) => electron.ipcRenderer.invoke("save-media-file", fileName, base64Data, subDir),
  getMediaPath: (fileName, subDir) => electron.ipcRenderer.invoke("get-media-path", fileName, subDir),
  openMediaDir: (subDir) => electron.ipcRenderer.invoke("open-media-dir", subDir),
  // 鍘嗗彶浣滃搧 message.json 璇诲啓
  ipcLoadMessageJson: () => electron.ipcRenderer.invoke("load-message-json"),
  ipcSaveMessageJson: (messages) => electron.ipcRenderer.invoke("save-message-json", { messages }),
  ipcOpenMediaFolder: () => electron.ipcRenderer.invoke("open-media-folder"),
  ipcGetMediaFileCount: () => electron.ipcRenderer.invoke("get-media-file-count"),
  ipcOpenMediaImageFolder: () => electron.ipcRenderer.invoke("open-media-image-folder"),
  ipcOpenMediaVideoFolder: () => electron.ipcRenderer.invoke("open-media-video-folder"),
  ipcStartHermes: (options) => electron.ipcRenderer.invoke("hermes:start", options),
  ipcStopHermes: () => electron.ipcRenderer.invoke("hermes:stop"),
  ipcGetHermesStatus: () => electron.ipcRenderer.invoke("hermes:getStatus"),
  ipcStartHermesDashboard: (options) => electron.ipcRenderer.invoke("hermes:startDashboard", options),
  ipcStartHermesApiServer: (options) => electron.ipcRenderer.invoke("hermes:startApiServer", options),
  ipcOpenHermesConfig: () => electron.ipcRenderer.invoke("hermes:openConfig"),
  ipcOpenHermesDashboard: () => electron.ipcRenderer.invoke("hermes:openDashboard"),
  ipcOpenHermesApiServer: () => electron.ipcRenderer.invoke("hermes:openApiServer"),
  ipcHermesChat: (options) => electron.ipcRenderer.invoke("hermes:chat", options),
  ipcOpenHermesInternal: (url) => electron.ipcRenderer.invoke("hermes:openInternal", url),
  ipcOpenHermesEmbedded: (url) => electron.ipcRenderer.invoke("hermes:openEmbedded", url),
  ipcGetHermesFrameUrl: (url) => electron.ipcRenderer.invoke("hermes:getFrameUrl", url),
  ipcOnHermesEmbeddedOpen: (callback) => electron.ipcRenderer.on("hermes-open-embedded", (_, payload) => callback(payload)),
  ipcOffHermesEmbeddedOpen: (callback) => electron.ipcRenderer.removeListener("hermes-open-embedded", callback),
  ipcOnHermesStatus: (callback) => electron.ipcRenderer.on("hermes-status", (_, status) => callback(status)),
  ipcOffHermesStatus: (callback) => electron.ipcRenderer.removeListener("hermes-status", callback),
  ipcOnHermesChatProgress: (callback) => electron.ipcRenderer.on("hermes-chat-progress", (_, payload) => callback(payload)),
  ipcOffHermesChatProgress: (callback) => electron.ipcRenderer.removeListener("hermes-chat-progress", callback),
  ipcOnHermesChatResult: (callback) => electron.ipcRenderer.on("hermes-chat-result", (_, payload) => callback(payload)),
  ipcOffHermesChatResult: (callback) => electron.ipcRenderer.removeListener("hermes-chat-result", callback),
  ipcOnHermesLog: (callback) => electron.ipcRenderer.on("hermes-log", (_, log) => callback(log)),
  ipcOffHermesLog: (callback) => electron.ipcRenderer.removeListener("hermes-log", callback)
});
