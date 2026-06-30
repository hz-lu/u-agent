"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
const electron = require("electron");
const child_process = require("child_process");
const fs$1 = require("fs");
const path$1 = require("path");
const crypto$1 = require("crypto");
const EventEmitter = require("events");
const require$$3 = require("http");
const os = require("os");
const net = require("net");
const require$$1 = require("util");
const stream = require("stream");
const require$$4 = require("https");
const require$$5 = require("url");
const http2 = require("http2");
const require$$4$1 = require("assert");
const require$$1$1 = require("tty");
const zlib = require("zlib");
const LICENSE_SALT = "uclaw-license-v1";
const LICENSE_ITERATIONS = 1e5;
const LICENSE_KEYLEN = 32;
const LICENSE_DIGEST = "sha256";
const LICENSE_SIGN_VERSION = 2;
const LICENSE_SIGN_ALG = "ed25519";
const LICENSE_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA29uQxiQyam4tRMJfeul/MEZX8NOYVp6AM35bYGavo8I=
-----END PUBLIC KEY-----`;
function aesGcmEncrypt(data, key) {
  const iv = crypto$1.randomBytes(12);
  const cipher = crypto$1.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64")
  };
}
function aesGcmDecrypt(encrypted, key) {
  const iv = Buffer.from(encrypted.iv, "base64");
  const tag = Buffer.from(encrypted.tag, "base64");
  const data = Buffer.from(encrypted.data, "base64");
  const decipher = crypto$1.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}
function deriveKeyFromSerial(serial2) {
  return crypto$1.pbkdf2Sync(serial2, LICENSE_SALT, LICENSE_ITERATIONS, LICENSE_KEYLEN, LICENSE_DIGEST);
}
const CHANNEL_ID = "openclaw-weixin";
const PLUGIN_SPEC$1 = "@tencent-weixin/openclaw-weixin";
class WechatManager extends EventEmitter {
  constructor({ runtimeDir, dataDir, isDev, usbRuntime }) {
    super();
    this.runtimeDir = runtimeDir;
    this.usbRuntime = usbRuntime || "";
    this.dataDir = dataDir;
    this.isDev = isDev;
    this.loginProcess = null;
    this.status = "disconnected";
  }
  _getEnv() {
    const nodeBinDir = process.platform === "win32" || !this.usbRuntime ? "" : path$1.join(this.usbRuntime, "node", "bin");
    const paths = [this.runtimeDir, nodeBinDir, this.usbRuntime].filter(Boolean);
    return {
      ...process.env,
      OPENCLAW_HOME: this.dataDir,
      OPENCLAW_STATE_DIR: path$1.join(this.dataDir, ".openclaw"),
      OPENCLAW_CONFIG: path$1.join(this.dataDir, ".openclaw", "openclaw.json"),
      OPENCLAW_CONFIG_PATH: path$1.join(this.dataDir, ".openclaw", "openclaw.json"),
      PATH: `${paths.join(path$1.delimiter)}${path$1.delimiter}${process.env.PATH}`
    };
  }
  _getCliBin() {
    if (this.isDev) return "openclaw";
    const cmd1 = path$1.join(this.runtimeDir, process.platform === "win32" ? "openclaw.cmd" : "openclaw");
    if (fs$1.existsSync(cmd1)) return cmd1;
    if (this.usbRuntime) {
      const cmd2 = path$1.join(this.usbRuntime, process.platform === "win32" ? "openclaw.cmd" : "openclaw");
      if (fs$1.existsSync(cmd2)) return cmd2;
    }
    return cmd1;
  }
  _exec(args, { silent = true, timeout = 5e3 } = {}) {
    const bin = this._getCliBin();
    const isWin2 = process.platform === "win32";
    const cmd = isWin2 ? `cmd /c "${bin}" ${args}` : `"${bin}" ${args}`;
    return child_process.execSync(cmd, {
      encoding: "utf-8",
      timeout,
      env: this._getEnv(),
      stdio: silent ? ["pipe", "pipe", "pipe"] : "inherit"
    }).trim();
  }
  /** Check if weixin plugin is installed (cached) */
  isPluginInstalled() {
    if (this._pluginCacheTime && Date.now() - this._pluginCacheTime < 6e4) {
      return this._pluginCached;
    }
    const extDir = path$1.join(this.dataDir, ".openclaw", "extensions", "openclaw-weixin");
    const bundledDir = path$1.join(getAppRoot(), "extensions", "openclaw-weixin");
    let result = fs$1.existsSync(extDir);
    if (!result && fs$1.existsSync(bundledDir)) {
      try {
        fs$1.mkdirSync(path$1.dirname(extDir), { recursive: true });
        this._copyDirSync(bundledDir, extDir);
        result = fs$1.existsSync(extDir);
      } catch (err) {
        console.warn("[wechat] failed to mirror bundled plugin:", err?.message || err);
      }
    }
    if (result) this._ensurePluginsAllow();
    this._pluginCached = result;
    this._pluginCacheTime = Date.now();
    return result;
  }
  /** Install or update weixin plugin */
  _ensurePluginsAllow() {
    try {
      const configFile = path$1.join(this.dataDir, ".openclaw", "openclaw.json");
      if (fs$1.existsSync(configFile)) {
        const config = JSON.parse(fs$1.readFileSync(configFile, "utf-8"));
        let dirty = false;
        if (!config.plugins) config.plugins = {};
        if (!Array.isArray(config.plugins.allow)) config.plugins.allow = [];
        if (!config.plugins.entries) config.plugins.entries = {};
        if (!config.plugins.entries["openclaw-weixin"]) {
          config.plugins.entries["openclaw-weixin"] = { enabled: true, config: {} };
          dirty = true;
          console.log("[wechat] Added openclaw-weixin to plugins.entries");
        }
        if (!config.channels) config.channels = {};
        if (!config.channels["openclaw-weixin"]) {
          config.channels["openclaw-weixin"] = {};
          dirty = true;
          console.log("[wechat] Added openclaw-weixin to channels");
        }
        if (config.plugins.entries["openclaw-weixin"]?.enabled !== true) {
          config.plugins.entries["openclaw-weixin"] = {
            ...(config.plugins.entries["openclaw-weixin"] || {}),
            enabled: true,
            config: config.plugins.entries["openclaw-weixin"]?.config || {}
          };
          dirty = true;
          console.log("[wechat] Enabled openclaw-weixin plugin entry");
        }
        if (dirty) {
          atomicWriteFileSync(configFile, JSON.stringify(config, null, 2), "utf-8");
        }
      }
    } catch (e) {
      console.log(`[wechat] plugins.allow update error: ${e.message}`);
    }
  }
  /**
   * Install plugin — tries offline (bundled zip) first, falls back to online.
   * @param {object} opts
   * @param {string} opts.usbRoot - USB root directory (for finding bundled zips)
   * @param {boolean} opts.forceOnline - skip offline, go straight to online (for updates)
   */
  async installPlugin({ usbRoot, forceOnline = false } = {}) {
    this.status = "installing";
    this.emit("status", this.status);
    const extDir = path$1.join(this.dataDir, ".openclaw", "extensions", "openclaw-weixin");
    const isUpdate = fs$1.existsSync(extDir);
    this.emit("log", forceOnline ? "正在联网更新微信插件..." : isUpdate ? "正在更新微信插件..." : "正在安装微信插件...");
    if (!forceOnline && usbRoot) {
      const bundledZip = path$1.join(usbRoot, "runtime", "weixin-plugin.zip");
      const bundledDir = path$1.join(usbRoot, "extensions", "openclaw-weixin");
      if (fs$1.existsSync(bundledZip)) {
        this.emit("log", "从本地安装包解压...");
        try {
          const targetExtDir = path$1.join(this.dataDir, ".openclaw", "extensions");
          if (!fs$1.existsSync(targetExtDir)) fs$1.mkdirSync(targetExtDir, { recursive: true });
          if (fs$1.existsSync(extDir)) fs$1.rmSync(extDir, { recursive: true, force: true });
          if (process.platform === "win32") {
            child_process.execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${bundledZip}' -DestinationPath '${extDir}' -Force"`, { timeout: 6e4 });
          } else {
            fs$1.mkdirSync(extDir, { recursive: true });
            child_process.execSync(`unzip -o "${bundledZip}" -d "${extDir}"`, { timeout: 6e4 });
          }
          this._pluginCached = true;
          this._pluginCacheTime = Date.now();
          this._ensurePluginsAllow();
          this.emit("log", "✅ 微信插件安装成功（离线）");
          this.status = "disconnected";
          this.emit("status", this.status);
          return { success: true, offline: true };
        } catch (e) {
          this.emit("log", `[warn] 离线安装失败: ${e.message}，尝试从本地目录复制...`);
        }
      }
      if (fs$1.existsSync(bundledDir)) {
        this.emit("log", "从本地目录复制...");
        try {
          const targetExtDir = path$1.join(this.dataDir, ".openclaw", "extensions");
          if (!fs$1.existsSync(targetExtDir)) fs$1.mkdirSync(targetExtDir, { recursive: true });
          if (fs$1.existsSync(extDir)) fs$1.rmSync(extDir, { recursive: true, force: true });
          this._copyDirSync(bundledDir, extDir);
          const zodCheck = path$1.join(extDir, "node_modules", "zod");
          if (!fs$1.existsSync(zodCheck)) {
            this.emit("log", "安装插件依赖...");
            try {
              const env2 = Object.assign({}, process.env);
              const runtimeDir = this.runtimeDir || path$1.join(this.dataDir, "openclaw-runtime");
              if (fs$1.existsSync(runtimeDir)) env2.PATH = runtimeDir + path$1.delimiter + (env2.PATH || "");
              child_process.execSync("npm install --production --no-optional", {
                cwd: extDir,
                env: env2,
                timeout: 12e4,
                stdio: "ignore",
                shell: true
              });
            } catch (depErr) {
              this.emit("log", `[warn] 依赖安装失败: ${depErr.message}`);
            }
          }
          this._pluginCached = true;
          this._pluginCacheTime = Date.now();
          this._ensurePluginsAllow();
          this.emit("log", "✅ 微信插件安装成功（离线）");
          this.status = "disconnected";
          this.emit("status", this.status);
          return { success: true, offline: true };
        } catch (e) {
          this.emit("log", `[warn] 本地复制失败: ${e.message}，尝试联网安装...`);
        }
      }
    }
    return this._installOnline(extDir, isUpdate);
  }
  _copyDirSync(src2, dest) {
    fs$1.mkdirSync(dest, { recursive: true });
    for (const entry of fs$1.readdirSync(src2, { withFileTypes: true })) {
      const s = path$1.join(src2, entry.name);
      const d = path$1.join(dest, entry.name);
      if (entry.isDirectory()) this._copyDirSync(s, d);
      else fs$1.copyFileSync(s, d);
    }
  }
  _cleanupOnlineInstallProject() {
    try {
      const projectsRoot = path$1.join(this.dataDir, ".openclaw", "npm", "projects");
      if (!fs$1.existsSync(projectsRoot)) return;
      for (const entry of fs$1.readdirSync(projectsRoot, { withFileTypes: true })) {
        if (!entry.isDirectory() || !entry.name.includes("tencent-weixin-openclaw-weixin")) continue;
        const full = path$1.join(projectsRoot, entry.name);
        this.emit("log", `[repair] 清理旧微信插件安装缓存: ${full}`);
        fs$1.rmSync(full, { recursive: true, force: true });
      }
    } catch (err) {
      this.emit("log", `[warn] 清理微信插件安装缓存失败: ${err?.message || err}`);
    }
  }
  /** Online install via `openclaw plugins install` */
  _installOnline(extDir, isUpdate) {
    return new Promise((resolve) => {
      const bin = this._getCliBin();
      const isWin2 = process.platform === "win32";
      this.emit("log", "联网下载最新版...");
      console.log(`[wechat] installPlugin online: bin=${bin}, exists=${fs$1.existsSync(bin)}, isUpdate=${isUpdate}`);
      let backupDir = null;
      if (isUpdate) {
        backupDir = extDir + ".bak-" + Date.now();
        this.emit("log", "备份旧版插件...");
        try {
          fs$1.renameSync(extDir, backupDir);
        } catch (e) {
          this.emit("log", `[warn] 备份失败，直接删除旧版: ${e.message}`);
          backupDir = null;
          try {
            fs$1.rmSync(extDir, { recursive: true, force: true });
          } catch {
          }
        }
      }
      this._cleanupOnlineInstallProject();
      let proc;
      if (isWin2) {
        proc = child_process.spawn(`"${bin}" plugins install "${PLUGIN_SPEC$1}@latest" --force`, [], {
          env: this._getEnv(),
          stdio: ["ignore", "pipe", "pipe"],
          shell: true
        });
      } else {
        proc = child_process.spawn(bin, ["plugins", "install", `${PLUGIN_SPEC$1}@latest`, "--force"], {
          env: this._getEnv(),
          stdio: ["ignore", "pipe", "pipe"],
          shell: true
        });
      }
      proc.stdout?.on("data", (d) => {
        const text = d.toString().trim();
        if (text) this.emit("log", text);
      });
      proc.stderr?.on("data", (d) => {
        const text = d.toString().trim();
        if (text) this.emit("log", `[stderr] ${text}`);
      });
      proc.on("exit", (code) => {
        if (code === 0) {
          this._pluginCached = true;
          this._pluginCacheTime = Date.now();
          this.emit("log", isUpdate ? "✅ 微信插件更新成功" : "✅ 微信插件安装成功");
          this.status = "disconnected";
          this.emit("status", this.status);
          this._ensurePluginsAllow();
          if (backupDir && fs$1.existsSync(backupDir)) {
            try {
              fs$1.rmSync(backupDir, { recursive: true, force: true });
            } catch {
            }
          }
          resolve({ success: true });
        } else {
          this.emit("log", `❌ 安装失败 (exit code ${code})`);
          if (backupDir && fs$1.existsSync(backupDir) && !fs$1.existsSync(extDir)) {
            this.emit("log", "恢复旧版插件...");
            try {
              fs$1.renameSync(backupDir, extDir);
              this.emit("log", "已恢复旧版");
            } catch {
            }
          }
          this.status = "error";
          this.emit("status", this.status);
          resolve({ success: false, error: `exit code ${code}` });
        }
      });
      proc.on("error", (err) => {
        this.emit("log", `❌ 安装失败: ${err.message}`);
        if (backupDir && fs$1.existsSync(backupDir) && !fs$1.existsSync(extDir)) {
          this.emit("log", "恢复旧版插件...");
          try {
            fs$1.renameSync(backupDir, extDir);
            this.emit("log", "已恢复旧版");
          } catch {
          }
        }
        this.status = "error";
        this.emit("status", this.status);
        resolve({ success: false, error: err.message });
      });
    });
  }
  /**
   * Start QR login process.
   * Spawns `openclaw channels login --channel openclaw-weixin`
   * and captures stdout for QR code URL.
   */
  startLogin() {
    if (this.loginProcess) {
      const oldProcess = this.loginProcess;
      this.loginProcess = null;
      oldProcess.removeAllListeners();
      oldProcess.kill();
    }
    this.status = "scanning";
    this.emit("status", this.status);
    const bin = this._getCliBin();
    const isWin2 = process.platform === "win32";
    console.log(`[wechat] startLogin: bin=${bin}, isWin=${isWin2}, runtimeDir=${this.runtimeDir}`);
    if (isWin2) {
      const cmdExe = path$1.join(process.env.SystemRoot || "C:\\Windows", "System32", "cmd.exe");
      this.loginProcess = child_process.spawn(cmdExe, ["/c", `"${bin}"`, "channels", "login", "--channel", CHANNEL_ID], {
        env: this._getEnv(),
        stdio: ["pipe", "pipe", "pipe"],
        windowsVerbatimArguments: true
      });
    } else {
      this.loginProcess = child_process.spawn(bin, ["channels", "login", "--channel", CHANNEL_ID], {
        env: this._getEnv(),
        stdio: ["pipe", "pipe", "pipe"],
        shell: true
      });
    }
    console.log(`[wechat] spawn pid=${this.loginProcess.pid}`);
    this.loginProcess.on("error", (err) => {
      console.log(`[wechat] spawn error: ${err.message}`);
      this.emit("log", `[error] ${err.message}`);
      this.status = "error";
      this.emit("status", this.status);
    });
    let qrFound = false;
    const processOutput = (data, source) => {
      const text = data.toString();
      const clean2 = text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "").replace(/\x1B\][^\x07]*\x07/g, "").replace(/\x1B[^a-zA-Z]*[a-zA-Z]/g, "").replace(/[\x00-\x09\x0B\x0C\x0E-\x1F]/g, "");
      this.emit("log", source === "stderr" ? `[stderr] ${clean2}` : clean2);
      if (!qrFound) {
        const urlMatch = clean2.match(/(https?:\/\/[^\s]+(?:weixin|qrcode|liteapp)[^\s]*)/);
        if (urlMatch || text.includes("data:image") || text.includes("liteapp.weixin.qq.com")) {
          qrFound = true;
          const url2 = urlMatch[1].replace(/['"<>]/g, "");
          console.log(`[wechat] Found QR URL: ${url2}`);
          this.emit("qr-url", url2);
        }
      }
      if (clean2.includes("微信连接成功") || clean2.includes("登录成功") || clean2.includes("logged in") || clean2.includes("connected")) {
        this.status = "connected";
        this.emit("status", this.status);
      }
      if (clean2.includes("二维码已过期，正在刷新")) {
        qrFound = false;
        this.status = "refreshing";
        this.emit("status", this.status);
        this.cancelLogin();
      }
      if (clean2.includes("登录超时") || clean2.includes("二维码多次过期") || clean2.includes("二维码过期次数过多")) {
        qrFound = false;
        this.status = "disconnected";
        this.emit("status", this.status);
      }
    };
    this.loginProcess.stdout.on("data", (data) => processOutput(data, "stdout"));
    this.loginProcess.stderr.on("data", (data) => processOutput(data, "stderr"));
    this.loginProcess.on("exit", (code) => {
      this.emit("log", `[weixin exit error] ${code}`);
      this.loginProcess = null;
      if (code === 0 && this.status === "scanning") {
        this.status = "connected";
        this.emit("status", this.status);
      } else if (this.status === "scanning") {
        this.status = "disconnected";
        this.emit("status", this.status);
      }
      if (code === 0 || this.status === "connected") {
        const restart = this.restartGateway();
        this.emit("log", restart.success ? "[weixin] account credentials saved; Gateway keeps running." : `[weixin] account save notice failed: ${restart.error}`);
      }
      this.emit("login-exit", code);
    });
    return { success: true };
  }
  /** Cancel ongoing login */
  cancelLogin() {
    if (this.loginProcess) {
      const oldProcess = this.loginProcess;
      this.loginProcess = null;
      oldProcess.removeAllListeners();
      oldProcess.kill();
    }
    this.status = "disconnected";
    this.emit("status", this.status);
  }
  /** Check current connection status — checks local session files */
  getStatus() {
    if (this.status === "disconnected" || this.status === "error") {
      const accountsFile = path$1.join(this.dataDir, ".openclaw", "openclaw-weixin", "accounts.json");
      if (fs$1.existsSync(accountsFile)) {
        try {
          const accounts = JSON.parse(fs$1.readFileSync(accountsFile, "utf-8"));
          if (Array.isArray(accounts) && accounts.length > 0) {
            this.status = "connected";
            this.emit("status", "connected");
          }
        } catch {
        }
      }
    }
    return this.status;
  }
  /** Restart gateway to pick up new channel config */
  restartGateway() {
    this.emit("log", "[weixin] login process completed without restarting Gateway.");
    return { success: true, skipped: true };
  }
  destroy() {
    if (this.loginProcess) {
      this.loginProcess.kill();
      this.loginProcess = null;
    }
    this.removeAllListeners();
  }
}

class HermesManager {
  constructor({ dataDir }) {
    this.dataDir = dataDir;
    this.proc = null;
    this.dashboardProc = null;
    this.apiProc = null;
    this.status = "idle";
    this.memoryMb = 0;
    this.iterations = 0;
    this.memoryPath = "./hermes_memory";
    this.model = "GPT-4";
    this.lastError = "";
    this.stopping = false;
    this.dashboardProc = null;
    this.apiProc = null;
    this.chatChildren = /* @__PURE__ */ new Map();
    this.chatRunMeta = /* @__PURE__ */ new Map();
    this.apiServerKey = process.env.HERMES_API_SERVER_KEY || "openclaw-local-hermes";
    this._lastStatusSnapshot = null;
    this._lastStatusAt = 0;
    this._statusRefreshInFlight = null;
  }
  getHermesDataRoot() {
    return path$1.join(getAppRoot(), "data", ".hermes");
  }
  getHermesLogsRoot() {
    return path$1.join(this.getHermesDataRoot(), "logs");
  }
  writeLauncherLog(type, msg) {
    const text = String(msg || "").trimEnd();
    if (!text) return;
    try {
      const logsRoot = this.getHermesLogsRoot();
      fs$1.mkdirSync(logsRoot, { recursive: true });
      const line = JSON.stringify({
        time: new Date().toISOString(),
        type: type || "system",
        msg: text
      }) + "\n";
      fs$1.appendFileSync(path$1.join(logsRoot, "launcher.log"), line, "utf8");
    } catch (err) {
      console.warn("[hermes-launcher-log] write failed:", err?.message || err);
    }
  }
  emitLog(type, msg) {
    this.writeLauncherLog(type, msg);
    safeSend("hermes-log", { type, msg });
  }
  getPortableRoot() {
    const envRoot = process.env.HERMES_PORTABLE_ROOT?.trim();
    if (envRoot) return envRoot;
    const platformRoot = path$1.join(getActiveRuntimeDir(), "HermesPortable");
    if (fs$1.existsSync(platformRoot)) return platformRoot;
    return path$1.join(getAppRoot(), "runtime", "HermesPortable");
  }
  getPortableLauncher() {
    return path$1.join(this.getPortableRoot(), "Hermes.bat");
  }
  getHermesBin() {
    const root = this.getPortableRoot();
    if (process.platform === "win32") {
      return path$1.join(root, "venv", "Scripts", "hermes.exe");
    }
    return path$1.join(root, "venv", "bin", "hermes");
  }
  getHermesCommand(args = []) {
    if (process.platform === "win32") {
      return { command: this.getPortablePython(), args: ["-m", "hermes_cli.main", ...args] };
    }
    return { command: this.getHermesBin(), args };
  }
  getPortablePython() {
    const root = this.getPortableRoot();
    if (process.platform !== "win32") {
      const venvPython = path$1.join(root, "venv", "bin", "python");
      if (fs$1.existsSync(venvPython)) return venvPython;
      const venvPython3 = path$1.join(root, "venv", "bin", "python3");
      if (fs$1.existsSync(venvPython3)) return venvPython3;
    }
    const exact = path$1.join(root, "python", "cpython-3.12.13-windows-x86_64-none", "python.exe");
    if (fs$1.existsSync(exact)) return exact;
    const pyRoot = path$1.join(root, "python");
    const stack = [pyRoot];
    while (stack.length) {
      const dir = stack.pop();
      if (!dir || !fs$1.existsSync(dir)) continue;
      for (const entry of fs$1.readdirSync(dir, { withFileTypes: true })) {
        const full = path$1.join(dir, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (entry.isFile() && entry.name.toLowerCase() === "python.exe") return full;
      }
    }
    return process.platform === "win32" ? path$1.join(root, "venv", "Scripts", "python.exe") : path$1.join(root, "venv", "bin", "python");
  }
  getHermesEnv() {
    const root = this.getPortableRoot();
    const usbRoot = getAppRoot();
    const data = this.getHermesDataRoot();
    const home = path$1.join(data, "home");
    const venvScripts = process.platform === "win32" ? path$1.join(root, "venv", "Scripts") : path$1.join(root, "venv", "bin");
    const venvSitePackages = findPythonSitePackages(root);
    const sourceRoot = path$1.join(root, "hermes-agent");
    const platformNodeDir = process.platform === "win32" ? path$1.join(root, "node") : path$1.join(getActiveRuntimeDir(), "node", "bin");
    const nodeDir = fs$1.existsSync(path$1.join(root, "node-windows-x64")) ? path$1.join(root, "node-windows-x64") : platformNodeDir;
    const pythonDir = path$1.dirname(this.getPortablePython());
    for (const dir of [data, home, path$1.join(data, "config"), path$1.join(data, "cache"), path$1.join(data, "logs"), path$1.join(data, "memories"), path$1.join(data, "skills"), path$1.join(data, "tmp")]) {
      if (!fs$1.existsSync(dir)) fs$1.mkdirSync(dir, { recursive: true });
    }
    const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") || "Path";
    return {
      ...process.env,
      HOME: home,
      USERPROFILE: home,
      XDG_CONFIG_HOME: path$1.join(data, "config"),
      XDG_CACHE_HOME: path$1.join(data, "cache"),
      HERMES_HOME: data,
      HERMES_LOG_DIR: path$1.join(data, "logs"),
      HERMES_MEMORY_PATH: path$1.join(data, "memories"),
      HERMES_SKILLS_PATH: path$1.join(data, "skills"),
      TMP: path$1.join(data, "tmp"),
      TEMP: path$1.join(data, "tmp"),
      HERMES_BROWSER_OPENED: "1",
      PYTHONIOENCODING: "utf-8",
      PYTHONUTF8: "1",
      PYTHONPATH: [venvSitePackages, sourceRoot, process.env.PYTHONPATH || ""].filter(Boolean).join(path$1.delimiter),
      [pathKey]: [venvScripts, nodeDir, pythonDir, process.env[pathKey] || ""].filter(Boolean).join(path$1.delimiter)
    };
  }
  syncOpenClawSkillsToHermes(options = {}) {
    const silent = options?.silent !== false;
    const hermesSkillsRoot = path$1.join(getAppRoot(), "data", ".hermes", "skills");
    const openClawTargetRoot = path$1.join(hermesSkillsRoot, "openclaw");
    const manifestPath = path$1.join(openClawTargetRoot, ".openclaw_sync_manifest.json");
    const reportPath = path$1.join(getAppRoot(), "data", ".hermes", "reports", "skills", "visibility-last.json");
    fs$1.mkdirSync(openClawTargetRoot, { recursive: true });
    fs$1.mkdirSync(path$1.dirname(reportPath), { recursive: true });
    function readJsonSafe(filePath) {
      try {
        if (!fs$1.existsSync(filePath)) return null;
        return JSON.parse(fs$1.readFileSync(filePath, "utf8"));
      } catch {
        return null;
      }
    }
    function writeJson(filePath, value) {
      fs$1.mkdirSync(path$1.dirname(filePath), { recursive: true });
      fs$1.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
    }
    function safeSkillDirName(name, fallback) {
      return String(name || fallback || "skill").replace(/[\\/:*?\"<>|]/g, "_").trim() || "skill";
    }
    function skillSlug(value) {
      return String(value || "").toLowerCase().replace(/[\s_]+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
    }
    function uniqueTargetName(name, used) {
      let candidate = name;
      let index = 2;
      while (used.has(candidate.toLowerCase())) {
        candidate = name + "-" + index;
        index += 1;
      }
      used.add(candidate.toLowerCase());
      return candidate;
    }
    function shouldCopySkillPath(rootDir, sourcePath) {
      const rel = path$1.relative(rootDir, sourcePath).replace(/\\/g, "/");
      const excluded = new Set([".git", ".github", ".hub", ".archive", "node_modules", "__pycache__", ".venv", "venv", "dist", "build", ".next", ".cache"]);
      return !rel.split("/").some((part) => excluded.has(part));
    }
    function findSkillSources(rootDir) {
      const rows = [];
      if (!rootDir || !fs$1.existsSync(rootDir)) return rows;
      for (const entry of fs$1.readdirSync(rootDir, { withFileTypes: true })) {
        const full = path$1.join(rootDir, entry.name);
        if (entry.isDirectory()) {
          const skillFile = path$1.join(full, "SKILL.md");
          if (!fs$1.existsSync(skillFile)) continue;
          let meta = null;
          try { meta = parseSkillMeta(skillFile); } catch { meta = null; }
          rows.push({ source: full, name: meta?.name || entry.name, key: entry.name, skillFile });
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
          let meta = null;
          try { meta = parseSkillMeta(full); } catch { meta = null; }
          rows.push({ source: full, name: meta?.name || entry.name.replace(/\.md$/i, ""), key: entry.name.replace(/\.md$/i, ""), skillFile: full });
        }
      }
      return rows;
    }
    function writeOpenClawSkillCatalog(sources, sourceRoots) {
      const catalogDir = path$1.join(getAppRoot(), "data", ".openclaw");
      const catalogJson = path$1.join(catalogDir, "skills-catalog.json");
      const catalogMd = path$1.join(catalogDir, "skills-catalog.md");
      const rows = sources.map((item, index) => ({
        index: index + 1,
        name: item.name,
        key: item.key,
        path: item.source,
        enabled: true
      }));
      const catalog = {
        ok: true,
        checkedAt: new Date().toISOString(),
        total: rows.length,
        sourceRoots,
        skills: rows
      };
      fs$1.mkdirSync(catalogDir, { recursive: true });
      fs$1.writeFileSync(catalogJson, JSON.stringify(catalog, null, 2) + "\n", "utf8");
      fs$1.writeFileSync(catalogMd, ["# OpenClaw Skill Catalog", "", "Total skills: " + rows.length, "", ...rows.map((item) => `${item.index}. ${item.name} (${item.key})`), ""].join("\n"), "utf8");
      return { catalogJson, catalogMd, total: rows.length };
    }
    function verifyHermesSkills(python, sourceRoot, env2) {
      if (!fs$1.existsSync(python)) throw new Error("Hermes portable Python was not found: " + python);
      if (!fs$1.existsSync(path$1.join(sourceRoot, "agent", "skill_commands.py"))) throw new Error("Hermes skill_commands.py was not found: " + sourceRoot);
      const script = [
        "import json, sys",
        "sys.path.insert(0, " + JSON.stringify(sourceRoot) + ")",
        "from agent.skill_commands import reload_skills, get_skill_commands",
        "result = reload_skills()",
        "commands = get_skill_commands()",
        "names = sorted(set((info or {}).get('name') or key.lstrip('/') for key, info in commands.items()))",
        "cmd_keys = sorted(commands.keys())",
        "print(json.dumps({'ok': True, 'reload': result, 'commands': cmd_keys, 'names': names}, ensure_ascii=False))"
      ].join("; ");
      const result = child_process.spawnSync(python, ["-c", script], {
        cwd: path$1.join(getAppRoot(), "data", ".hermes"),
        env: env2,
        encoding: "utf8",
        windowsHide: true,
        timeout: 45000
      });
      if (result.status !== 0) throw new Error((result.stderr || result.stdout || "Hermes skill scan exited with " + result.status).trim());
      const parsed = JSON.parse((result.stdout || "{}").trim());
      return {
        ok: !!parsed.ok,
        names: Array.isArray(parsed.names) ? parsed.names.map(String) : [],
        commands: Array.isArray(parsed.commands) ? parsed.commands.map(String) : [],
        invocationCommand: "",
        invocationLoaded: false
      };
    }
    try {
      const config = readJsonSafe(path$1.join(getAppRoot(), "data", ".openclaw", "openclaw.json")) || {};
      const extraDirs = Array.isArray(config?.skills?.load?.extraDirs) ? config.skills.load.extraDirs : [];
      const skillEntries = config?.skills?.entries || {};
      const sourceRoots = extraDirs.map((dir) => path$1.isAbsolute(dir) ? dir : path$1.join(getAppRoot(), dir));
      const sources = [];
      const seenKeys = new Set();
      for (const rootDir of sourceRoots) {
        for (const item of findSkillSources(rootDir)) {
          const disabled = skillEntries[item.name]?.enabled === false || skillEntries[item.key]?.enabled === false;
          if (disabled) continue;
          const targetName = uniqueTargetName(safeSkillDirName(item.key || item.name, item.name), seenKeys);
          const stat = fs$1.statSync(item.skillFile);
          sources.push({ ...item, targetName, skillMtimeMs: Math.round(stat.mtimeMs), rootDir });
        }
      }
      const catalog = writeOpenClawSkillCatalog(sources, sourceRoots);
      const nextManifest = { version: 3, syncedAt: new Date().toISOString(), sourceRoots, skills: sources.map(({ source, name, key, targetName, skillMtimeMs }) => ({ source, name, key, targetName, skillMtimeMs })) };
      const oldManifest = readJsonSafe(manifestPath);
      const unchanged = !!oldManifest && JSON.stringify({ ...oldManifest, syncedAt: nextManifest.syncedAt }) === JSON.stringify(nextManifest);
      let copied = 0;
      if (!unchanged) {
        fs$1.mkdirSync(openClawTargetRoot, { recursive: true });
        const keepNames = new Set(sources.map((item) => item.targetName.toLowerCase()).concat(["description.md", ".openclaw_sync_manifest.json"]));
        for (const entry of fs$1.readdirSync(openClawTargetRoot, { withFileTypes: true })) {
          if (keepNames.has(entry.name.toLowerCase())) continue;
          fs$1.rmSync(path$1.join(openClawTargetRoot, entry.name), { recursive: true, force: true });
        }
        fs$1.writeFileSync(path$1.join(openClawTargetRoot, "DESCRIPTION.md"), "# OpenClaw Skills\n\nOpenClaw skills synchronized from the portable USB skills directory and verified through Hermes native skill command scanning.\n", "utf8");
        for (const item of sources) {
          const target = path$1.join(openClawTargetRoot, item.targetName);
          fs$1.rmSync(target, { recursive: true, force: true });
          if (fs$1.statSync(item.source).isDirectory()) {
            fs$1.cpSync(item.source, target, { recursive: true, filter: (sourcePath) => shouldCopySkillPath(item.source, sourcePath) });
          } else {
            fs$1.mkdirSync(target, { recursive: true });
            fs$1.copyFileSync(item.source, path$1.join(target, "SKILL.md"));
          }
          copied += 1;
        }
        fs$1.writeFileSync(manifestPath, JSON.stringify(nextManifest, null, 2) + "\n", "utf8");
      }
      const verification = verifyHermesSkills(this.getPortablePython(), path$1.join(this.getPortableRoot(), "hermes-agent"), this.getHermesEnv());
      const visibleSet = new Set([...verification.names, ...verification.commands.map((cmd) => cmd.replace(/^\//, ""))].map(skillSlug));
      const missingNames = sources.map((item) => item.name).filter((name) => !visibleSet.has(skillSlug(name))).slice(0, 50);
      const report = {
        ok: verification.ok,
        checkedAt: new Date().toISOString(),
        sourceCount: sources.length,
        copied,
        mirroredCount: sources.length,
        visibleCount: verification.names.length,
        commandCount: verification.commands.length,
        invocationCommand: "",
        invocationLoaded: false,
        invocationStatus: "not-run",
        usageTracked: fs$1.existsSync(path$1.join(hermesSkillsRoot, ".usage.json")),
        mirrorRoot: openClawTargetRoot,
        path: openClawTargetRoot,
        reportPath,
        catalogPath: catalog.catalogJson,
        catalogMarkdownPath: catalog.catalogMd,
        sampleCommands: verification.commands.slice(0, 20),
        missingNames,
        unchanged
      };
      writeJson(reportPath, report);
      if (!silent) safeSend("hermes-log", { type: "system", msg: "[skills] synced=" + copied + " source=" + report.sourceCount + " visible=" + report.visibleCount + " commands=" + report.commandCount + " report=" + reportPath });
      return report;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      const report = { ok: false, checkedAt: new Date().toISOString(), copied: 0, sourceCount: 0, mirroredCount: 0, visibleCount: 0, commandCount: 0, usageTracked: fs$1.existsSync(path$1.join(hermesSkillsRoot, ".usage.json")), mirrorRoot: openClawTargetRoot, path: openClawTargetRoot, reportPath, sampleCommands: [], missingNames: [], error };
      writeJson(reportPath, report);
      safeSend("hermes-log", { type: "stderr", msg: "[skills] sync failed: " + error });
      return report;
    }
  }
  detectPortableSkillInstallRequest(message) {
    const text = String(message || "");
    if (!/(install|安装|装上|添加|同步).{0,30}(skill|技能)/i.test(text) && !/(skill|技能).{0,30}(install|安装|装上|添加|同步)/i.test(text)) return null;
    const match = text.match(/https?:\/\/(?:www\.)?github\.com\/([^\s\)\]\}\"'，。；;]+)(?:\.git)?/i);
    if (!match) return null;
    let url = match[0].replace(/[，。；;,.]+$/, "");
    if (!/\.git$/i.test(url)) url += ".git";
    return { url };
  }

  async installPortableSkillFromGit(url, options = {}) {
    const startedAt = Date.now();
    const cleanUrl = String(url || "").trim();
    if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\.git$/i.test(cleanUrl)) {
      return { ok: false, error: "只支持 GitHub skill 仓库地址，例如 https://github.com/user/repo.git" };
    }
    const appRoot = getAppRoot();
    const skillsRoot = path$1.resolve(appRoot, "skills");
    const tmpRoot = path$1.resolve(appRoot, "data", ".hermes", "tmp");
    fs$1.mkdirSync(skillsRoot, { recursive: true });
    fs$1.mkdirSync(tmpRoot, { recursive: true });
    const repoName = cleanUrl.split("/").pop().replace(/\.git$/i, "").replace(/[^A-Za-z0-9_.-]/g, "-") || "skill-repo";
    const cloneDir = path$1.join(tmpRoot, repoName);
    const portablePython = this.getPortablePython();
    function isInside(parent, child) {
      const rel = path$1.relative(parent, child);
      return rel && !rel.startsWith("..") && !path$1.isAbsolute(rel);
    }
    function shouldCopySkillPath(rootDir, sourcePath) {
      const rel = path$1.relative(rootDir, sourcePath).replace(/\\/g, "/");
      const excluded = new Set([".git", ".github", ".hub", ".archive", "node_modules", "__pycache__", ".venv", "venv", "dist", "build", ".next", ".cache"]);
      return !rel.split("/").some((part) => excluded.has(part));
    }
    function findSkillSources(rootDir) {
      const rows = [];
      if (fs$1.existsSync(path$1.join(rootDir, "SKILL.md"))) rows.push({ source: rootDir, name: repoName });
      for (const entry of fs$1.readdirSync(rootDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const full = path$1.join(rootDir, entry.name);
        if (fs$1.existsSync(path$1.join(full, "SKILL.md"))) rows.push({ source: full, name: entry.name });
      }
      return rows;
    }
    function gitCandidates() {
      const rows = [];
      if (process.env.GIT_BIN) rows.push(process.env.GIT_BIN);
      rows.push("git");
      if (process.platform === "win32") {
        rows.push("C:\\Program Files\\Git\\bin\\git.exe");
        rows.push("C:\\Program Files\\Git\\cmd\\git.exe");
      }
      return [...new Set(rows)];
    }
    async function downloadArchiveFallback() {
      if (!fs$1.existsSync(portablePython)) throw new Error("系统 Git 不可用，且未找到便携 Python：" + portablePython);
      const repoMatch = cleanUrl.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\.git$/i);
      if (!repoMatch) throw new Error("无法解析 GitHub 仓库地址：" + cleanUrl);
      const owner = repoMatch[1];
      const repo = repoMatch[2];
      const branches = ["main", "master"];
      let lastError = "";
      for (const branch of branches) {
        const archiveUrl = "https://github.com/" + owner + "/" + repo + "/archive/refs/heads/" + branch + ".zip";
        const zipPath = path$1.join(tmpRoot, repoName + "-" + branch + ".zip");
        const script = [
          "import os, pathlib, shutil, sys, urllib.request, zipfile",
          "url, zip_path, target = sys.argv[1:4]",
          "tmp = target + '-extract'",
          "shutil.rmtree(tmp, ignore_errors=True)",
          "shutil.rmtree(target, ignore_errors=True)",
          "os.makedirs(os.path.dirname(zip_path), exist_ok=True)",
          "req = urllib.request.Request(url, headers={'User-Agent': 'OpenClawPro-AgentHub'})",
          "with urllib.request.urlopen(req, timeout=90) as r, open(zip_path, 'wb') as f: shutil.copyfileobj(r, f)",
          "with zipfile.ZipFile(zip_path) as z: z.extractall(tmp)",
          "roots = [p for p in pathlib.Path(tmp).iterdir()]",
          "src = roots[0] if len(roots) == 1 and roots[0].is_dir() else pathlib.Path(tmp)",
          "shutil.move(str(src), target)",
          "shutil.rmtree(tmp, ignore_errors=True)"
        ].join("; ");
        const result = await new Promise((resolve) => {
          const child = child_process.spawn(portablePython, ["-c", script, archiveUrl, zipPath, cloneDir], {
            cwd: tmpRoot,
            env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" },
            stdio: ["ignore", "pipe", "pipe"],
            windowsHide: true
          });
          let output = "";
          const timer = setTimeout(() => {
            try { child.kill("SIGKILL"); } catch {}
            resolve({ ok: false, error: "GitHub archive 下载超时", output });
          }, Number(options.timeoutMs) || 120000);
          child.stdout?.on("data", (data) => { output = (output + Buffer.from(data).toString("utf8")).slice(-4000); });
          child.stderr?.on("data", (data) => { output = (output + Buffer.from(data).toString("utf8")).slice(-4000); });
          child.on("error", (err) => { clearTimeout(timer); resolve({ ok: false, error: err.message, output }); });
          child.on("exit", (code) => { clearTimeout(timer); resolve({ ok: code === 0, error: code === 0 ? "" : "archive download exited with code " + code, output }); });
        });
        if (result.ok && findSkillSources(cloneDir).length > 0) return { reused: false, git: null, archive: archiveUrl, output: result.output || "" };
        lastError = result.error + (result.output ? "\n" + result.output : "");
      }
      throw new Error(lastError || "无法下载 GitHub archive");
    }
    async function cloneRepo() {
      if (fs$1.existsSync(cloneDir) && findSkillSources(cloneDir).length > 0) {
        return { reused: true, git: null, output: "reused existing tmp repository" };
      }
      fs$1.rmSync(cloneDir, { recursive: true, force: true });
      let lastError = "";
      for (const git of gitCandidates()) {
        try {
          const result = await new Promise((resolve) => {
            const child = child_process.spawn(git, ["clone", "--depth", "1", cleanUrl, cloneDir], {
              cwd: tmpRoot,
              env: process.env,
              stdio: ["ignore", "pipe", "pipe"],
              windowsHide: true
            });
            let output = "";
            const timer = setTimeout(() => {
              try { child.kill("SIGKILL"); } catch {}
              resolve({ ok: false, error: "git clone 超时，已终止安装。", output });
            }, Number(options.timeoutMs) || 120000);
            child.stdout?.on("data", (data) => { output = (output + Buffer.from(data).toString("utf8")).slice(-4000); });
            child.stderr?.on("data", (data) => { output = (output + Buffer.from(data).toString("utf8")).slice(-4000); });
            child.on("error", (err) => { clearTimeout(timer); resolve({ ok: false, error: err.message, output }); });
            child.on("exit", (code) => { clearTimeout(timer); resolve({ ok: code === 0, error: code === 0 ? "" : "git clone exited with code " + code, output }); });
          });
          if (result.ok) return { reused: false, git, output: result.output || "" };
          lastError = result.error + (result.output ? "\n" + result.output : "");
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      }
      try {
        const fallback = await downloadArchiveFallback();
        fallback.output = (fallback.output || "") + (lastError ? "\nGit fallback reason: " + lastError : "");
        return fallback;
      } catch (archiveErr) {
        throw new Error((lastError ? lastError + "\n" : "") + (archiveErr instanceof Error ? archiveErr.message : String(archiveErr)));
      }
    }
    function ensureOpenClawSkillsConfig(installed) {
      const configPath = path$1.join(appRoot, "data", ".openclaw", "openclaw.json");
      let config = {};
      try { if (fs$1.existsSync(configPath)) config = JSON.parse(fs$1.readFileSync(configPath, "utf8")); } catch { config = {}; }
      config.skills = config.skills || {};
      config.skills.load = config.skills.load || {};
      const extraDirs = Array.isArray(config.skills.load.extraDirs) ? config.skills.load.extraDirs : [];
      if (!extraDirs.some((entry) => String(entry).replace(/\\/g, "/") === "skills" || String(entry).replace(/\\/g, "/").endsWith("/skills"))) extraDirs.push("skills");
      config.skills.load.extraDirs = extraDirs;
      config.skills.entries = config.skills.entries || {};
      for (const item of installed) {
        config.skills.entries[item.name] = { ...(config.skills.entries[item.name] || {}), enabled: true };
      }
      fs$1.mkdirSync(path$1.dirname(configPath), { recursive: true });
      fs$1.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
    }
    try {
      safeSend("hermes-log", { type: "system", msg: "[skill-install] installing " + cleanUrl });
      const clone = await cloneRepo();
      const sources = findSkillSources(cloneDir);
      if (sources.length === 0) throw new Error("仓库中没有找到 SKILL.md，无法作为 skill 安装。仓库：" + cleanUrl);
      const installed = [];
      for (const item of sources) {
        const safeName = String(item.name || repoName).replace(/[\\/:*?\"<>|]/g, "_").trim() || repoName;
        const target = path$1.resolve(skillsRoot, safeName);
        if (!isInside(skillsRoot, target)) throw new Error("非法 skill 目录：" + safeName);
        fs$1.rmSync(target, { recursive: true, force: true });
        fs$1.cpSync(item.source, target, { recursive: true, filter: (sourcePath) => shouldCopySkillPath(item.source, sourcePath) });
        installed.push({ name: safeName, path: target });
      }
      ensureOpenClawSkillsConfig(installed);
      const sync = this.syncOpenClawSkillsToHermes({ silent: false });
      const report = { ok: true, url: cleanUrl, repoName, cloneReused: !!clone.reused, installed, installedCount: installed.length, skillsRoot, sync, elapsedMs: Date.now() - startedAt };
      safeSend("hermes-log", { type: "system", msg: "[skill-install] installed=" + installed.length + " synced=" + (sync?.mirroredCount ?? sync?.sourceCount ?? 0) + " url=" + cleanUrl });
      return report;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      safeSend("hermes-log", { type: "stderr", msg: "[skill-install] failed: " + error });
      return { ok: false, url: cleanUrl, error, elapsedMs: Date.now() - startedAt };
    }
  }
  verifyHermesMemory(options = {}) {
    const silent = options?.silent !== false;
    const data = path$1.join(getAppRoot(), "data", ".hermes");
    const memoryDir = path$1.join(data, "memories");
    const configPath = path$1.join(data, "config.yaml");
    const reportPath = path$1.join(data, "reports", "memory", "persistence-last.json");
    const memoryFile = path$1.join(memoryDir, "MEMORY.md");
    const userFile = path$1.join(memoryDir, "USER.md");
    function writeJson(filePath, value) {
      fs$1.mkdirSync(path$1.dirname(filePath), { recursive: true });
      fs$1.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
    }
    function writeConfigYaml() {
      fs$1.mkdirSync(data, { recursive: true });
      const yaml = [
        "# Managed by OpenClawPro Agent Hub. Kept inside the USB data/.hermes directory.",
        "memory:",
        "  memory_enabled: true",
        "  user_profile_enabled: true",
        "  memory_char_limit: 2200",
        "  user_char_limit: 1375",
        "  provider: \"\"",
        "skills:",
        "  auto_skill_enabled: true",
        "  external_dirs:",
        "    - " + JSON.stringify(path$1.join(getAppRoot(), "skills")),
        "paths:",
        "  home: " + JSON.stringify(path$1.join(data, "home")),
        "  logs: " + JSON.stringify(path$1.join(data, "logs")),
        "  memories: " + JSON.stringify(memoryDir),
        "  skills: " + JSON.stringify(path$1.join(data, "skills")),
        ""
      ].join("\n");
      fs$1.writeFileSync(configPath, yaml, "utf8");
    }
    try {
      writeConfigYaml();
      fs$1.mkdirSync(path$1.dirname(reportPath), { recursive: true });
      const python = this.getPortablePython();
      const sourceRoot = path$1.join(this.getPortableRoot(), "hermes-agent");
      if (!fs$1.existsSync(python)) throw new Error("Hermes portable Python was not found: " + python);
      if (!fs$1.existsSync(path$1.join(sourceRoot, "tools", "memory_tool.py"))) throw new Error("Hermes memory_tool.py was not found: " + sourceRoot);
      const marker = "openclaw-hermes-memory-verify-" + Date.now();
      const script = [
        "import json, sys",
        "sys.path.insert(0, " + JSON.stringify(sourceRoot) + ")",
        "from tools.memory_tool import MemoryStore, get_memory_dir",
        "store = MemoryStore(memory_char_limit=2200, user_char_limit=1375)",
        "store.load_from_disk()",
        "marker = " + JSON.stringify(marker),
        "memory_content = f'{marker} memory persistence probe'",
        "user_content = f'{marker} user profile probe'",
        "memory_add = store.add('memory', memory_content)",
        "user_add = store.add('user', user_content)",
        "store.load_from_disk()",
        "memory_seen = memory_content in store.memory_entries",
        "user_seen = user_content in store.user_entries",
        "memory_remove = store.remove('memory', marker)",
        "user_remove = store.remove('user', marker)",
        "store.load_from_disk()",
        "memory_dir = get_memory_dir()",
        "payload = {",
        "  'ok': bool(memory_seen and user_seen and memory_add.get('success') and user_add.get('success')),",
        "  'memoryEntryCount': len(store.memory_entries),",
        "  'userEntryCount': len(store.user_entries),",
        "  'memoryFileExists': (memory_dir / 'MEMORY.md').exists(),",
        "  'userFileExists': (memory_dir / 'USER.md').exists(),",
        "  'memoryWritable': bool(memory_add.get('success') and memory_seen),",
        "  'userWritable': bool(user_add.get('success') and user_seen),",
        "  'testEntryRemoved': bool(memory_remove.get('success') and user_remove.get('success'))",
        "}",
        "print(json.dumps(payload, ensure_ascii=False))"
      ].join("\n");
      const result = child_process.spawnSync(python, ["-c", script], {
        cwd: data,
        env: this.getHermesEnv(),
        encoding: "utf8",
        windowsHide: true,
        timeout: 45000
      });
      if (result.status !== 0) throw new Error((result.stderr || result.stdout || "Hermes memory verification exited with " + result.status).trim());
      const parsed = JSON.parse((result.stdout || "{}").trim());
      const report = { ok: !!parsed.ok, checkedAt: new Date().toISOString(), memoryEnabled: true, userProfileEnabled: true, memoryDir, memoryFile, userFile, configPath, reportPath, memoryEntryCount: parsed.memoryEntryCount || 0, userEntryCount: parsed.userEntryCount || 0, memoryFileExists: !!parsed.memoryFileExists, userFileExists: !!parsed.userFileExists, memoryWritable: !!parsed.memoryWritable, userWritable: !!parsed.userWritable, testEntryRemoved: !!parsed.testEntryRemoved };
      writeJson(reportPath, report);
      if (!silent) safeSend("hermes-log", { type: report.ok ? "system" : "stderr", msg: "[memory] verified=" + report.ok + " memoryEntries=" + report.memoryEntryCount + " userEntries=" + report.userEntryCount + " report=" + reportPath });
      return report;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      const report = { ok: false, checkedAt: new Date().toISOString(), memoryEnabled: true, userProfileEnabled: true, memoryDir, memoryFile, userFile, configPath, reportPath, memoryEntryCount: 0, userEntryCount: 0, memoryFileExists: fs$1.existsSync(memoryFile), userFileExists: fs$1.existsSync(userFile), memoryWritable: false, userWritable: false, testEntryRemoved: false, error };
      writeJson(reportPath, report);
      safeSend("hermes-log", { type: "stderr", msg: "[memory] verification failed: " + error });
      return report;
    }
  }
  repairShims() {
    const root = this.getPortableRoot();
    const python = this.getPortablePython();
    const fixer = path$1.join(root, "lib", "fix_shims.py");
    if (fs$1.existsSync(python) && fs$1.existsSync(fixer)) {
      try {
        child_process.execFileSync(python, [fixer], {
          cwd: root,
          env: this.getHermesEnv(),
          encoding: "utf8",
          timeout: 30000,
          windowsHide: true
        });
      } catch (err) {
        safeSend("hermes-log", { type: "stderr", msg: "[hermes-portable] fix_shims failed: " + (err instanceof Error ? err.message : String(err)) });
      }
    }
  }
  checkTcpPort(port) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(800);
      socket.once("connect", () => {
        socket.destroy();
        resolve(true);
      });
      socket.once("timeout", () => {
        socket.destroy();
        resolve(false);
      });
      socket.once("error", () => resolve(false));
      socket.connect(port, "127.0.0.1");
    });
  }
  async stopPort(port) {
    if (process.platform !== "win32") return;
    try {
      const output = child_process.execFileSync("netstat", ["-ano", "-p", "tcp"], {
        encoding: "utf8",
        windowsHide: true,
        timeout: 5000
      });
      const pids = new Set();
      for (const line of output.split(/\r?\n/)) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 5 || parts[0] !== "TCP") continue;
        const localAddress = parts[1] || "";
        const state = parts[3] || "";
        const pid = Number(parts[4]);
        if (state === "LISTENING" && localAddress.endsWith(":" + port) && Number.isInteger(pid) && pid > 0) {
          pids.add(pid);
        }
      }
      for (const pid of pids) {
        child_process.execFileSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
          encoding: "utf8",
          windowsHide: true,
          timeout: 5000
        });
      }
    } catch {
    }
  }
  snapshot(options = {}) {
    const fast = options?.fast === true;
    const root = this.getPortableRoot();
    const hermesBin = this.getHermesBin();
    const python = this.getPortablePython();
    const nodeDir = fs$1.existsSync(path$1.join(root, "node-windows-x64")) ? path$1.join(root, "node-windows-x64") : path$1.join(root, "node");
    const nodeBin = process.platform === "win32" ? path$1.join(nodeDir, "node.exe") : path$1.join(nodeDir, "bin", "node");
    const npmBin = process.platform === "win32" ? path$1.join(nodeDir, "npm.cmd") : path$1.join(nodeDir, "bin", "npm");
    const data = path$1.join(getAppRoot(), "data", ".hermes");
    const skillsRoot = path$1.join(data, "skills");
    function countHermesSkills(rootDir) {
      const seen = /* @__PURE__ */ new Set();
      function walk(dir) {
        if (!fs$1.existsSync(dir)) return;
        for (const entry of fs$1.readdirSync(dir, { withFileTypes: true })) {
          const full = path$1.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (fs$1.existsSync(path$1.join(full, "SKILL.md")) || fs$1.existsSync(path$1.join(full, "DESCRIPTION.md"))) seen.add(path$1.relative(rootDir, full).replace(/\\/g, "/"));
            walk(full);
          } else if (/^(SKILL|DESCRIPTION)\.md$/i.test(entry.name)) {
            seen.add(path$1.relative(rootDir, dir).replace(/\\/g, "/") || entry.name);
          }
        }
      }
      walk(rootDir);
      return seen.size;
    }
    function readJsonSafe(filePath) {
      try {
        if (!fs$1.existsSync(filePath)) return null;
        return JSON.parse(fs$1.readFileSync(filePath, "utf8"));
      } catch {
        return null;
      }
    }
    const openClawConfig = readJsonSafe(path$1.join(getAppRoot(), "data", ".openclaw", "openclaw.json"));
    const openClawSkillDirs = Array.isArray(openClawConfig?.skills?.load?.extraDirs) ? openClawConfig.skills.load.extraDirs.map((dir) => path$1.isAbsolute(dir) ? dir : path$1.join(getAppRoot(), dir)) : [];
    const memoryReport = readJsonSafe(path$1.join(data, "reports", "memory", "persistence-last.json"));
    const skillReport = readJsonSafe(path$1.join(data, "reports", "skills", "visibility-last.json"));
    const skillGrowthReport = readJsonSafe(path$1.join(data, "reports", "skills", "growth-last.json"));
    const skillGrowthReady = !!skillGrowthReport?.ok || !!(skillReport?.ok && (skillReport?.visibleCount || 0) > 0 && (skillReport?.commandCount || 0) > 0);
    const reportedSkillCount = Number(skillReport?.mirroredCount || skillReport?.sourceCount || 0);
    const skillCount = reportedSkillCount || (this._skillCountCache && Date.now() - this._skillCountCache.checkedAt < 60000 ? this._skillCountCache.count : fast ? 0 : (() => {
      const count = countHermesSkills(skillsRoot);
      this._skillCountCache = { checkedAt: Date.now(), count };
      return count;
    })());
    const primaryModel = openClawConfig?.agents?.defaults?.model?.primary || "";
    return {
      status: this.status,
      pid: this.proc?.pid ?? this.dashboardProc?.pid ?? this.apiProc?.pid ?? null,
      memoryMb: this.memoryMb,
      iterations: this.iterations,
      memoryPath: path$1.join(data, "memories"),
      memoryReady: !!memoryReport?.ok,
      memoryWritable: !!memoryReport?.memoryWritable && !!memoryReport?.userWritable,
      memoryEntryCount: memoryReport?.memoryEntryCount || 0,
      userMemoryEntryCount: memoryReport?.userEntryCount || 0,
      memoryReportPath: memoryReport?.reportPath || path$1.join(data, "reports", "memory", "persistence-last.json"),
      memoryReport,
      model: this.model,
      runtimeRoot: root,
      dataRoot: data,
      configRoot: path$1.join(data, "config"),
      logsRoot: path$1.join(data, "logs"),
      skillsRoot,
      nodeBin,
      npmBin,
      hermesBin,
      pythonBin: python,
      hermesReady: fs$1.existsSync(hermesBin),
      pythonReady: fs$1.existsSync(python),
      nodeReady: fs$1.existsSync(nodeBin),
      npmReady: fs$1.existsSync(npmBin),
      sourceReady: fs$1.existsSync(path$1.join(root, "hermes-agent", "pyproject.toml")),
      dataReady: fs$1.existsSync(data),
      configDirReady: fs$1.existsSync(path$1.join(data, "config")),
      skillsReady: fs$1.existsSync(skillsRoot),
      skillCount,
      skillVisibleCount: skillReport?.visibleCount || 0,
      skillCommandCount: skillReport?.commandCount || 0,
      skillMissingNames: skillReport?.missingNames || [],
      skillReportPath: skillReport?.reportPath || path$1.join(data, "reports", "skills", "visibility-last.json"),
      skillsUsageTracked: !!skillReport?.usageTracked,
      skillsReport: skillReport,
      skillGrowthReady,
      skillGrowthReportPath: skillGrowthReport?.reportPath || path$1.join(data, "reports", "skills", "growth-last.json"),
      skillGrowthReport,
      modelBridgeReady: !!primaryModel,
      modelBridge: primaryModel || "未配置 OpenClaw 当前模型",
      lastError: this.lastError,
      launcherLogPath: path$1.join(this.getHermesLogsRoot(), "launcher.log")
    };
  }
  emitStatus() {
    safeSend("hermes-status", this.snapshot({ fast: true }));
  }
  refreshMemory() {
    const pid = this.proc?.pid;
    if (!pid) {
      this.memoryMb = 0;
      return;
    }
    try {
      if (process.platform === "win32") {
        const raw = child_process.execFileSync("tasklist", ["/FI", "PID eq " + pid, "/FO", "CSV", "/NH"], { encoding: "utf8", timeout: 3000 });
        const fields = [...raw.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
        const memKb = Number((fields[4] || "").replace(/[^0-9]/g, ""));
        if (Number.isFinite(memKb) && memKb > 0) this.memoryMb = Math.round(memKb / 1024 * 10) / 10;
      }
    } catch {
      this.memoryMb = 0;
    }
  }
  async start(options = {}) {
    const root = this.getPortableRoot();
    const configServer = path$1.join(root, "lib", "config_server.py");
    const python = path$1.join(root, "venv", "Scripts", "python.exe");
    if (!fs$1.existsSync(configServer) || !fs$1.existsSync(this.getPortablePython())) {
      this.status = "error";
      this.lastError = "Hermes Portable 未安装完整：缺少 config_server.py 或 portable python";
      this.emitLog("error", "[hermes-portable] " + this.lastError + "\nroot=" + root + "\nconfigServer=" + configServer + "\npython=" + this.getPortablePython());
      this.emitStatus();
      return this.snapshot();
    }
    this.memoryPath = typeof options.memoryPath === "string" && options.memoryPath.trim() ? options.memoryPath.trim() : this.memoryPath;
    this.model = typeof options.model === "string" && options.model.trim() ? options.model.trim() : this.model;
    this.lastError = "";
    this.stopping = false;
    const launchPython = this.getPortablePython();
    try {
      if (!(await this.checkTcpPort(17520))) {
        this.emitLog("system", "[hermes-portable] config server launch request\nroot=" + root + "\ncwd=" + root + "\npython=" + launchPython + "\nscript=" + configServer + "\nlogs=" + this.getHermesLogsRoot());
        this.proc = child_process.spawn(launchPython, [configServer], {
          cwd: root,
          env: this.getHermesEnv(),
          stdio: ["ignore", "pipe", "pipe"],
          windowsHide: true
        });
        this.status = "starting";
        this.emitLog("system", "[hermes-portable] config server spawned pid=" + (this.proc.pid || "unknown") + " command=" + launchPython + " " + configServer);
        this.emitStatus();
        let configStdoutTail = "";
        let configStderrTail = "";
        const appendConfigTail = (current, chunk) => (current + String(chunk || "")).slice(-4000);
        this.proc.stdout?.on("data", (data) => {
          const text = Buffer.from(data).toString("utf8");
          configStdoutTail = appendConfigTail(configStdoutTail, text);
          this.emitLog("stdout", "[config] " + text);
        });
        this.proc.stderr?.on("data", (data) => {
          const text = Buffer.from(data).toString("utf8");
          configStderrTail = appendConfigTail(configStderrTail, text);
          this.emitLog("stderr", "[config] " + text);
        });
        this.proc.on("error", (err) => {
          this.status = "error";
          this.lastError = err.message;
          this.emitLog("error", "[hermes-portable] config server spawn error: " + err.message);
          this.emitStatus();
        });
        this.proc.on("exit", (code, signal) => {
          const wasStopping = this.stopping;
          this.proc = null;
          this.memoryMb = 0;
          this.stopping = false;
          this.status = wasStopping || code === 0 ? "idle" : "error";
          if (this.status === "error") this.lastError = "Hermes config server exited with code " + (code ?? "null") + (signal ? ", signal " + signal : "");
          this.emitLog("exit", "[hermes-portable] config server exited code=" + (code ?? "null") + " signal=" + (signal ?? "") + (wasStopping || code === 0 ? " (normal stop)" : " (unexpected)"));
          if (!wasStopping && code !== 0) {
            this.emitLog("stderr", "[hermes-portable] unexpected config server exit diagnostics\nstdoutTail=" + configStdoutTail.trim().slice(-1200) + "\nstderrTail=" + configStderrTail.trim().slice(-1200));
          }
          this.emitStatus();
        });
      }
      const configReady = await this.waitForPort(17520, 2e4, () => !!this.proc);
      if (!configReady) {
        this.status = "error";
        this.lastError = "Hermes config server did not become ready on 127.0.0.1:17520";
        this.emitLog("stderr", "[config] " + this.lastError + "\nlauncherLog=" + path$1.join(this.getHermesLogsRoot(), "launcher.log"));
        this.emitStatus();
        return await this.getStatus();
      }
      if (options.open === true) openHermesInMainWindow("http://127.0.0.1:17520");
      const apiStatus = await this.startApiServer({ open: false });
      if (!apiStatus.apiServerReady) {
        this.status = "error";
        this.lastError = apiStatus.lastError || this.lastError || "Hermes Agent API did not become ready on 127.0.0.1:8642";
        this.emitLog("stderr", "[api-server] " + this.lastError);
        this.emitStatus();
      }
      return await this.getStatus();
    } catch (err) {
      this.status = "error";
      this.lastError = err instanceof Error ? err.message : String(err);
      this.emitLog("error", "[hermes-portable] start failed: " + this.lastError);
      this.emitStatus();
      return this.snapshot();
    }
  }
  requestJson(urlText, payload, headers = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(urlText);
      const body = payload ? JSON.stringify(payload) : "";
      const req = require$$3.request({
        hostname: urlObj.hostname,
        port: Number(urlObj.port) || 80,
        path: urlObj.pathname + urlObj.search,
        method: payload ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          ...headers
        }
      }, (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => raw += chunk);
        res.on("end", () => {
          let data = null;
          try {
            data = raw ? JSON.parse(raw) : null;
          } catch {
            data = { raw };
          }
          if ((res.statusCode || 0) >= 200 && (res.statusCode || 0) < 300) {
            resolve(data);
          } else {
            const message = data?.error?.message || data?.error || data?.detail || raw || "HTTP " + res.statusCode;
            reject(new Error(message));
          }
        });
      });
      req.on("error", reject);
      req.setTimeout(12e4, () => {
        req.destroy(new Error("Hermes API request timed out"));
      });
      if (body) req.write(body);
      req.end();
    });
  }
  async waitForPort(port, timeoutMs = 2e4, isProcessAlive = null) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      if (await this.checkTcpPort(port)) return true;
      if (typeof isProcessAlive === "function" && !isProcessAlive()) return false;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return await this.checkTcpPort(port);
  }
  killChild(proc) {
    if (!proc || proc.killed) return;
    try {
      if (process.platform === "win32" && proc.pid) {
        child_process.spawn("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
      } else {
        proc.kill("SIGTERM");
      }
    } catch {
    }
  }
  spawnHermes(args, label, envPatch = {}) {
    const root = this.getPortableRoot();
    const defaultEnvPatch = label === "dashboard" ? { HERMES_WEB_DIST: path$1.join(root, "hermes-agent", "hermes_cli", "web_dist") } : {};
    const hermesCommand = this.getHermesCommand(args);
    if (!fs$1.existsSync(hermesCommand.command)) {
      this.status = "error";
      this.lastError = "Hermes CLI runtime not found: " + hermesCommand.command;
      this.emitLog("error", "[hermes-portable] " + this.lastError + "\nroot=" + root);
      this.emitStatus();
      return null;
    }
    this.emitLog("system", "[hermes-portable] " + label + " launch request\nroot=" + root + "\ncwd=" + root + "\ncommand=" + hermesCommand.command + " " + hermesCommand.args.join(" ") + "\nlogs=" + this.getHermesLogsRoot());
    const proc = child_process.spawn(hermesCommand.command, hermesCommand.args, {
      cwd: root,
      env: { ...this.getHermesEnv(), ...defaultEnvPatch, ...envPatch },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    });
    this.status = "running";
    this.lastError = "";
    this.emitLog("system", "[hermes-portable] " + label + " spawned pid=" + (proc.pid || "unknown"));
    let stderrTail = "";
    let stdoutTail = "";
    const appendTail = (current, chunk) => (current + String(chunk || "")).slice(-4000);
    proc.stdout?.on("data", (data) => {
      const text = Buffer.from(data).toString("utf8");
      stdoutTail = appendTail(stdoutTail, text);
      this.emitLog("stdout", "[" + label + "] " + text);
    });
    proc.stderr?.on("data", (data) => {
      const text = Buffer.from(data).toString("utf8");
      stderrTail = appendTail(stderrTail, text);
      this.emitLog("stderr", "[" + label + "] " + text);
    });
    proc.on("error", (err) => {
      this.status = "error";
      this.lastError = label + ": " + err.message;
      this.emitLog("error", this.lastError);
      this.emitStatus();
    });
    proc.on("exit", (code, signal) => {
      const wasStopping = this.stopping;
      if (this.dashboardProc === proc) this.dashboardProc = null;
      if (this.apiProc === proc) this.apiProc = null;
      const exitMsg = "[hermes-portable] " + label + " exited code=" + (code ?? "null") + " signal=" + (signal ?? "") + (wasStopping || code === 0 ? " (normal stop)" : " (unexpected)");
      this.emitLog("exit", exitMsg);
      if (!wasStopping && code !== 0) {
        this.lastError = label + " exited unexpectedly with code " + (code ?? "null") + (stderrTail.trim() ? ": " + stderrTail.trim().slice(-1200) : "");
        this.emitLog("stderr", "[hermes-portable] unexpected " + label + " exit diagnostics\nstdoutTail=" + stdoutTail.trim().slice(-1200) + "\nstderrTail=" + stderrTail.trim().slice(-1200));
      }
      this.getStatus().catch(() => this.emitStatus());
    });
    this.emitStatus();
    return proc;
  }
  dashboardRootReady() {
    return new Promise((resolve) => {
      const req = require$$3.get({ hostname: "127.0.0.1", port: 9119, path: "/" }, (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => raw += chunk);
        res.on("end", () => {
          resolve((res.statusCode || 0) < 400 && !raw.includes("Frontend not built"));
        });
      });
      req.on("error", () => resolve(false));
      req.setTimeout(3000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }
  async stopHermesDashboard() {
    const hermesCommand = this.getHermesCommand(["dashboard", "--stop"]);
    if (!fs$1.existsSync(hermesCommand.command)) return;
    try {
      child_process.execFileSync(hermesCommand.command, hermesCommand.args, {
        cwd: this.getPortableRoot(),
        env: { ...this.getHermesEnv(), HERMES_WEB_DIST: path$1.join(this.getPortableRoot(), "hermes-agent", "hermes_cli", "web_dist") },
        encoding: "utf8",
        timeout: 1e4,
        windowsHide: true
      });
    } catch {
    }
  }
  async startDashboard(options = {}) {
    const open = options.open !== false;
    if (await this.checkTcpPort(9119)) {
      if (await this.dashboardRootReady()) {
        if (open) openHermesInMainWindow("http://127.0.0.1:9119");
        return await this.getStatus();
      }
      this.emitLog("system", "[dashboard] stale dashboard detected, restarting 9119");
      await this.stopPort(9119);
      await this.stopHermesDashboard();
      this.dashboardProc = null;
      await new Promise((resolve) => setTimeout(resolve, 1800));
    }
    if (!this.dashboardProc) {
      this.dashboardProc = this.spawnHermes(["dashboard", "--host", "127.0.0.1", "--port", "9119", "--no-open"], "dashboard");
    }
    const ready = await this.waitForPort(9119, 9e4, () => !!this.dashboardProc);
    if (ready && open) openHermesInMainWindow("http://127.0.0.1:9119");
    if (!ready) {
      this.lastError = "Hermes Dashboard did not become ready on 127.0.0.1:9119";
      this.emitLog("stderr", "[dashboard] " + this.lastError);
    }
    return await this.getStatus();
  }
  async startApiServer(options = {}) {
    const open = options.open === true;
    if (await this.checkTcpPort(8642)) {
      if (open) this.emitLog("system", "[api-server] Agent API ready at http://127.0.0.1:8642/v1 (Bearer auth required)");
      return await this.getStatus();
    }
    if (!this.apiProc) {
      this.apiProc = this.spawnHermes(["gateway", "--accept-hooks", "run"], "api-server", {
        API_SERVER_ENABLED: "true",
        API_SERVER_HOST: "127.0.0.1",
        API_SERVER_PORT: "8642",
        API_SERVER_KEY: this.apiServerKey,
        API_SERVER_MODEL_NAME: "hermes-agent",
        HERMES_ACCEPT_HOOKS: "1"
      });
    }
    const ready = await this.waitForPort(8642, 9e4, () => !!this.apiProc);
    if (ready && open) this.emitLog("system", "[api-server] Agent API ready at http://127.0.0.1:8642/v1 (Bearer auth required)");
    if (!ready) {
      this.lastError = "Hermes API Server did not become ready on 127.0.0.1:8642. Check Hermes model/provider config first.";
      this.emitLog("stderr", "[api-server] " + this.lastError);
    }
    return await this.getStatus();
  }
  async openConfig() {
    if (!(await this.checkTcpPort(17520))) await this.start({ open: false });
    openHermesInMainWindow("http://127.0.0.1:17520");
    return await this.getStatus();
  }
  async openDashboard() {
    return await this.startDashboard({ open: true });
  }
  async openApiServer() {
    return await this.startApiServer({ open: true });
  }
  async stop() {
    this.stopping = true;
    const pid = this.proc?.pid;
    try {
      for (const child of this.chatChildren.values()) this.killChild(child);
      this.chatChildren.clear();
      this.chatRunMeta.clear();
      this.killChild(this.proc);
      this.killChild(this.dashboardProc);
      this.killChild(this.apiProc);
      await this.stopPort(17520);
      await this.stopPort(8642);
      await this.stopPort(9119);
    } catch (err) {
      this.lastError = err instanceof Error ? err.message : String(err);
    }
    this.proc = null;
    this.dashboardProc = null;
    this.apiProc = null;
    this.stopping = false;
    this.status = "idle";
    this.memoryMb = 0;
    this.emitStatus();
    return this.snapshot();
  }
  async getStatus(options = {}) {
    const fast = options?.fast === true;
    const now = Date.now();
    if (fast && this._lastStatusSnapshot && now - this._lastStatusAt < 5000) {
      return this._lastStatusSnapshot;
    }
    if (fast) {
      const snap = {
        ...this.snapshot({ fast: true }),
        portableRoot: this.getPortableRoot(),
        configUrl: "http://127.0.0.1:17520",
        dashboardUrl: "http://127.0.0.1:9119",
        apiServerUrl: "http://127.0.0.1:8642",
        gatewayUrl: "http://127.0.0.1:8642",
        configReady: this._lastStatusSnapshot?.configReady || false,
        dashboardReady: this._lastStatusSnapshot?.dashboardReady || false,
        apiServerReady: this._lastStatusSnapshot?.apiServerReady || false,
        gatewayReady: this._lastStatusSnapshot?.gatewayReady || false
      };
      this._lastStatusSnapshot = snap;
      this._lastStatusAt = now;
      if (!this._statusRefreshInFlight || now - (this._statusRefreshStartedAt || 0) > 5000) {
        this._statusRefreshStartedAt = now;
        this._statusRefreshInFlight = this.getStatus({ fast: false }).catch(() => null).finally(() => {
          this._statusRefreshInFlight = null;
        });
      }
      return snap;
    }
    const configReady = await this.checkTcpPort(17520);
    const dashboardReady = await this.checkTcpPort(9119);
    const apiServerReady = await this.checkTcpPort(8642);
    const gatewayReady = apiServerReady;
    if (configReady || dashboardReady || apiServerReady) this.status = "running";
    else if (this.proc || this.dashboardProc || this.apiProc) {
      if (this.status !== "error") this.status = "starting";
    }
    else if (this.status !== "error") this.status = "idle";
    this.refreshMemory();
    const snap = {
      ...this.snapshot(),
      portableRoot: this.getPortableRoot(),
      configUrl: "http://127.0.0.1:17520",
      dashboardUrl: "http://127.0.0.1:9119",
      apiServerUrl: "http://127.0.0.1:8642",
      gatewayUrl: "http://127.0.0.1:8642",
      configReady,
      dashboardReady,
      apiServerReady,
      gatewayReady
    };
    safeSend("hermes-status", snap);
    this._lastStatusSnapshot = snap;
    this._lastStatusAt = Date.now();
    return snap;
  }
  async chat(options = {}) {
    const message = typeof options.message === "string" ? options.message.trim() : "";
    if (!message) {
      return { ok: false, error: "消息不能为空" };
    }
    const skillInstallRequest = this.detectPortableSkillInstallRequest(message);
    if (skillInstallRequest) {
      const result = await this.installPortableSkillFromGit(skillInstallRequest.url);
      if (result.ok) {
        const names = (result.installed || []).map((item) => item.name).join(", ") || "已安装技能";
        return { ok: true, reply: "已通过便携安装器安装 skill：" + names + "。\n安装位置：" + result.skillsRoot + "\n已同步给 Hermes，OpenClaw 与 Hermes 可以共用。" };
      }
      return { ok: false, error: "Skill 安装失败：" + (result.error || "未知错误") };
    }
    const hermesCommand = this.getHermesCommand([]);
    if (!fs$1.existsSync(hermesCommand.command)) {
      return { ok: false, error: "Hermes CLI runtime not found: " + hermesCommand.command };
    }
    function readJsonSafe(filePath) {
      try {
        if (!fs$1.existsSync(filePath)) return null;
        return JSON.parse(fs$1.readFileSync(filePath, "utf8"));
      } catch {
        return null;
      }
    }
    function resolveOpenClawModel() {
      const config = readJsonSafe(path$1.join(getAppRoot(), "data", ".openclaw", "openclaw.json"));
      const primary = config?.agents?.defaults?.model?.primary || "";
      const parts = String(primary).split("/");
      const providerId = parts.length > 1 ? parts[0] : "";
      const modelId = parts.length > 1 ? parts.slice(1).join("/") : primary;
      const providerConfig = providerId ? config?.models?.providers?.[providerId] : null;
      if (!providerConfig) return null;
      return {
        provider: providerId,
        model: modelId,
        apiKey: providerConfig.apiKey || providerConfig.key || "",
        baseUrl: providerConfig.baseUrl || providerConfig.base || "",
        api: providerConfig.api || ""
      };
    }
    function resolveHermesModel() {
      const hub = readJsonSafe(path$1.join(getAppRoot(), "data", ".hermes", "config", "hub.json"));
      const model = hub?.model || {};
      if (model.apiKey || model.baseUrl || model.model && model.model !== "hermes-agent") {
        return { provider: model.provider || "", model: model.model || "", apiKey: model.apiKey || "", baseUrl: model.baseUrl || "" };
      }
      return null;
    }
    function mapProvider(provider, baseUrl) {
      const id = String(provider || "").toLowerCase();
      const base = String(baseUrl || "").toLowerCase();
      if (base) return "openai-api";
      if (id === "qwen") return "openai-api";
      if (id === "deepseek") return "openai-api";
      if (id === "kimi" || id === "moonshot") return "openai-api";
      if (id === "custom" || id === "openai-compatible") return "openai-api";
      return provider || "openai-api";
    }
    const runtimeModel = resolveHermesModel() || resolveOpenClawModel() || {};
    try {
      if (!this.proc && !(await this.checkTcpPort(17520))) {
        this.start({ open: false }).catch((err) => {
          safeSend("hermes-log", { type: "stderr", msg: "[hermes-chat] background start failed: " + (err instanceof Error ? err.message : String(err)) });
        });
      }
    } catch (err) {
      safeSend("hermes-log", { type: "stderr", msg: "[hermes-chat] background start failed: " + (err instanceof Error ? err.message : String(err)) });
    }
    const args = ["--oneshot", message];
    const modelName = typeof options.modelName === "string" && options.modelName.trim() ? options.modelName.trim() : runtimeModel.model || "";
    const apiKey = typeof options.apiKey === "string" && options.apiKey.trim() ? options.apiKey.trim() : runtimeModel.apiKey || "";
    const baseUrl = typeof options.baseUrl === "string" && options.baseUrl.trim() ? options.baseUrl.trim() : runtimeModel.baseUrl || "";
    const provider = mapProvider(typeof options.provider === "string" && options.provider.trim() ? options.provider.trim() : runtimeModel.provider, baseUrl);
    if (provider) args.push("--provider", provider);
    if (modelName) args.push("--model", modelName);
    const memoryPath = typeof options.memoryPath === "string" && options.memoryPath.trim() ? options.memoryPath.trim() : path$1.join(getAppRoot(), "data", ".hermes", "memories");
    const env2 = {
      ...this.getHermesEnv(),
      HERMES_MEMORY_PATH: memoryPath,
      HERMES_ACCEPT_HOOKS: "1",
      HERMES_BROWSER_OPENED: "1",
      PYTHONIOENCODING: "utf-8",
      PYTHONUTF8: "1"
    };
    if (apiKey) {
      env2.HERMES_API_KEY = apiKey;
      env2.OPENAI_API_KEY = apiKey;
      env2.DASHSCOPE_API_KEY = apiKey;
      env2.DEEPSEEK_API_KEY = apiKey;
      env2.KIMI_CN_API_KEY = apiKey;
    }
    if (baseUrl) {
      env2.HERMES_BASE_URL = baseUrl;
      env2.OPENAI_BASE_URL = baseUrl;
      env2.DASHSCOPE_BASE_URL = baseUrl;
      env2.DEEPSEEK_BASE_URL = baseUrl;
      env2.KIMI_CN_BASE_URL = baseUrl;
    }
    const chatCommand = this.getHermesCommand(args);
    safeSend("hermes-log", { type: "system", msg: "[hermes-chat] starting oneshot: " + chatCommand.command + " " + chatCommand.args.join(" ") + " provider=" + (provider || "auto") + " model=" + (modelName || "auto") + " key=" + (apiKey ? "present" : "missing") });
    const manager = this;
    return await new Promise((resolve) => {
      const progressBase = {
        sessionId: options.sessionId || "hermes-ai-chat",
        mode: options.sessionId === "openclaw-hermes-collab" ? "collab" : "hermes",
        startedAt: Date.now()
      };
      const startedAtMs = progressBase.startedAt;
      let lastProgressKey = "";
      let lastProgressAt = 0;
      const formatElapsed = () => {
        const seconds = Math.max(0, Math.round((Date.now() - startedAtMs) / 1000));
        if (seconds < 60) return seconds + " 秒";
        return Math.floor(seconds / 60) + " 分 " + String(seconds % 60).padStart(2, "0") + " 秒";
      };
      const emitProgress = (stage, detail = "") => {
        const now = Date.now();
        const displayDetail = detail + " 已等待 " + formatElapsed();
        const key = stage + "\n" + displayDetail;
        if (key === lastProgressKey && now - lastProgressAt < 7000) return;
        lastProgressKey = key;
        lastProgressAt = now;
        safeSend("hermes-chat-progress", { ...progressBase, stage, detail: displayDetail, elapsedMs: now - startedAtMs, elapsedText: formatElapsed(), at: Date.now() });
      };
      emitProgress("starting", "Hermes 正在准备本地运行环境...");
      const child = child_process.spawn(chatCommand.command, chatCommand.args, {
        cwd: path$1.join(getAppRoot(), "data", ".hermes"),
        env: env2,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true
      });
      const pendingChildKey = options.taskId || "pending-" + Date.now();
      manager.chatChildren.set(pendingChildKey, child);
      let stdout = "";
      let stderr = "";
      let stdoutBytes = 0;
      let stderrBytes = 0;
      let lastStderrLogAt = 0;
      let lastStdoutSpillAt = 0;
      let lastStderrSpillAt = 0;
      let spoolChain = Promise.resolve();
      let settled = false;
      function appendFileQueued(filePath, chunk) {
        /* codex-hermes-chat-async-spool */
        const payload = Buffer.from(chunk);
        spoolChain = spoolChain.then(() => fs$1.promises.appendFile(filePath, payload)).catch((err) => {
          safeSend("hermes-log", { type: "stderr", msg: "[chat-spool] write failed: " + (err?.message || err) });
        });
      }
      async function flushSpoolWrites() {
        try {
          await spoolChain;
        } catch {
        }
      }
      const runId = "hermes-chat-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
      const runDir = path$1.join(getAppRoot(), "data", ".hermes", "runs", runId);
      const stdoutPath = path$1.join(runDir, "stdout.txt");
      const stderrPath = path$1.join(runDir, "stderr.txt");
      const statusPath = path$1.join(runDir, "status.json");
      const resultPath = path$1.join(runDir, "result.json");
      fs$1.mkdirSync(runDir, { recursive: true });
      if (!options.taskId) {
        manager.chatChildren.delete(pendingChildKey);
        manager.chatChildren.set(runId, child);
      }
      manager.chatRunMeta.set(options.taskId || runId, { statusPath, resultPath, runId, runDir, stdoutPath, stderrPath, sessionId: options.sessionId || "hermes-ai-chat" });
      fs$1.writeFileSync(path$1.join(runDir, "request.json"), JSON.stringify({ startedAt: new Date().toISOString(), taskId: options.taskId || "", sessionId: options.sessionId || "hermes-ai-chat", mode: options.sessionId === "openclaw-hermes-collab" ? "collab" : "hermes", message, provider, modelName }, null, 2) + "\n", "utf8");
      fs$1.writeFileSync(statusPath, JSON.stringify({ status: "running", startedAt: new Date().toISOString(), taskId: options.taskId || "", sessionId: options.sessionId || "hermes-ai-chat", runId, runDir }, null, 2) + "\n", "utf8");
      emitProgress("model", "Hermes 已启动，正在调用模型：" + (modelName || "当前配置模型"));
      const heartbeat = setInterval(() => {
        emitProgress("waiting", "模型仍在处理，本轮任务没有中断；可继续切换其他页面。");
      }, 8000);
      const maxStdoutBytes = Number(options.maxStdoutBytes) || 1024 * 1024;
      const maxStderrBytes = Number(options.maxStderrBytes) || 256 * 1024;
      function appendLimited(current, text, limit) {
        const next = current + text;
        return next.length > limit ? next.slice(-limit) : next;
      }
      function finish(payload) {
        if (settled) return;
        settled = true;
        const finalStatus = payload?.errorKind === "cancelled" ? "cancelled" : payload?.ok === false ? "failed" : "finished";
        try {
          fs$1.writeFileSync(resultPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
          fs$1.writeFileSync(statusPath, JSON.stringify({ status: finalStatus, finishedAt: new Date().toISOString(), taskId: options.taskId || "", sessionId: options.sessionId || "hermes-ai-chat", runId, runDir, stdoutPath, stderrPath, resultPath }, null, 2) + "\n", "utf8");
        } catch (err) {
          safeSend("hermes-log", { type: "stderr", msg: "[chat-status] write failed: " + (err?.message || err) });
        }
        manager.chatChildren.delete(options.taskId || runId);
        manager.chatRunMeta.delete(options.taskId || runId);
        clearTimeout(timer);
        clearInterval(heartbeat);
        emitProgress(payload?.ok === false ? "error" : "done", payload?.ok === false ? "Hermes 本轮请求未完成，已生成友好错误说明。" : "Hermes 已完成回复。");
        resolve(payload);
      }
      function noteOutputSpill(streamName, bytes, filePath) {
        const now = Date.now();
        if (streamName === "stdout") {
          if (now - lastStdoutSpillAt < 3000 && bytes > 0) return;
          lastStdoutSpillAt = now;
        } else {
          if (now - lastStderrSpillAt < 3000 && bytes > 0) return;
          lastStderrSpillAt = now;
        }
        const marker = streamName + " 已写入 " + Math.round(bytes / 1024) + "KB 到 " + filePath + "；桌面仅保留尾部用于显示，任务会继续执行。";
        safeSend("hermes-log", { type: "system", msg: "[chat-output-spool] " + marker });
      }
      function classifyHermesError(rawText, context = {}) {
        const raw = String(rawText || "").trim();
        const lower = raw.toLowerCase();
        const has = (items) => items.some((item) => lower.includes(String(item).toLowerCase()) || raw.includes(String(item)));
        const logLine = context.runDir ? "\n\n\u6280\u672f\u65e5\u5fd7\uff1a" + context.runDir : "";
        const build = (errorKind, title, reasons, actions) => ({
          ok: false,
          errorKind,
          error: title + (reasons && reasons.length ? "\n\n\u53ef\u80fd\u539f\u56e0\uff1a\n" + reasons.map((item, index) => index + 1 + ". " + item).join("\n") : "") + (actions && actions.length ? "\n\n\u5efa\u8bae\u5904\u7406\uff1a\n" + actions.map((item, index) => index + 1 + ". " + item).join("\n") : "") + logLine,
          suggestions: actions || [],
          technicalError: raw.slice(-4000),
          runId: context.runId,
          runDir: context.runDir,
          stdoutPath: context.stdoutPath,
          stderrPath: context.stderrPath
        });
        if (has(["insufficient_quota", "quota", "billing", "balance", "insufficient balance", "credit", "payment required", "resource_exhausted", "402", "\u989d\u5ea6", "\u4f59\u989d", "\u6b20\u8d39", "\u5145\u503c"])) {
          return build("quota_exhausted", "\u5f53\u524d\u6a21\u578b API \u989d\u5ea6\u4e0d\u8db3\u6216\u8d26\u6237\u4f59\u989d\u5df2\u7528\u5b8c\uff0cHermes \u65e0\u6cd5\u7ee7\u7eed\u8c03\u7528\u6a21\u578b\u3002", [], ["\u5145\u503c token/API \u5957\u9910\u540e\u91cd\u8bd5\u3002", "\u6216\u5728\u201c\u6a21\u578b\u914d\u7f6e\u201d\u4e2d\u5207\u6362\u5230\u5176\u4ed6\u53ef\u7528\u6a21\u578b\uff0c\u5e76\u5148\u70b9\u51fb\u6d4b\u8bd5\u8fde\u63a5\u3002"]);
        }
        if (has(["invalid_api_key", "invalid api key", "unauthorized", "forbidden", "permission denied", "401", "403", "api key", "\u9274\u6743", "\u8ba4\u8bc1", "\u6743\u9650", "\u5bc6\u94a5\u65e0\u6548"])) {
          return build("auth", "\u5f53\u524d\u6a21\u578b API Key \u65e0\u6548\u3001\u5df2\u8fc7\u671f\uff0c\u6216\u6ca1\u6709\u8bbf\u95ee\u8be5\u6a21\u578b\u7684\u6743\u9650\u3002", [], ["\u8bf7\u5728\u201c\u6a21\u578b\u914d\u7f6e\u201d\u4e2d\u91cd\u65b0\u586b\u5199 API Key\u3002", "\u4fdd\u5b58\u540e\u5148\u6d4b\u8bd5\u8fde\u63a5\uff0c\u518d\u56de\u5230 Hermes \u5bf9\u8bdd\u91cd\u8bd5\u3002"]);
        }
        if (has(["rate limit", "too many requests", "429", "\u9650\u6d41", "\u9891\u7387", "\u8bf7\u6c42\u8fc7\u591a"])) {
          return build("rate_limit", "\u6a21\u578b\u670d\u52a1\u5f53\u524d\u9650\u6d41\uff0cHermes \u6682\u65f6\u6ca1\u6709\u62ff\u5230\u53ef\u7528\u56de\u590d\u3002", [], ["\u7a0d\u540e\u91cd\u8bd5\u3002", "\u5982\u679c\u9891\u7e41\u51fa\u73b0\uff0c\u8bf7\u5207\u6362\u5230\u66f4\u9ad8\u9650\u989d\u7684\u6a21\u578b\u6216\u5957\u9910\u3002"]);
        }
        if (has(["econnreset", "enotfound", "etimedout", "connecttimeout", "fetch failed", "network", "socket hang up", "timeout", "\u7f51\u7edc", "\u8d85\u65f6", "\u4ee3\u7406"])) {
          return build("network", "Hermes \u8fde\u63a5\u6a21\u578b\u670d\u52a1\u5931\u8d25\uff0c\u53ef\u80fd\u662f\u7f51\u7edc\u3001\u4ee3\u7406\u6216\u670d\u52a1\u7aef\u6682\u65f6\u4e0d\u53ef\u7528\u3002", [], ["\u68c0\u67e5\u7f51\u7edc\u548c\u4ee3\u7406\u8bbe\u7f6e\u540e\u91cd\u8bd5\u3002", "\u5230\u201c\u6a21\u578b\u914d\u7f6e\u201d\u9875\u6d4b\u8bd5 Base URL \u662f\u5426\u53ef\u8fde\u63a5\u3002"]);
        }
        if (has(["model not found", "invalid model", "not found", "404", "\u6a21\u578b\u4e0d\u5b58\u5728", "\u6a21\u578b\u540d\u79f0"])) {
          return build("model_not_found", "\u5f53\u524d\u914d\u7f6e\u7684\u6a21\u578b\u540d\u79f0\u6216 Base URL \u4e0d\u6b63\u786e\uff0cHermes \u65e0\u6cd5\u8c03\u7528\u8be5\u6a21\u578b\u3002", [], ["\u8bf7\u5728\u201c\u6a21\u578b\u914d\u7f6e\u201d\u4e2d\u68c0\u67e5\u6a21\u578b\u540d\u79f0\u3001\u4f9b\u5e94\u5546\u548c Base URL\u3002", "\u4fdd\u5b58\u540e\u70b9\u51fb\u6d4b\u8bd5\u8fde\u63a5\u3002"]);
        }
        if (has(["no final response was produced", "no final response"])) {
          return build("no_final_response", "Hermes \u6ca1\u6709\u4ece\u6a21\u578b\u670d\u52a1\u62ff\u5230\u53ef\u7528\u56de\u590d\u3002", ["API \u989d\u5ea6\u4e0d\u8db3\u6216\u8d26\u6237\u4f59\u989d\u5df2\u7528\u5b8c\u3002", "API Key \u65e0\u6548\u3001\u8fc7\u671f\uff0c\u6216\u6ca1\u6709\u8be5\u6a21\u578b\u6743\u9650\u3002", "\u6a21\u578b\u670d\u52a1\u9650\u6d41\u6216\u7f51\u7edc\u8d85\u65f6\u3002", "\u6a21\u578b\u540d\u79f0\u6216 Base URL \u914d\u7f6e\u4e0d\u6b63\u786e\u3002"], ["\u8bf7\u5148\u5230\u201c\u6a21\u578b\u914d\u7f6e\u201d\u9875\u6d4b\u8bd5\u5f53\u524d\u6a21\u578b\u8fde\u63a5\u3002", "\u5982\u679c\u989d\u5ea6\u4e0d\u8db3\uff0c\u8bf7\u5145\u503c\u6216\u5207\u6362\u5230\u5176\u4ed6\u53ef\u7528\u6a21\u578b\u540e\u91cd\u8bd5\u3002"]);
        }
        return build("unknown", "Hermes \u672c\u6b21\u6ca1\u6709\u5b8c\u6210\u8bf7\u6c42\uff0c\u4f46\u5e95\u5c42\u9519\u8bef\u6ca1\u6709\u7ed9\u51fa\u660e\u786e\u539f\u56e0\u3002", ["\u6a21\u578b API \u989d\u5ea6\u6216\u4f59\u989d\u95ee\u9898\u3002", "API Key\u3001\u6a21\u578b\u540d\u79f0\u6216 Base URL \u914d\u7f6e\u95ee\u9898\u3002", "\u7f51\u7edc\u3001\u4ee3\u7406\u6216\u6a21\u578b\u670d\u52a1\u6682\u65f6\u5f02\u5e38\u3002"], ["\u8bf7\u5230\u201c\u6a21\u578b\u914d\u7f6e\u201d\u9875\u70b9\u51fb\u6d4b\u8bd5\u8fde\u63a5\u3002", "\u68c0\u67e5\u65e5\u5fd7\u8def\u5f84\u4e2d\u7684\u8be6\u7ec6\u4fe1\u606f\uff0c\u6216\u66f4\u6362\u6a21\u578b\u540e\u91cd\u8bd5\u3002"]);
      }
      const timer = setTimeout(() => {
        try {
          child.kill("SIGKILL");
        } catch {
        }
        const errTail = stderr.trim().slice(-1200);
        const timeoutResult = classifyHermesError("timeout " + errTail, { runId, runDir, stdoutPath, stderrPath });
        const timeoutMessage = timeoutResult.error;
        safeSend("hermes-log", { type: "stderr", msg: "[chat-timeout] " + timeoutMessage });
        finish(timeoutResult);
      }, Number(options.timeoutMs) || 1800000);
      child.stdout?.on("data", (data) => {
        const chunk = Buffer.from(data);
        stdoutBytes += chunk.length;
        appendFileQueued(stdoutPath, chunk);
        stdout = appendLimited(stdout, chunk.toString("utf8"), maxStdoutBytes);
        emitProgress("receiving", "Hermes 已收到模型输出，正在整理回复...");
        if (stdoutBytes === chunk.length || stdoutBytes % (1024 * 1024) < chunk.length) noteOutputSpill("stdout", stdoutBytes, stdoutPath);
      });
      child.stderr?.on("data", (data) => {
        const chunk = Buffer.from(data);
        stderrBytes += chunk.length;
        const text = chunk.toString("utf8");
        appendFileQueued(stderrPath, chunk);
        stderr = appendLimited(stderr, text, maxStderrBytes);
        const now = Date.now();
        if (now - lastStderrLogAt > 3000) {
          lastStderrLogAt = now;
          safeSend("hermes-log", { type: "stderr", msg: "[chat] " + text.slice(-1200) });
          emitProgress("working", "Hermes 正在执行工具/插件初始化，详细过程已写入日志。");
        }
        if (stderrBytes === chunk.length || stderrBytes % (512 * 1024) < chunk.length) noteOutputSpill("stderr", stderrBytes, stderrPath);
      });
      child.on("error", (err) => {
        finish(classifyHermesError(err.message, { runId, runDir, stdoutPath, stderrPath }));
      });
      child.on("exit", async (code) => {
        await flushSpoolWrites();
        if (settled) return;
        if (child.__uclawCancelled) {
          finish({ ok: false, errorKind: "cancelled", error: "Hermes task was cancelled by the user.", runId, runDir, stdoutPath, stderrPath });
          return;
        }
        const reply = stdout.trim();
        const errText = stderr.trim();
        if (code !== 0) {
          finish(classifyHermesError(errText.slice(-4000) || reply.slice(-4000) || "Hermes chat exited with code " + code, { runId, runDir, stdoutPath, stderrPath }));
          return;
        }
        if (!reply) {
          finish(classifyHermesError("no final response was produced", { runId, runDir, stdoutPath, stderrPath }));
          return;
        }
        const replyForUi = reply.length > maxStdoutBytes ? reply.slice(-maxStdoutBytes) + "\n\n[完整输出已保存到 " + stdoutPath + "]" : reply;
        finish({ ok: true, reply: replyForUi, raw: stdout, runId, runDir, stdoutPath, stderrPath });
      });
    });
  }
}
let hermesManager = null;
const hermesChatResults = /* @__PURE__ */ new Map();
const HERMES_CHAT_STALE_MS = 30 * 1000;
function readHermesChatResultFromRuns(taskId) {
  if (!taskId) return null;
  const runsRoot = path$1.join(getAppRoot(), "data", ".hermes", "runs");
  try {
    if (!fs$1.existsSync(runsRoot)) return null;
    const dirs = fs$1.readdirSync(runsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => {
      const fullPath = path$1.join(runsRoot, entry.name);
      let mtimeMs = 0;
      try {
        mtimeMs = fs$1.statSync(fullPath).mtimeMs;
      } catch {
      }
      return { name: entry.name, fullPath, mtimeMs };
    }).sort((a, b) => b.mtimeMs - a.mtimeMs).slice(0, 60);
    for (const dir of dirs) {
      const requestPath = path$1.join(dir.fullPath, "request.json");
      if (!fs$1.existsSync(requestPath)) continue;
      let request = null;
      try {
        request = JSON.parse(fs$1.readFileSync(requestPath, "utf8"));
      } catch {
        continue;
      }
      if (request?.taskId !== taskId) continue;
      const stdoutPath = path$1.join(dir.fullPath, "stdout.txt");
      const stderrPath = path$1.join(dir.fullPath, "stderr.txt");
      const statusPath = path$1.join(dir.fullPath, "status.json");
      const resultPath = path$1.join(dir.fullPath, "result.json");
      const finishedAt = Date.now();
      let status = null;
      let result = null;
      try {
        if (fs$1.existsSync(statusPath)) status = JSON.parse(fs$1.readFileSync(statusPath, "utf8"));
      } catch {
      }
      try {
        if (fs$1.existsSync(resultPath)) result = JSON.parse(fs$1.readFileSync(resultPath, "utf8"));
      } catch {
      }
      if (result && ["finished", "failed", "cancelled"].includes(status?.status || "")) {
        const payload = {
          taskId,
          sessionId: request.sessionId || "hermes-ai-chat",
          mode: request.mode || (request.sessionId === "openclaw-hermes-collab" ? "collab" : "hermes"),
          result: { ...result, runId: result.runId || dir.name, runDir: result.runDir || dir.fullPath, stdoutPath: result.stdoutPath || stdoutPath, stderrPath: result.stderrPath || stderrPath },
          finishedAt
        };
        hermesChatResults.set(taskId, payload);
        return payload;
      }
      if (status?.status === "failed" || status?.status === "cancelled") {
        const payload = {
          taskId,
          sessionId: request.sessionId || "hermes-ai-chat",
          mode: request.mode || (request.sessionId === "openclaw-hermes-collab" ? "collab" : "hermes"),
          result: { ok: false, error: status.error || "Hermes task did not complete.", runId: dir.name, runDir: dir.fullPath, stdoutPath, stderrPath },
          finishedAt
        };
        hermesChatResults.set(taskId, payload);
        return payload;
      }
      if (status?.status === "running") {
        const startedAtMs = Date.parse(status.startedAt || request.startedAt || "");
        const ageMs = Number.isFinite(startedAtMs) ? Date.now() - startedAtMs : Infinity;
        const hasLiveChild = !!hermesManager?.chatChildren?.has?.(taskId);
        if (hasLiveChild) {
          return {
            taskId,
            sessionId: request.sessionId || "hermes-ai-chat",
            mode: request.mode || (request.sessionId === "openclaw-hermes-collab" ? "collab" : "hermes"),
            pending: true,
            startedAt: status.startedAt || request.startedAt || null,
            runId: dir.name,
            runDir: dir.fullPath,
            stdoutPath,
            stderrPath
          };
        }
        if (!hasLiveChild && ageMs > HERMES_CHAT_STALE_MS) {
          const resultPayload = {
            ok: false,
            errorKind: "interrupted",
            error: "上一次 Hermes 任务已中断，程序已自动恢复会话。请重新发送消息；如果反复出现，请在首页重新启动 Hermes 后再试。",
            runId: dir.name,
            runDir: dir.fullPath,
            stdoutPath,
            stderrPath
          };
          const payload = {
            taskId,
            sessionId: request.sessionId || "hermes-ai-chat",
            mode: request.mode || (request.sessionId === "openclaw-hermes-collab" ? "collab" : "hermes"),
            result: resultPayload,
            finishedAt
          };
          try {
            fs$1.writeFileSync(resultPath, JSON.stringify(resultPayload, null, 2) + "\n", "utf8");
            fs$1.writeFileSync(statusPath, JSON.stringify({ status: "failed", errorKind: "interrupted", finishedAt: new Date().toISOString(), taskId, sessionId: request.sessionId || "hermes-ai-chat", runId: dir.name, runDir: dir.fullPath, stdoutPath, stderrPath, resultPath }, null, 2) + "\n", "utf8");
          } catch (err) {
            safeSend("hermes-log", { type: "stderr", msg: "[hermes-chat-result] stale task close failed: " + (err instanceof Error ? err.message : String(err)) });
          }
          hermesChatResults.set(taskId, payload);
          safeSend("hermes-chat-result", payload);
          return payload;
        }
      }
      return null;
    }
  } catch (err) {
    safeSend("hermes-log", { type: "stderr", msg: "[hermes-chat-result] run recovery failed: " + (err instanceof Error ? err.message : String(err)) });
  }
  return null;
}
function getHermesManager() {
  if (!hermesManager) {
    hermesManager = new HermesManager({ dataDir: getDataRoot() });
  }
  return hermesManager;
}

const IS_DEV = !electron.app.isPackaged;
const env = {
  rendererPort: 8080,
  appName: "OpenClaw",
  gatewayDefaultPort: "18789"
};
const APP_NAME = env.appName;
const GATEWAY_DEFAULT_PORT = Number(env.gatewayDefaultPort);
const REMOTE_API_DISABLED_MESSAGE = "远程服务器功能已移除";
const RENDER_PORT = env.rendererPort;
let wechatManager = null;
function initWechat() {
  const wechatRuntimeDir = getOpenClawRuntimeBinDir();
  wechatManager = new WechatManager({ runtimeDir: wechatRuntimeDir, usbRuntime: getActiveRuntimeDir(), dataDir: getDataRoot(), isDev: IS_DEV });
  wechatManager.on("status", (status) => {
    safeSend("wechat-status", status);
  });
  wechatManager.on("qr-url", (url2) => {
    console.log("出现二维码===>", url2);
    safeSend("wechat-qr-url", url2);
  });
  wechatManager.on("qr-text", (text) => {
    console.log("出现二维码文本===>", text);
    safeSend("wechat-qr-text", text);
  });
  wechatManager.on("log", (msg) => {
    safeSend("wechat-log", msg);
  });
}
function getWechatManagerInstance() {
  return wechatManager;
}
let mainWindow$1 = null;
let splashWindow = null;
let tray = null;
let hermesInternalWindow = null;
const logoPath = IS_DEV ? path$1.join(electron.app.getAppPath(), "src", "assets", "logo.png") : path$1.join(__dirname, "..", "assets", "logo.png");
const appIconPath = IS_DEV ? path$1.join(electron.app.getAppPath(), "src", "assets", "logo.png") : path$1.join(__dirname, "..", "assets", "icon.ico");
const splashHTML = `<html><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:rgba(15,23,42,0.95);border-radius:16px;font-family:system-ui;color:white;flex-direction:column;border:1px solid #2A3040;overflow:hidden;">
  <img src="file://${logoPath}" style="width:60px;height:60px;margin-bottom:12px;border-radius:8px" />
  <div style="-webkit-text-fill-color: transparent;font-size:24px;font-weight:bold;margin-bottom:18px;background: linear-gradient(135deg, #ff6b35, #ff8f65);background-clip: text;">${APP_NAME}</div>
  <div id="status" style="font-size:22px;color:#94a3b8;text-align:center;padding:0 20px">Loading...</div>
  <div id="progress" style="width:200px;height:4px;background:#334155;border-radius:2px;margin-top:12px;overflow:hidden;display:none">
    <div id="bar" style="width:0%;height:100%;background:#3b82f6;border-radius:2px;transition:width 0.3s"></div>
  </div>
</body></html>`;
function createSplash() {
  splashWindow = new electron.BrowserWindow({
    width: 560,
    height: 440,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    icon: appIconPath,
    skipTaskbar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true, webSecurity: false }
  });
  splashWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(splashHTML));
  splashWindow.center();
}
function updateSplash(text, percent) {
  if (!splashWindow || splashWindow.isDestroyed()) return;
  splashWindow.webContents.executeJavaScript(`
    ${text !== null ? `document.getElementById('status').innerText = ${JSON.stringify(text)};` : ""}
    ${percent !== void 0 ? `
      document.getElementById('progress').style.display = 'block';
      document.getElementById('bar').style.width = '${percent}%';
    ` : ""}
  `).catch(() => {
  });
}
function closeSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
}
function loadActivationPage() {
  if (!mainWindow$1) {
    console.warn("[loadActivationPage] mainWindow is null");
    return;
  }
  if (IS_DEV) {
    mainWindow$1.loadURL(`http://localhost:${RENDER_PORT}/main/index.html#/activate`);
  } else {
    const indexPath = path$1.join(__dirname, "..", "assets", "main", "index.html");
    console.log("[loadActivationPage] PROD: loading", indexPath);
    mainWindow$1.loadFile(indexPath, { hash: "/activate" });
  }
}
function safeSend(channel, data) {
  try {
    let payload = data;
    if (channel === "hermes-log" && data && typeof data.msg === "string") {
      /* codex-safe-send-log-trim */
      const msg = data.msg;
      if (msg.length > 12000) {
        payload = { ...data, msg: msg.slice(0, 5000) + "\n...[界面日志已精简，完整输出已保存在 U 盘 data/.hermes/runs 或 logs 目录]...\n" + msg.slice(-5000) };
      }
    }
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send(channel, payload);
    }
  } catch {
  }
}
function sendBootPhase(phase, title, detail, progress) {
  safeSend("gateway-boot-phase", { phase, title, detail, progress });
}
function sendGatewayStatus(running, errorMsg = "") {
  safeSend("gateway-status", { running, errorMsg, port: GATEWAY_DEFAULT_PORT });
}
const gatewayUiLogThrottle = new Map();
const gatewayDiskLogBuffer = [];
let gatewayDiskLogFlushTimer = null;
function shouldSendGatewayLogToUi(type2, msg) {
  const text = String(msg || "");
  const lower = text.toLowerCase();
  if (lower.includes("[model-pricing]") && lower.includes("fetch failed")) {
    return false;
  }
  if (lower.includes("typeerror: fetch failed") && lower.includes("getupdates")) {
    const key = "wechat-getupdates-fetch-failed";
    const now = Date.now();
    const last = gatewayUiLogThrottle.get(key) || 0;
    gatewayUiLogThrottle.set(key, now);
    return now - last > 3e4;
  }
  return true;
}
function flushGatewayDiskLogs() {
  gatewayDiskLogFlushTimer = null;
  if (!gatewayDiskLogBuffer.length) return;
  const lines = gatewayDiskLogBuffer.splice(0, gatewayDiskLogBuffer.length).join("");
  try {
    const logDir = path$1.join(getDataRoot(), ".openclaw", "logs");
    fs$1.mkdirSync(logDir, { recursive: true });
    fs$1.appendFile(path$1.join(logDir, "gateway-launcher.log"), lines, "utf8", () => {});
  } catch {
  }
}
function queueGatewayDiskLog(type2, msg) {
  gatewayDiskLogBuffer.push(JSON.stringify({
    time: new Date().toISOString(),
    type: type2,
    msg: String(msg || "")
  }) + "\n");
  if (gatewayDiskLogBuffer.length > 500) gatewayDiskLogBuffer.splice(0, gatewayDiskLogBuffer.length - 500);
  if (!gatewayDiskLogFlushTimer) {
    gatewayDiskLogFlushTimer = setTimeout(flushGatewayDiskLogs, 1e3);
  }
}
function sendGatewayLog(type2, msg) {
  queueGatewayDiskLog(type2, msg);
  if (shouldSendGatewayLogToUi(type2, msg)) {
    safeSend("gateway-log", { type: type2, msg });
  }
}
function checkTcpPortOpen(port, timeoutMs = 500) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}
let portableCleanupInFlight = false;
function cleanupPortableChildProcesses() {
  if (process.platform !== "win32") return;
  try {
    const appRoot = path$1.resolve(getAppRoot()).toLowerCase();
    const dataRoot = path$1.resolve(getDataRoot()).toLowerCase();
    const runtimeRoot = path$1.resolve(RUNTIME_DIR).toLowerCase();
    const currentPid = process.pid;
    const ps = [
      "$ErrorActionPreference='SilentlyContinue'",
      "$targets=@(" + [appRoot, dataRoot, runtimeRoot].map((p) => "'" + p.replace(/'/g, "''") + "'").join(",") + ")",
      "$self=" + currentPid,
      "Get-CimInstance Win32_Process | ForEach-Object {",
      "  $cmd=(($_.CommandLine)+'').ToLower(); $exe=(($_.ExecutablePath)+'').ToLower();",
      "  if ($_.ProcessId -eq $self) { return }",
      "  $hit=$false; foreach($t in $targets){ if(($cmd -like ('*'+$t+'*')) -or ($exe -like ($t+'*'))){ $hit=$true; break } }",
      "  if($hit -and ($cmd -match 'openclaw|hermes|runtime|win-unpacked|config_server|hermes_cli|openclaw-weixin|gateway')){",
      "    try { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } catch {}",
      "  }",
      "}"
    ].join("; ");
    if (portableCleanupInFlight) return;
    portableCleanupInFlight = true;
    const child = child_process.spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps], {
      stdio: "ignore",
      windowsHide: true,
      detached: false
    });
    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {
      }
    }, 4000);
    child.on("exit", () => {
      clearTimeout(timer);
      portableCleanupInFlight = false;
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      portableCleanupInFlight = false;
      appendDesktopCrashLog("cleanup-portable-processes-failed", { message: err?.message || String(err) });
    });
  } catch (err) {
    portableCleanupInFlight = false;
    appendDesktopCrashLog("cleanup-portable-processes-failed", { message: err?.message || String(err) });
  }
}
function createWindow(gateway) {
  function createTray() {
    try {
      const iconPath = IS_DEV ? path$1.join(electron.app.getAppPath(), "src", "assets", "logo.png") : path$1.join(__dirname, "..", "assets", "logo.png");
      const trayIcon = electron.nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
      tray = new electron.Tray(trayIcon);
      tray.setToolTip(APP_NAME);
      const contextMenu = electron.Menu.buildFromTemplate([
        {
          label: "📱 打开面板",
          click: () => {
            if (mainWindow$1) {
              mainWindow$1.show();
              mainWindow$1.focus();
            }
          }
        },
        { type: "separator" },
        {
          label: "🧠 Hermes Agent",
          submenu: [
            {
              label: "打开配置中心",
              click: async () => {
                await getHermesManager().openConfig();
              }
            },
            {
              label: "打开 Dashboard",
              click: async () => {
                await getHermesManager().openDashboard();
              }
            },
            {
              label: "启动 Agent API",
              click: async () => {
                await getHermesManager().openApiServer();
              }
            },
            { type: "separator" },
            {
              label: "停止 Hermes",
              click: async () => {
                await getHermesManager().stop();
              }
            }
          ]
        },
        { type: "separator" },
        {
          label: "❌ 完全退出",
          click: () => {
            electron.app.isQuitting = true;
            gateway.stopGatewaySync();
            getHermesManager().stop().finally(() => cleanupPortableChildProcesses());
            getWechatManagerInstance()?.destroy();
            electron.app.quit();
          }
        }
      ]);
      tray.setContextMenu(contextMenu);
      tray.on("double-click", () => {
        if (mainWindow$1) {
          mainWindow$1.show();
          mainWindow$1.focus();
        }
      });
    } catch (e) {
      console.warn("[tray] 创建托盘失败:", e);
    }
  }
  console.log("创建window===>");
  mainWindow$1 = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: APP_NAME,
    maximizable: false,
    frame: false,
    icon: appIconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path$1.join(__dirname, "..", "preload", "index.js"),
      devTools: IS_DEV
    },
    show: false,
    backgroundColor: "#0a0a0a"
  });
  createTray();
  mainWindow$1.on("close", (event) => {
    if (!electron.app.isQuitting) {
      event.preventDefault();
      mainWindow$1.hide();
    }
  });
  mainWindow$1.on("unresponsive", () => {
    appendDesktopCrashLog("window-unresponsive", { url: mainWindow$1?.webContents?.getURL?.() || "", time: new Date().toISOString() });
  });
  mainWindow$1.on("responsive", () => {
    appendDesktopCrashLog("window-responsive", { url: mainWindow$1?.webContents?.getURL?.() || "", time: new Date().toISOString() });
  });
  mainWindow$1.webContents.on("did-start-loading", () => {
  });
  mainWindow$1.webContents.on("did-finish-load", () => {
    console.log(`Page finished loading`);
  });
  electron.ipcMain.on("window-ready", () => {
    console.log(`Window ready from renderer, closing splash and showing`);
    closeSplash();
    mainWindow$1.show();
  });
  setTimeout(() => {
    if (mainWindow$1 && !mainWindow$1.isDestroyed() && !mainWindow$1.isVisible()) {
      console.log("[startup] renderer ready timeout; showing main window and continuing startup in background");
      closeSplash();
      mainWindow$1.show();
    }
  }, 8e3);
  mainWindow$1.webContents.on("did-fail-load", (_event, errorCode, errorDesc) => {
    console.error(`Page failed to load: ${errorDesc} (code=${errorCode})`);
    mainWindow$1.show();
  });
  mainWindow$1.on("closed", () => {
    mainWindow$1 = null;
    if (tray) {
      tray.destroy();
      tray = null;
    }
  });
  mainWindow$1.webContents.setWindowOpenHandler(({ url: url2 }) => {
    if (url2.startsWith("http://127.0.0.1:17520") || url2.startsWith("http://127.0.0.1:9119") || url2.startsWith("http://127.0.0.1:8642")) {
      openHermesInMainWindow(url2);
      return { action: "deny" };
    }
    if (url2.startsWith("http")) electron.shell.openExternal(url2);
    return { action: "deny" };
  });
}
function getMainWindow() {
  return mainWindow$1;
}
function getHermesFrameFileUrl(targetUrl) {
  const frameFile = path$1.join(__dirname, "..", "assets", "hermes-frame.html");
  return "file://" + frameFile.replace(/\\/g, "/") + "?target=" + encodeURIComponent(targetUrl);
}
function openHermesInternalWindow(targetUrl, title = "Hermes") {
  const frameUrl = getHermesFrameFileUrl(targetUrl);
  if (hermesInternalWindow && !hermesInternalWindow.isDestroyed()) {
    hermesInternalWindow.show();
    hermesInternalWindow.focus();
    hermesInternalWindow.loadURL(frameUrl);
    return true;
  }
  hermesInternalWindow = new electron.BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 960,
    minHeight: 640,
    title,
    icon: appIconPath,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });
  hermesInternalWindow.setMenuBarVisibility(false);
  hermesInternalWindow.webContents.setWindowOpenHandler(({ url: url2 }) => {
    hermesInternalWindow.loadURL(getHermesFrameFileUrl(url2));
    return { action: "deny" };
  });
  hermesInternalWindow.on("closed", () => {
    hermesInternalWindow = null;
  });
  hermesInternalWindow.loadURL(frameUrl);
  return true;
}
function openHermesInMainWindow(targetUrl) {
  const win = getMainWindow();
  if (!win || win.isDestroyed()) return openHermesInternalWindow(targetUrl, "Hermes");
  win.webContents.send("hermes-open-embedded", {
    url: targetUrl,
    frameUrl: getHermesFrameFileUrl(targetUrl)
  });
  win.show();
  win.focus();
  return true;
}
function readFileTailLines(filePath, limit = 100, maxBytes = 256 * 1024) {
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100));
  const stat = fs$1.statSync(filePath);
  const start = Math.max(0, stat.size - maxBytes);
  const fd = fs$1.openSync(filePath, "r");
  try {
    const length = stat.size - start;
    const buffer = Buffer.alloc(length);
    fs$1.readSync(fd, buffer, 0, length, start);
    return buffer.toString("utf8").split(/\r?\n/).filter(Boolean).slice(-safeLimit);
  } finally {
    fs$1.closeSync(fd);
  }
}

function isWin() {
  return process.platform === "win32";
}
const runtimeStore = {};
function atomicWriteFileSync(filePath, content, encoding = "utf-8") {
  const dir = path$1.dirname(filePath);
  const tmpName = `.${path$1.basename(filePath)}.tmp.${Date.now()}`;
  const tmpPath = path$1.join(dir, tmpName);
  try {
    fs$1.writeFileSync(tmpPath, content, encoding);
    fs$1.renameSync(tmpPath, filePath);
  } catch (e) {
    try {
      if (fs$1.existsSync(tmpPath)) fs$1.unlinkSync(tmpPath);
    } catch {
    }
    throw e;
  }
}
let _appRoot = null;
let _dataRoot = null;
let _configDir = null;
let _configPath = null;
let _resourcesPath = null;
const DIR_DATA = "data";
const DIR_OPENCLAW = ".openclaw";
const DIR_SKILLS = "skills";
const DIR_RUNTIME = "runtime";
const FILE_CONFIG = "openclaw.json";
const FILE_LICENSE = ".license";
const FILE_OPENCLAW_MJS = "openclaw.mjs";
function hasPortableRootMarkers(candidate) {
  try {
    const markers = ["runtime", "data", "skills", "extensions"];
    return markers.filter((name) => fs$1.existsSync(path$1.join(candidate, name))).length >= 2;
  } catch {
    return false;
  }
}
function findPortableRootFrom(startPath) {
  let current = path$1.resolve(startPath);
  const parsed = path$1.parse(current);
  while (current && current !== parsed.root) {
    if (hasPortableRootMarkers(current)) return current;
    current = path$1.dirname(current);
  }
  return hasPortableRootMarkers(parsed.root) ? parsed.root : null;
}
function getPortablePlatformId() {
  if (process.platform === "darwin") return process.arch === "arm64" ? "macos-arm64" : "macos-x64";
  if (process.platform === "linux") return process.arch === "arm64" ? "linux-arm64" : "linux-x64";
  if (process.platform === "win32") return "windows-x64";
  return `${process.platform}-${process.arch}`;
}
function getActiveRuntimeDir() {
  const envRoot = process.env.OPENCLAW_RUNTIME_ROOT?.trim();
  if (envRoot) return path$1.resolve(envRoot);
  const rootRuntime = path$1.join(getAppRoot(), DIR_RUNTIME);
  const platformRuntime = path$1.join(rootRuntime, getPortablePlatformId());
  if (process.platform !== "win32" && fs$1.existsSync(platformRuntime)) return platformRuntime;
  return rootRuntime;
}
function findPythonSitePackages(root) {
  const windowsPath = path$1.join(root, "venv", "Lib", "site-packages");
  if (fs$1.existsSync(windowsPath)) return windowsPath;
  const libRoot = path$1.join(root, "venv", "lib");
  if (!fs$1.existsSync(libRoot)) return "";
  const stack = [libRoot];
  while (stack.length) {
    const dir = stack.pop();
    if (!dir || !fs$1.existsSync(dir)) continue;
    for (const entry of fs$1.readdirSync(dir, { withFileTypes: true })) {
      const full = path$1.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "site-packages") return full;
        stack.push(full);
      }
    }
  }
  return "";
}
function getLocalBase() {
  if (!IS_DEV) return path$1.join(getDataRoot(), ".openclaw", "electron");
  const appData = process.env.LOCALAPPDATA || process.env.APPDATA;
  if (appData) {
    const candidate = path$1.join(appData, APP_NAME);
    if (!/[^\x00-\x7F]/.test(candidate) && !candidate.includes(" ")) {
      return candidate;
    }
    console.log(`[runtime] Problematic path detected (non-ASCII or space): ${candidate}, using fallback`);
  }
  const drive = (process.env.SystemDrive || "C:") + "\\";
  return path$1.join(drive, APP_NAME);
}
const localBase = getLocalBase();
const electronDataDir = path$1.join(localBase, "electron-cache");
fs$1.mkdirSync(electronDataDir, { recursive: true });
electron.app.setPath("userData", electronDataDir);
electron.app.setPath("sessionData", path$1.join(electronDataDir, "session"));
electron.app.setPath("crashDumps", path$1.join(electronDataDir, "crashDumps"));
electron.app.setAppLogsPath(path$1.join(electronDataDir, "logs"));
const RUNTIME_DIR = path$1.join(getAppRoot(), DIR_RUNTIME);
function getAppRoot() {
  if (_appRoot) return _appRoot;
  if (!IS_DEV) {
    const exeDir = path$1.dirname(electron.app.getPath("exe"));
    const discovered = findPortableRootFrom(exeDir);
    if (discovered) {
      _appRoot = discovered;
      return _appRoot;
    }
    if (process.platform === "darwin") {
      const appBundle = path$1.resolve(exeDir, "..", "..");
      const appContainer = path$1.dirname(appBundle);
      _appRoot = path$1.basename(appContainer) === "macos" ? path$1.dirname(appContainer) : appContainer;
      return _appRoot;
    }
    _appRoot = path$1.resolve(exeDir, "..");
    return _appRoot;
  }
  _appRoot = path$1.resolve(__dirname, "..", "..");
  return _appRoot;
}
function getDataRoot() {
  if (_dataRoot) return _dataRoot;
  _dataRoot = path$1.join(getAppRoot(), DIR_DATA);
  return _dataRoot;
}
function appendDesktopCrashLog(kind, payload) {
  /* codex-desktop-crash-diagnostics */
  try {
    const logDir = path$1.join(getDataRoot(), ".openclaw", "logs");
    fs$1.mkdirSync(logDir, { recursive: true });
    const text = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
    fs$1.appendFileSync(path$1.join(logDir, "desktop-crash.log"), "[" + new Date().toISOString() + "] " + kind + "\n" + text + "\n\n", "utf8");
  } catch {
  }
}
function installDesktopCrashDiagnostics() {
  if (globalThis.__uclawDesktopCrashDiagnosticsInstalled) return;
  globalThis.__uclawDesktopCrashDiagnosticsInstalled = true;
  let lastTick = Date.now();
  setInterval(() => {
    const now = Date.now();
    const delay = now - lastTick - 2000;
    lastTick = now;
    if (delay > 2500) {
      appendDesktopCrashLog("main-event-loop-delay", { delayMs: Math.round(delay), at: new Date(now).toISOString() });
    }
  }, 2000).unref?.();
  process.on("uncaughtException", (err) => {
    appendDesktopCrashLog("uncaughtException", { message: err?.message || String(err), stack: err?.stack || "" });
  });
  process.on("unhandledRejection", (reason) => {
    appendDesktopCrashLog("unhandledRejection", { reason: reason?.message || String(reason), stack: reason?.stack || "" });
  });
  electron.app.on("render-process-gone", (_event, webContents, details) => {
    appendDesktopCrashLog("render-process-gone", { url: webContents?.getURL?.() || "", details });
  });
  electron.app.on("child-process-gone", (_event, details) => {
    appendDesktopCrashLog("child-process-gone", details || {});
  });
}
function readJsonFileDir() {
  if (_configDir) return _configDir;
  _configDir = path$1.join(getDataRoot(), DIR_OPENCLAW);
  return _configDir;
}
function readJsonFilePath() {
  if (_configPath) return _configPath;
  _configPath = path$1.join(readJsonFileDir(), FILE_CONFIG);
  return _configPath;
}
function getResourcesPath() {
  if (_resourcesPath) return _resourcesPath;
  _resourcesPath = !IS_DEV ? path$1.join(process.resourcesPath, "app", "src") : path$1.join(__dirname, "..", "src");
  return _resourcesPath;
}
function getOpenClawEntry() {
  const runtimeRoot = getActiveRuntimeDir();
  return path$1.join(getOpenClawPackageRoot(runtimeRoot), FILE_OPENCLAW_MJS);
}
function getLicensePath() {
  return path$1.join(getAppRoot(), FILE_LICENSE);
}
function createLicenseFile() {
  const filePath = getLicensePath();
  if (!fs$1.existsSync(filePath)) {
    try {
      fs$1.writeFileSync(filePath, JSON.stringify({}), "utf-8");
    } catch {
      console.log("创建.license文件失败");
    }
  }
}
function normalizeHardwareSerial(serial2) {
  return String(serial2 || "").replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, "").trim().toUpperCase();
}
function decodeBase64Url(value) {
  const input = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = input + "=".repeat((4 - input.length % 4) % 4);
  return Buffer.from(padded, "base64");
}
function parseSignedLicenseInput(value) {
  if (!value) throw new Error("缺少已签名 license");
  if (typeof value === "string") return JSON.parse(value);
  if (value.license) return parseSignedLicenseInput(value.license);
  return value;
}
function verifySignedLicense(licenseData) {
  if (!licenseData || typeof licenseData !== "object") throw new Error("license 格式无效");
  if (licenseData.v !== LICENSE_SIGN_VERSION) throw new Error("license 格式不支持");
  if (licenseData.alg !== LICENSE_SIGN_ALG) throw new Error("license 算法不支持");
  if (!licenseData.payload || !licenseData.signature) throw new Error("license 签名信息不完整");
  const payloadBuf = decodeBase64Url(licenseData.payload);
  const signatureBuf = decodeBase64Url(licenseData.signature);
  const ok = crypto$1.verify(null, payloadBuf, LICENSE_PUBLIC_KEY_PEM, signatureBuf);
  if (!ok) throw new Error("license 签名无效");
  const payload = JSON.parse(payloadBuf.toString("utf8"));
  if (!payload.serial) throw new Error("license 授权信息不完整");
  return {
    serial: payload.serial,
    serial_normalized: payload.serial_normalized || normalizeHardwareSerial(payload.serial),
    activation_code: payload.activation_code || null,
    issued_at: payload.issued_at || null,
    expires_at: payload.expires_at || null,
    payload
  };
}
function writeLicenseFile(serial2, activation_code, signedLicense) {
  createLicenseFile();
  try {
    const licenseData = parseSignedLicenseInput(signedLicense);
    const parsed = verifySignedLicense(licenseData);
    if (normalizeHardwareSerial(serial2) !== parsed.serial_normalized) {
      throw new Error("license 与当前 U 盘硬件序列号不匹配");
    }
    if (activation_code && parsed.activation_code && activation_code !== parsed.activation_code) {
      throw new Error("license 与当前激活码不匹配");
    }
    atomicWriteFileSync(getLicensePath(), JSON.stringify(licenseData, null, 2), "utf-8");
    console.log(`[License] 写入成功: ${getLicensePath()}`);
    return true;
  } catch (e) {
    console.error("[License] 写入失败:", e.message);
    return false;
  }
}
function readLicenseFile(serial2) {
  const filePath = getLicensePath();
  if (!fs$1.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs$1.readFileSync(filePath, "utf8");
    const licenseData = JSON.parse(raw);
    const parsed = verifySignedLicense(licenseData);
    if (normalizeHardwareSerial(serial2) !== parsed.serial_normalized) {
      console.error("[License] 硬件序列号不匹配");
      return null;
    }
    if (parsed.expires_at && Date.now() > Date.parse(parsed.expires_at)) {
      console.error("[License] license 已过期");
      return null;
    }
    return {
      serial: serial2 || parsed.serial || null,
      license_serial: parsed.serial || null,
      activation_code: parsed.activation_code || null,
      issued_at: parsed.issued_at || null,
      expires_at: parsed.expires_at || null
    };
  } catch (e) {
    console.error("[License] 读取/验签失败:", e.message);
    return null;
  }
}
function updatePluginsField(config, plugins) {
  if (!config.plugins) config.plugins = {};
  if (!config.plugins.load) config.plugins.load = {};
  if (!config.plugins.entries) config.plugins.entries = {};
  if (!config.plugins.allow) config.plugins.allow = [];
  config.plugins.load.paths = [...plugins.load.paths];
  if (plugins.entries) {
    Object.assign(config.plugins.entries, plugins.entries);
  }
  if (plugins.allow) {
    config.plugins.allow = [...plugins.allow];
  }
  return config;
}
function updateModelsField(config, modelsData) {
  const { models } = modelsData;
  const customModelDefaultUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
  if (!config.models) config.models = { mode: "replace", providers: {} };
  if (!config.models.providers) config.models.providers = {};
  if (!config.agents) config.agents = {};
  if (!config.agents.defaults) config.agents.defaults = {};
  if (!config.agents.defaults.model) config.agents.defaults.model = {};
  if (!config.agents.defaults.models) config.agents.defaults.models = {};
  if (!config.agents.defaults.compaction) config.agents.defaults.compaction = {};
  const providerMap = {};
  let currentModel = null;
  const removedSource = String.fromCharCode(111, 102, 102, 105, 99, 105, 97, 108);
  for (const model of models) {
    if (model.source === removedSource) continue;
    const providerName = model.provider;
    const modelId = model.model || model.value;
    if (!providerName || !modelId) continue;
    if (model.isCurrent) {
      currentModel = `${providerName}/${modelId}`;
    }
    if (!providerMap[providerName]) {
      providerMap[providerName] = {
        apiKey: model.key || "",
        baseUrl: model.url || model.base || "",
        api: model.api || "openai-completions",
        ...providerName === "custom" ? { headers: { "User-Agent": customModelDefaultUserAgent } } : {},
        models: []
      };
    }
    providerMap[providerName].models.push({
      id: modelId,
      name: modelId,
      input: ["text", "image"],
      contextWindow: 128e3,
      maxTokens: 4096
    });
    config.agents.defaults.models[`${providerName}/${modelId}`] = {
      alias: `${providerName}/${modelId}`
    };
  }
  for (const [providerName, providerConfig] of Object.entries(providerMap)) {
    config.models.providers[providerName] = providerConfig;
  }
  if (currentModel) {
    config.agents.defaults.model.primary = currentModel;
  }
  config.agents.defaults.compaction.mode = "safeguard";
  return config;
}
function updateSkillsField(config, skills) {
  if (!config.skills) config.skills = {};
  if (!config.skills.load) config.skills.load = {};
  if (skills.load?.extraDirs) {
    if (!config.skills.load.extraDirs) {
      config.skills.load.extraDirs = [...skills.load.extraDirs];
    } else {
      for (const dir of skills.load.extraDirs) {
        if (!config.skills.load.extraDirs.includes(dir)) {
          config.skills.load.extraDirs.push(dir);
        }
      }
    }
  }
  if (skills.entries) {
    if (!config.skills.entries) config.skills.entries = {};
    Object.assign(config.skills.entries, skills.entries);
  }
  return config;
}
function updateChannelsField(config, channels) {
  if (!config.channels) config.channels = {};
  if (channels?.["openclaw-weixin"]) {
    if (!config.channels["openclaw-weixin"]) {
      config.channels["openclaw-weixin"] = {};
    }
    if (channels["openclaw-weixin"].accounts !== void 0) {
      config.channels["openclaw-weixin"].accounts = channels["openclaw-weixin"].accounts;
    }
  }
  return config;
}
async function writeOpenClawConfig({ models, skills, plugins, channels } = {}, type2) {
  const configPath = readJsonFilePath();
  let config;
  try {
    config = JSON.parse(fs$1.readFileSync(configPath, "utf-8"));
    console.log(`[wocc] 读取现有配置成功, gateway.bind=${config.gateway?.bind}, type=${type2}`);
  } catch (e) {
    config = {};
    console.warn(`[wocc] 读取配置文件失败，使用空配置: ${e.message}`);
  }
  if (type2 === "plugins") {
    config = updatePluginsField(config, plugins);
  }
  if (type2 === "skills") {
    config = updateSkillsField(config, skills);
  }
  if (type2 === "model") {
    config = updateModelsField(config, { models });
  }
  if (type2 === "channels") {
    config = updateChannelsField(config, channels);
  }
  try {
    atomicWriteFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`[wocc] 配置已保存, gateway.bind=${config.gateway?.bind}, type=${type2}`);
  } catch (e) {
    console.error(`写入 openaw.json 失败:`, e.message);
  }
}
async function ensureOpenClawDirectories() {
  console.log("[ensureOpenClawDirectories] 开始执行");
  const configDir = readJsonFileDir();
  fs$1.mkdirSync(configDir, { recursive: true });
  fs$1.mkdirSync(path$1.join(configDir, "workspace", "memory"), { recursive: true });
  fs$1.mkdirSync(path$1.join(configDir, "backups"), { recursive: true });
  fs$1.mkdirSync(path$1.join(configDir, "workspace"), { recursive: true });
  fs$1.mkdirSync(path$1.join(configDir, "media", "image"), { recursive: true });
  fs$1.mkdirSync(path$1.join(configDir, "media", "video"), { recursive: true });
  const configPath = readJsonFilePath();
  const appRoot = getAppRoot();
  const appSkillsDir = path$1.join(appRoot, DIR_SKILLS);
  if (!fs$1.existsSync(configPath)) {
    updateSplash("正在初始化openclaw配置文件...", 100);
    const initialConfig = {
      gateway: {
        mode: "local",
        bind: "loopback",
        port: Number(GATEWAY_DEFAULT_PORT),
        auth: {
          token: "newToken"
        },
        controlUi: {
          allowedOrigins: [
            "file://",
            "http://localhost",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:18789",
            "http://127.0.0.1:18789",
            "app://",
            "null"
          ]
        }
      },
      skills: {
        load: {
          extraDirs: [appSkillsDir]
        }
      },
      meta: {
        lastTouchedVersion: "2026.3.24",
        lastTouchedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
    atomicWriteFileSync(configPath, JSON.stringify(initialConfig, null, 2), "utf-8");
  } else {
    try {
      const config = JSON.parse(fs$1.readFileSync(configPath, "utf-8"));
      if (!config.skills) config.skills = {};
      if (!config.skills.load) config.skills.load = {};
      if (!config.skills.load.extraDirs) config.skills.load.extraDirs = [];
      if (config.skills.load.extraDirs.length > 0) {
        config.skills.load.extraDirs = [appSkillsDir];
      }
      atomicWriteFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
      console.log("[ensureOpenClawDirectories] 已将 skills 初始化为 appSkillsDir");
    } catch (e) {
      console.error("[ensureOpenClawDirectories] 更新配置文件失败:", e.message);
    }
  }
}
function copyDirSync(src2, dest) {
  fs$1.mkdirSync(dest, { recursive: true });
  for (const entry of fs$1.readdirSync(src2, { withFileTypes: true })) {
    const s = path$1.join(src2, entry.name);
    const d = path$1.join(dest, entry.name);
    if (entry.isDirectory()) copyDirSync(s, d);
    else fs$1.copyFileSync(s, d);
  }
}
function repairOpenClawRuntimeTemplates(runtimeRoot = RUNTIME_DIR) {
  try {
    const packageRoot = getOpenClawPackageRoot(runtimeRoot);
    const targetRoot = path$1.join(packageRoot, "src", "agents", "templates");
    const templateNames = ["AGENTS.md", "BOOT.md", "BOOTSTRAP.md", "HEARTBEAT.md", "IDENTITY.md", "SOUL.md", "TOOLS.md", "USER.md"];
    const zip = path$1.join(runtimeRoot, "openclaw.zip");
    const tarExe = process.platform === "win32" ? path$1.join(process.env.SystemRoot || "C:\\Windows", "System32", "tar.exe") : "tar";
    const repaired = [];
    const missing = [];
    for (const name of templateNames) {
      const target = path$1.join(targetRoot, name);
      if (fs$1.existsSync(target)) continue;
      const candidates = [
        path$1.join(packageRoot, "docs", "reference", "templates", name),
        path$1.join(packageRoot, "docs", name)
      ];
      const source = candidates.find((file) => fs$1.existsSync(file));
      if (source) {
        fs$1.mkdirSync(path$1.dirname(target), { recursive: true });
        fs$1.copyFileSync(source, target);
        repaired.push(name);
        continue;
      }
      if (fs$1.existsSync(zip)) {
        const entryName = "node_modules/openclaw/docs/reference/templates/" + name;
        const extracted = child_process.spawnSync(tarExe, ["-xOf", zip, entryName], { encoding: "utf8", windowsHide: true, maxBuffer: 1024 * 1024 });
        if (extracted.status === 0 && extracted.stdout) {
          fs$1.mkdirSync(path$1.dirname(target), { recursive: true });
          fs$1.writeFileSync(target, extracted.stdout, "utf8");
          repaired.push(name);
          continue;
        }
      }
      missing.push(name);
    }
    if (repaired.length) console.log("[runtime] Repaired OpenClaw templates:", repaired.join(", "));
    if (missing.length) return { ok: false, repaired: repaired.length > 0, missing, targetRoot, error: "OpenClaw workspace templates missing: " + missing.join(", ") };
    return { ok: true, repaired: repaired.length > 0, targetRoot };
  } catch (err) {
    return { ok: false, repaired: false, error: err instanceof Error ? err.message : String(err) };
  }
}
function getMediaDir() {
  return path$1.join(getDataRoot(), DIR_OPENCLAW, "media");
}
function getMediaImageDir() {
  return path$1.join(getDataRoot(), DIR_OPENCLAW, "media", "image");
}
function getMediaVideoDir() {
  return path$1.join(getDataRoot(), DIR_OPENCLAW, "media", "video");
}
function getPaths() {
  const appRoot = getAppRoot();
  const dataRoot = getDataRoot();
  const configDir = readJsonFileDir();
  const configPath = readJsonFilePath();
  const resourcesPath = getResourcesPath();
  const openclawPath = getOpenClawPath();
  const openclawEntry = getOpenClawEntry();
  return { appRoot, dataRoot, configDir, configPath, resourcesPath, openclawPath, openclawEntry };
}
function getNodeBin() {
  const platform2 = process.platform;
  const arch = process.arch;
  const nodeDir = !IS_DEV ? path$1.join(getAppRoot(), "runtime", "js", `node-${platform2}-${arch}`) : path$1.join(__dirname, "..", "runtime", "js", `node-${platform2}-${arch}`);
  const nodeBin = platform2 === "win32" ? path$1.join(nodeDir, "node.exe") : path$1.join(nodeDir, "bin", "node");
  if (fs$1.existsSync(nodeBin)) return nodeBin;
  return "node";
}
async function extractRuntime() {
  const runtimeSrc = path$1.join(getAppRoot(), DIR_RUNTIME);
  const runtimeMarker = path$1.join(RUNTIME_DIR, ".extracted");
  const runtimeHasCli = fs$1.existsSync(path$1.join(RUNTIME_DIR, "openclaw.cmd"));
  const runtimeHasNode = fs$1.existsSync(path$1.join(RUNTIME_DIR, "node.exe"));
  if (runtimeHasCli && runtimeHasNode) {
    /* codex-portable-runtime-ready-skip */
    const repair = repairOpenClawRuntimeTemplates(getActiveRuntimeDir());
    if (!repair.ok) console.log("[runtime] OpenClaw template repair pending:", repair.error || repair.target);
    try { fs$1.writeFileSync(runtimeMarker, Date.now().toString(), "utf8"); } catch {}
    console.log("[runtime] Portable runtime already present, skipping extraction");
    return;
  }
  if (path$1.resolve(RUNTIME_DIR) === path$1.resolve(runtimeSrc)) {
    const repair = repairOpenClawRuntimeTemplates(getActiveRuntimeDir());
    if (!repair.ok) console.log("[runtime] OpenClaw template repair pending:", repair.error || repair.target);
    console.log("[runtime] Runtime source and target are identical; skipping self-extraction");
    return;
  }
  if (fs$1.existsSync(RUNTIME_DIR) && !fs$1.existsSync(path$1.join(RUNTIME_DIR, ".extracted")) && !fs$1.existsSync(path$1.join(RUNTIME_DIR, "openclaw.cmd"))) {
    console.log("[runtime] Broken local runtime detected, skipping startup cleanup to avoid blocking on slow USB storage");
  }
  if (fs$1.existsSync(path$1.join(RUNTIME_DIR, ".extracted"))) {
    console.log("[runtime] Already extracted, skipping");
    return;
  }
  if (!fs$1.existsSync(runtimeSrc)) {
    console.log("[runtime] No runtime/ directory found");
    return;
  }
  if (!fs$1.existsSync(path$1.join(runtimeSrc, "openclaw.zip"))) {
    console.log("[runtime] No openclaw.zip found, using USB runtime directly");
    return;
  }
  const allowStartupExtraction = process.env.OPENCLAW_ALLOW_RUNTIME_EXTRACTION === "1" || fs$1.existsSync(path$1.join(runtimeSrc, "ALLOW_RUNTIME_EXTRACTION"));
  if (!allowStartupExtraction) {
    console.log("[runtime] openclaw.zip found, but startup extraction is disabled. Pre-expand runtime in the release package or set OPENCLAW_ALLOW_RUNTIME_EXTRACTION=1 for manual repair.");
    updateSplash("运行时未完整预置，请在环境检查中查看修复提示", 90);
    return;
  }
  console.log("[runtime] Extracting runtime (first launch)...");
  updateSplash("首次运行，正在初始化环境...", 5);
  fs$1.mkdirSync(RUNTIME_DIR, { recursive: true });
  const extractZip = (zipPath, destPath, startPct, endPct) => new Promise((resolve, reject) => {
    const ticker = setInterval(() => {
    }, 1e3);
    const tarExe = path$1.join(process.env.SystemRoot || "C:\\Windows", "System32", "tar.exe");
    const psExe = path$1.join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
    const ps = child_process.spawn(tarExe, ["-xf", zipPath, "-C", destPath], {
      stdio: ["ignore", "pipe", "pipe"]
    });
    ps.on("exit", (code) => {
      console.log("[runtime] tar exit code:", code);
      clearInterval(ticker);
      if (code === 0) {
        resolve();
        return;
      }
      console.log("[runtime] tar failed, falling back to PowerShell...");
      const ps2 = child_process.spawn(psExe, ["-NoProfile", "-NonInteractive", "-Command", `Expand-Archive -Path '${zipPath}' -DestinationPath '${destPath}' -Force`], {
        stdio: ["ignore", "pipe", "pipe"]
      });
      ps2.on("exit", (c) => c === 0 ? resolve() : reject(new Error(`exit code ${c}`)));
      ps2.on("error", reject);
    });
    ps.on("error", (err) => {
      console.log("[runtime] tar spawn error:", err.message);
      clearInterval(ticker);
      const ps2 = child_process.spawn(psExe, ["-NoProfile", "-NonInteractive", "-Command", `Expand-Archive -Path '${zipPath}' -DestinationPath '${destPath}' -Force`], {
        stdio: ["ignore", "pipe", "pipe"]
      });
      ps2.on("exit", (c) => c === 0 ? resolve() : reject(new Error(`exit code ${c}`)));
      ps2.on("error", reject);
    });
  });
  const nodeSrc = path$1.join(runtimeSrc, "node.exe");
  const nodeDest = path$1.join(RUNTIME_DIR, "node.exe");
  if (fs$1.existsSync(nodeSrc) && !fs$1.existsSync(nodeDest)) {
    updateSplash("正在复制 Node.js 运行时...", 8);
    fs$1.copyFileSync(nodeSrc, nodeDest);
    console.log("[runtime] Copied node.exe");
  }
  const openclawZip = path$1.join(runtimeSrc, "openclaw.zip");
  let extractOk = true;
  if (fs$1.existsSync(openclawZip)) {
    try {
      console.log("[runtime] Extracting openclaw.zip...");
      updateSplash("正在解压 OpenClaw 核心组件...\n（首次可能需要 1-3 分钟）", 20);
      await extractZip(openclawZip, RUNTIME_DIR, 20, 70);
      updateSplash("OpenClaw 核心组件就绪", 70);
      console.log("[runtime] openclaw.zip extracted");
    } catch (e) {
      extractOk = false;
      console.log(`[runtime] Failed to extract openclaw.zip: ${e.message}`);
      updateSplash("解压失败: " + e.message);
    }
  }
  if (fs$1.existsSync(runtimeSrc)) {
    for (const entry of fs$1.readdirSync(runtimeSrc)) {
      if (entry.endsWith(".zip") || entry === "node.exe") continue;
      const src2 = path$1.join(runtimeSrc, entry);
      const dest = path$1.join(RUNTIME_DIR, entry);
      if (!fs$1.existsSync(dest)) {
        if (fs$1.statSync(src2).isDirectory()) copyDirSync(src2, dest);
        else fs$1.copyFileSync(src2, dest);
      }
    }
  }
  const criticalFiles = ["openclaw.cmd", "node.exe"];
  repairOpenClawRuntimeTemplates(RUNTIME_DIR);
  const missingFiles = criticalFiles.filter((f) => !fs$1.existsSync(path$1.join(RUNTIME_DIR, f)));
  if (missingFiles.length > 0) {
    extractOk = false;
    console.log(`[runtime] Missing critical files after extraction: ${missingFiles.join(", ")}`);
    updateSplash(`解压不完整，缺少: ${missingFiles.join(", ")}`);
  }
  if (extractOk) {
    fs$1.writeFileSync(path$1.join(RUNTIME_DIR, ".extracted"), Date.now().toString());
    console.log("[runtime] Extraction complete");
    updateSplash("环境初始化完成！", 90);
  } else {
    console.log("[runtime] Extraction incomplete, will retry on next launch");
    updateSplash("环境初始化未完成，请使用环境检查修复", 90);
  }
}
function getOpenClawPath() {
  const runtimeRoot = getActiveRuntimeDir();
  const binDir = getOpenClawRuntimeBinDir();
  const cliName = process.platform === "win32" ? "openclaw.cmd" : "openclaw";
  const candidates = [
    path$1.join(runtimeRoot, cliName),
    path$1.join(binDir, cliName),
    process.platform === "win32" ? path$1.join(RUNTIME_DIR, "openclaw.cmd") : ""
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (fs$1.existsSync(candidate)) return candidate;
  }
  return "openclaw";
}
function getOpenClawPackageRoot(runtimeRoot = getActiveRuntimeDir()) {
  if (process.platform === "win32" || runtimeRoot === RUNTIME_DIR) {
    return path$1.join(runtimeRoot, "node_modules", "openclaw");
  }
  return path$1.join(runtimeRoot, "openclaw", "node_modules", "openclaw");
}
function getOpenClawRuntimeBinDir() {
  const runtimeRoot = getActiveRuntimeDir();
  const packagedBin = path$1.join(runtimeRoot, "openclaw", "bin");
  if (fs$1.existsSync(packagedBin)) return packagedBin;
  return runtimeRoot;
}
function getOpenClawRuntimeDiagnosis() {
  const appRoot = getAppRoot();
  const runtimeRoot = getActiveRuntimeDir();
  const rootRuntime = RUNTIME_DIR;
  const isWindowsRuntime = process.platform === "win32" || runtimeRoot === rootRuntime;
  const binDir = getOpenClawRuntimeBinDir();
  const nodePath = isWindowsRuntime ? path$1.join(runtimeRoot, "node.exe") : path$1.join(runtimeRoot, "node", "bin", "node");
  const cliPath = isWindowsRuntime ? path$1.join(runtimeRoot, "openclaw.cmd") : path$1.join(binDir, "openclaw");
  const packageRoot = getOpenClawPackageRoot(runtimeRoot);
  const entry = path$1.join(packageRoot, "openclaw.mjs");
  const dist = path$1.join(packageRoot, "dist");
  const nestedEntry = path$1.join(runtimeRoot, "runtime", "node_modules", "openclaw", "openclaw.mjs");
  const appNestedEntry = path$1.join(appRoot, "u-agent", "runtime", "node_modules", "openclaw", "openclaw.mjs");
  const stagingEntry = path$1.join(appRoot, "release", "windows-shell-e2e-slim-staging", "runtime", "node_modules", "openclaw", "openclaw.mjs");
  const rootEntries = fs$1.existsSync(appRoot) ? fs$1.readdirSync(appRoot).slice(0, 40) : [];
  const runtimeEntries = fs$1.existsSync(runtimeRoot) ? fs$1.readdirSync(runtimeRoot).slice(0, 40) : [];
  const problems = [];
  if (!fs$1.existsSync(cliPath)) problems.push("缺少 " + path$1.relative(appRoot, cliPath));
  if (!fs$1.existsSync(nodePath)) problems.push("缺少 " + path$1.relative(appRoot, nodePath));
  if (isWindowsRuntime && !fs$1.existsSync(entry)) problems.push("缺少 runtime/node_modules/openclaw/openclaw.mjs");
  if (!isWindowsRuntime && !fs$1.existsSync(entry)) problems.push("缺少 " + path$1.relative(appRoot, entry));
  if (isWindowsRuntime && !fs$1.existsSync(dist)) problems.push("缺少 runtime/node_modules/openclaw/dist");
  if (!isWindowsRuntime && !fs$1.existsSync(dist)) problems.push("缺少 " + path$1.relative(appRoot, dist));
  const hints = [];
  if (fs$1.existsSync(nestedEntry)) hints.push("检测到 runtime/runtime/node_modules/openclaw/openclaw.mjs：runtime 可能多套了一层 runtime 目录。请把内层 runtime 的内容移动到 U 盘根目录的 runtime。");
  if (fs$1.existsSync(appNestedEntry)) hints.push("检测到 u-agent/runtime/node_modules/openclaw/openclaw.mjs：程序当前按 U 盘根目录运行，请把 u-agent 目录内的 runtime 复制到 U 盘根目录 runtime，或从完整 staging 目录启动。");
  if (fs$1.existsSync(stagingEntry)) hints.push("检测到 release/windows-shell-e2e-slim-staging/runtime：请复制 staging 目录里面的内容到 U 盘根目录，而不是复制整个 staging 目录本身。");
  return {
    ok: problems.length === 0,
    appRoot,
    runtimeRoot,
    expectedEntry: entry,
    expectedDist: dist,
    problems,
    hints,
    rootEntries,
    runtimeEntries
  };
}
function formatOpenClawRuntimeDiagnosis(diag) {
  return [
    "OpenClaw runtime 不完整，Gateway 未启动。",
    "当前程序根目录: " + diag.appRoot,
    "当前 runtime 目录: " + diag.runtimeRoot,
    "期望入口文件: " + diag.expectedEntry,
    "缺失项:",
    ...diag.problems.map((item) => "  - " + item),
    diag.hints.length ? "可能原因:" : "",
    ...diag.hints.map((item) => "  - " + item),
    "U盘根目录前 40 项: " + diag.rootEntries.join(", "),
    "runtime 目录前 40 项: " + diag.runtimeEntries.join(", ")
  ].filter(Boolean).join("\n");
}
function writeDnsHook() {
  const hookPath = path$1.join(getActiveRuntimeDir(), "dns-hook.cjs");
  const content = `// Portable OpenClaw hook: fast-fail pricing DNS and tolerate Windows plugin skill junction races.
const dns = require('dns');
const fs = require('fs');
const origLookup = dns.lookup;
dns.lookup = function(hostname, options, cb) {
  if (typeof hostname === 'string' && (hostname === 'openrouter.ai' || hostname.endsWith('.openrouter.ai'))) {
    if (typeof options === 'function') { cb = options; }
    process.nextTick(() => cb(null, '127.0.0.1', 4));
    return;
  }
  origLookup.apply(this, arguments);
};
function toleratePluginSkillLinkError(target, pathLike, err, createSymlink) {
  const linkPath = String(pathLike || '');
  if (process.platform !== 'win32' || !err || !['EISDIR', 'EEXIST', 'EPERM'].includes(err.code) || !linkPath.includes('plugin-skills')) return false;
  try {
    if (fs.existsSync(linkPath) && fs.realpathSync(target) === fs.realpathSync(linkPath)) return true;
  } catch {}
  try {
    if (fs.existsSync(linkPath)) {
      const stat = fs.lstatSync(linkPath);
      const skillFile = require('path').join(linkPath, 'SKILL.md');
      if (stat.isDirectory() && fs.existsSync(skillFile)) return true;
    }
  } catch {}
  try {
    if (fs.existsSync(target) && fs.lstatSync(target).isDirectory()) {
      fs.rmSync(linkPath, { recursive: true, force: true });
      return true;
    }
  } catch {}
  try {
    fs.rmSync(linkPath, { recursive: true, force: true });
    createSymlink(target, linkPath);
    return true;
  } catch {}
  try {
    fs.mkdirSync(linkPath, { recursive: true });
  } catch {}
  return true;
}
const origSymlinkSync = fs.symlinkSync;
fs.symlinkSync = function(target, pathLike, type) {
  try {
    return origSymlinkSync.apply(this, arguments);
  } catch (err) {
    if (toleratePluginSkillLinkError(target, pathLike, err, (t, p) => origSymlinkSync.call(fs, t, p, 'junction'))) return undefined;
    throw err;
  }
};
const origSymlink = fs.symlink;
fs.symlink = function(target, pathLike, type, cb) {
  if (typeof type === 'function') {
    cb = type;
    type = undefined;
  }
  return origSymlink.call(this, target, pathLike, type, (err) => {
    if (err) {
      if (toleratePluginSkillLinkError(target, pathLike, err, (t, p) => origSymlinkSync.call(fs, t, p, 'junction'))) {
        if (typeof cb === 'function') cb(null);
        return;
      }
      if (typeof cb === 'function') cb(err);
      return;
    }
    if (typeof cb === 'function') cb(null);
  });
};
const origSymlinkPromise = fs.promises && fs.promises.symlink;
if (origSymlinkPromise) {
  fs.promises.symlink = async function(target, pathLike, type) {
    try {
      return await origSymlinkPromise.call(this, target, pathLike, type);
    } catch (err) {
      if (toleratePluginSkillLinkError(target, pathLike, err, (t, p) => origSymlinkSync.call(fs, t, p, 'junction'))) return undefined;
      throw err;
    }
  };
}
`;
  try {
    if (!fs$1.existsSync(hookPath) || fs$1.readFileSync(hookPath, "utf8") !== content) {
      fs$1.writeFileSync(hookPath, content, "utf-8");
    }
    return hookPath;
  } catch (e) {
    console.error(`[DNS Hook] 写入失败: ${e.message}`);
    return null;
  }
}
function rewritePortableOpenClawConfigPaths() {
  /* codex-portable-openclaw-config-rewrite */
  const configPath = path$1.join(getDataRoot(), ".openclaw", "openclaw.json");
  try {
    if (!fs$1.existsSync(configPath)) return;
    const config = JSON.parse(fs$1.readFileSync(configPath, "utf8"));
    let changed = false;
    const extraDirs = config?.skills?.load?.extraDirs;
    if (Array.isArray(extraDirs)) {
      const normalized = extraDirs.map((entry) => {
        if (typeof entry !== "string") return entry;
        const clean = entry.replace(/\\/g, "/");
        if (/^[A-Za-z]:\/skills\/?$/i.test(clean) || clean === "skills" || clean.endsWith("/skills")) return "skills";
        return entry;
      });
      if (JSON.stringify(normalized) !== JSON.stringify(extraDirs)) {
        config.skills.load.extraDirs = normalized;
        changed = true;
      }
    }
    const defaultPluginIds = ["qwen", "memory-core", "browser", "canvas", "device-pair", "file-transfer", "phone-control", "talk-voice"];
    config.plugins ||= {};
    if (!Array.isArray(config.plugins.allow)) config.plugins.allow = [];
    const allowSet = new Set(config.plugins.allow);
    for (const id of defaultPluginIds) allowSet.add(id);
    const nextAllow = Array.from(allowSet);
    if (JSON.stringify(nextAllow) !== JSON.stringify(config.plugins.allow)) {
      config.plugins.allow = nextAllow;
      changed = true;
    }
    config.plugins.entries ||= {};
    for (const id of defaultPluginIds) {
      if (!config.plugins.entries[id]) {
        config.plugins.entries[id] = { enabled: true };
        changed = true;
      }
    }
    if (changed) fs$1.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
  } catch (err) {
    console.warn("[portable] failed to rewrite OpenClaw config paths:", err instanceof Error ? err.message : String(err));
  }
}
function normalizeOpenClawPluginSkillLinks() {
  /* codex-openclaw-plugin-skill-link-normalize */
  try {
    const stateRoot = path$1.resolve(getDataRoot(), ".openclaw");
    const pluginSkillsRoot = path$1.resolve(stateRoot, "plugin-skills");
    const browserSkill = path$1.resolve(pluginSkillsRoot, "browser-automation");
    const runtimeRoot = getActiveRuntimeDir();
    const packageRoot = getOpenClawPackageRoot(runtimeRoot);
    const browserSkillTarget = path$1.resolve(packageRoot, "dist", "extensions", "browser", "skills", "browser-automation");
    if (!browserSkill.startsWith(pluginSkillsRoot + path$1.sep)) return;
    fs$1.mkdirSync(pluginSkillsRoot, { recursive: true });
    if (!fs$1.existsSync(browserSkillTarget)) return;
    let shouldCreate = true;
    if (fs$1.existsSync(browserSkill)) {
      const stat = fs$1.lstatSync(browserSkill);
      if (stat.isSymbolicLink()) {
        const currentTarget = path$1.resolve(pluginSkillsRoot, fs$1.readlinkSync(browserSkill));
        shouldCreate = currentTarget !== browserSkillTarget;
      }
      if (shouldCreate) fs$1.rmSync(browserSkill, { recursive: true, force: true });
    }
    if (shouldCreate) {
      try {
        fs$1.symlinkSync(browserSkillTarget, browserSkill, process.platform === "win32" ? "junction" : "dir");
        console.log("[portable] prepared plugin skill link: " + browserSkill + " -> " + browserSkillTarget);
      } catch (linkErr) {
        fs$1.rmSync(browserSkill, { recursive: true, force: true });
        fs$1.cpSync(browserSkillTarget, browserSkill, { recursive: true, force: true });
        console.log("[portable] copied plugin skill for non-NTFS USB: " + browserSkill);
      }
    }
  } catch (err) {
    console.warn("[portable] failed to normalize OpenClaw plugin skill links:", err instanceof Error ? err.message : String(err));
  }
}
function getGatewayEnv() {
  rewritePortableOpenClawConfigPaths();
  const runtimeRoot = getActiveRuntimeDir();
  const repair = repairOpenClawRuntimeTemplates(runtimeRoot);
  if (!repair.ok) console.warn("[runtime] OpenClaw template repair pending before gateway start:", repair.error || repair.targetRoot);
  normalizeOpenClawPluginSkillLinks();
  const usbRuntime = path$1.join(getAppRoot(), "runtime");
  const paths = [];
  const binDir = getOpenClawRuntimeBinDir();
  const nodeBinDir = process.platform === "win32" ? runtimeRoot : path$1.join(runtimeRoot, "node", "bin");
  if (fs$1.existsSync(binDir)) {
    paths.push(binDir);
  }
  if (fs$1.existsSync(nodeBinDir)) {
    paths.push(nodeBinDir);
  }
  if (fs$1.existsSync(path$1.join(runtimeRoot, "openclaw.cmd")) || fs$1.existsSync(path$1.join(runtimeRoot, "node_modules")) || fs$1.existsSync(path$1.join(runtimeRoot, "openclaw", "node_modules"))) {
    paths.push(runtimeRoot);
  }
  if (fs$1.existsSync(usbRuntime)) {
    paths.push(usbRuntime);
  }
  const runtimePath = runtimeRoot;
  const nodePathEntries = [
    path$1.join(runtimePath, "node_modules"),
    path$1.join(runtimePath, "openclaw", "node_modules")
  ].filter((entry) => fs$1.existsSync(entry));
  const dnsHookPath = writeDnsHook();
  const nodeOptions = [
    // Windows 上 NODE_OPTIONS 中的反斜杠会被 Node.js 解析为转义字符，
    // Windows paths must use forward slashes before writing into JSON config.
    dnsHookPath ? `--require="${dnsHookPath.replace(/\\/g, "/")}"` : ""
  ].filter(Boolean).join(" ");
  const noProxy = [
    "openrouter.ai",
    process.env.NO_PROXY
  ].filter(Boolean).join(",");
  const portableStateRoot = path$1.join(getDataRoot(), ".openclaw");
  const portableTmp = path$1.join(portableStateRoot, "tmp");
  const portableHome = path$1.join(portableStateRoot, "home");
  fs$1.mkdirSync(portableTmp, { recursive: true });
  fs$1.mkdirSync(portableHome, { recursive: true });
  return {
    ...process.env,
    HOME: portableHome,
    USERPROFILE: portableHome,
    OPENCLAW_HOME: getDataRoot(),
    OPENCLAW_STATE_DIR: portableStateRoot,
    OPENCLAW_CONFIG: path$1.join(portableStateRoot, "openclaw.json"),
    OPENCLAW_CONFIG_PATH: path$1.join(portableStateRoot, "openclaw.json"),
    OPENCLAW_WORKSPACE: path$1.join(portableStateRoot, "workspace"),
    TMP: portableTmp,
    TEMP: portableTmp,
    NODE_PATH: (nodePathEntries.length ? nodePathEntries : [path$1.join(runtimePath, "node_modules")]).join(path$1.delimiter),
    PATH: `${paths.join(path$1.delimiter)}${path$1.delimiter}${process.env.PATH}`,
    NODE_OPTIONS: nodeOptions,
    NO_PROXY: noProxy,
    NO_COLOR: "1"
  };
}
function createGatewayManager() {
  let gatewayProc = null;
  let gatewayRunning = false;
  let healthPollTimer = null;
  let gatewayStopping = false;
  function stopGatewaySync() {
    stopHealthPoll();
    if (!gatewayProc) {
      gatewayRunning = false;
      return;
    }
    try {
      if (process.platform === "win32") {
        child_process.execSync(`taskkill /pid ${gatewayProc.pid} /T /F`, { stdio: "ignore", timeout: 3e3 });
      } else {
        gatewayProc.kill("SIGTERM");
      }
    } catch {
    }
    gatewayProc = null;
    gatewayRunning = false;
  }
  function classifyGatewayError(errorMsg) {
    const msg = (errorMsg || "").toLowerCase();
    if (msg.includes("unknown channel") || msg.includes("unknown channel id")) {
      return { title: "聊天插件未安装", detail: "配置了未安装的聊天插件，已自动清理无效配置，重启即可", action: "retry" };
    }
    if (msg.includes("enoent") || msg.includes("not found") || msg.includes("cannot find")) {
      return { title: "运行环境缺失", detail: "Node.js 或 OpenClaw 未找到，请点击一键修复重新解压运行环境", action: "repair" };
    }
    if (msg.includes("eaddrinuse") || msg.includes("address already in use") || msg.includes("18789")) {
      return { title: "端口被占用", detail: "端口 18789 被其他程序占用，点击下方按钮释放端口后重试", action: "clear-port" };
    }
    if (msg.includes("eacces") || msg.includes("eperm") || msg.includes("permission")) {
      return { title: "权限不足", detail: "没有足够权限启动服务，请尝试以管理员身份运行", action: "retry" };
    }
    if (msg.includes("module_not_found") || msg.includes("cannot find module")) {
      return { title: "模块缺失", detail: "核心模块丢失，请点击一键修复重新解压", action: "repair" };
    }
    if (msg.includes("config") || msg.includes("json") || msg.includes("parse")) {
      return { title: "配置文件损坏", detail: "配置文件格式错误，点击一键修复将重置配置", action: "repair" };
    }
    if (msg.includes("timeout") || msg.includes("超时")) {
      return { title: "启动超时", detail: "Gateway 启动超时，可能是系统资源不足或防火墙拦截，请重试", action: "retry" };
    }
    return { title: "启动失败", detail: errorMsg || "未知错误，请查看日志后重试", action: "retry" };
  }
  function stopHealthPoll() {
    if (healthPollTimer) {
      clearTimeout(healthPollTimer);
      healthPollTimer = null;
    }
  }
  function pollGatewayHealth(port, onFirstResult) {
    stopHealthPoll();
    let attempts = 0;
    const maxAttempts = 60;
    let resolved = false;
    sendBootPhase("waiting-ready", "等待就绪", "正在等待 Gateway 响应...", 40);
    const check = async () => {
      attempts++;
      const progress = Math.min(40 + Math.round(attempts / maxAttempts * 55), 95);
      if (!resolved && (attempts === 1 || attempts % 5 === 0)) {
        sendBootPhase("waiting-ready", "等待就绪", `健康检查中... (${attempts}/${maxAttempts})`, progress);
      }
      try {
        const http22 = require("http");
        const portOpen = await checkTcpPortOpen(port, 350);
        if (portOpen && !resolved) {
          gatewayRunning = true;
          sendBootPhase("waiting-ready", "Gateway 端口已打开", "Gateway 端口已打开，正在等待 health 和 WebSocket 就绪...", progress);
          sendGatewayStatus(true);
          resolved = true;
          if (onFirstResult) onFirstResult({ success: true, pendingReady: true, portOpen: true });
        }
        const result = await new Promise((res, rej) => {
          const req = http22.get(`http://127.0.0.1:${port}/health`, { timeout: 900 }, (resp) => {
            let data = "";
            resp.on("data", (c) => data += c);
            resp.on("end", () => res({ ok: resp.statusCode === 200, data }));
          });
          req.on("error", rej);
          req.on("timeout", () => {
            req.destroy();
            rej(new Error("timeout"));
          });
        });
        if (result.ok) {
          console.log(`[gateway] health OK on attempt ${attempts}`);
          attempts = 0;
          gatewayRunning = true;
          sendBootPhase("done", "启动成功", "Gateway 已就绪！", 100);
          sendGatewayStatus(true);
          safeSend("gateway-ready", true);
          if (!resolved && onFirstResult) {
            resolved = true;
            onFirstResult({ success: true });
          }
          healthPollTimer = setTimeout(check, 3e4);
          return;
        }
      } catch (e) {
        console.log(`[gateway] health attempt ${attempts}: ${e.message}`);
      }
      if (!gatewayProc) {
        const classified = classifyGatewayError("Gateway 进程已退出");
        sendBootPhase("error", classified.title, classified.detail, 0);
        if (!resolved && onFirstResult) {
          resolved = true;
          onFirstResult({ success: false, error: classified.title, errorDetail: classified.detail, errorAction: classified.action });
        }
        return;
      }
      if (resolved && attempts <= 5) {
        console.log(`[gateway] health blip ${attempts}/5, retrying in 10s...`);
        healthPollTimer = setTimeout(check, 1e4);
        return;
      }
      if (attempts < maxAttempts) {
        setTimeout(check, resolved ? 1e4 : 1e3);
      } else {
        console.log(`[gateway] health failed after ${maxAttempts} attempts`);
        gatewayRunning = false;
        const classified = classifyGatewayError("timeout");
        sendBootPhase("error", classified.title, classified.detail, 0);
        sendGatewayStatus(false, classified.title);
        if (!resolved && onFirstResult) {
          resolved = true;
          onFirstResult({ success: false, error: classified.title, errorDetail: classified.detail, errorAction: classified.action });
        }
      }
    };
    check();
  }
  function killProcessOnPort(port) {
    return new Promise((resolve) => {
      const platform2 = process.platform;
      let command;
      if (platform2 === "darwin") {
        command = `lsof -ti:${port} | xargs -I {} sh -c 'ps -p {} -o comm= 2>/dev/null | grep -q "${APP_NAME}" && kill -9 {}' 2>/dev/null || true`;
      } else if (isWin()) {
        console.log("[gateway] skipping blocking openclaw gateway stop during startup cleanup");
        const findCommand = `netstat -ano | findstr :${port} | findstr LISTENING`;
        child_process.exec(findCommand, { encoding: "utf-8", timeout: 3e3, windowsHide: true }, (err, stdout = "") => {
          if (err || !stdout.trim()) {
            console.log(`[gateway] port ${port} is free`);
            resolve(true);
            return;
          }
          const pids = Array.from(new Set(stdout.trim().split(/\r?\n/).map((line) => line.trim().split(/\s+/).pop()).filter((pid) => pid && pid !== "0" && /^\d+$/.test(pid))));
          if (!pids.length) {
            resolve(true);
            return;
          }
          let remaining = pids.length;
          for (const pid of pids) {
            child_process.exec(`taskkill /f /pid ${pid}`, { timeout: 3e3, windowsHide: true }, () => {
              console.log(`[gateway] killed process on port ${port} (pid ${pid})`);
              sendBootPhase("cleanup", "cleanup", `Stopped process on port ${port} (PID ${pid})`, 10);
              remaining--;
              if (remaining === 0) {
                setTimeout(() => resolve(true), 500);
              }
            });
          }
        });
        return;
        try {
          const netstat = child_process.execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: "utf-8", timeout: 3e3 });
          const lines = netstat.trim().split("\n");
          for (const line of lines) {
            const pid = line.trim().split(/\s+/).pop();
            if (pid && pid !== "0" && /^\d+$/.test(pid)) {
              try {
                child_process.execSync(`taskkill /f /pid ${pid}`, { stdio: "ignore", timeout: 3e3 });
              } catch {
              }
              console.log(`[gateway] killed process on port 18789 (pid ${pid})`);
              sendBootPhase("cleanup", "清理残留进程", `已终止占用端口的进程 (PID ${pid})`, 10);
            }
          }
        } catch {
        }
        for (let i = 0; i < 5; i++) {
          try {
            child_process.execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: "utf-8", timeout: 1e3 });
            child_process.execSync("ping 127.0.0.1 -n 1 -w 500 >nul", { stdio: "ignore" });
          } catch {
            console.log(`[gateway] port 18789 is free (after ${i} retries)`);
            break;
          }
        }
        resolve(true);
        return;
      } else {
        command = `fuser -k ${port}/tcp 2>/dev/null || true`;
      }
      child_process.exec(command, (err) => {
        if (err) {
          console.log(`[Gateway] No process found on port ${port} or already killed`);
        } else {
          console.log(`[Gateway] Killed process on port ${port}`);
        }
        setTimeout(() => resolve(true), 500);
      });
    });
  }
  async function startGateway(port = GATEWAY_DEFAULT_PORT) {
    if (gatewayProc) {
      sendBootPhase("done", "启动成功", "Gateway 已在运行中", 100);
      sendGatewayStatus(true);
      return Promise.resolve({ success: true, already: true });
    }
    const runtimeDiag = getOpenClawRuntimeDiagnosis();
    if (!runtimeDiag.ok) {
      const detail = formatOpenClawRuntimeDiagnosis(runtimeDiag);
      sendGatewayLog("stderr", detail);
      sendBootPhase("error", "OpenClaw 运行时不完整", "缺少 runtime/node_modules/openclaw/openclaw.mjs，请检查 U 盘 runtime 复制层级。", 0);
      sendGatewayStatus(false, "OpenClaw 运行时不完整");
      return Promise.resolve({
        success: false,
        error: "OpenClaw 运行时不完整",
        errorDetail: detail,
        errorAction: "copy-runtime"
      });
    }
    sendBootPhase("cleanup", "清理残留进程", "检查端口占用...", 5);
    await killProcessOnPort(port);
    sendBootPhase("config", "初始化配置", "检查并生成配置文件...", 15);
    sendBootPhase("runtime-check", "检查运行环境", "验证 Node.js 和 OpenClaw...", 20);
    sendBootPhase("plugin-check", "检查插件", "验证插件完整性...", 28);
    sendBootPhase("start-command", "启动 Gateway", "正在启动 Gateway 进程...", 30);
    sendBootPhase("generate-new-token", "生成 Token", "生成新token...", 30);
    return new Promise(async (resolve, reject) => {
      const env2 = getGatewayEnv();
      const cli = getOpenClawPath();
      if (isWin()) {
        const cmdExe = path$1.join(process.env.SystemRoot || "C:\\Windows", "System32", "cmd.exe");
        gatewayProc = child_process.spawn(cmdExe, ["/c", `"${cli}"`, "gateway", "--allow-unconfigured"], {
          env: env2,
          stdio: ["ignore", "pipe", "pipe"],
          detached: false,
          windowsVerbatimArguments: true,
          cwd: getAppRoot()
        });
      } else {
        gatewayProc = child_process.spawn(cli, ["gateway", "--allow-unconfigured"], {
          env: env2,
          stdio: ["ignore", "pipe", "pipe"],
          detached: false,
          shell: true,
          cwd: getAppRoot()
        });
      }
      let output = "";
      gatewayProc.stdout?.on("data", (d) => {
        const text = d.toString().trim();
        output += text;
        console.log(`[gateway:out] ${text}`);
        text.split("\n").forEach((line) => {
          if (line.trim()) sendGatewayLog("stdout", line.trim());
          if (line.includes("[gateway] listening on") || line.includes("gateway ready") || line.includes("http server listening")) {
            gatewayRunning = true;
            sendGatewayStatus(true);
          }
        });
      });
      gatewayProc.stderr?.on("data", (d) => {
        const text = d.toString().trim();
        output += text;
        console.log(`[gateway:err] ${text}`);
        text.split("\n").forEach((line) => {
          if (line.trim()) sendGatewayLog("stderr", line.trim());
        });
      });
      gatewayProc.on("exit", (code) => {
        console.log(`[gateway] process exited with code ${code}`);
        gatewayProc = null;
        gatewayRunning = false;
        stopHealthPoll();
        if (code && !gatewayStopping) {
          const errorContext = output.includes("unknown channel") ? output : `进程异常退出 (code ${code})`;
          const classified = classifyGatewayError(errorContext);
          sendBootPhase("error", classified.title, classified.detail, 0);
          sendGatewayStatus(false, classified.title);
          {
            if (!global._gwRestartHistory) global._gwRestartHistory = [];
            const now = Date.now();
            global._gwRestartHistory = global._gwRestartHistory.filter((t) => now - t < 3e5);
            if (global._gwRestartHistory.length < 3) {
              global._gwRestartHistory.push(now);
              const delay = Math.min(5e3 * global._gwRestartHistory.length, 15e3);
              console.log(`[gateway] auto-restart in ${delay / 1e3}s (attempt ${global._gwRestartHistory.length}/3)`);
              sendGatewayLog("stderr", `⚠️ Gateway 崩溃，${delay / 1e3}秒后自动重启 (第${global._gwRestartHistory.length}次)...`);
              sendGatewayStatus(true);
              sendBootPhase("waiting-ready", "自动重启", `${delay / 1e3}秒后重启...`, 30);
              setTimeout(() => {
                if (!gatewayRunning && true) {
                  console.log("[gateway] auto-restarting...");
                  startGateway(port);
                }
              }, delay);
            } else {
              console.log("[gateway] auto-restart limit reached (3 times in 5 min)");
              sendGatewayLog("stderr", "❌ Gateway 反复崩溃，已停止自动重启。请检查配置或点击“一键修复”。");
            }
          }
        } else {
          gatewayStopping = false;
          sendGatewayStatus(false);
        }
        gatewayStopping = false;
      });
      gatewayProc.on("error", (err) => {
        console.log(`[gateway] spawn error: ${err.message}`);
        gatewayProc = null;
        gatewayRunning = false;
        const classified = classifyGatewayError(err.message);
        sendBootPhase("error", classified.title, classified.detail, 0);
        sendGatewayStatus(false, classified.title);
        resolve({ success: false, error: classified.title, errorDetail: classified.detail, errorAction: classified.action });
      });
      pollGatewayHealth(port, (result) => {
        resolve(result);
      });
    });
  }
  function stopGateway() {
    stopHealthPoll();
    gatewayStopping = true;
    if (!gatewayProc) {
      gatewayRunning = false;
      gatewayStopping = false;
      return Promise.resolve({ success: true });
    }
    return new Promise((resolve) => {
      try {
        if (process.platform === "win32") {
          child_process.spawn("taskkill", ["/pid", String(gatewayProc.pid), "/T", "/F"], { stdio: "ignore" });
        } else {
          gatewayProc.kill("SIGTERM");
        }
      } catch {
      }
      const timeout = setTimeout(() => {
        gatewayProc = null;
        gatewayRunning = false;
        sendGatewayStatus(false);
        resolve({ success: true });
      }, 3e3);
      if (gatewayProc) {
        gatewayProc.once("exit", () => {
          console.log("监听到停止了...");
          clearTimeout(timeout);
          gatewayProc = null;
          gatewayRunning = false;
          sendGatewayStatus(false);
          resolve({ success: true });
        });
      }
    });
  }
  async function restartGateway(port = GATEWAY_DEFAULT_PORT) {
    safeSend("gateway-restarting", true);
    console.log("[restart] stopping gateway...");
    await stopGateway();
    if (isWin()) {
      try {
        const netstat = child_process.execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: "utf-8", timeout: 3e3 });
        const lines = netstat.trim().split("\n");
        for (const line of lines) {
          const pid = line.trim().split(/\s+/).pop();
          if (pid && pid !== "0" && /^\d+$/.test(pid)) {
            try {
              child_process.execSync(`taskkill /f /pid ${pid}`, { stdio: "ignore", timeout: 3e3 });
            } catch {
            }
            console.log(`[restart] killed orphaned process on port 18789: pid ${pid}`);
          }
        }
      } catch {
      }
    }
    await new Promise((r) => setTimeout(r, 2e3));
    console.log("[restart] starting gateway...");
    const restartResult = await startGateway(port);
    const restartOk = restartResult?.success !== false;
    safeSend("gateway-restarting", false);
    if (restartOk) {
      sendGatewayStatus(true);
      safeSend("gateway-restarted", { success: true, port, source: "codex-gateway-restart-status-recovery" });
      return { success: true };
    }
    sendGatewayStatus(false, restartResult?.error || "Gateway restart failed");
    safeSend("gateway-restarted", { success: false, port, error: restartResult?.error || "Gateway restart failed", source: "codex-gateway-restart-status-recovery" });
    return restartResult || { success: false, error: "Gateway restart failed" };
  }
  function isGatewayReady() {
    return gatewayRunning;
  }
  return {
    startGateway,
    stopGateway,
    restartGateway,
    isGatewayReady,
    stopGatewaySync
  };
}
function setupLifecycle({ getGateway }) {
  electron.app.on("window-all-closed", () => {
    console.log(`所有窗口已关闭，app.isQuitting=`, electron.app.isQuitting, "mainWindow=", !!mainWindow);
    if (process.platform !== "darwin") {
      electron.app.quit();
    }
  });
  electron.app.on("before-quit", async () => {
    console.log(`应用退出前事件触发`);
    electron.app.isQuitting = true;
    flushGatewayDiskLogs();
    if (hermesManager) {
      await hermesManager.stop();
    }
    await getGateway().stopGateway();
    cleanupPortableChildProcesses();
  });
  electron.app.on("activate", async () => {
  });
}
function bind$2(fn, thisArg) {
  return function wrap2() {
    return fn.apply(thisArg, arguments);
  };
}
const { toString } = Object.prototype;
const { getPrototypeOf } = Object;
const { iterator, toStringTag: toStringTag$1 } = Symbol;
const kindOf = /* @__PURE__ */ ((cache) => (thing) => {
  const str = toString.call(thing);
  return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
})(/* @__PURE__ */ Object.create(null));
const kindOfTest = (type2) => {
  type2 = type2.toLowerCase();
  return (thing) => kindOf(thing) === type2;
};
const typeOfTest = (type2) => (thing) => typeof thing === type2;
const { isArray: isArray$1 } = Array;
const isUndefined = typeOfTest("undefined");
function isBuffer$1(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor) && isFunction$2(val.constructor.isBuffer) && val.constructor.isBuffer(val);
}
const isArrayBuffer = kindOfTest("ArrayBuffer");
function isArrayBufferView(val) {
  let result;
  if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
    result = ArrayBuffer.isView(val);
  } else {
    result = val && val.buffer && isArrayBuffer(val.buffer);
  }
  return result;
}
const isString$1 = typeOfTest("string");
const isFunction$2 = typeOfTest("function");
const isNumber = typeOfTest("number");
const isObject = (thing) => thing !== null && typeof thing === "object";
const isBoolean = (thing) => thing === true || thing === false;
const isPlainObject = (val) => {
  if (kindOf(val) !== "object") {
    return false;
  }
  const prototype2 = getPrototypeOf(val);
  return (prototype2 === null || prototype2 === Object.prototype || Object.getPrototypeOf(prototype2) === null) && !(toStringTag$1 in val) && !(iterator in val);
};
const isEmptyObject = (val) => {
  if (!isObject(val) || isBuffer$1(val)) {
    return false;
  }
  try {
    return Object.keys(val).length === 0 && Object.getPrototypeOf(val) === Object.prototype;
  } catch (e) {
    return false;
  }
};
const isDate = kindOfTest("Date");
const isFile = kindOfTest("File");
const isReactNativeBlob = (value) => {
  return !!(value && typeof value.uri !== "undefined");
};
const isReactNative = (formData) => formData && typeof formData.getParts !== "undefined";
const isBlob = kindOfTest("Blob");
const isFileList = kindOfTest("FileList");
const isStream = (val) => isObject(val) && isFunction$2(val.pipe);
function getGlobal() {
  if (typeof globalThis !== "undefined") return globalThis;
  if (typeof self !== "undefined") return self;
  if (typeof window !== "undefined") return window;
  if (typeof global !== "undefined") return global;
  return {};
}
const G = getGlobal();
const FormDataCtor = typeof G.FormData !== "undefined" ? G.FormData : void 0;
const isFormData = (thing) => {
  if (!thing) return false;
  if (FormDataCtor && thing instanceof FormDataCtor) return true;
  const proto = getPrototypeOf(thing);
  if (!proto || proto === Object.prototype) return false;
  if (!isFunction$2(thing.append)) return false;
  const kind = kindOf(thing);
  return kind === "formdata" || // detect form-data instance
  kind === "object" && isFunction$2(thing.toString) && thing.toString() === "[object FormData]";
};
const isURLSearchParams = kindOfTest("URLSearchParams");
const [isReadableStream, isRequest, isResponse, isHeaders] = [
  "ReadableStream",
  "Request",
  "Response",
  "Headers"
].map(kindOfTest);
const trim = (str) => {
  return str.trim ? str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
};
function forEach(obj, fn, { allOwnKeys = false } = {}) {
  if (obj === null || typeof obj === "undefined") {
    return;
  }
  let i;
  let l;
  if (typeof obj !== "object") {
    obj = [obj];
  }
  if (isArray$1(obj)) {
    for (i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    if (isBuffer$1(obj)) {
      return;
    }
    const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
    const len = keys.length;
    let key;
    for (i = 0; i < len; i++) {
      key = keys[i];
      fn.call(null, obj[key], key, obj);
    }
  }
}
function findKey(obj, key) {
  if (isBuffer$1(obj)) {
    return null;
  }
  key = key.toLowerCase();
  const keys = Object.keys(obj);
  let i = keys.length;
  let _key;
  while (i-- > 0) {
    _key = keys[i];
    if (key === _key.toLowerCase()) {
      return _key;
    }
  }
  return null;
}
const _global = (() => {
  if (typeof globalThis !== "undefined") return globalThis;
  return typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : global;
})();
const isContextDefined = (context) => !isUndefined(context) && context !== _global;
function merge() {
  const { caseless, skipUndefined } = isContextDefined(this) && this || {};
  const result = {};
  const assignValue = (val, key) => {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return;
    }
    const targetKey = caseless && findKey(result, key) || key;
    if (isPlainObject(result[targetKey]) && isPlainObject(val)) {
      result[targetKey] = merge(result[targetKey], val);
    } else if (isPlainObject(val)) {
      result[targetKey] = merge({}, val);
    } else if (isArray$1(val)) {
      result[targetKey] = val.slice();
    } else if (!skipUndefined || !isUndefined(val)) {
      result[targetKey] = val;
    }
  };
  for (let i = 0, l = arguments.length; i < l; i++) {
    arguments[i] && forEach(arguments[i], assignValue);
  }
  return result;
}
const extend = (a, b, thisArg, { allOwnKeys } = {}) => {
  forEach(
    b,
    (val, key) => {
      if (thisArg && isFunction$2(val)) {
        Object.defineProperty(a, key, {
          value: bind$2(val, thisArg),
          writable: true,
          enumerable: true,
          configurable: true
        });
      } else {
        Object.defineProperty(a, key, {
          value: val,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    },
    { allOwnKeys }
  );
  return a;
};
const stripBOM = (content) => {
  if (content.charCodeAt(0) === 65279) {
    content = content.slice(1);
  }
  return content;
};
const inherits = (constructor, superConstructor, props, descriptors) => {
  constructor.prototype = Object.create(superConstructor.prototype, descriptors);
  Object.defineProperty(constructor.prototype, "constructor", {
    value: constructor,
    writable: true,
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(constructor, "super", {
    value: superConstructor.prototype
  });
  props && Object.assign(constructor.prototype, props);
};
const toFlatObject = (sourceObj, destObj, filter2, propFilter) => {
  let props;
  let i;
  let prop;
  const merged = {};
  destObj = destObj || {};
  if (sourceObj == null) return destObj;
  do {
    props = Object.getOwnPropertyNames(sourceObj);
    i = props.length;
    while (i-- > 0) {
      prop = props[i];
      if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
        destObj[prop] = sourceObj[prop];
        merged[prop] = true;
      }
    }
    sourceObj = filter2 !== false && getPrototypeOf(sourceObj);
  } while (sourceObj && (!filter2 || filter2(sourceObj, destObj)) && sourceObj !== Object.prototype);
  return destObj;
};
const endsWith = (str, searchString, position) => {
  str = String(str);
  if (position === void 0 || position > str.length) {
    position = str.length;
  }
  position -= searchString.length;
  const lastIndex = str.indexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
};
const toArray = (thing) => {
  if (!thing) return null;
  if (isArray$1(thing)) return thing;
  let i = thing.length;
  if (!isNumber(i)) return null;
  const arr = new Array(i);
  while (i-- > 0) {
    arr[i] = thing[i];
  }
  return arr;
};
const isTypedArray = /* @__PURE__ */ ((TypedArray2) => {
  return (thing) => {
    return TypedArray2 && thing instanceof TypedArray2;
  };
})(typeof Uint8Array !== "undefined" && getPrototypeOf(Uint8Array));
const forEachEntry = (obj, fn) => {
  const generator = obj && obj[iterator];
  const _iterator = generator.call(obj);
  let result;
  while ((result = _iterator.next()) && !result.done) {
    const pair = result.value;
    fn.call(obj, pair[0], pair[1]);
  }
};
const matchAll = (regExp, str) => {
  let matches;
  const arr = [];
  while ((matches = regExp.exec(str)) !== null) {
    arr.push(matches);
  }
  return arr;
};
const isHTMLForm = kindOfTest("HTMLFormElement");
const toCamelCase = (str) => {
  return str.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g, function replacer(m, p1, p2) {
    return p1.toUpperCase() + p2;
  });
};
const hasOwnProperty = (({ hasOwnProperty: hasOwnProperty2 }) => (obj, prop) => hasOwnProperty2.call(obj, prop))(Object.prototype);
const isRegExp = kindOfTest("RegExp");
const reduceDescriptors = (obj, reducer) => {
  const descriptors = Object.getOwnPropertyDescriptors(obj);
  const reducedDescriptors = {};
  forEach(descriptors, (descriptor, name) => {
    let ret;
    if ((ret = reducer(descriptor, name, obj)) !== false) {
      reducedDescriptors[name] = ret || descriptor;
    }
  });
  Object.defineProperties(obj, reducedDescriptors);
};
const freezeMethods = (obj) => {
  reduceDescriptors(obj, (descriptor, name) => {
    if (isFunction$2(obj) && ["arguments", "caller", "callee"].indexOf(name) !== -1) {
      return false;
    }
    const value = obj[name];
    if (!isFunction$2(value)) return;
    descriptor.enumerable = false;
    if ("writable" in descriptor) {
      descriptor.writable = false;
      return;
    }
    if (!descriptor.set) {
      descriptor.set = () => {
        throw Error("Can not rewrite read-only method '" + name + "'");
      };
    }
  });
};
const toObjectSet = (arrayOrString, delimiter) => {
  const obj = {};
  const define = (arr) => {
    arr.forEach((value) => {
      obj[value] = true;
    });
  };
  isArray$1(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));
  return obj;
};
const noop$1 = () => {
};
const toFiniteNumber = (value, defaultValue) => {
  return value != null && Number.isFinite(value = +value) ? value : defaultValue;
};
function isSpecCompliantForm(thing) {
  return !!(thing && isFunction$2(thing.append) && thing[toStringTag$1] === "FormData" && thing[iterator]);
}
const toJSONObject = (obj) => {
  const stack = new Array(10);
  const visit = (source, i) => {
    if (isObject(source)) {
      if (stack.indexOf(source) >= 0) {
        return;
      }
      if (isBuffer$1(source)) {
        return source;
      }
      if (!("toJSON" in source)) {
        stack[i] = source;
        const target = isArray$1(source) ? [] : {};
        forEach(source, (value, key) => {
          const reducedValue = visit(value, i + 1);
          !isUndefined(reducedValue) && (target[key] = reducedValue);
        });
        stack[i] = void 0;
        return target;
      }
    }
    return source;
  };
  return visit(obj, 0);
};
const isAsyncFn = kindOfTest("AsyncFunction");
const isThenable = (thing) => thing && (isObject(thing) || isFunction$2(thing)) && isFunction$2(thing.then) && isFunction$2(thing.catch);
const _setImmediate = ((setImmediateSupported, postMessageSupported) => {
  if (setImmediateSupported) {
    return setImmediate;
  }
  return postMessageSupported ? ((token, callbacks) => {
    _global.addEventListener(
      "message",
      ({ source, data }) => {
        if (source === _global && data === token) {
          callbacks.length && callbacks.shift()();
        }
      },
      false
    );
    return (cb) => {
      callbacks.push(cb);
      _global.postMessage(token, "*");
    };
  })(`axios@${Math.random()}`, []) : (cb) => setTimeout(cb);
})(typeof setImmediate === "function", isFunction$2(_global.postMessage));
const asap = typeof queueMicrotask !== "undefined" ? queueMicrotask.bind(_global) : typeof process !== "undefined" && process.nextTick || _setImmediate;
const isIterable = (thing) => thing != null && isFunction$2(thing[iterator]);
const utils$1 = {
  isArray: isArray$1,
  isArrayBuffer,
  isBuffer: isBuffer$1,
  isFormData,
  isArrayBufferView,
  isString: isString$1,
  isNumber,
  isBoolean,
  isObject,
  isPlainObject,
  isEmptyObject,
  isReadableStream,
  isRequest,
  isResponse,
  isHeaders,
  isUndefined,
  isDate,
  isFile,
  isReactNativeBlob,
  isReactNative,
  isBlob,
  isRegExp,
  isFunction: isFunction$2,
  isStream,
  isURLSearchParams,
  isTypedArray,
  isFileList,
  forEach,
  merge,
  extend,
  trim,
  stripBOM,
  inherits,
  toFlatObject,
  kindOf,
  kindOfTest,
  endsWith,
  toArray,
  forEachEntry,
  matchAll,
  isHTMLForm,
  hasOwnProperty,
  hasOwnProp: hasOwnProperty,
  // an alias to avoid ESLint no-prototype-builtins detection
  reduceDescriptors,
  freezeMethods,
  toObjectSet,
  toCamelCase,
  noop: noop$1,
  toFiniteNumber,
  findKey,
  global: _global,
  isContextDefined,
  isSpecCompliantForm,
  toJSONObject,
  isAsyncFn,
  isThenable,
  setImmediate: _setImmediate,
  asap,
  isIterable
};
let AxiosError$1 = class AxiosError extends Error {
  static from(error, code, config, request, response, customProps) {
    const axiosError = new AxiosError(error.message, code || error.code, config, request, response);
    axiosError.cause = error;
    axiosError.name = error.name;
    if (error.status != null && axiosError.status == null) {
      axiosError.status = error.status;
    }
    customProps && Object.assign(axiosError, customProps);
    return axiosError;
  }
  /**
   * Create an Error with the specified message, config, error code, request and response.
   *
   * @param {string} message The error message.
   * @param {string} [code] The error code (for example, 'ECONNABORTED').
   * @param {Object} [config] The config.
   * @param {Object} [request] The request.
   * @param {Object} [response] The response.
   *
   * @returns {Error} The created error.
   */
  constructor(message, code, config, request, response) {
    super(message);
    Object.defineProperty(this, "message", {
      value: message,
      enumerable: true,
      writable: true,
      configurable: true
    });
    this.name = "AxiosError";
    this.isAxiosError = true;
    code && (this.code = code);
    config && (this.config = config);
    request && (this.request = request);
    if (response) {
      this.response = response;
      this.status = response.status;
    }
  }
  toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: utils$1.toJSONObject(this.config),
      code: this.code,
      status: this.status
    };
  }
};
AxiosError$1.ERR_BAD_OPTION_VALUE = "ERR_BAD_OPTION_VALUE";
AxiosError$1.ERR_BAD_OPTION = "ERR_BAD_OPTION";
AxiosError$1.ECONNABORTED = "ECONNABORTED";
AxiosError$1.ETIMEDOUT = "ETIMEDOUT";
AxiosError$1.ERR_NETWORK = "ERR_NETWORK";
AxiosError$1.ERR_FR_TOO_MANY_REDIRECTS = "ERR_FR_TOO_MANY_REDIRECTS";
AxiosError$1.ERR_DEPRECATED = "ERR_DEPRECATED";
AxiosError$1.ERR_BAD_RESPONSE = "ERR_BAD_RESPONSE";
AxiosError$1.ERR_BAD_REQUEST = "ERR_BAD_REQUEST";
AxiosError$1.ERR_CANCELED = "ERR_CANCELED";
AxiosError$1.ERR_NOT_SUPPORT = "ERR_NOT_SUPPORT";
AxiosError$1.ERR_INVALID_URL = "ERR_INVALID_URL";
AxiosError$1.ERR_FORM_DATA_DEPTH_EXCEEDED = "ERR_FORM_DATA_DEPTH_EXCEEDED";
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var Stream$2 = stream.Stream;
var util$2 = require$$1;
var delayed_stream = DelayedStream$1;
function DelayedStream$1() {
  this.source = null;
  this.dataSize = 0;
  this.maxDataSize = 1024 * 1024;
  this.pauseStream = true;
  this._maxDataSizeExceeded = false;
  this._released = false;
  this._bufferedEvents = [];
}
util$2.inherits(DelayedStream$1, Stream$2);
DelayedStream$1.create = function(source, options) {
  var delayedStream = new this();
  options = options || {};
  for (var option in options) {
    delayedStream[option] = options[option];
  }
  delayedStream.source = source;
  var realEmit = source.emit;
  source.emit = function() {
    delayedStream._handleEmit(arguments);
    return realEmit.apply(source, arguments);
  };
  source.on("error", function() {
  });
  if (delayedStream.pauseStream) {
    source.pause();
  }
  return delayedStream;
};
Object.defineProperty(DelayedStream$1.prototype, "readable", {
  configurable: true,
  enumerable: true,
  get: function() {
    return this.source.readable;
  }
});
DelayedStream$1.prototype.setEncoding = function() {
  return this.source.setEncoding.apply(this.source, arguments);
};
DelayedStream$1.prototype.resume = function() {
  if (!this._released) {
    this.release();
  }
  this.source.resume();
};
DelayedStream$1.prototype.pause = function() {
  this.source.pause();
};
DelayedStream$1.prototype.release = function() {
  this._released = true;
  this._bufferedEvents.forEach(function(args) {
    this.emit.apply(this, args);
  }.bind(this));
  this._bufferedEvents = [];
};
DelayedStream$1.prototype.pipe = function() {
  var r = Stream$2.prototype.pipe.apply(this, arguments);
  this.resume();
  return r;
};
DelayedStream$1.prototype._handleEmit = function(args) {
  if (this._released) {
    this.emit.apply(this, args);
    return;
  }
  if (args[0] === "data") {
    this.dataSize += args[1].length;
    this._checkIfMaxDataSizeExceeded();
  }
  this._bufferedEvents.push(args);
};
DelayedStream$1.prototype._checkIfMaxDataSizeExceeded = function() {
  if (this._maxDataSizeExceeded) {
    return;
  }
  if (this.dataSize <= this.maxDataSize) {
    return;
  }
  this._maxDataSizeExceeded = true;
  var message = "DelayedStream#maxDataSize of " + this.maxDataSize + " bytes exceeded.";
  this.emit("error", new Error(message));
};
var util$1 = require$$1;
var Stream$1 = stream.Stream;
var DelayedStream = delayed_stream;
var combined_stream = CombinedStream$1;
function CombinedStream$1() {
  this.writable = false;
  this.readable = true;
  this.dataSize = 0;
  this.maxDataSize = 2 * 1024 * 1024;
  this.pauseStreams = true;
  this._released = false;
  this._streams = [];
  this._currentStream = null;
  this._insideLoop = false;
  this._pendingNext = false;
}
util$1.inherits(CombinedStream$1, Stream$1);
CombinedStream$1.create = function(options) {
  var combinedStream = new this();
  options = options || {};
  for (var option in options) {
    combinedStream[option] = options[option];
  }
  return combinedStream;
};
CombinedStream$1.isStreamLike = function(stream2) {
  return typeof stream2 !== "function" && typeof stream2 !== "string" && typeof stream2 !== "boolean" && typeof stream2 !== "number" && !Buffer.isBuffer(stream2);
};
CombinedStream$1.prototype.append = function(stream2) {
  var isStreamLike = CombinedStream$1.isStreamLike(stream2);
  if (isStreamLike) {
    if (!(stream2 instanceof DelayedStream)) {
      var newStream = DelayedStream.create(stream2, {
        maxDataSize: Infinity,
        pauseStream: this.pauseStreams
      });
      stream2.on("data", this._checkDataSize.bind(this));
      stream2 = newStream;
    }
    this._handleErrors(stream2);
    if (this.pauseStreams) {
      stream2.pause();
    }
  }
  this._streams.push(stream2);
  return this;
};
CombinedStream$1.prototype.pipe = function(dest, options) {
  Stream$1.prototype.pipe.call(this, dest, options);
  this.resume();
  return dest;
};
CombinedStream$1.prototype._getNext = function() {
  this._currentStream = null;
  if (this._insideLoop) {
    this._pendingNext = true;
    return;
  }
  this._insideLoop = true;
  try {
    do {
      this._pendingNext = false;
      this._realGetNext();
    } while (this._pendingNext);
  } finally {
    this._insideLoop = false;
  }
};
CombinedStream$1.prototype._realGetNext = function() {
  var stream2 = this._streams.shift();
  if (typeof stream2 == "undefined") {
    this.end();
    return;
  }
  if (typeof stream2 !== "function") {
    this._pipeNext(stream2);
    return;
  }
  var getStream = stream2;
  getStream(function(stream3) {
    var isStreamLike = CombinedStream$1.isStreamLike(stream3);
    if (isStreamLike) {
      stream3.on("data", this._checkDataSize.bind(this));
      this._handleErrors(stream3);
    }
    this._pipeNext(stream3);
  }.bind(this));
};
CombinedStream$1.prototype._pipeNext = function(stream2) {
  this._currentStream = stream2;
  var isStreamLike = CombinedStream$1.isStreamLike(stream2);
  if (isStreamLike) {
    stream2.on("end", this._getNext.bind(this));
    stream2.pipe(this, { end: false });
    return;
  }
  var value = stream2;
  this.write(value);
  this._getNext();
};
CombinedStream$1.prototype._handleErrors = function(stream2) {
  var self2 = this;
  stream2.on("error", function(err) {
    self2._emitError(err);
  });
};
CombinedStream$1.prototype.write = function(data) {
  this.emit("data", data);
};
CombinedStream$1.prototype.pause = function() {
  if (!this.pauseStreams) {
    return;
  }
  if (this.pauseStreams && this._currentStream && typeof this._currentStream.pause == "function") this._currentStream.pause();
  this.emit("pause");
};
CombinedStream$1.prototype.resume = function() {
  if (!this._released) {
    this._released = true;
    this.writable = true;
    this._getNext();
  }
  if (this.pauseStreams && this._currentStream && typeof this._currentStream.resume == "function") this._currentStream.resume();
  this.emit("resume");
};
CombinedStream$1.prototype.end = function() {
  this._reset();
  this.emit("end");
};
CombinedStream$1.prototype.destroy = function() {
  this._reset();
  this.emit("close");
};
CombinedStream$1.prototype._reset = function() {
  this.writable = false;
  this._streams = [];
  this._currentStream = null;
};
CombinedStream$1.prototype._checkDataSize = function() {
  this._updateDataSize();
  if (this.dataSize <= this.maxDataSize) {
    return;
  }
  var message = "DelayedStream#maxDataSize of " + this.maxDataSize + " bytes exceeded.";
  this._emitError(new Error(message));
};
CombinedStream$1.prototype._updateDataSize = function() {
  this.dataSize = 0;
  var self2 = this;
  this._streams.forEach(function(stream2) {
    if (!stream2.dataSize) {
      return;
    }
    self2.dataSize += stream2.dataSize;
  });
  if (this._currentStream && this._currentStream.dataSize) {
    this.dataSize += this._currentStream.dataSize;
  }
};
CombinedStream$1.prototype._emitError = function(err) {
  this._reset();
  this.emit("error", err);
};
var mimeTypes = {};
const require$$0 = {
  "application/1d-interleaved-parityfec": {
    source: "iana"
  },
  "application/3gpdash-qoe-report+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/3gpp-ims+xml": {
    source: "iana",
    compressible: true
  },
  "application/3gpphal+json": {
    source: "iana",
    compressible: true
  },
  "application/3gpphalforms+json": {
    source: "iana",
    compressible: true
  },
  "application/a2l": {
    source: "iana"
  },
  "application/ace+cbor": {
    source: "iana"
  },
  "application/activemessage": {
    source: "iana"
  },
  "application/activity+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-costmap+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-costmapfilter+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-directory+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-endpointcost+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-endpointcostparams+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-endpointprop+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-endpointpropparams+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-error+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-networkmap+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-networkmapfilter+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-updatestreamcontrol+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-updatestreamparams+json": {
    source: "iana",
    compressible: true
  },
  "application/aml": {
    source: "iana"
  },
  "application/andrew-inset": {
    source: "iana",
    extensions: [
      "ez"
    ]
  },
  "application/applefile": {
    source: "iana"
  },
  "application/applixware": {
    source: "apache",
    extensions: [
      "aw"
    ]
  },
  "application/at+jwt": {
    source: "iana"
  },
  "application/atf": {
    source: "iana"
  },
  "application/atfx": {
    source: "iana"
  },
  "application/atom+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "atom"
    ]
  },
  "application/atomcat+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "atomcat"
    ]
  },
  "application/atomdeleted+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "atomdeleted"
    ]
  },
  "application/atomicmail": {
    source: "iana"
  },
  "application/atomsvc+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "atomsvc"
    ]
  },
  "application/atsc-dwd+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "dwd"
    ]
  },
  "application/atsc-dynamic-event-message": {
    source: "iana"
  },
  "application/atsc-held+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "held"
    ]
  },
  "application/atsc-rdt+json": {
    source: "iana",
    compressible: true
  },
  "application/atsc-rsat+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "rsat"
    ]
  },
  "application/atxml": {
    source: "iana"
  },
  "application/auth-policy+xml": {
    source: "iana",
    compressible: true
  },
  "application/bacnet-xdd+zip": {
    source: "iana",
    compressible: false
  },
  "application/batch-smtp": {
    source: "iana"
  },
  "application/bdoc": {
    compressible: false,
    extensions: [
      "bdoc"
    ]
  },
  "application/beep+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/calendar+json": {
    source: "iana",
    compressible: true
  },
  "application/calendar+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "xcs"
    ]
  },
  "application/call-completion": {
    source: "iana"
  },
  "application/cals-1840": {
    source: "iana"
  },
  "application/captive+json": {
    source: "iana",
    compressible: true
  },
  "application/cbor": {
    source: "iana"
  },
  "application/cbor-seq": {
    source: "iana"
  },
  "application/cccex": {
    source: "iana"
  },
  "application/ccmp+xml": {
    source: "iana",
    compressible: true
  },
  "application/ccxml+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "ccxml"
    ]
  },
  "application/cdfx+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "cdfx"
    ]
  },
  "application/cdmi-capability": {
    source: "iana",
    extensions: [
      "cdmia"
    ]
  },
  "application/cdmi-container": {
    source: "iana",
    extensions: [
      "cdmic"
    ]
  },
  "application/cdmi-domain": {
    source: "iana",
    extensions: [
      "cdmid"
    ]
  },
  "application/cdmi-object": {
    source: "iana",
    extensions: [
      "cdmio"
    ]
  },
  "application/cdmi-queue": {
    source: "iana",
    extensions: [
      "cdmiq"
    ]
  },
  "application/cdni": {
    source: "iana"
  },
  "application/cea": {
    source: "iana"
  },
  "application/cea-2018+xml": {
    source: "iana",
    compressible: true
  },
  "application/cellml+xml": {
    source: "iana",
    compressible: true
  },
  "application/cfw": {
    source: "iana"
  },
  "application/city+json": {
    source: "iana",
    compressible: true
  },
  "application/clr": {
    source: "iana"
  },
  "application/clue+xml": {
    source: "iana",
    compressible: true
  },
  "application/clue_info+xml": {
    source: "iana",
    compressible: true
  },
  "application/cms": {
    source: "iana"
  },
  "application/cnrp+xml": {
    source: "iana",
    compressible: true
  },
  "application/coap-group+json": {
    source: "iana",
    compressible: true
  },
  "application/coap-payload": {
    source: "iana"
  },
  "application/commonground": {
    source: "iana"
  },
  "application/conference-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/cose": {
    source: "iana"
  },
  "application/cose-key": {
    source: "iana"
  },
  "application/cose-key-set": {
    source: "iana"
  },
  "application/cpl+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "cpl"
    ]
  },
  "application/csrattrs": {
    source: "iana"
  },
  "application/csta+xml": {
    source: "iana",
    compressible: true
  },
  "application/cstadata+xml": {
    source: "iana",
    compressible: true
  },
  "application/csvm+json": {
    source: "iana",
    compressible: true
  },
  "application/cu-seeme": {
    source: "apache",
    extensions: [
      "cu"
    ]
  },
  "application/cwt": {
    source: "iana"
  },
  "application/cybercash": {
    source: "iana"
  },
  "application/dart": {
    compressible: true
  },
  "application/dash+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "mpd"
    ]
  },
  "application/dash-patch+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "mpp"
    ]
  },
  "application/dashdelta": {
    source: "iana"
  },
  "application/davmount+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "davmount"
    ]
  },
  "application/dca-rft": {
    source: "iana"
  },
  "application/dcd": {
    source: "iana"
  },
  "application/dec-dx": {
    source: "iana"
  },
  "application/dialog-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/dicom": {
    source: "iana"
  },
  "application/dicom+json": {
    source: "iana",
    compressible: true
  },
  "application/dicom+xml": {
    source: "iana",
    compressible: true
  },
  "application/dii": {
    source: "iana"
  },
  "application/dit": {
    source: "iana"
  },
  "application/dns": {
    source: "iana"
  },
  "application/dns+json": {
    source: "iana",
    compressible: true
  },
  "application/dns-message": {
    source: "iana"
  },
  "application/docbook+xml": {
    source: "apache",
    compressible: true,
    extensions: [
      "dbk"
    ]
  },
  "application/dots+cbor": {
    source: "iana"
  },
  "application/dskpp+xml": {
    source: "iana",
    compressible: true
  },
  "application/dssc+der": {
    source: "iana",
    extensions: [
      "dssc"
    ]
  },
  "application/dssc+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "xdssc"
    ]
  },
  "application/dvcs": {
    source: "iana"
  },
  "application/ecmascript": {
    source: "iana",
    compressible: true,
    extensions: [
      "es",
      "ecma"
    ]
  },
  "application/edi-consent": {
    source: "iana"
  },
  "application/edi-x12": {
    source: "iana",
    compressible: false
  },
  "application/edifact": {
    source: "iana",
    compressible: false
  },
  "application/efi": {
    source: "iana"
  },
  "application/elm+json": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/elm+xml": {
    source: "iana",
    compressible: true
  },
  "application/emergencycalldata.cap+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/emergencycalldata.comment+xml": {
    source: "iana",
    compressible: true
  },
  "application/emergencycalldata.control+xml": {
    source: "iana",
    compressible: true
  },
  "application/emergencycalldata.deviceinfo+xml": {
    source: "iana",
    compressible: true
  },
  "application/emergencycalldata.ecall.msd": {
    source: "iana"
  },
  "application/emergencycalldata.providerinfo+xml": {
    source: "iana",
    compressible: true
  },
  "application/emergencycalldata.serviceinfo+xml": {
    source: "iana",
    compressible: true
  },
  "application/emergencycalldata.subscriberinfo+xml": {
    source: "iana",
    compressible: true
  },
  "application/emergencycalldata.veds+xml": {
    source: "iana",
    compressible: true
  },
  "application/emma+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "emma"
    ]
  },
  "application/emotionml+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "emotionml"
    ]
  },
  "application/encaprtp": {
    source: "iana"
  },
  "application/epp+xml": {
    source: "iana",
    compressible: true
  },
  "application/epub+zip": {
    source: "iana",
    compressible: false,
    extensions: [
      "epub"
    ]
  },
  "application/eshop": {
    source: "iana"
  },
  "application/exi": {
    source: "iana",
    extensions: [
      "exi"
    ]
  },
  "application/expect-ct-report+json": {
    source: "iana",
    compressible: true
  },
  "application/express": {
    source: "iana",
    extensions: [
      "exp"
    ]
  },
  "application/fastinfoset": {
    source: "iana"
  },
  "application/fastsoap": {
    source: "iana"
  },
  "application/fdt+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "fdt"
    ]
  },
  "application/fhir+json": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/fhir+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/fido.trusted-apps+json": {
    compressible: true
  },
  "application/fits": {
    source: "iana"
  },
  "application/flexfec": {
    source: "iana"
  },
  "application/font-sfnt": {
    source: "iana"
  },
  "application/font-tdpfr": {
    source: "iana",
    extensions: [
      "pfr"
    ]
  },
  "application/font-woff": {
    source: "iana",
    compressible: false
  },
  "application/framework-attributes+xml": {
    source: "iana",
    compressible: true
  },
  "application/geo+json": {
    source: "iana",
    compressible: true,
    extensions: [
      "geojson"
    ]
  },
  "application/geo+json-seq": {
    source: "iana"
  },
  "application/geopackage+sqlite3": {
    source: "iana"
  },
  "application/geoxacml+xml": {
    source: "iana",
    compressible: true
  },
  "application/gltf-buffer": {
    source: "iana"
  },
  "application/gml+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "gml"
    ]
  },
  "application/gpx+xml": {
    source: "apache",
    compressible: true,
    extensions: [
      "gpx"
    ]
  },
  "application/gxf": {
    source: "apache",
    extensions: [
      "gxf"
    ]
  },
  "application/gzip": {
    source: "iana",
    compressible: false,
    extensions: [
      "gz"
    ]
  },
  "application/h224": {
    source: "iana"
  },
  "application/held+xml": {
    source: "iana",
    compressible: true
  },
  "application/hjson": {
    extensions: [
      "hjson"
    ]
  },
  "application/http": {
    source: "iana"
  },
  "application/hyperstudio": {
    source: "iana",
    extensions: [
      "stk"
    ]
  },
  "application/ibe-key-request+xml": {
    source: "iana",
    compressible: true
  },
  "application/ibe-pkg-reply+xml": {
    source: "iana",
    compressible: true
  },
  "application/ibe-pp-data": {
    source: "iana"
  },
  "application/iges": {
    source: "iana"
  },
  "application/im-iscomposing+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/index": {
    source: "iana"
  },
  "application/index.cmd": {
    source: "iana"
  },
  "application/index.obj": {
    source: "iana"
  },
  "application/index.response": {
    source: "iana"
  },
  "application/index.vnd": {
    source: "iana"
  },
  "application/inkml+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "ink",
      "inkml"
    ]
  },
  "application/iotp": {
    source: "iana"
  },
  "application/ipfix": {
    source: "iana",
    extensions: [
      "ipfix"
    ]
  },
  "application/ipp": {
    source: "iana"
  },
  "application/isup": {
    source: "iana"
  },
  "application/its+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "its"
    ]
  },
  "application/java-archive": {
    source: "apache",
    compressible: false,
    extensions: [
      "jar",
      "war",
      "ear"
    ]
  },
  "application/java-serialized-object": {
    source: "apache",
    compressible: false,
    extensions: [
      "ser"
    ]
  },
  "application/java-vm": {
    source: "apache",
    compressible: false,
    extensions: [
      "class"
    ]
  },
  "application/javascript": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: [
      "js",
      "mjs"
    ]
  },
  "application/jf2feed+json": {
    source: "iana",
    compressible: true
  },
  "application/jose": {
    source: "iana"
  },
  "application/jose+json": {
    source: "iana",
    compressible: true
  },
  "application/jrd+json": {
    source: "iana",
    compressible: true
  },
  "application/jscalendar+json": {
    source: "iana",
    compressible: true
  },
  "application/json": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: [
      "json",
      "map"
    ]
  },
  "application/json-patch+json": {
    source: "iana",
    compressible: true
  },
  "application/json-seq": {
    source: "iana"
  },
  "application/json5": {
    extensions: [
      "json5"
    ]
  },
  "application/jsonml+json": {
    source: "apache",
    compressible: true,
    extensions: [
      "jsonml"
    ]
  },
  "application/jwk+json": {
    source: "iana",
    compressible: true
  },
  "application/jwk-set+json": {
    source: "iana",
    compressible: true
  },
  "application/jwt": {
    source: "iana"
  },
  "application/kpml-request+xml": {
    source: "iana",
    compressible: true
  },
  "application/kpml-response+xml": {
    source: "iana",
    compressible: true
  },
  "application/ld+json": {
    source: "iana",
    compressible: true,
    extensions: [
      "jsonld"
    ]
  },
  "application/lgr+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "lgr"
    ]
  },
  "application/link-format": {
    source: "iana"
  },
  "application/load-control+xml": {
    source: "iana",
    compressible: true
  },
  "application/lost+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "lostxml"
    ]
  },
  "application/lostsync+xml": {
    source: "iana",
    compressible: true
  },
  "application/lpf+zip": {
    source: "iana",
    compressible: false
  },
  "application/lxf": {
    source: "iana"
  },
  "application/mac-binhex40": {
    source: "iana",
    extensions: [
      "hqx"
    ]
  },
  "application/mac-compactpro": {
    source: "apache",
    extensions: [
      "cpt"
    ]
  },
  "application/macwriteii": {
    source: "iana"
  },
  "application/mads+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "mads"
    ]
  },
  "application/manifest+json": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: [
      "webmanifest"
    ]
  },
  "application/marc": {
    source: "iana",
    extensions: [
      "mrc"
    ]
  },
  "application/marcxml+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "mrcx"
    ]
  },
  "application/mathematica": {
    source: "iana",
    extensions: [
      "ma",
      "nb",
      "mb"
    ]
  },
  "application/mathml+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "mathml"
    ]
  },
  "application/mathml-content+xml": {
    source: "iana",
    compressible: true
  },
  "application/mathml-presentation+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-associated-procedure-description+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-deregister+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-envelope+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-msk+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-msk-response+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-protection-description+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-reception-report+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-register+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-register-response+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-schedule+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-user-service-description+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbox": {
    source: "iana",
    extensions: [
      "mbox"
    ]
  },
  "application/media-policy-dataset+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "mpf"
    ]
  },
  "application/media_control+xml": {
    source: "iana",
    compressible: true
  },
  "application/mediaservercontrol+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "mscml"
    ]
  },
  "application/merge-patch+json": {
    source: "iana",
    compressible: true
  },
  "application/metalink+xml": {
    source: "apache",
    compressible: true,
    extensions: [
      "metalink"
    ]
  },
  "application/metalink4+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "meta4"
    ]
  },
  "application/mets+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "mets"
    ]
  },
  "application/mf4": {
    source: "iana"
  },
  "application/mikey": {
    source: "iana"
  },
  "application/mipc": {
    source: "iana"
  },
  "application/missing-blocks+cbor-seq": {
    source: "iana"
  },
  "application/mmt-aei+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "maei"
    ]
  },
  "application/mmt-usd+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "musd"
    ]
  },
  "application/mods+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "mods"
    ]
  },
  "application/moss-keys": {
    source: "iana"
  },
  "application/moss-signature": {
    source: "iana"
  },
  "application/mosskey-data": {
    source: "iana"
  },
  "application/mosskey-request": {
    source: "iana"
  },
  "application/mp21": {
    source: "iana",
    extensions: [
      "m21",
      "mp21"
    ]
  },
  "application/mp4": {
    source: "iana",
    extensions: [
      "mp4s",
      "m4p"
    ]
  },
  "application/mpeg4-generic": {
    source: "iana"
  },
  "application/mpeg4-iod": {
    source: "iana"
  },
  "application/mpeg4-iod-xmt": {
    source: "iana"
  },
  "application/mrb-consumer+xml": {
    source: "iana",
    compressible: true
  },
  "application/mrb-publish+xml": {
    source: "iana",
    compressible: true
  },
  "application/msc-ivr+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/msc-mixer+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/msword": {
    source: "iana",
    compressible: false,
    extensions: [
      "doc",
      "dot"
    ]
  },
  "application/mud+json": {
    source: "iana",
    compressible: true
  },
  "application/multipart-core": {
    source: "iana"
  },
  "application/mxf": {
    source: "iana",
    extensions: [
      "mxf"
    ]
  },
  "application/n-quads": {
    source: "iana",
    extensions: [
      "nq"
    ]
  },
  "application/n-triples": {
    source: "iana",
    extensions: [
      "nt"
    ]
  },
  "application/nasdata": {
    source: "iana"
  },
  "application/news-checkgroups": {
    source: "iana",
    charset: "US-ASCII"
  },
  "application/news-groupinfo": {
    source: "iana",
    charset: "US-ASCII"
  },
  "application/news-transmission": {
    source: "iana"
  },
  "application/nlsml+xml": {
    source: "iana",
    compressible: true
  },
  "application/node": {
    source: "iana",
    extensions: [
      "cjs"
    ]
  },
  "application/nss": {
    source: "iana"
  },
  "application/oauth-authz-req+jwt": {
    source: "iana"
  },
  "application/oblivious-dns-message": {
    source: "iana"
  },
  "application/ocsp-request": {
    source: "iana"
  },
  "application/ocsp-response": {
    source: "iana"
  },
  "application/octet-stream": {
    source: "iana",
    compressible: false,
    extensions: [
      "bin",
      "dms",
      "lrf",
      "mar",
      "so",
      "dist",
      "distz",
      "pkg",
      "bpk",
      "dump",
      "elc",
      "deploy",
      "exe",
      "dll",
      "deb",
      "dmg",
      "iso",
      "img",
      "msi",
      "msp",
      "msm",
      "buffer"
    ]
  },
  "application/oda": {
    source: "iana",
    extensions: [
      "oda"
    ]
  },
  "application/odm+xml": {
    source: "iana",
    compressible: true
  },
  "application/odx": {
    source: "iana"
  },
  "application/oebps-package+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "opf"
    ]
  },
  "application/ogg": {
    source: "iana",
    compressible: false,
    extensions: [
      "ogx"
    ]
  },
  "application/omdoc+xml": {
    source: "apache",
    compressible: true,
    extensions: [
      "omdoc"
    ]
  },
  "application/onenote": {
    source: "apache",
    extensions: [
      "onetoc",
      "onetoc2",
      "onetmp",
      "onepkg"
    ]
  },
  "application/opc-nodeset+xml": {
    source: "iana",
    compressible: true
  },
  "application/oscore": {
    source: "iana"
  },
  "application/oxps": {
    source: "iana",
    extensions: [
      "oxps"
    ]
  },
  "application/p21": {
    source: "iana"
  },
  "application/p21+zip": {
    source: "iana",
    compressible: false
  },
  "application/p2p-overlay+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "relo"
    ]
  },
  "application/parityfec": {
    source: "iana"
  },
  "application/passport": {
    source: "iana"
  },
  "application/patch-ops-error+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "xer"
    ]
  },
  "application/pdf": {
    source: "iana",
    compressible: false,
    extensions: [
      "pdf"
    ]
  },
  "application/pdx": {
    source: "iana"
  },
  "application/pem-certificate-chain": {
    source: "iana"
  },
  "application/pgp-encrypted": {
    source: "iana",
    compressible: false,
    extensions: [
      "pgp"
    ]
  },
  "application/pgp-keys": {
    source: "iana",
    extensions: [
      "asc"
    ]
  },
  "application/pgp-signature": {
    source: "iana",
    extensions: [
      "asc",
      "sig"
    ]
  },
  "application/pics-rules": {
    source: "apache",
    extensions: [
      "prf"
    ]
  },
  "application/pidf+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/pidf-diff+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/pkcs10": {
    source: "iana",
    extensions: [
      "p10"
    ]
  },
  "application/pkcs12": {
    source: "iana"
  },
  "application/pkcs7-mime": {
    source: "iana",
    extensions: [
      "p7m",
      "p7c"
    ]
  },
  "application/pkcs7-signature": {
    source: "iana",
    extensions: [
      "p7s"
    ]
  },
  "application/pkcs8": {
    source: "iana",
    extensions: [
      "p8"
    ]
  },
  "application/pkcs8-encrypted": {
    source: "iana"
  },
  "application/pkix-attr-cert": {
    source: "iana",
    extensions: [
      "ac"
    ]
  },
  "application/pkix-cert": {
    source: "iana",
    extensions: [
      "cer"
    ]
  },
  "application/pkix-crl": {
    source: "iana",
    extensions: [
      "crl"
    ]
  },
  "application/pkix-pkipath": {
    source: "iana",
    extensions: [
      "pkipath"
    ]
  },
  "application/pkixcmp": {
    source: "iana",
    extensions: [
      "pki"
    ]
  },
  "application/pls+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "pls"
    ]
  },
  "application/poc-settings+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/postscript": {
    source: "iana",
    compressible: true,
    extensions: [
      "ai",
      "eps",
      "ps"
    ]
  },
  "application/ppsp-tracker+json": {
    source: "iana",
    compressible: true
  },
  "application/problem+json": {
    source: "iana",
    compressible: true
  },
  "application/problem+xml": {
    source: "iana",
    compressible: true
  },
  "application/provenance+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "provx"
    ]
  },
  "application/prs.alvestrand.titrax-sheet": {
    source: "iana"
  },
  "application/prs.cww": {
    source: "iana",
    extensions: [
      "cww"
    ]
  },
  "application/prs.cyn": {
    source: "iana",
    charset: "7-BIT"
  },
  "application/prs.hpub+zip": {
    source: "iana",
    compressible: false
  },
  "application/prs.nprend": {
    source: "iana"
  },
  "application/prs.plucker": {
    source: "iana"
  },
  "application/prs.rdf-xml-crypt": {
    source: "iana"
  },
  "application/prs.xsf+xml": {
    source: "iana",
    compressible: true
  },
  "application/pskc+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "pskcxml"
    ]
  },
  "application/pvd+json": {
    source: "iana",
    compressible: true
  },
  "application/qsig": {
    source: "iana"
  },
  "application/raml+yaml": {
    compressible: true,
    extensions: [
      "raml"
    ]
  },
  "application/raptorfec": {
    source: "iana"
  },
  "application/rdap+json": {
    source: "iana",
    compressible: true
  },
  "application/rdf+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "rdf",
      "owl"
    ]
  },
  "application/reginfo+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "rif"
    ]
  },
  "application/relax-ng-compact-syntax": {
    source: "iana",
    extensions: [
      "rnc"
    ]
  },
  "application/remote-printing": {
    source: "iana"
  },
  "application/reputon+json": {
    source: "iana",
    compressible: true
  },
  "application/resource-lists+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "rl"
    ]
  },
  "application/resource-lists-diff+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "rld"
    ]
  },
  "application/rfc+xml": {
    source: "iana",
    compressible: true
  },
  "application/riscos": {
    source: "iana"
  },
  "application/rlmi+xml": {
    source: "iana",
    compressible: true
  },
  "application/rls-services+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "rs"
    ]
  },
  "application/route-apd+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "rapd"
    ]
  },
  "application/route-s-tsid+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "sls"
    ]
  },
  "application/route-usd+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "rusd"
    ]
  },
  "application/rpki-ghostbusters": {
    source: "iana",
    extensions: [
      "gbr"
    ]
  },
  "application/rpki-manifest": {
    source: "iana",
    extensions: [
      "mft"
    ]
  },
  "application/rpki-publication": {
    source: "iana"
  },
  "application/rpki-roa": {
    source: "iana",
    extensions: [
      "roa"
    ]
  },
  "application/rpki-updown": {
    source: "iana"
  },
  "application/rsd+xml": {
    source: "apache",
    compressible: true,
    extensions: [
      "rsd"
    ]
  },
  "application/rss+xml": {
    source: "apache",
    compressible: true,
    extensions: [
      "rss"
    ]
  },
  "application/rtf": {
    source: "iana",
    compressible: true,
    extensions: [
      "rtf"
    ]
  },
  "application/rtploopback": {
    source: "iana"
  },
  "application/rtx": {
    source: "iana"
  },
  "application/samlassertion+xml": {
    source: "iana",
    compressible: true
  },
  "application/samlmetadata+xml": {
    source: "iana",
    compressible: true
  },
  "application/sarif+json": {
    source: "iana",
    compressible: true
  },
  "application/sarif-external-properties+json": {
    source: "iana",
    compressible: true
  },
  "application/sbe": {
    source: "iana"
  },
  "application/sbml+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "sbml"
    ]
  },
  "application/scaip+xml": {
    source: "iana",
    compressible: true
  },
  "application/scim+json": {
    source: "iana",
    compressible: true
  },
  "application/scvp-cv-request": {
    source: "iana",
    extensions: [
      "scq"
    ]
  },
  "application/scvp-cv-response": {
    source: "iana",
    extensions: [
      "scs"
    ]
  },
  "application/scvp-vp-request": {
    source: "iana",
    extensions: [
      "spq"
    ]
  },
  "application/scvp-vp-response": {
    source: "iana",
    extensions: [
      "spp"
    ]
  },
  "application/sdp": {
    source: "iana",
    extensions: [
      "sdp"
    ]
  },
  "application/secevent+jwt": {
    source: "iana"
  },
  "application/senml+cbor": {
    source: "iana"
  },
  "application/senml+json": {
    source: "iana",
    compressible: true
  },
  "application/senml+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "senmlx"
    ]
  },
  "application/senml-etch+cbor": {
    source: "iana"
  },
  "application/senml-etch+json": {
    source: "iana",
    compressible: true
  },
  "application/senml-exi": {
    source: "iana"
  },
  "application/sensml+cbor": {
    source: "iana"
  },
  "application/sensml+json": {
    source: "iana",
    compressible: true
  },
  "application/sensml+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "sensmlx"
    ]
  },
  "application/sensml-exi": {
    source: "iana"
  },
  "application/sep+xml": {
    source: "iana",
    compressible: true
  },
  "application/sep-exi": {
    source: "iana"
  },
  "application/session-info": {
    source: "iana"
  },
  "application/set-payment": {
    source: "iana"
  },
  "application/set-payment-initiation": {
    source: "iana",
    extensions: [
      "setpay"
    ]
  },
  "application/set-registration": {
    source: "iana"
  },
  "application/set-registration-initiation": {
    source: "iana",
    extensions: [
      "setreg"
    ]
  },
  "application/sgml": {
    source: "iana"
  },
  "application/sgml-open-catalog": {
    source: "iana"
  },
  "application/shf+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "shf"
    ]
  },
  "application/sieve": {
    source: "iana",
    extensions: [
      "siv",
      "sieve"
    ]
  },
  "application/simple-filter+xml": {
    source: "iana",
    compressible: true
  },
  "application/simple-message-summary": {
    source: "iana"
  },
  "application/simplesymbolcontainer": {
    source: "iana"
  },
  "application/sipc": {
    source: "iana"
  },
  "application/slate": {
    source: "iana"
  },
  "application/smil": {
    source: "iana"
  },
  "application/smil+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "smi",
      "smil"
    ]
  },
  "application/smpte336m": {
    source: "iana"
  },
  "application/soap+fastinfoset": {
    source: "iana"
  },
  "application/soap+xml": {
    source: "iana",
    compressible: true
  },
  "application/sparql-query": {
    source: "iana",
    extensions: [
      "rq"
    ]
  },
  "application/sparql-results+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "srx"
    ]
  },
  "application/spdx+json": {
    source: "iana",
    compressible: true
  },
  "application/spirits-event+xml": {
    source: "iana",
    compressible: true
  },
  "application/sql": {
    source: "iana"
  },
  "application/srgs": {
    source: "iana",
    extensions: [
      "gram"
    ]
  },
  "application/srgs+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "grxml"
    ]
  },
  "application/sru+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "sru"
    ]
  },
  "application/ssdl+xml": {
    source: "apache",
    compressible: true,
    extensions: [
      "ssdl"
    ]
  },
  "application/ssml+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "ssml"
    ]
  },
  "application/stix+json": {
    source: "iana",
    compressible: true
  },
  "application/swid+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "swidtag"
    ]
  },
  "application/tamp-apex-update": {
    source: "iana"
  },
  "application/tamp-apex-update-confirm": {
    source: "iana"
  },
  "application/tamp-community-update": {
    source: "iana"
  },
  "application/tamp-community-update-confirm": {
    source: "iana"
  },
  "application/tamp-error": {
    source: "iana"
  },
  "application/tamp-sequence-adjust": {
    source: "iana"
  },
  "application/tamp-sequence-adjust-confirm": {
    source: "iana"
  },
  "application/tamp-status-query": {
    source: "iana"
  },
  "application/tamp-status-response": {
    source: "iana"
  },
  "application/tamp-update": {
    source: "iana"
  },
  "application/tamp-update-confirm": {
    source: "iana"
  },
  "application/tar": {
    compressible: true
  },
  "application/taxii+json": {
    source: "iana",
    compressible: true
  },
  "application/td+json": {
    source: "iana",
    compressible: true
  },
  "application/tei+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "tei",
      "teicorpus"
    ]
  },
  "application/tetra_isi": {
    source: "iana"
  },
  "application/thraud+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "tfi"
    ]
  },
  "application/timestamp-query": {
    source: "iana"
  },
  "application/timestamp-reply": {
    source: "iana"
  },
  "application/timestamped-data": {
    source: "iana",
    extensions: [
      "tsd"
    ]
  },
  "application/tlsrpt+gzip": {
    source: "iana"
  },
  "application/tlsrpt+json": {
    source: "iana",
    compressible: true
  },
  "application/tnauthlist": {
    source: "iana"
  },
  "application/token-introspection+jwt": {
    source: "iana"
  },
  "application/toml": {
    compressible: true,
    extensions: [
      "toml"
    ]
  },
  "application/trickle-ice-sdpfrag": {
    source: "iana"
  },
  "application/trig": {
    source: "iana",
    extensions: [
      "trig"
    ]
  },
  "application/ttml+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "ttml"
    ]
  },
  "application/tve-trigger": {
    source: "iana"
  },
  "application/tzif": {
    source: "iana"
  },
  "application/tzif-leap": {
    source: "iana"
  },
  "application/ubjson": {
    compressible: false,
    extensions: [
      "ubj"
    ]
  },
  "application/ulpfec": {
    source: "iana"
  },
  "application/urc-grpsheet+xml": {
    source: "iana",
    compressible: true
  },
  "application/urc-ressheet+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "rsheet"
    ]
  },
  "application/urc-targetdesc+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "td"
    ]
  },
  "application/urc-uisocketdesc+xml": {
    source: "iana",
    compressible: true
  },
  "application/vcard+json": {
    source: "iana",
    compressible: true
  },
  "application/vcard+xml": {
    source: "iana",
    compressible: true
  },
  "application/vemmi": {
    source: "iana"
  },
  "application/vividence.scriptfile": {
    source: "apache"
  },
  "application/vnd.1000minds.decision-model+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "1km"
    ]
  },
  "application/vnd.3gpp-prose+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp-prose-pc3ch+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp-v2x-local-service-information": {
    source: "iana"
  },
  "application/vnd.3gpp.5gnas": {
    source: "iana"
  },
  "application/vnd.3gpp.access-transfer-events+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.bsf+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.gmop+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.gtpc": {
    source: "iana"
  },
  "application/vnd.3gpp.interworking-data": {
    source: "iana"
  },
  "application/vnd.3gpp.lpp": {
    source: "iana"
  },
  "application/vnd.3gpp.mc-signalling-ear": {
    source: "iana"
  },
  "application/vnd.3gpp.mcdata-affiliation-command+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcdata-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcdata-payload": {
    source: "iana"
  },
  "application/vnd.3gpp.mcdata-service-config+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcdata-signalling": {
    source: "iana"
  },
  "application/vnd.3gpp.mcdata-ue-config+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcdata-user-profile+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcptt-affiliation-command+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcptt-floor-request+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcptt-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcptt-location-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcptt-mbms-usage-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcptt-service-config+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcptt-signed+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcptt-ue-config+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcptt-ue-init-config+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcptt-user-profile+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcvideo-affiliation-command+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcvideo-affiliation-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcvideo-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcvideo-location-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcvideo-mbms-usage-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcvideo-service-config+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcvideo-transmission-request+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcvideo-ue-config+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcvideo-user-profile+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mid-call+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.ngap": {
    source: "iana"
  },
  "application/vnd.3gpp.pfcp": {
    source: "iana"
  },
  "application/vnd.3gpp.pic-bw-large": {
    source: "iana",
    extensions: [
      "plb"
    ]
  },
  "application/vnd.3gpp.pic-bw-small": {
    source: "iana",
    extensions: [
      "psb"
    ]
  },
  "application/vnd.3gpp.pic-bw-var": {
    source: "iana",
    extensions: [
      "pvb"
    ]
  },
  "application/vnd.3gpp.s1ap": {
    source: "iana"
  },
  "application/vnd.3gpp.sms": {
    source: "iana"
  },
  "application/vnd.3gpp.sms+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.srvcc-ext+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.srvcc-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.state-and-event-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.ussd+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp2.bcmcsinfo+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp2.sms": {
    source: "iana"
  },
  "application/vnd.3gpp2.tcap": {
    source: "iana",
    extensions: [
      "tcap"
    ]
  },
  "application/vnd.3lightssoftware.imagescal": {
    source: "iana"
  },
  "application/vnd.3m.post-it-notes": {
    source: "iana",
    extensions: [
      "pwn"
    ]
  },
  "application/vnd.accpac.simply.aso": {
    source: "iana",
    extensions: [
      "aso"
    ]
  },
  "application/vnd.accpac.simply.imp": {
    source: "iana",
    extensions: [
      "imp"
    ]
  },
  "application/vnd.acucobol": {
    source: "iana",
    extensions: [
      "acu"
    ]
  },
  "application/vnd.acucorp": {
    source: "iana",
    extensions: [
      "atc",
      "acutc"
    ]
  },
  "application/vnd.adobe.air-application-installer-package+zip": {
    source: "apache",
    compressible: false,
    extensions: [
      "air"
    ]
  },
  "application/vnd.adobe.flash.movie": {
    source: "iana"
  },
  "application/vnd.adobe.formscentral.fcdt": {
    source: "iana",
    extensions: [
      "fcdt"
    ]
  },
  "application/vnd.adobe.fxp": {
    source: "iana",
    extensions: [
      "fxp",
      "fxpl"
    ]
  },
  "application/vnd.adobe.partial-upload": {
    source: "iana"
  },
  "application/vnd.adobe.xdp+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "xdp"
    ]
  },
  "application/vnd.adobe.xfdf": {
    source: "iana",
    extensions: [
      "xfdf"
    ]
  },
  "application/vnd.aether.imp": {
    source: "iana"
  },
  "application/vnd.afpc.afplinedata": {
    source: "iana"
  },
  "application/vnd.afpc.afplinedata-pagedef": {
    source: "iana"
  },
  "application/vnd.afpc.cmoca-cmresource": {
    source: "iana"
  },
  "application/vnd.afpc.foca-charset": {
    source: "iana"
  },
  "application/vnd.afpc.foca-codedfont": {
    source: "iana"
  },
  "application/vnd.afpc.foca-codepage": {
    source: "iana"
  },
  "application/vnd.afpc.modca": {
    source: "iana"
  },
  "application/vnd.afpc.modca-cmtable": {
    source: "iana"
  },
  "application/vnd.afpc.modca-formdef": {
    source: "iana"
  },
  "application/vnd.afpc.modca-mediummap": {
    source: "iana"
  },
  "application/vnd.afpc.modca-objectcontainer": {
    source: "iana"
  },
  "application/vnd.afpc.modca-overlay": {
    source: "iana"
  },
  "application/vnd.afpc.modca-pagesegment": {
    source: "iana"
  },
  "application/vnd.age": {
    source: "iana",
    extensions: [
      "age"
    ]
  },
  "application/vnd.ah-barcode": {
    source: "iana"
  },
  "application/vnd.ahead.space": {
    source: "iana",
    extensions: [
      "ahead"
    ]
  },
  "application/vnd.airzip.filesecure.azf": {
    source: "iana",
    extensions: [
      "azf"
    ]
  },
  "application/vnd.airzip.filesecure.azs": {
    source: "iana",
    extensions: [
      "azs"
    ]
  },
  "application/vnd.amadeus+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.amazon.ebook": {
    source: "apache",
    extensions: [
      "azw"
    ]
  },
  "application/vnd.amazon.mobi8-ebook": {
    source: "iana"
  },
  "application/vnd.americandynamics.acc": {
    source: "iana",
    extensions: [
      "acc"
    ]
  },
  "application/vnd.amiga.ami": {
    source: "iana",
    extensions: [
      "ami"
    ]
  },
  "application/vnd.amundsen.maze+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.android.ota": {
    source: "iana"
  },
  "application/vnd.android.package-archive": {
    source: "apache",
    compressible: false,
    extensions: [
      "apk"
    ]
  },
  "application/vnd.anki": {
    source: "iana"
  },
  "application/vnd.anser-web-certificate-issue-initiation": {
    source: "iana",
    extensions: [
      "cii"
    ]
  },
  "application/vnd.anser-web-funds-transfer-initiation": {
    source: "apache",
    extensions: [
      "fti"
    ]
  },
  "application/vnd.antix.game-component": {
    source: "iana",
    extensions: [
      "atx"
    ]
  },
  "application/vnd.apache.arrow.file": {
    source: "iana"
  },
  "application/vnd.apache.arrow.stream": {
    source: "iana"
  },
  "application/vnd.apache.thrift.binary": {
    source: "iana"
  },
  "application/vnd.apache.thrift.compact": {
    source: "iana"
  },
  "application/vnd.apache.thrift.json": {
    source: "iana"
  },
  "application/vnd.api+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.aplextor.warrp+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.apothekende.reservation+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.apple.installer+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "mpkg"
    ]
  },
  "application/vnd.apple.keynote": {
    source: "iana",
    extensions: [
      "key"
    ]
  },
  "application/vnd.apple.mpegurl": {
    source: "iana",
    extensions: [
      "m3u8"
    ]
  },
  "application/vnd.apple.numbers": {
    source: "iana",
    extensions: [
      "numbers"
    ]
  },
  "application/vnd.apple.pages": {
    source: "iana",
    extensions: [
      "pages"
    ]
  },
  "application/vnd.apple.pkpass": {
    compressible: false,
    extensions: [
      "pkpass"
    ]
  },
  "application/vnd.arastra.swi": {
    source: "iana"
  },
  "application/vnd.aristanetworks.swi": {
    source: "iana",
    extensions: [
      "swi"
    ]
  },
  "application/vnd.artisan+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.artsquare": {
    source: "iana"
  },
  "application/vnd.astraea-software.iota": {
    source: "iana",
    extensions: [
      "iota"
    ]
  },
  "application/vnd.audiograph": {
    source: "iana",
    extensions: [
      "aep"
    ]
  },
  "application/vnd.autopackage": {
    source: "iana"
  },
  "application/vnd.avalon+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.avistar+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.balsamiq.bmml+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "bmml"
    ]
  },
  "application/vnd.balsamiq.bmpr": {
    source: "iana"
  },
  "application/vnd.banana-accounting": {
    source: "iana"
  },
  "application/vnd.bbf.usp.error": {
    source: "iana"
  },
  "application/vnd.bbf.usp.msg": {
    source: "iana"
  },
  "application/vnd.bbf.usp.msg+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.bekitzur-stech+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.bint.med-content": {
    source: "iana"
  },
  "application/vnd.biopax.rdf+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.blink-idb-value-wrapper": {
    source: "iana"
  },
  "application/vnd.blueice.multipass": {
    source: "iana",
    extensions: [
      "mpm"
    ]
  },
  "application/vnd.bluetooth.ep.oob": {
    source: "iana"
  },
  "application/vnd.bluetooth.le.oob": {
    source: "iana"
  },
  "application/vnd.bmi": {
    source: "iana",
    extensions: [
      "bmi"
    ]
  },
  "application/vnd.bpf": {
    source: "iana"
  },
  "application/vnd.bpf3": {
    source: "iana"
  },
  "application/vnd.businessobjects": {
    source: "iana",
    extensions: [
      "rep"
    ]
  },
  "application/vnd.byu.uapi+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.cab-jscript": {
    source: "iana"
  },
  "application/vnd.canon-cpdl": {
    source: "iana"
  },
  "application/vnd.canon-lips": {
    source: "iana"
  },
  "application/vnd.capasystems-pg+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.cendio.thinlinc.clientconf": {
    source: "iana"
  },
  "application/vnd.century-systems.tcp_stream": {
    source: "iana"
  },
  "application/vnd.chemdraw+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "cdxml"
    ]
  },
  "application/vnd.chess-pgn": {
    source: "iana"
  },
  "application/vnd.chipnuts.karaoke-mmd": {
    source: "iana",
    extensions: [
      "mmd"
    ]
  },
  "application/vnd.ciedi": {
    source: "iana"
  },
  "application/vnd.cinderella": {
    source: "iana",
    extensions: [
      "cdy"
    ]
  },
  "application/vnd.cirpack.isdn-ext": {
    source: "iana"
  },
  "application/vnd.citationstyles.style+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "csl"
    ]
  },
  "application/vnd.claymore": {
    source: "iana",
    extensions: [
      "cla"
    ]
  },
  "application/vnd.cloanto.rp9": {
    source: "iana",
    extensions: [
      "rp9"
    ]
  },
  "application/vnd.clonk.c4group": {
    source: "iana",
    extensions: [
      "c4g",
      "c4d",
      "c4f",
      "c4p",
      "c4u"
    ]
  },
  "application/vnd.cluetrust.cartomobile-config": {
    source: "iana",
    extensions: [
      "c11amc"
    ]
  },
  "application/vnd.cluetrust.cartomobile-config-pkg": {
    source: "iana",
    extensions: [
      "c11amz"
    ]
  },
  "application/vnd.coffeescript": {
    source: "iana"
  },
  "application/vnd.collabio.xodocuments.document": {
    source: "iana"
  },
  "application/vnd.collabio.xodocuments.document-template": {
    source: "iana"
  },
  "application/vnd.collabio.xodocuments.presentation": {
    source: "iana"
  },
  "application/vnd.collabio.xodocuments.presentation-template": {
    source: "iana"
  },
  "application/vnd.collabio.xodocuments.spreadsheet": {
    source: "iana"
  },
  "application/vnd.collabio.xodocuments.spreadsheet-template": {
    source: "iana"
  },
  "application/vnd.collection+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.collection.doc+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.collection.next+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.comicbook+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.comicbook-rar": {
    source: "iana"
  },
  "application/vnd.commerce-battelle": {
    source: "iana"
  },
  "application/vnd.commonspace": {
    source: "iana",
    extensions: [
      "csp"
    ]
  },
  "application/vnd.contact.cmsg": {
    source: "iana",
    extensions: [
      "cdbcmsg"
    ]
  },
  "application/vnd.coreos.ignition+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.cosmocaller": {
    source: "iana",
    extensions: [
      "cmc"
    ]
  },
  "application/vnd.crick.clicker": {
    source: "iana",
    extensions: [
      "clkx"
    ]
  },
  "application/vnd.crick.clicker.keyboard": {
    source: "iana",
    extensions: [
      "clkk"
    ]
  },
  "application/vnd.crick.clicker.palette": {
    source: "iana",
    extensions: [
      "clkp"
    ]
  },
  "application/vnd.crick.clicker.template": {
    source: "iana",
    extensions: [
      "clkt"
    ]
  },
  "application/vnd.crick.clicker.wordbank": {
    source: "iana",
    extensions: [
      "clkw"
    ]
  },
  "application/vnd.criticaltools.wbs+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "wbs"
    ]
  },
  "application/vnd.cryptii.pipe+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.crypto-shade-file": {
    source: "iana"
  },
  "application/vnd.cryptomator.encrypted": {
    source: "iana"
  },
  "application/vnd.cryptomator.vault": {
    source: "iana"
  },
  "application/vnd.ctc-posml": {
    source: "iana",
    extensions: [
      "pml"
    ]
  },
  "application/vnd.ctct.ws+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.cups-pdf": {
    source: "iana"
  },
  "application/vnd.cups-postscript": {
    source: "iana"
  },
  "application/vnd.cups-ppd": {
    source: "iana",
    extensions: [
      "ppd"
    ]
  },
  "application/vnd.cups-raster": {
    source: "iana"
  },
  "application/vnd.cups-raw": {
    source: "iana"
  },
  "application/vnd.curl": {
    source: "iana"
  },
  "application/vnd.curl.car": {
    source: "apache",
    extensions: [
      "car"
    ]
  },
  "application/vnd.curl.pcurl": {
    source: "apache",
    extensions: [
      "pcurl"
    ]
  },
  "application/vnd.cyan.dean.root+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.cybank": {
    source: "iana"
  },
  "application/vnd.cyclonedx+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.cyclonedx+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.d2l.coursepackage1p0+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.d3m-dataset": {
    source: "iana"
  },
  "application/vnd.d3m-problem": {
    source: "iana"
  },
  "application/vnd.dart": {
    source: "iana",
    compressible: true,
    extensions: [
      "dart"
    ]
  },
  "application/vnd.data-vision.rdz": {
    source: "iana",
    extensions: [
      "rdz"
    ]
  },
  "application/vnd.datapackage+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dataresource+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dbf": {
    source: "iana",
    extensions: [
      "dbf"
    ]
  },
  "application/vnd.debian.binary-package": {
    source: "iana"
  },
  "application/vnd.dece.data": {
    source: "iana",
    extensions: [
      "uvf",
      "uvvf",
      "uvd",
      "uvvd"
    ]
  },
  "application/vnd.dece.ttml+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "uvt",
      "uvvt"
    ]
  },
  "application/vnd.dece.unspecified": {
    source: "iana",
    extensions: [
      "uvx",
      "uvvx"
    ]
  },
  "application/vnd.dece.zip": {
    source: "iana",
    extensions: [
      "uvz",
      "uvvz"
    ]
  },
  "application/vnd.denovo.fcselayout-link": {
    source: "iana",
    extensions: [
      "fe_launch"
    ]
  },
  "application/vnd.desmume.movie": {
    source: "iana"
  },
  "application/vnd.dir-bi.plate-dl-nosuffix": {
    source: "iana"
  },
  "application/vnd.dm.delegation+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dna": {
    source: "iana",
    extensions: [
      "dna"
    ]
  },
  "application/vnd.document+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dolby.mlp": {
    source: "apache",
    extensions: [
      "mlp"
    ]
  },
  "application/vnd.dolby.mobile.1": {
    source: "iana"
  },
  "application/vnd.dolby.mobile.2": {
    source: "iana"
  },
  "application/vnd.doremir.scorecloud-binary-document": {
    source: "iana"
  },
  "application/vnd.dpgraph": {
    source: "iana",
    extensions: [
      "dpg"
    ]
  },
  "application/vnd.dreamfactory": {
    source: "iana",
    extensions: [
      "dfac"
    ]
  },
  "application/vnd.drive+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ds-keypoint": {
    source: "apache",
    extensions: [
      "kpxx"
    ]
  },
  "application/vnd.dtg.local": {
    source: "iana"
  },
  "application/vnd.dtg.local.flash": {
    source: "iana"
  },
  "application/vnd.dtg.local.html": {
    source: "iana"
  },
  "application/vnd.dvb.ait": {
    source: "iana",
    extensions: [
      "ait"
    ]
  },
  "application/vnd.dvb.dvbisl+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dvb.dvbj": {
    source: "iana"
  },
  "application/vnd.dvb.esgcontainer": {
    source: "iana"
  },
  "application/vnd.dvb.ipdcdftnotifaccess": {
    source: "iana"
  },
  "application/vnd.dvb.ipdcesgaccess": {
    source: "iana"
  },
  "application/vnd.dvb.ipdcesgaccess2": {
    source: "iana"
  },
  "application/vnd.dvb.ipdcesgpdd": {
    source: "iana"
  },
  "application/vnd.dvb.ipdcroaming": {
    source: "iana"
  },
  "application/vnd.dvb.iptv.alfec-base": {
    source: "iana"
  },
  "application/vnd.dvb.iptv.alfec-enhancement": {
    source: "iana"
  },
  "application/vnd.dvb.notif-aggregate-root+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dvb.notif-container+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dvb.notif-generic+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dvb.notif-ia-msglist+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dvb.notif-ia-registration-request+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dvb.notif-ia-registration-response+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dvb.notif-init+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dvb.pfr": {
    source: "iana"
  },
  "application/vnd.dvb.service": {
    source: "iana",
    extensions: [
      "svc"
    ]
  },
  "application/vnd.dxr": {
    source: "iana"
  },
  "application/vnd.dynageo": {
    source: "iana",
    extensions: [
      "geo"
    ]
  },
  "application/vnd.dzr": {
    source: "iana"
  },
  "application/vnd.easykaraoke.cdgdownload": {
    source: "iana"
  },
  "application/vnd.ecdis-update": {
    source: "iana"
  },
  "application/vnd.ecip.rlp": {
    source: "iana"
  },
  "application/vnd.eclipse.ditto+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ecowin.chart": {
    source: "iana",
    extensions: [
      "mag"
    ]
  },
  "application/vnd.ecowin.filerequest": {
    source: "iana"
  },
  "application/vnd.ecowin.fileupdate": {
    source: "iana"
  },
  "application/vnd.ecowin.series": {
    source: "iana"
  },
  "application/vnd.ecowin.seriesrequest": {
    source: "iana"
  },
  "application/vnd.ecowin.seriesupdate": {
    source: "iana"
  },
  "application/vnd.efi.img": {
    source: "iana"
  },
  "application/vnd.efi.iso": {
    source: "iana"
  },
  "application/vnd.emclient.accessrequest+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.enliven": {
    source: "iana",
    extensions: [
      "nml"
    ]
  },
  "application/vnd.enphase.envoy": {
    source: "iana"
  },
  "application/vnd.eprints.data+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.epson.esf": {
    source: "iana",
    extensions: [
      "esf"
    ]
  },
  "application/vnd.epson.msf": {
    source: "iana",
    extensions: [
      "msf"
    ]
  },
  "application/vnd.epson.quickanime": {
    source: "iana",
    extensions: [
      "qam"
    ]
  },
  "application/vnd.epson.salt": {
    source: "iana",
    extensions: [
      "slt"
    ]
  },
  "application/vnd.epson.ssf": {
    source: "iana",
    extensions: [
      "ssf"
    ]
  },
  "application/vnd.ericsson.quickcall": {
    source: "iana"
  },
  "application/vnd.espass-espass+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.eszigno3+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "es3",
      "et3"
    ]
  },
  "application/vnd.etsi.aoc+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.asic-e+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.etsi.asic-s+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.etsi.cug+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.iptvcommand+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.iptvdiscovery+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.iptvprofile+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.iptvsad-bc+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.iptvsad-cod+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.iptvsad-npvr+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.iptvservice+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.iptvsync+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.iptvueprofile+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.mcid+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.mheg5": {
    source: "iana"
  },
  "application/vnd.etsi.overload-control-policy-dataset+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.pstn+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.sci+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.simservs+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.timestamp-token": {
    source: "iana"
  },
  "application/vnd.etsi.tsl+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.tsl.der": {
    source: "iana"
  },
  "application/vnd.eu.kasparian.car+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.eudora.data": {
    source: "iana"
  },
  "application/vnd.evolv.ecig.profile": {
    source: "iana"
  },
  "application/vnd.evolv.ecig.settings": {
    source: "iana"
  },
  "application/vnd.evolv.ecig.theme": {
    source: "iana"
  },
  "application/vnd.exstream-empower+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.exstream-package": {
    source: "iana"
  },
  "application/vnd.ezpix-album": {
    source: "iana",
    extensions: [
      "ez2"
    ]
  },
  "application/vnd.ezpix-package": {
    source: "iana",
    extensions: [
      "ez3"
    ]
  },
  "application/vnd.f-secure.mobile": {
    source: "iana"
  },
  "application/vnd.familysearch.gedcom+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.fastcopy-disk-image": {
    source: "iana"
  },
  "application/vnd.fdf": {
    source: "iana",
    extensions: [
      "fdf"
    ]
  },
  "application/vnd.fdsn.mseed": {
    source: "iana",
    extensions: [
      "mseed"
    ]
  },
  "application/vnd.fdsn.seed": {
    source: "iana",
    extensions: [
      "seed",
      "dataless"
    ]
  },
  "application/vnd.ffsns": {
    source: "iana"
  },
  "application/vnd.ficlab.flb+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.filmit.zfc": {
    source: "iana"
  },
  "application/vnd.fints": {
    source: "iana"
  },
  "application/vnd.firemonkeys.cloudcell": {
    source: "iana"
  },
  "application/vnd.flographit": {
    source: "iana",
    extensions: [
      "gph"
    ]
  },
  "application/vnd.fluxtime.clip": {
    source: "iana",
    extensions: [
      "ftc"
    ]
  },
  "application/vnd.font-fontforge-sfd": {
    source: "iana"
  },
  "application/vnd.framemaker": {
    source: "iana",
    extensions: [
      "fm",
      "frame",
      "maker",
      "book"
    ]
  },
  "application/vnd.frogans.fnc": {
    source: "iana",
    extensions: [
      "fnc"
    ]
  },
  "application/vnd.frogans.ltf": {
    source: "iana",
    extensions: [
      "ltf"
    ]
  },
  "application/vnd.fsc.weblaunch": {
    source: "iana",
    extensions: [
      "fsc"
    ]
  },
  "application/vnd.fujifilm.fb.docuworks": {
    source: "iana"
  },
  "application/vnd.fujifilm.fb.docuworks.binder": {
    source: "iana"
  },
  "application/vnd.fujifilm.fb.docuworks.container": {
    source: "iana"
  },
  "application/vnd.fujifilm.fb.jfi+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.fujitsu.oasys": {
    source: "iana",
    extensions: [
      "oas"
    ]
  },
  "application/vnd.fujitsu.oasys2": {
    source: "iana",
    extensions: [
      "oa2"
    ]
  },
  "application/vnd.fujitsu.oasys3": {
    source: "iana",
    extensions: [
      "oa3"
    ]
  },
  "application/vnd.fujitsu.oasysgp": {
    source: "iana",
    extensions: [
      "fg5"
    ]
  },
  "application/vnd.fujitsu.oasysprs": {
    source: "iana",
    extensions: [
      "bh2"
    ]
  },
  "application/vnd.fujixerox.art-ex": {
    source: "iana"
  },
  "application/vnd.fujixerox.art4": {
    source: "iana"
  },
  "application/vnd.fujixerox.ddd": {
    source: "iana",
    extensions: [
      "ddd"
    ]
  },
  "application/vnd.fujixerox.docuworks": {
    source: "iana",
    extensions: [
      "xdw"
    ]
  },
  "application/vnd.fujixerox.docuworks.binder": {
    source: "iana",
    extensions: [
      "xbd"
    ]
  },
  "application/vnd.fujixerox.docuworks.container": {
    source: "iana"
  },
  "application/vnd.fujixerox.hbpl": {
    source: "iana"
  },
  "application/vnd.fut-misnet": {
    source: "iana"
  },
  "application/vnd.futoin+cbor": {
    source: "iana"
  },
  "application/vnd.futoin+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.fuzzysheet": {
    source: "iana",
    extensions: [
      "fzs"
    ]
  },
  "application/vnd.genomatix.tuxedo": {
    source: "iana",
    extensions: [
      "txd"
    ]
  },
  "application/vnd.gentics.grd+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.geo+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.geocube+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.geogebra.file": {
    source: "iana",
    extensions: [
      "ggb"
    ]
  },
  "application/vnd.geogebra.slides": {
    source: "iana"
  },
  "application/vnd.geogebra.tool": {
    source: "iana",
    extensions: [
      "ggt"
    ]
  },
  "application/vnd.geometry-explorer": {
    source: "iana",
    extensions: [
      "gex",
      "gre"
    ]
  },
  "application/vnd.geonext": {
    source: "iana",
    extensions: [
      "gxt"
    ]
  },
  "application/vnd.geoplan": {
    source: "iana",
    extensions: [
      "g2w"
    ]
  },
  "application/vnd.geospace": {
    source: "iana",
    extensions: [
      "g3w"
    ]
  },
  "application/vnd.gerber": {
    source: "iana"
  },
  "application/vnd.globalplatform.card-content-mgt": {
    source: "iana"
  },
  "application/vnd.globalplatform.card-content-mgt-response": {
    source: "iana"
  },
  "application/vnd.gmx": {
    source: "iana",
    extensions: [
      "gmx"
    ]
  },
  "application/vnd.google-apps.document": {
    compressible: false,
    extensions: [
      "gdoc"
    ]
  },
  "application/vnd.google-apps.presentation": {
    compressible: false,
    extensions: [
      "gslides"
    ]
  },
  "application/vnd.google-apps.spreadsheet": {
    compressible: false,
    extensions: [
      "gsheet"
    ]
  },
  "application/vnd.google-earth.kml+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "kml"
    ]
  },
  "application/vnd.google-earth.kmz": {
    source: "iana",
    compressible: false,
    extensions: [
      "kmz"
    ]
  },
  "application/vnd.gov.sk.e-form+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.gov.sk.e-form+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.gov.sk.xmldatacontainer+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.grafeq": {
    source: "iana",
    extensions: [
      "gqf",
      "gqs"
    ]
  },
  "application/vnd.gridmp": {
    source: "iana"
  },
  "application/vnd.groove-account": {
    source: "iana",
    extensions: [
      "gac"
    ]
  },
  "application/vnd.groove-help": {
    source: "iana",
    extensions: [
      "ghf"
    ]
  },
  "application/vnd.groove-identity-message": {
    source: "iana",
    extensions: [
      "gim"
    ]
  },
  "application/vnd.groove-injector": {
    source: "iana",
    extensions: [
      "grv"
    ]
  },
  "application/vnd.groove-tool-message": {
    source: "iana",
    extensions: [
      "gtm"
    ]
  },
  "application/vnd.groove-tool-template": {
    source: "iana",
    extensions: [
      "tpl"
    ]
  },
  "application/vnd.groove-vcard": {
    source: "iana",
    extensions: [
      "vcg"
    ]
  },
  "application/vnd.hal+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.hal+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "hal"
    ]
  },
  "application/vnd.handheld-entertainment+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "zmm"
    ]
  },
  "application/vnd.hbci": {
    source: "iana",
    extensions: [
      "hbci"
    ]
  },
  "application/vnd.hc+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.hcl-bireports": {
    source: "iana"
  },
  "application/vnd.hdt": {
    source: "iana"
  },
  "application/vnd.heroku+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.hhe.lesson-player": {
    source: "iana",
    extensions: [
      "les"
    ]
  },
  "application/vnd.hl7cda+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/vnd.hl7v2+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/vnd.hp-hpgl": {
    source: "iana",
    extensions: [
      "hpgl"
    ]
  },
  "application/vnd.hp-hpid": {
    source: "iana",
    extensions: [
      "hpid"
    ]
  },
  "application/vnd.hp-hps": {
    source: "iana",
    extensions: [
      "hps"
    ]
  },
  "application/vnd.hp-jlyt": {
    source: "iana",
    extensions: [
      "jlt"
    ]
  },
  "application/vnd.hp-pcl": {
    source: "iana",
    extensions: [
      "pcl"
    ]
  },
  "application/vnd.hp-pclxl": {
    source: "iana",
    extensions: [
      "pclxl"
    ]
  },
  "application/vnd.httphone": {
    source: "iana"
  },
  "application/vnd.hydrostatix.sof-data": {
    source: "iana",
    extensions: [
      "sfd-hdstx"
    ]
  },
  "application/vnd.hyper+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.hyper-item+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.hyperdrive+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.hzn-3d-crossword": {
    source: "iana"
  },
  "application/vnd.ibm.afplinedata": {
    source: "iana"
  },
  "application/vnd.ibm.electronic-media": {
    source: "iana"
  },
  "application/vnd.ibm.minipay": {
    source: "iana",
    extensions: [
      "mpy"
    ]
  },
  "application/vnd.ibm.modcap": {
    source: "iana",
    extensions: [
      "afp",
      "listafp",
      "list3820"
    ]
  },
  "application/vnd.ibm.rights-management": {
    source: "iana",
    extensions: [
      "irm"
    ]
  },
  "application/vnd.ibm.secure-container": {
    source: "iana",
    extensions: [
      "sc"
    ]
  },
  "application/vnd.iccprofile": {
    source: "iana",
    extensions: [
      "icc",
      "icm"
    ]
  },
  "application/vnd.ieee.1905": {
    source: "iana"
  },
  "application/vnd.igloader": {
    source: "iana",
    extensions: [
      "igl"
    ]
  },
  "application/vnd.imagemeter.folder+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.imagemeter.image+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.immervision-ivp": {
    source: "iana",
    extensions: [
      "ivp"
    ]
  },
  "application/vnd.immervision-ivu": {
    source: "iana",
    extensions: [
      "ivu"
    ]
  },
  "application/vnd.ims.imsccv1p1": {
    source: "iana"
  },
  "application/vnd.ims.imsccv1p2": {
    source: "iana"
  },
  "application/vnd.ims.imsccv1p3": {
    source: "iana"
  },
  "application/vnd.ims.lis.v2.result+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ims.lti.v2.toolconsumerprofile+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ims.lti.v2.toolproxy+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ims.lti.v2.toolproxy.id+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ims.lti.v2.toolsettings+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ims.lti.v2.toolsettings.simple+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.informedcontrol.rms+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.informix-visionary": {
    source: "iana"
  },
  "application/vnd.infotech.project": {
    source: "iana"
  },
  "application/vnd.infotech.project+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.innopath.wamp.notification": {
    source: "iana"
  },
  "application/vnd.insors.igm": {
    source: "iana",
    extensions: [
      "igm"
    ]
  },
  "application/vnd.intercon.formnet": {
    source: "iana",
    extensions: [
      "xpw",
      "xpx"
    ]
  },
  "application/vnd.intergeo": {
    source: "iana",
    extensions: [
      "i2g"
    ]
  },
  "application/vnd.intertrust.digibox": {
    source: "iana"
  },
  "application/vnd.intertrust.nncp": {
    source: "iana"
  },
  "application/vnd.intu.qbo": {
    source: "iana",
    extensions: [
      "qbo"
    ]
  },
  "application/vnd.intu.qfx": {
    source: "iana",
    extensions: [
      "qfx"
    ]
  },
  "application/vnd.iptc.g2.catalogitem+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.iptc.g2.conceptitem+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.iptc.g2.knowledgeitem+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.iptc.g2.newsitem+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.iptc.g2.newsmessage+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.iptc.g2.packageitem+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.iptc.g2.planningitem+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ipunplugged.rcprofile": {
    source: "iana",
    extensions: [
      "rcprofile"
    ]
  },
  "application/vnd.irepository.package+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "irp"
    ]
  },
  "application/vnd.is-xpr": {
    source: "iana",
    extensions: [
      "xpr"
    ]
  },
  "application/vnd.isac.fcs": {
    source: "iana",
    extensions: [
      "fcs"
    ]
  },
  "application/vnd.iso11783-10+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.jam": {
    source: "iana",
    extensions: [
      "jam"
    ]
  },
  "application/vnd.japannet-directory-service": {
    source: "iana"
  },
  "application/vnd.japannet-jpnstore-wakeup": {
    source: "iana"
  },
  "application/vnd.japannet-payment-wakeup": {
    source: "iana"
  },
  "application/vnd.japannet-registration": {
    source: "iana"
  },
  "application/vnd.japannet-registration-wakeup": {
    source: "iana"
  },
  "application/vnd.japannet-setstore-wakeup": {
    source: "iana"
  },
  "application/vnd.japannet-verification": {
    source: "iana"
  },
  "application/vnd.japannet-verification-wakeup": {
    source: "iana"
  },
  "application/vnd.jcp.javame.midlet-rms": {
    source: "iana",
    extensions: [
      "rms"
    ]
  },
  "application/vnd.jisp": {
    source: "iana",
    extensions: [
      "jisp"
    ]
  },
  "application/vnd.joost.joda-archive": {
    source: "iana",
    extensions: [
      "joda"
    ]
  },
  "application/vnd.jsk.isdn-ngn": {
    source: "iana"
  },
  "application/vnd.kahootz": {
    source: "iana",
    extensions: [
      "ktz",
      "ktr"
    ]
  },
  "application/vnd.kde.karbon": {
    source: "iana",
    extensions: [
      "karbon"
    ]
  },
  "application/vnd.kde.kchart": {
    source: "iana",
    extensions: [
      "chrt"
    ]
  },
  "application/vnd.kde.kformula": {
    source: "iana",
    extensions: [
      "kfo"
    ]
  },
  "application/vnd.kde.kivio": {
    source: "iana",
    extensions: [
      "flw"
    ]
  },
  "application/vnd.kde.kontour": {
    source: "iana",
    extensions: [
      "kon"
    ]
  },
  "application/vnd.kde.kpresenter": {
    source: "iana",
    extensions: [
      "kpr",
      "kpt"
    ]
  },
  "application/vnd.kde.kspread": {
    source: "iana",
    extensions: [
      "ksp"
    ]
  },
  "application/vnd.kde.kword": {
    source: "iana",
    extensions: [
      "kwd",
      "kwt"
    ]
  },
  "application/vnd.kenameaapp": {
    source: "iana",
    extensions: [
      "htke"
    ]
  },
  "application/vnd.kidspiration": {
    source: "iana",
    extensions: [
      "kia"
    ]
  },
  "application/vnd.kinar": {
    source: "iana",
    extensions: [
      "kne",
      "knp"
    ]
  },
  "application/vnd.koan": {
    source: "iana",
    extensions: [
      "skp",
      "skd",
      "skt",
      "skm"
    ]
  },
  "application/vnd.kodak-descriptor": {
    source: "iana",
    extensions: [
      "sse"
    ]
  },
  "application/vnd.las": {
    source: "iana"
  },
  "application/vnd.las.las+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.las.las+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "lasxml"
    ]
  },
  "application/vnd.laszip": {
    source: "iana"
  },
  "application/vnd.leap+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.liberty-request+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.llamagraphics.life-balance.desktop": {
    source: "iana",
    extensions: [
      "lbd"
    ]
  },
  "application/vnd.llamagraphics.life-balance.exchange+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "lbe"
    ]
  },
  "application/vnd.logipipe.circuit+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.loom": {
    source: "iana"
  },
  "application/vnd.lotus-1-2-3": {
    source: "iana",
    extensions: [
      "123"
    ]
  },
  "application/vnd.lotus-approach": {
    source: "iana",
    extensions: [
      "apr"
    ]
  },
  "application/vnd.lotus-freelance": {
    source: "iana",
    extensions: [
      "pre"
    ]
  },
  "application/vnd.lotus-notes": {
    source: "iana",
    extensions: [
      "nsf"
    ]
  },
  "application/vnd.lotus-organizer": {
    source: "iana",
    extensions: [
      "org"
    ]
  },
  "application/vnd.lotus-screencam": {
    source: "iana",
    extensions: [
      "scm"
    ]
  },
  "application/vnd.lotus-wordpro": {
    source: "iana",
    extensions: [
      "lwp"
    ]
  },
  "application/vnd.macports.portpkg": {
    source: "iana",
    extensions: [
      "portpkg"
    ]
  },
  "application/vnd.mapbox-vector-tile": {
    source: "iana",
    extensions: [
      "mvt"
    ]
  },
  "application/vnd.marlin.drm.actiontoken+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.marlin.drm.conftoken+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.marlin.drm.license+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.marlin.drm.mdcf": {
    source: "iana"
  },
  "application/vnd.mason+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.maxar.archive.3tz+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.maxmind.maxmind-db": {
    source: "iana"
  },
  "application/vnd.mcd": {
    source: "iana",
    extensions: [
      "mcd"
    ]
  },
  "application/vnd.medcalcdata": {
    source: "iana",
    extensions: [
      "mc1"
    ]
  },
  "application/vnd.mediastation.cdkey": {
    source: "iana",
    extensions: [
      "cdkey"
    ]
  },
  "application/vnd.meridian-slingshot": {
    source: "iana"
  },
  "application/vnd.mfer": {
    source: "iana",
    extensions: [
      "mwf"
    ]
  },
  "application/vnd.mfmp": {
    source: "iana",
    extensions: [
      "mfm"
    ]
  },
  "application/vnd.micro+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.micrografx.flo": {
    source: "iana",
    extensions: [
      "flo"
    ]
  },
  "application/vnd.micrografx.igx": {
    source: "iana",
    extensions: [
      "igx"
    ]
  },
  "application/vnd.microsoft.portable-executable": {
    source: "iana"
  },
  "application/vnd.microsoft.windows.thumbnail-cache": {
    source: "iana"
  },
  "application/vnd.miele+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.mif": {
    source: "iana",
    extensions: [
      "mif"
    ]
  },
  "application/vnd.minisoft-hp3000-save": {
    source: "iana"
  },
  "application/vnd.mitsubishi.misty-guard.trustweb": {
    source: "iana"
  },
  "application/vnd.mobius.daf": {
    source: "iana",
    extensions: [
      "daf"
    ]
  },
  "application/vnd.mobius.dis": {
    source: "iana",
    extensions: [
      "dis"
    ]
  },
  "application/vnd.mobius.mbk": {
    source: "iana",
    extensions: [
      "mbk"
    ]
  },
  "application/vnd.mobius.mqy": {
    source: "iana",
    extensions: [
      "mqy"
    ]
  },
  "application/vnd.mobius.msl": {
    source: "iana",
    extensions: [
      "msl"
    ]
  },
  "application/vnd.mobius.plc": {
    source: "iana",
    extensions: [
      "plc"
    ]
  },
  "application/vnd.mobius.txf": {
    source: "iana",
    extensions: [
      "txf"
    ]
  },
  "application/vnd.mophun.application": {
    source: "iana",
    extensions: [
      "mpn"
    ]
  },
  "application/vnd.mophun.certificate": {
    source: "iana",
    extensions: [
      "mpc"
    ]
  },
  "application/vnd.motorola.flexsuite": {
    source: "iana"
  },
  "application/vnd.motorola.flexsuite.adsi": {
    source: "iana"
  },
  "application/vnd.motorola.flexsuite.fis": {
    source: "iana"
  },
  "application/vnd.motorola.flexsuite.gotap": {
    source: "iana"
  },
  "application/vnd.motorola.flexsuite.kmr": {
    source: "iana"
  },
  "application/vnd.motorola.flexsuite.ttc": {
    source: "iana"
  },
  "application/vnd.motorola.flexsuite.wem": {
    source: "iana"
  },
  "application/vnd.motorola.iprm": {
    source: "iana"
  },
  "application/vnd.mozilla.xul+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "xul"
    ]
  },
  "application/vnd.ms-3mfdocument": {
    source: "iana"
  },
  "application/vnd.ms-artgalry": {
    source: "iana",
    extensions: [
      "cil"
    ]
  },
  "application/vnd.ms-asf": {
    source: "iana"
  },
  "application/vnd.ms-cab-compressed": {
    source: "iana",
    extensions: [
      "cab"
    ]
  },
  "application/vnd.ms-color.iccprofile": {
    source: "apache"
  },
  "application/vnd.ms-excel": {
    source: "iana",
    compressible: false,
    extensions: [
      "xls",
      "xlm",
      "xla",
      "xlc",
      "xlt",
      "xlw"
    ]
  },
  "application/vnd.ms-excel.addin.macroenabled.12": {
    source: "iana",
    extensions: [
      "xlam"
    ]
  },
  "application/vnd.ms-excel.sheet.binary.macroenabled.12": {
    source: "iana",
    extensions: [
      "xlsb"
    ]
  },
  "application/vnd.ms-excel.sheet.macroenabled.12": {
    source: "iana",
    extensions: [
      "xlsm"
    ]
  },
  "application/vnd.ms-excel.template.macroenabled.12": {
    source: "iana",
    extensions: [
      "xltm"
    ]
  },
  "application/vnd.ms-fontobject": {
    source: "iana",
    compressible: true,
    extensions: [
      "eot"
    ]
  },
  "application/vnd.ms-htmlhelp": {
    source: "iana",
    extensions: [
      "chm"
    ]
  },
  "application/vnd.ms-ims": {
    source: "iana",
    extensions: [
      "ims"
    ]
  },
  "application/vnd.ms-lrm": {
    source: "iana",
    extensions: [
      "lrm"
    ]
  },
  "application/vnd.ms-office.activex+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ms-officetheme": {
    source: "iana",
    extensions: [
      "thmx"
    ]
  },
  "application/vnd.ms-opentype": {
    source: "apache",
    compressible: true
  },
  "application/vnd.ms-outlook": {
    compressible: false,
    extensions: [
      "msg"
    ]
  },
  "application/vnd.ms-package.obfuscated-opentype": {
    source: "apache"
  },
  "application/vnd.ms-pki.seccat": {
    source: "apache",
    extensions: [
      "cat"
    ]
  },
  "application/vnd.ms-pki.stl": {
    source: "apache",
    extensions: [
      "stl"
    ]
  },
  "application/vnd.ms-playready.initiator+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ms-powerpoint": {
    source: "iana",
    compressible: false,
    extensions: [
      "ppt",
      "pps",
      "pot"
    ]
  },
  "application/vnd.ms-powerpoint.addin.macroenabled.12": {
    source: "iana",
    extensions: [
      "ppam"
    ]
  },
  "application/vnd.ms-powerpoint.presentation.macroenabled.12": {
    source: "iana",
    extensions: [
      "pptm"
    ]
  },
  "application/vnd.ms-powerpoint.slide.macroenabled.12": {
    source: "iana",
    extensions: [
      "sldm"
    ]
  },
  "application/vnd.ms-powerpoint.slideshow.macroenabled.12": {
    source: "iana",
    extensions: [
      "ppsm"
    ]
  },
  "application/vnd.ms-powerpoint.template.macroenabled.12": {
    source: "iana",
    extensions: [
      "potm"
    ]
  },
  "application/vnd.ms-printdevicecapabilities+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ms-printing.printticket+xml": {
    source: "apache",
    compressible: true
  },
  "application/vnd.ms-printschematicket+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ms-project": {
    source: "iana",
    extensions: [
      "mpp",
      "mpt"
    ]
  },
  "application/vnd.ms-tnef": {
    source: "iana"
  },
  "application/vnd.ms-windows.devicepairing": {
    source: "iana"
  },
  "application/vnd.ms-windows.nwprinting.oob": {
    source: "iana"
  },
  "application/vnd.ms-windows.printerpairing": {
    source: "iana"
  },
  "application/vnd.ms-windows.wsd.oob": {
    source: "iana"
  },
  "application/vnd.ms-wmdrm.lic-chlg-req": {
    source: "iana"
  },
  "application/vnd.ms-wmdrm.lic-resp": {
    source: "iana"
  },
  "application/vnd.ms-wmdrm.meter-chlg-req": {
    source: "iana"
  },
  "application/vnd.ms-wmdrm.meter-resp": {
    source: "iana"
  },
  "application/vnd.ms-word.document.macroenabled.12": {
    source: "iana",
    extensions: [
      "docm"
    ]
  },
  "application/vnd.ms-word.template.macroenabled.12": {
    source: "iana",
    extensions: [
      "dotm"
    ]
  },
  "application/vnd.ms-works": {
    source: "iana",
    extensions: [
      "wps",
      "wks",
      "wcm",
      "wdb"
    ]
  },
  "application/vnd.ms-wpl": {
    source: "iana",
    extensions: [
      "wpl"
    ]
  },
  "application/vnd.ms-xpsdocument": {
    source: "iana",
    compressible: false,
    extensions: [
      "xps"
    ]
  },
  "application/vnd.msa-disk-image": {
    source: "iana"
  },
  "application/vnd.mseq": {
    source: "iana",
    extensions: [
      "mseq"
    ]
  },
  "application/vnd.msign": {
    source: "iana"
  },
  "application/vnd.multiad.creator": {
    source: "iana"
  },
  "application/vnd.multiad.creator.cif": {
    source: "iana"
  },
  "application/vnd.music-niff": {
    source: "iana"
  },
  "application/vnd.musician": {
    source: "iana",
    extensions: [
      "mus"
    ]
  },
  "application/vnd.muvee.style": {
    source: "iana",
    extensions: [
      "msty"
    ]
  },
  "application/vnd.mynfc": {
    source: "iana",
    extensions: [
      "taglet"
    ]
  },
  "application/vnd.nacamar.ybrid+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ncd.control": {
    source: "iana"
  },
  "application/vnd.ncd.reference": {
    source: "iana"
  },
  "application/vnd.nearst.inv+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.nebumind.line": {
    source: "iana"
  },
  "application/vnd.nervana": {
    source: "iana"
  },
  "application/vnd.netfpx": {
    source: "iana"
  },
  "application/vnd.neurolanguage.nlu": {
    source: "iana",
    extensions: [
      "nlu"
    ]
  },
  "application/vnd.nimn": {
    source: "iana"
  },
  "application/vnd.nintendo.nitro.rom": {
    source: "iana"
  },
  "application/vnd.nintendo.snes.rom": {
    source: "iana"
  },
  "application/vnd.nitf": {
    source: "iana",
    extensions: [
      "ntf",
      "nitf"
    ]
  },
  "application/vnd.noblenet-directory": {
    source: "iana",
    extensions: [
      "nnd"
    ]
  },
  "application/vnd.noblenet-sealer": {
    source: "iana",
    extensions: [
      "nns"
    ]
  },
  "application/vnd.noblenet-web": {
    source: "iana",
    extensions: [
      "nnw"
    ]
  },
  "application/vnd.nokia.catalogs": {
    source: "iana"
  },
  "application/vnd.nokia.conml+wbxml": {
    source: "iana"
  },
  "application/vnd.nokia.conml+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.nokia.iptv.config+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.nokia.isds-radio-presets": {
    source: "iana"
  },
  "application/vnd.nokia.landmark+wbxml": {
    source: "iana"
  },
  "application/vnd.nokia.landmark+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.nokia.landmarkcollection+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.nokia.n-gage.ac+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "ac"
    ]
  },
  "application/vnd.nokia.n-gage.data": {
    source: "iana",
    extensions: [
      "ngdat"
    ]
  },
  "application/vnd.nokia.n-gage.symbian.install": {
    source: "iana",
    extensions: [
      "n-gage"
    ]
  },
  "application/vnd.nokia.ncd": {
    source: "iana"
  },
  "application/vnd.nokia.pcd+wbxml": {
    source: "iana"
  },
  "application/vnd.nokia.pcd+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.nokia.radio-preset": {
    source: "iana",
    extensions: [
      "rpst"
    ]
  },
  "application/vnd.nokia.radio-presets": {
    source: "iana",
    extensions: [
      "rpss"
    ]
  },
  "application/vnd.novadigm.edm": {
    source: "iana",
    extensions: [
      "edm"
    ]
  },
  "application/vnd.novadigm.edx": {
    source: "iana",
    extensions: [
      "edx"
    ]
  },
  "application/vnd.novadigm.ext": {
    source: "iana",
    extensions: [
      "ext"
    ]
  },
  "application/vnd.ntt-local.content-share": {
    source: "iana"
  },
  "application/vnd.ntt-local.file-transfer": {
    source: "iana"
  },
  "application/vnd.ntt-local.ogw_remote-access": {
    source: "iana"
  },
  "application/vnd.ntt-local.sip-ta_remote": {
    source: "iana"
  },
  "application/vnd.ntt-local.sip-ta_tcp_stream": {
    source: "iana"
  },
  "application/vnd.oasis.opendocument.chart": {
    source: "iana",
    extensions: [
      "odc"
    ]
  },
  "application/vnd.oasis.opendocument.chart-template": {
    source: "iana",
    extensions: [
      "otc"
    ]
  },
  "application/vnd.oasis.opendocument.database": {
    source: "iana",
    extensions: [
      "odb"
    ]
  },
  "application/vnd.oasis.opendocument.formula": {
    source: "iana",
    extensions: [
      "odf"
    ]
  },
  "application/vnd.oasis.opendocument.formula-template": {
    source: "iana",
    extensions: [
      "odft"
    ]
  },
  "application/vnd.oasis.opendocument.graphics": {
    source: "iana",
    compressible: false,
    extensions: [
      "odg"
    ]
  },
  "application/vnd.oasis.opendocument.graphics-template": {
    source: "iana",
    extensions: [
      "otg"
    ]
  },
  "application/vnd.oasis.opendocument.image": {
    source: "iana",
    extensions: [
      "odi"
    ]
  },
  "application/vnd.oasis.opendocument.image-template": {
    source: "iana",
    extensions: [
      "oti"
    ]
  },
  "application/vnd.oasis.opendocument.presentation": {
    source: "iana",
    compressible: false,
    extensions: [
      "odp"
    ]
  },
  "application/vnd.oasis.opendocument.presentation-template": {
    source: "iana",
    extensions: [
      "otp"
    ]
  },
  "application/vnd.oasis.opendocument.spreadsheet": {
    source: "iana",
    compressible: false,
    extensions: [
      "ods"
    ]
  },
  "application/vnd.oasis.opendocument.spreadsheet-template": {
    source: "iana",
    extensions: [
      "ots"
    ]
  },
  "application/vnd.oasis.opendocument.text": {
    source: "iana",
    compressible: false,
    extensions: [
      "odt"
    ]
  },
  "application/vnd.oasis.opendocument.text-master": {
    source: "iana",
    extensions: [
      "odm"
    ]
  },
  "application/vnd.oasis.opendocument.text-template": {
    source: "iana",
    extensions: [
      "ott"
    ]
  },
  "application/vnd.oasis.opendocument.text-web": {
    source: "iana",
    extensions: [
      "oth"
    ]
  },
  "application/vnd.obn": {
    source: "iana"
  },
  "application/vnd.ocf+cbor": {
    source: "iana"
  },
  "application/vnd.oci.image.manifest.v1+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oftn.l10n+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oipf.contentaccessdownload+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oipf.contentaccessstreaming+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oipf.cspg-hexbinary": {
    source: "iana"
  },
  "application/vnd.oipf.dae.svg+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oipf.dae.xhtml+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oipf.mippvcontrolmessage+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oipf.pae.gem": {
    source: "iana"
  },
  "application/vnd.oipf.spdiscovery+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oipf.spdlist+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oipf.ueprofile+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oipf.userprofile+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.olpc-sugar": {
    source: "iana",
    extensions: [
      "xo"
    ]
  },
  "application/vnd.oma-scws-config": {
    source: "iana"
  },
  "application/vnd.oma-scws-http-request": {
    source: "iana"
  },
  "application/vnd.oma-scws-http-response": {
    source: "iana"
  },
  "application/vnd.oma.bcast.associated-procedure-parameter+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.bcast.drm-trigger+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.bcast.imd+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.bcast.ltkm": {
    source: "iana"
  },
  "application/vnd.oma.bcast.notification+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.bcast.provisioningtrigger": {
    source: "iana"
  },
  "application/vnd.oma.bcast.sgboot": {
    source: "iana"
  },
  "application/vnd.oma.bcast.sgdd+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.bcast.sgdu": {
    source: "iana"
  },
  "application/vnd.oma.bcast.simple-symbol-container": {
    source: "iana"
  },
  "application/vnd.oma.bcast.smartcard-trigger+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.bcast.sprov+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.bcast.stkm": {
    source: "iana"
  },
  "application/vnd.oma.cab-address-book+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.cab-feature-handler+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.cab-pcc+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.cab-subs-invite+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.cab-user-prefs+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.dcd": {
    source: "iana"
  },
  "application/vnd.oma.dcdc": {
    source: "iana"
  },
  "application/vnd.oma.dd2+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "dd2"
    ]
  },
  "application/vnd.oma.drm.risd+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.group-usage-list+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.lwm2m+cbor": {
    source: "iana"
  },
  "application/vnd.oma.lwm2m+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.lwm2m+tlv": {
    source: "iana"
  },
  "application/vnd.oma.pal+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.poc.detailed-progress-report+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.poc.final-report+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.poc.groups+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.poc.invocation-descriptor+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.poc.optimized-progress-report+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.push": {
    source: "iana"
  },
  "application/vnd.oma.scidm.messages+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.xcap-directory+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.omads-email+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/vnd.omads-file+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/vnd.omads-folder+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/vnd.omaloc-supl-init": {
    source: "iana"
  },
  "application/vnd.onepager": {
    source: "iana"
  },
  "application/vnd.onepagertamp": {
    source: "iana"
  },
  "application/vnd.onepagertamx": {
    source: "iana"
  },
  "application/vnd.onepagertat": {
    source: "iana"
  },
  "application/vnd.onepagertatp": {
    source: "iana"
  },
  "application/vnd.onepagertatx": {
    source: "iana"
  },
  "application/vnd.openblox.game+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "obgx"
    ]
  },
  "application/vnd.openblox.game-binary": {
    source: "iana"
  },
  "application/vnd.openeye.oeb": {
    source: "iana"
  },
  "application/vnd.openofficeorg.extension": {
    source: "apache",
    extensions: [
      "oxt"
    ]
  },
  "application/vnd.openstreetmap.data+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "osm"
    ]
  },
  "application/vnd.opentimestamps.ots": {
    source: "iana"
  },
  "application/vnd.openxmlformats-officedocument.custom-properties+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.customxmlproperties+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.drawing+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.drawingml.chart+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.extended-properties+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.comments+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    source: "iana",
    compressible: false,
    extensions: [
      "pptx"
    ]
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presprops+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slide": {
    source: "iana",
    extensions: [
      "sldx"
    ]
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slide+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow": {
    source: "iana",
    extensions: [
      "ppsx"
    ]
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.tags+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.template": {
    source: "iana",
    extensions: [
      "potx"
    ]
  },
  "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    source: "iana",
    compressible: false,
    extensions: [
      "xlsx"
    ]
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
    source: "iana",
    extensions: [
      "xltx"
    ]
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.theme+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.themeoverride+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.vmldrawing": {
    source: "iana"
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    source: "iana",
    compressible: false,
    extensions: [
      "docx"
    ]
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
    source: "iana",
    extensions: [
      "dotx"
    ]
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-package.core-properties+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-package.relationships+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oracle.resource+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.orange.indata": {
    source: "iana"
  },
  "application/vnd.osa.netdeploy": {
    source: "iana"
  },
  "application/vnd.osgeo.mapguide.package": {
    source: "iana",
    extensions: [
      "mgp"
    ]
  },
  "application/vnd.osgi.bundle": {
    source: "iana"
  },
  "application/vnd.osgi.dp": {
    source: "iana",
    extensions: [
      "dp"
    ]
  },
  "application/vnd.osgi.subsystem": {
    source: "iana",
    extensions: [
      "esa"
    ]
  },
  "application/vnd.otps.ct-kip+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oxli.countgraph": {
    source: "iana"
  },
  "application/vnd.pagerduty+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.palm": {
    source: "iana",
    extensions: [
      "pdb",
      "pqa",
      "oprc"
    ]
  },
  "application/vnd.panoply": {
    source: "iana"
  },
  "application/vnd.paos.xml": {
    source: "iana"
  },
  "application/vnd.patentdive": {
    source: "iana"
  },
  "application/vnd.patientecommsdoc": {
    source: "iana"
  },
  "application/vnd.pawaafile": {
    source: "iana",
    extensions: [
      "paw"
    ]
  },
  "application/vnd.pcos": {
    source: "iana"
  },
  "application/vnd.pg.format": {
    source: "iana",
    extensions: [
      "str"
    ]
  },
  "application/vnd.pg.osasli": {
    source: "iana",
    extensions: [
      "ei6"
    ]
  },
  "application/vnd.piaccess.application-licence": {
    source: "iana"
  },
  "application/vnd.picsel": {
    source: "iana",
    extensions: [
      "efif"
    ]
  },
  "application/vnd.pmi.widget": {
    source: "iana",
    extensions: [
      "wg"
    ]
  },
  "application/vnd.poc.group-advertisement+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.pocketlearn": {
    source: "iana",
    extensions: [
      "plf"
    ]
  },
  "application/vnd.powerbuilder6": {
    source: "iana",
    extensions: [
      "pbd"
    ]
  },
  "application/vnd.powerbuilder6-s": {
    source: "iana"
  },
  "application/vnd.powerbuilder7": {
    source: "iana"
  },
  "application/vnd.powerbuilder7-s": {
    source: "iana"
  },
  "application/vnd.powerbuilder75": {
    source: "iana"
  },
  "application/vnd.powerbuilder75-s": {
    source: "iana"
  },
  "application/vnd.preminet": {
    source: "iana"
  },
  "application/vnd.previewsystems.box": {
    source: "iana",
    extensions: [
      "box"
    ]
  },
  "application/vnd.proteus.magazine": {
    source: "iana",
    extensions: [
      "mgz"
    ]
  },
  "application/vnd.psfs": {
    source: "iana"
  },
  "application/vnd.publishare-delta-tree": {
    source: "iana",
    extensions: [
      "qps"
    ]
  },
  "application/vnd.pvi.ptid1": {
    source: "iana",
    extensions: [
      "ptid"
    ]
  },
  "application/vnd.pwg-multiplexed": {
    source: "iana"
  },
  "application/vnd.pwg-xhtml-print+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.qualcomm.brew-app-res": {
    source: "iana"
  },
  "application/vnd.quarantainenet": {
    source: "iana"
  },
  "application/vnd.quark.quarkxpress": {
    source: "iana",
    extensions: [
      "qxd",
      "qxt",
      "qwd",
      "qwt",
      "qxl",
      "qxb"
    ]
  },
  "application/vnd.quobject-quoxdocument": {
    source: "iana"
  },
  "application/vnd.radisys.moml+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-audit+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-audit-conf+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-audit-conn+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-audit-dialog+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-audit-stream+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-conf+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-dialog+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-dialog-base+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-dialog-fax-detect+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-dialog-fax-sendrecv+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-dialog-group+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-dialog-speech+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-dialog-transform+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.rainstor.data": {
    source: "iana"
  },
  "application/vnd.rapid": {
    source: "iana"
  },
  "application/vnd.rar": {
    source: "iana",
    extensions: [
      "rar"
    ]
  },
  "application/vnd.realvnc.bed": {
    source: "iana",
    extensions: [
      "bed"
    ]
  },
  "application/vnd.recordare.musicxml": {
    source: "iana",
    extensions: [
      "mxl"
    ]
  },
  "application/vnd.recordare.musicxml+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "musicxml"
    ]
  },
  "application/vnd.renlearn.rlprint": {
    source: "iana"
  },
  "application/vnd.resilient.logic": {
    source: "iana"
  },
  "application/vnd.restful+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.rig.cryptonote": {
    source: "iana",
    extensions: [
      "cryptonote"
    ]
  },
  "application/vnd.rim.cod": {
    source: "apache",
    extensions: [
      "cod"
    ]
  },
  "application/vnd.rn-realmedia": {
    source: "apache",
    extensions: [
      "rm"
    ]
  },
  "application/vnd.rn-realmedia-vbr": {
    source: "apache",
    extensions: [
      "rmvb"
    ]
  },
  "application/vnd.route66.link66+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "link66"
    ]
  },
  "application/vnd.rs-274x": {
    source: "iana"
  },
  "application/vnd.ruckus.download": {
    source: "iana"
  },
  "application/vnd.s3sms": {
    source: "iana"
  },
  "application/vnd.sailingtracker.track": {
    source: "iana",
    extensions: [
      "st"
    ]
  },
  "application/vnd.sar": {
    source: "iana"
  },
  "application/vnd.sbm.cid": {
    source: "iana"
  },
  "application/vnd.sbm.mid2": {
    source: "iana"
  },
  "application/vnd.scribus": {
    source: "iana"
  },
  "application/vnd.sealed.3df": {
    source: "iana"
  },
  "application/vnd.sealed.csf": {
    source: "iana"
  },
  "application/vnd.sealed.doc": {
    source: "iana"
  },
  "application/vnd.sealed.eml": {
    source: "iana"
  },
  "application/vnd.sealed.mht": {
    source: "iana"
  },
  "application/vnd.sealed.net": {
    source: "iana"
  },
  "application/vnd.sealed.ppt": {
    source: "iana"
  },
  "application/vnd.sealed.tiff": {
    source: "iana"
  },
  "application/vnd.sealed.xls": {
    source: "iana"
  },
  "application/vnd.sealedmedia.softseal.html": {
    source: "iana"
  },
  "application/vnd.sealedmedia.softseal.pdf": {
    source: "iana"
  },
  "application/vnd.seemail": {
    source: "iana",
    extensions: [
      "see"
    ]
  },
  "application/vnd.seis+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.sema": {
    source: "iana",
    extensions: [
      "sema"
    ]
  },
  "application/vnd.semd": {
    source: "iana",
    extensions: [
      "semd"
    ]
  },
  "application/vnd.semf": {
    source: "iana",
    extensions: [
      "semf"
    ]
  },
  "application/vnd.shade-save-file": {
    source: "iana"
  },
  "application/vnd.shana.informed.formdata": {
    source: "iana",
    extensions: [
      "ifm"
    ]
  },
  "application/vnd.shana.informed.formtemplate": {
    source: "iana",
    extensions: [
      "itp"
    ]
  },
  "application/vnd.shana.informed.interchange": {
    source: "iana",
    extensions: [
      "iif"
    ]
  },
  "application/vnd.shana.informed.package": {
    source: "iana",
    extensions: [
      "ipk"
    ]
  },
  "application/vnd.shootproof+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.shopkick+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.shp": {
    source: "iana"
  },
  "application/vnd.shx": {
    source: "iana"
  },
  "application/vnd.sigrok.session": {
    source: "iana"
  },
  "application/vnd.simtech-mindmapper": {
    source: "iana",
    extensions: [
      "twd",
      "twds"
    ]
  },
  "application/vnd.siren+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.smaf": {
    source: "iana",
    extensions: [
      "mmf"
    ]
  },
  "application/vnd.smart.notebook": {
    source: "iana"
  },
  "application/vnd.smart.teacher": {
    source: "iana",
    extensions: [
      "teacher"
    ]
  },
  "application/vnd.snesdev-page-table": {
    source: "iana"
  },
  "application/vnd.software602.filler.form+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "fo"
    ]
  },
  "application/vnd.software602.filler.form-xml-zip": {
    source: "iana"
  },
  "application/vnd.solent.sdkm+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "sdkm",
      "sdkd"
    ]
  },
  "application/vnd.spotfire.dxp": {
    source: "iana",
    extensions: [
      "dxp"
    ]
  },
  "application/vnd.spotfire.sfs": {
    source: "iana",
    extensions: [
      "sfs"
    ]
  },
  "application/vnd.sqlite3": {
    source: "iana"
  },
  "application/vnd.sss-cod": {
    source: "iana"
  },
  "application/vnd.sss-dtf": {
    source: "iana"
  },
  "application/vnd.sss-ntf": {
    source: "iana"
  },
  "application/vnd.stardivision.calc": {
    source: "apache",
    extensions: [
      "sdc"
    ]
  },
  "application/vnd.stardivision.draw": {
    source: "apache",
    extensions: [
      "sda"
    ]
  },
  "application/vnd.stardivision.impress": {
    source: "apache",
    extensions: [
      "sdd"
    ]
  },
  "application/vnd.stardivision.math": {
    source: "apache",
    extensions: [
      "smf"
    ]
  },
  "application/vnd.stardivision.writer": {
    source: "apache",
    extensions: [
      "sdw",
      "vor"
    ]
  },
  "application/vnd.stardivision.writer-global": {
    source: "apache",
    extensions: [
      "sgl"
    ]
  },
  "application/vnd.stepmania.package": {
    source: "iana",
    extensions: [
      "smzip"
    ]
  },
  "application/vnd.stepmania.stepchart": {
    source: "iana",
    extensions: [
      "sm"
    ]
  },
  "application/vnd.street-stream": {
    source: "iana"
  },
  "application/vnd.sun.wadl+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "wadl"
    ]
  },
  "application/vnd.sun.xml.calc": {
    source: "apache",
    extensions: [
      "sxc"
    ]
  },
  "application/vnd.sun.xml.calc.template": {
    source: "apache",
    extensions: [
      "stc"
    ]
  },
  "application/vnd.sun.xml.draw": {
    source: "apache",
    extensions: [
      "sxd"
    ]
  },
  "application/vnd.sun.xml.draw.template": {
    source: "apache",
    extensions: [
      "std"
    ]
  },
  "application/vnd.sun.xml.impress": {
    source: "apache",
    extensions: [
      "sxi"
    ]
  },
  "application/vnd.sun.xml.impress.template": {
    source: "apache",
    extensions: [
      "sti"
    ]
  },
  "application/vnd.sun.xml.math": {
    source: "apache",
    extensions: [
      "sxm"
    ]
  },
  "application/vnd.sun.xml.writer": {
    source: "apache",
    extensions: [
      "sxw"
    ]
  },
  "application/vnd.sun.xml.writer.global": {
    source: "apache",
    extensions: [
      "sxg"
    ]
  },
  "application/vnd.sun.xml.writer.template": {
    source: "apache",
    extensions: [
      "stw"
    ]
  },
  "application/vnd.sus-calendar": {
    source: "iana",
    extensions: [
      "sus",
      "susp"
    ]
  },
  "application/vnd.svd": {
    source: "iana",
    extensions: [
      "svd"
    ]
  },
  "application/vnd.swiftview-ics": {
    source: "iana"
  },
  "application/vnd.sycle+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.syft+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.symbian.install": {
    source: "apache",
    extensions: [
      "sis",
      "sisx"
    ]
  },
  "application/vnd.syncml+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: [
      "xsm"
    ]
  },
  "application/vnd.syncml.dm+wbxml": {
    source: "iana",
    charset: "UTF-8",
    extensions: [
      "bdm"
    ]
  },
  "application/vnd.syncml.dm+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: [
      "xdm"
    ]
  },
  "application/vnd.syncml.dm.notification": {
    source: "iana"
  },
  "application/vnd.syncml.dmddf+wbxml": {
    source: "iana"
  },
  "application/vnd.syncml.dmddf+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: [
      "ddf"
    ]
  },
  "application/vnd.syncml.dmtnds+wbxml": {
    source: "iana"
  },
  "application/vnd.syncml.dmtnds+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/vnd.syncml.ds.notification": {
    source: "iana"
  },
  "application/vnd.tableschema+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.tao.intent-module-archive": {
    source: "iana",
    extensions: [
      "tao"
    ]
  },
  "application/vnd.tcpdump.pcap": {
    source: "iana",
    extensions: [
      "pcap",
      "cap",
      "dmp"
    ]
  },
  "application/vnd.think-cell.ppttc+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.tmd.mediaflex.api+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.tml": {
    source: "iana"
  },
  "application/vnd.tmobile-livetv": {
    source: "iana",
    extensions: [
      "tmo"
    ]
  },
  "application/vnd.tri.onesource": {
    source: "iana"
  },
  "application/vnd.trid.tpt": {
    source: "iana",
    extensions: [
      "tpt"
    ]
  },
  "application/vnd.triscape.mxs": {
    source: "iana",
    extensions: [
      "mxs"
    ]
  },
  "application/vnd.trueapp": {
    source: "iana",
    extensions: [
      "tra"
    ]
  },
  "application/vnd.truedoc": {
    source: "iana"
  },
  "application/vnd.ubisoft.webplayer": {
    source: "iana"
  },
  "application/vnd.ufdl": {
    source: "iana",
    extensions: [
      "ufd",
      "ufdl"
    ]
  },
  "application/vnd.uiq.theme": {
    source: "iana",
    extensions: [
      "utz"
    ]
  },
  "application/vnd.umajin": {
    source: "iana",
    extensions: [
      "umj"
    ]
  },
  "application/vnd.unity": {
    source: "iana",
    extensions: [
      "unityweb"
    ]
  },
  "application/vnd.uoml+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "uoml"
    ]
  },
  "application/vnd.uplanet.alert": {
    source: "iana"
  },
  "application/vnd.uplanet.alert-wbxml": {
    source: "iana"
  },
  "application/vnd.uplanet.bearer-choice": {
    source: "iana"
  },
  "application/vnd.uplanet.bearer-choice-wbxml": {
    source: "iana"
  },
  "application/vnd.uplanet.cacheop": {
    source: "iana"
  },
  "application/vnd.uplanet.cacheop-wbxml": {
    source: "iana"
  },
  "application/vnd.uplanet.channel": {
    source: "iana"
  },
  "application/vnd.uplanet.channel-wbxml": {
    source: "iana"
  },
  "application/vnd.uplanet.list": {
    source: "iana"
  },
  "application/vnd.uplanet.list-wbxml": {
    source: "iana"
  },
  "application/vnd.uplanet.listcmd": {
    source: "iana"
  },
  "application/vnd.uplanet.listcmd-wbxml": {
    source: "iana"
  },
  "application/vnd.uplanet.signal": {
    source: "iana"
  },
  "application/vnd.uri-map": {
    source: "iana"
  },
  "application/vnd.valve.source.material": {
    source: "iana"
  },
  "application/vnd.vcx": {
    source: "iana",
    extensions: [
      "vcx"
    ]
  },
  "application/vnd.vd-study": {
    source: "iana"
  },
  "application/vnd.vectorworks": {
    source: "iana"
  },
  "application/vnd.vel+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.verimatrix.vcas": {
    source: "iana"
  },
  "application/vnd.veritone.aion+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.veryant.thin": {
    source: "iana"
  },
  "application/vnd.ves.encrypted": {
    source: "iana"
  },
  "application/vnd.vidsoft.vidconference": {
    source: "iana"
  },
  "application/vnd.visio": {
    source: "iana",
    extensions: [
      "vsd",
      "vst",
      "vss",
      "vsw"
    ]
  },
  "application/vnd.visionary": {
    source: "iana",
    extensions: [
      "vis"
    ]
  },
  "application/vnd.vividence.scriptfile": {
    source: "iana"
  },
  "application/vnd.vsf": {
    source: "iana",
    extensions: [
      "vsf"
    ]
  },
  "application/vnd.wap.sic": {
    source: "iana"
  },
  "application/vnd.wap.slc": {
    source: "iana"
  },
  "application/vnd.wap.wbxml": {
    source: "iana",
    charset: "UTF-8",
    extensions: [
      "wbxml"
    ]
  },
  "application/vnd.wap.wmlc": {
    source: "iana",
    extensions: [
      "wmlc"
    ]
  },
  "application/vnd.wap.wmlscriptc": {
    source: "iana",
    extensions: [
      "wmlsc"
    ]
  },
  "application/vnd.webturbo": {
    source: "iana",
    extensions: [
      "wtb"
    ]
  },
  "application/vnd.wfa.dpp": {
    source: "iana"
  },
  "application/vnd.wfa.p2p": {
    source: "iana"
  },
  "application/vnd.wfa.wsc": {
    source: "iana"
  },
  "application/vnd.windows.devicepairing": {
    source: "iana"
  },
  "application/vnd.wmc": {
    source: "iana"
  },
  "application/vnd.wmf.bootstrap": {
    source: "iana"
  },
  "application/vnd.wolfram.mathematica": {
    source: "iana"
  },
  "application/vnd.wolfram.mathematica.package": {
    source: "iana"
  },
  "application/vnd.wolfram.player": {
    source: "iana",
    extensions: [
      "nbp"
    ]
  },
  "application/vnd.wordperfect": {
    source: "iana",
    extensions: [
      "wpd"
    ]
  },
  "application/vnd.wqd": {
    source: "iana",
    extensions: [
      "wqd"
    ]
  },
  "application/vnd.wrq-hp3000-labelled": {
    source: "iana"
  },
  "application/vnd.wt.stf": {
    source: "iana",
    extensions: [
      "stf"
    ]
  },
  "application/vnd.wv.csp+wbxml": {
    source: "iana"
  },
  "application/vnd.wv.csp+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.wv.ssp+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.xacml+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.xara": {
    source: "iana",
    extensions: [
      "xar"
    ]
  },
  "application/vnd.xfdl": {
    source: "iana",
    extensions: [
      "xfdl"
    ]
  },
  "application/vnd.xfdl.webform": {
    source: "iana"
  },
  "application/vnd.xmi+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.xmpie.cpkg": {
    source: "iana"
  },
  "application/vnd.xmpie.dpkg": {
    source: "iana"
  },
  "application/vnd.xmpie.plan": {
    source: "iana"
  },
  "application/vnd.xmpie.ppkg": {
    source: "iana"
  },
  "application/vnd.xmpie.xlim": {
    source: "iana"
  },
  "application/vnd.yamaha.hv-dic": {
    source: "iana",
    extensions: [
      "hvd"
    ]
  },
  "application/vnd.yamaha.hv-script": {
    source: "iana",
    extensions: [
      "hvs"
    ]
  },
  "application/vnd.yamaha.hv-voice": {
    source: "iana",
    extensions: [
      "hvp"
    ]
  },
  "application/vnd.yamaha.openscoreformat": {
    source: "iana",
    extensions: [
      "osf"
    ]
  },
  "application/vnd.yamaha.openscoreformat.osfpvg+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "osfpvg"
    ]
  },
  "application/vnd.yamaha.remote-setup": {
    source: "iana"
  },
  "application/vnd.yamaha.smaf-audio": {
    source: "iana",
    extensions: [
      "saf"
    ]
  },
  "application/vnd.yamaha.smaf-phrase": {
    source: "iana",
    extensions: [
      "spf"
    ]
  },
  "application/vnd.yamaha.through-ngn": {
    source: "iana"
  },
  "application/vnd.yamaha.tunnel-udpencap": {
    source: "iana"
  },
  "application/vnd.yaoweme": {
    source: "iana"
  },
  "application/vnd.yellowriver-custom-menu": {
    source: "iana",
    extensions: [
      "cmp"
    ]
  },
  "application/vnd.youtube.yt": {
    source: "iana"
  },
  "application/vnd.zul": {
    source: "iana",
    extensions: [
      "zir",
      "zirz"
    ]
  },
  "application/vnd.zzazz.deck+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "zaz"
    ]
  },
  "application/voicexml+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "vxml"
    ]
  },
  "application/voucher-cms+json": {
    source: "iana",
    compressible: true
  },
  "application/vq-rtcpxr": {
    source: "iana"
  },
  "application/wasm": {
    source: "iana",
    compressible: true,
    extensions: [
      "wasm"
    ]
  },
  "application/watcherinfo+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "wif"
    ]
  },
  "application/webpush-options+json": {
    source: "iana",
    compressible: true
  },
  "application/whoispp-query": {
    source: "iana"
  },
  "application/whoispp-response": {
    source: "iana"
  },
  "application/widget": {
    source: "iana",
    extensions: [
      "wgt"
    ]
  },
  "application/winhlp": {
    source: "apache",
    extensions: [
      "hlp"
    ]
  },
  "application/wita": {
    source: "iana"
  },
  "application/wordperfect5.1": {
    source: "iana"
  },
  "application/wsdl+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "wsdl"
    ]
  },
  "application/wspolicy+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "wspolicy"
    ]
  },
  "application/x-7z-compressed": {
    source: "apache",
    compressible: false,
    extensions: [
      "7z"
    ]
  },
  "application/x-abiword": {
    source: "apache",
    extensions: [
      "abw"
    ]
  },
  "application/x-ace-compressed": {
    source: "apache",
    extensions: [
      "ace"
    ]
  },
  "application/x-amf": {
    source: "apache"
  },
  "application/x-apple-diskimage": {
    source: "apache",
    extensions: [
      "dmg"
    ]
  },
  "application/x-arj": {
    compressible: false,
    extensions: [
      "arj"
    ]
  },
  "application/x-authorware-bin": {
    source: "apache",
    extensions: [
      "aab",
      "x32",
      "u32",
      "vox"
    ]
  },
  "application/x-authorware-map": {
    source: "apache",
    extensions: [
      "aam"
    ]
  },
  "application/x-authorware-seg": {
    source: "apache",
    extensions: [
      "aas"
    ]
  },
  "application/x-bcpio": {
    source: "apache",
    extensions: [
      "bcpio"
    ]
  },
  "application/x-bdoc": {
    compressible: false,
    extensions: [
      "bdoc"
    ]
  },
  "application/x-bittorrent": {
    source: "apache",
    extensions: [
      "torrent"
    ]
  },
  "application/x-blorb": {
    source: "apache",
    extensions: [
      "blb",
      "blorb"
    ]
  },
  "application/x-bzip": {
    source: "apache",
    compressible: false,
    extensions: [
      "bz"
    ]
  },
  "application/x-bzip2": {
    source: "apache",
    compressible: false,
    extensions: [
      "bz2",
      "boz"
    ]
  },
  "application/x-cbr": {
    source: "apache",
    extensions: [
      "cbr",
      "cba",
      "cbt",
      "cbz",
      "cb7"
    ]
  },
  "application/x-cdlink": {
    source: "apache",
    extensions: [
      "vcd"
    ]
  },
  "application/x-cfs-compressed": {
    source: "apache",
    extensions: [
      "cfs"
    ]
  },
  "application/x-chat": {
    source: "apache",
    extensions: [
      "chat"
    ]
  },
  "application/x-chess-pgn": {
    source: "apache",
    extensions: [
      "pgn"
    ]
  },
  "application/x-chrome-extension": {
    extensions: [
      "crx"
    ]
  },
  "application/x-cocoa": {
    source: "nginx",
    extensions: [
      "cco"
    ]
  },
  "application/x-compress": {
    source: "apache"
  },
  "application/x-conference": {
    source: "apache",
    extensions: [
      "nsc"
    ]
  },
  "application/x-cpio": {
    source: "apache",
    extensions: [
      "cpio"
    ]
  },
  "application/x-csh": {
    source: "apache",
    extensions: [
      "csh"
    ]
  },
  "application/x-deb": {
    compressible: false
  },
  "application/x-debian-package": {
    source: "apache",
    extensions: [
      "deb",
      "udeb"
    ]
  },
  "application/x-dgc-compressed": {
    source: "apache",
    extensions: [
      "dgc"
    ]
  },
  "application/x-director": {
    source: "apache",
    extensions: [
      "dir",
      "dcr",
      "dxr",
      "cst",
      "cct",
      "cxt",
      "w3d",
      "fgd",
      "swa"
    ]
  },
  "application/x-doom": {
    source: "apache",
    extensions: [
      "wad"
    ]
  },
  "application/x-dtbncx+xml": {
    source: "apache",
    compressible: true,
    extensions: [
      "ncx"
    ]
  },
  "application/x-dtbook+xml": {
    source: "apache",
    compressible: true,
    extensions: [
      "dtb"
    ]
  },
  "application/x-dtbresource+xml": {
    source: "apache",
    compressible: true,
    extensions: [
      "res"
    ]
  },
  "application/x-dvi": {
    source: "apache",
    compressible: false,
    extensions: [
      "dvi"
    ]
  },
  "application/x-envoy": {
    source: "apache",
    extensions: [
      "evy"
    ]
  },
  "application/x-eva": {
    source: "apache",
    extensions: [
      "eva"
    ]
  },
  "application/x-font-bdf": {
    source: "apache",
    extensions: [
      "bdf"
    ]
  },
  "application/x-font-dos": {
    source: "apache"
  },
  "application/x-font-framemaker": {
    source: "apache"
  },
  "application/x-font-ghostscript": {
    source: "apache",
    extensions: [
      "gsf"
    ]
  },
  "application/x-font-libgrx": {
    source: "apache"
  },
  "application/x-font-linux-psf": {
    source: "apache",
    extensions: [
      "psf"
    ]
  },
  "application/x-font-pcf": {
    source: "apache",
    extensions: [
      "pcf"
    ]
  },
  "application/x-font-snf": {
    source: "apache",
    extensions: [
      "snf"
    ]
  },
  "application/x-font-speedo": {
    source: "apache"
  },
  "application/x-font-sunos-news": {
    source: "apache"
  },
  "application/x-font-type1": {
    source: "apache",
    extensions: [
      "pfa",
      "pfb",
      "pfm",
      "afm"
    ]
  },
  "application/x-font-vfont": {
    source: "apache"
  },
  "application/x-freearc": {
    source: "apache",
    extensions: [
      "arc"
    ]
  },
  "application/x-futuresplash": {
    source: "apache",
    extensions: [
      "spl"
    ]
  },
  "application/x-gca-compressed": {
    source: "apache",
    extensions: [
      "gca"
    ]
  },
  "application/x-glulx": {
    source: "apache",
    extensions: [
      "ulx"
    ]
  },
  "application/x-gnumeric": {
    source: "apache",
    extensions: [
      "gnumeric"
    ]
  },
  "application/x-gramps-xml": {
    source: "apache",
    extensions: [
      "gramps"
    ]
  },
  "application/x-gtar": {
    source: "apache",
    extensions: [
      "gtar"
    ]
  },
  "application/x-gzip": {
    source: "apache"
  },
  "application/x-hdf": {
    source: "apache",
    extensions: [
      "hdf"
    ]
  },
  "application/x-httpd-php": {
    compressible: true,
    extensions: [
      "php"
    ]
  },
  "application/x-install-instructions": {
    source: "apache",
    extensions: [
      "install"
    ]
  },
  "application/x-iso9660-image": {
    source: "apache",
    extensions: [
      "iso"
    ]
  },
  "application/x-iwork-keynote-sffkey": {
    extensions: [
      "key"
    ]
  },
  "application/x-iwork-numbers-sffnumbers": {
    extensions: [
      "numbers"
    ]
  },
  "application/x-iwork-pages-sffpages": {
    extensions: [
      "pages"
    ]
  },
  "application/x-java-archive-diff": {
    source: "nginx",
    extensions: [
      "jardiff"
    ]
  },
  "application/x-java-jnlp-file": {
    source: "apache",
    compressible: false,
    extensions: [
      "jnlp"
    ]
  },
  "application/x-javascript": {
    compressible: true
  },
  "application/x-keepass2": {
    extensions: [
      "kdbx"
    ]
  },
  "application/x-latex": {
    source: "apache",
    compressible: false,
    extensions: [
      "latex"
    ]
  },
  "application/x-lua-bytecode": {
    extensions: [
      "luac"
    ]
  },
  "application/x-lzh-compressed": {
    source: "apache",
    extensions: [
      "lzh",
      "lha"
    ]
  },
  "application/x-makeself": {
    source: "nginx",
    extensions: [
      "run"
    ]
  },
  "application/x-mie": {
    source: "apache",
    extensions: [
      "mie"
    ]
  },
  "application/x-mobipocket-ebook": {
    source: "apache",
    extensions: [
      "prc",
      "mobi"
    ]
  },
  "application/x-mpegurl": {
    compressible: false
  },
  "application/x-ms-application": {
    source: "apache",
    extensions: [
      "application"
    ]
  },
  "application/x-ms-shortcut": {
    source: "apache",
    extensions: [
      "lnk"
    ]
  },
  "application/x-ms-wmd": {
    source: "apache",
    extensions: [
      "wmd"
    ]
  },
  "application/x-ms-wmz": {
    source: "apache",
    extensions: [
      "wmz"
    ]
  },
  "application/x-ms-xbap": {
    source: "apache",
    extensions: [
      "xbap"
    ]
  },
  "application/x-msaccess": {
    source: "apache",
    extensions: [
      "mdb"
    ]
  },
  "application/x-msbinder": {
    source: "apache",
    extensions: [
      "obd"
    ]
  },
  "application/x-mscardfile": {
    source: "apache",
    extensions: [
      "crd"
    ]
  },
  "application/x-msclip": {
    source: "apache",
    extensions: [
      "clp"
    ]
  },
  "application/x-msdos-program": {
    extensions: [
      "exe"
    ]
  },
  "application/x-msdownload": {
    source: "apache",
    extensions: [
      "exe",
      "dll",
      "com",
      "bat",
      "msi"
    ]
  },
  "application/x-msmediaview": {
    source: "apache",
    extensions: [
      "mvb",
      "m13",
      "m14"
    ]
  },
  "application/x-msmetafile": {
    source: "apache",
    extensions: [
      "wmf",
      "wmz",
      "emf",
      "emz"
    ]
  },
  "application/x-msmoney": {
    source: "apache",
    extensions: [
      "mny"
    ]
  },
  "application/x-mspublisher": {
    source: "apache",
    extensions: [
      "pub"
    ]
  },
  "application/x-msschedule": {
    source: "apache",
    extensions: [
      "scd"
    ]
  },
  "application/x-msterminal": {
    source: "apache",
    extensions: [
      "trm"
    ]
  },
  "application/x-mswrite": {
    source: "apache",
    extensions: [
      "wri"
    ]
  },
  "application/x-netcdf": {
    source: "apache",
    extensions: [
      "nc",
      "cdf"
    ]
  },
  "application/x-ns-proxy-autoconfig": {
    compressible: true,
    extensions: [
      "pac"
    ]
  },
  "application/x-nzb": {
    source: "apache",
    extensions: [
      "nzb"
    ]
  },
  "application/x-perl": {
    source: "nginx",
    extensions: [
      "pl",
      "pm"
    ]
  },
  "application/x-pilot": {
    source: "nginx",
    extensions: [
      "prc",
      "pdb"
    ]
  },
  "application/x-pkcs12": {
    source: "apache",
    compressible: false,
    extensions: [
      "p12",
      "pfx"
    ]
  },
  "application/x-pkcs7-certificates": {
    source: "apache",
    extensions: [
      "p7b",
      "spc"
    ]
  },
  "application/x-pkcs7-certreqresp": {
    source: "apache",
    extensions: [
      "p7r"
    ]
  },
  "application/x-pki-message": {
    source: "iana"
  },
  "application/x-rar-compressed": {
    source: "apache",
    compressible: false,
    extensions: [
      "rar"
    ]
  },
  "application/x-redhat-package-manager": {
    source: "nginx",
    extensions: [
      "rpm"
    ]
  },
  "application/x-research-info-systems": {
    source: "apache",
    extensions: [
      "ris"
    ]
  },
  "application/x-sea": {
    source: "nginx",
    extensions: [
      "sea"
    ]
  },
  "application/x-sh": {
    source: "apache",
    compressible: true,
    extensions: [
      "sh"
    ]
  },
  "application/x-shar": {
    source: "apache",
    extensions: [
      "shar"
    ]
  },
  "application/x-shockwave-flash": {
    source: "apache",
    compressible: false,
    extensions: [
      "swf"
    ]
  },
  "application/x-silverlight-app": {
    source: "apache",
    extensions: [
      "xap"
    ]
  },
  "application/x-sql": {
    source: "apache",
    extensions: [
      "sql"
    ]
  },
  "application/x-stuffit": {
    source: "apache",
    compressible: false,
    extensions: [
      "sit"
    ]
  },
  "application/x-stuffitx": {
    source: "apache",
    extensions: [
      "sitx"
    ]
  },
  "application/x-subrip": {
    source: "apache",
    extensions: [
      "srt"
    ]
  },
  "application/x-sv4cpio": {
    source: "apache",
    extensions: [
      "sv4cpio"
    ]
  },
  "application/x-sv4crc": {
    source: "apache",
    extensions: [
      "sv4crc"
    ]
  },
  "application/x-t3vm-image": {
    source: "apache",
    extensions: [
      "t3"
    ]
  },
  "application/x-tads": {
    source: "apache",
    extensions: [
      "gam"
    ]
  },
  "application/x-tar": {
    source: "apache",
    compressible: true,
    extensions: [
      "tar"
    ]
  },
  "application/x-tcl": {
    source: "apache",
    extensions: [
      "tcl",
      "tk"
    ]
  },
  "application/x-tex": {
    source: "apache",
    extensions: [
      "tex"
    ]
  },
  "application/x-tex-tfm": {
    source: "apache",
    extensions: [
      "tfm"
    ]
  },
  "application/x-texinfo": {
    source: "apache",
    extensions: [
      "texinfo",
      "texi"
    ]
  },
  "application/x-tgif": {
    source: "apache",
    extensions: [
      "obj"
    ]
  },
  "application/x-ustar": {
    source: "apache",
    extensions: [
      "ustar"
    ]
  },
  "application/x-virtualbox-hdd": {
    compressible: true,
    extensions: [
      "hdd"
    ]
  },
  "application/x-virtualbox-ova": {
    compressible: true,
    extensions: [
      "ova"
    ]
  },
  "application/x-virtualbox-ovf": {
    compressible: true,
    extensions: [
      "ovf"
    ]
  },
  "application/x-virtualbox-vbox": {
    compressible: true,
    extensions: [
      "vbox"
    ]
  },
  "application/x-virtualbox-vbox-extpack": {
    compressible: false,
    extensions: [
      "vbox-extpack"
    ]
  },
  "application/x-virtualbox-vdi": {
    compressible: true,
    extensions: [
      "vdi"
    ]
  },
  "application/x-virtualbox-vhd": {
    compressible: true,
    extensions: [
      "vhd"
    ]
  },
  "application/x-virtualbox-vmdk": {
    compressible: true,
    extensions: [
      "vmdk"
    ]
  },
  "application/x-wais-source": {
    source: "apache",
    extensions: [
      "src"
    ]
  },
  "application/x-web-app-manifest+json": {
    compressible: true,
    extensions: [
      "webapp"
    ]
  },
  "application/x-www-form-urlencoded": {
    source: "iana",
    compressible: true
  },
  "application/x-x509-ca-cert": {
    source: "iana",
    extensions: [
      "der",
      "crt",
      "pem"
    ]
  },
  "application/x-x509-ca-ra-cert": {
    source: "iana"
  },
  "application/x-x509-next-ca-cert": {
    source: "iana"
  },
  "application/x-xfig": {
    source: "apache",
    extensions: [
      "fig"
    ]
  },
  "application/x-xliff+xml": {
    source: "apache",
    compressible: true,
    extensions: [
      "xlf"
    ]
  },
  "application/x-xpinstall": {
    source: "apache",
    compressible: false,
    extensions: [
      "xpi"
    ]
  },
  "application/x-xz": {
    source: "apache",
    extensions: [
      "xz"
    ]
  },
  "application/x-zmachine": {
    source: "apache",
    extensions: [
      "z1",
      "z2",
      "z3",
      "z4",
      "z5",
      "z6",
      "z7",
      "z8"
    ]
  },
  "application/x400-bp": {
    source: "iana"
  },
  "application/xacml+xml": {
    source: "iana",
    compressible: true
  },
  "application/xaml+xml": {
    source: "apache",
    compressible: true,
    extensions: [
      "xaml"
    ]
  },
  "application/xcap-att+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "xav"
    ]
  },
  "application/xcap-caps+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "xca"
    ]
  },
  "application/xcap-diff+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "xdf"
    ]
  },
  "application/xcap-el+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "xel"
    ]
  },
  "application/xcap-error+xml": {
    source: "iana",
    compressible: true
  },
  "application/xcap-ns+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "xns"
    ]
  },
  "application/xcon-conference-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/xcon-conference-info-diff+xml": {
    source: "iana",
    compressible: true
  },
  "application/xenc+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "xenc"
    ]
  },
  "application/xhtml+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "xhtml",
      "xht"
    ]
  },
  "application/xhtml-voice+xml": {
    source: "apache",
    compressible: true
  },
  "application/xliff+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "xlf"
    ]
  },
  "application/xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "xml",
      "xsl",
      "xsd",
      "rng"
    ]
  },
  "application/xml-dtd": {
    source: "iana",
    compressible: true,
    extensions: [
      "dtd"
    ]
  },
  "application/xml-external-parsed-entity": {
    source: "iana"
  },
  "application/xml-patch+xml": {
    source: "iana",
    compressible: true
  },
  "application/xmpp+xml": {
    source: "iana",
    compressible: true
  },
  "application/xop+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "xop"
    ]
  },
  "application/xproc+xml": {
    source: "apache",
    compressible: true,
    extensions: [
      "xpl"
    ]
  },
  "application/xslt+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "xsl",
      "xslt"
    ]
  },
  "application/xspf+xml": {
    source: "apache",
    compressible: true,
    extensions: [
      "xspf"
    ]
  },
  "application/xv+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "mxml",
      "xhvml",
      "xvml",
      "xvm"
    ]
  },
  "application/yang": {
    source: "iana",
    extensions: [
      "yang"
    ]
  },
  "application/yang-data+json": {
    source: "iana",
    compressible: true
  },
  "application/yang-data+xml": {
    source: "iana",
    compressible: true
  },
  "application/yang-patch+json": {
    source: "iana",
    compressible: true
  },
  "application/yang-patch+xml": {
    source: "iana",
    compressible: true
  },
  "application/yin+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "yin"
    ]
  },
  "application/zip": {
    source: "iana",
    compressible: false,
    extensions: [
      "zip"
    ]
  },
  "application/zlib": {
    source: "iana"
  },
  "application/zstd": {
    source: "iana"
  },
  "audio/1d-interleaved-parityfec": {
    source: "iana"
  },
  "audio/32kadpcm": {
    source: "iana"
  },
  "audio/3gpp": {
    source: "iana",
    compressible: false,
    extensions: [
      "3gpp"
    ]
  },
  "audio/3gpp2": {
    source: "iana"
  },
  "audio/aac": {
    source: "iana"
  },
  "audio/ac3": {
    source: "iana"
  },
  "audio/adpcm": {
    source: "apache",
    extensions: [
      "adp"
    ]
  },
  "audio/amr": {
    source: "iana",
    extensions: [
      "amr"
    ]
  },
  "audio/amr-wb": {
    source: "iana"
  },
  "audio/amr-wb+": {
    source: "iana"
  },
  "audio/aptx": {
    source: "iana"
  },
  "audio/asc": {
    source: "iana"
  },
  "audio/atrac-advanced-lossless": {
    source: "iana"
  },
  "audio/atrac-x": {
    source: "iana"
  },
  "audio/atrac3": {
    source: "iana"
  },
  "audio/basic": {
    source: "iana",
    compressible: false,
    extensions: [
      "au",
      "snd"
    ]
  },
  "audio/bv16": {
    source: "iana"
  },
  "audio/bv32": {
    source: "iana"
  },
  "audio/clearmode": {
    source: "iana"
  },
  "audio/cn": {
    source: "iana"
  },
  "audio/dat12": {
    source: "iana"
  },
  "audio/dls": {
    source: "iana"
  },
  "audio/dsr-es201108": {
    source: "iana"
  },
  "audio/dsr-es202050": {
    source: "iana"
  },
  "audio/dsr-es202211": {
    source: "iana"
  },
  "audio/dsr-es202212": {
    source: "iana"
  },
  "audio/dv": {
    source: "iana"
  },
  "audio/dvi4": {
    source: "iana"
  },
  "audio/eac3": {
    source: "iana"
  },
  "audio/encaprtp": {
    source: "iana"
  },
  "audio/evrc": {
    source: "iana"
  },
  "audio/evrc-qcp": {
    source: "iana"
  },
  "audio/evrc0": {
    source: "iana"
  },
  "audio/evrc1": {
    source: "iana"
  },
  "audio/evrcb": {
    source: "iana"
  },
  "audio/evrcb0": {
    source: "iana"
  },
  "audio/evrcb1": {
    source: "iana"
  },
  "audio/evrcnw": {
    source: "iana"
  },
  "audio/evrcnw0": {
    source: "iana"
  },
  "audio/evrcnw1": {
    source: "iana"
  },
  "audio/evrcwb": {
    source: "iana"
  },
  "audio/evrcwb0": {
    source: "iana"
  },
  "audio/evrcwb1": {
    source: "iana"
  },
  "audio/evs": {
    source: "iana"
  },
  "audio/flexfec": {
    source: "iana"
  },
  "audio/fwdred": {
    source: "iana"
  },
  "audio/g711-0": {
    source: "iana"
  },
  "audio/g719": {
    source: "iana"
  },
  "audio/g722": {
    source: "iana"
  },
  "audio/g7221": {
    source: "iana"
  },
  "audio/g723": {
    source: "iana"
  },
  "audio/g726-16": {
    source: "iana"
  },
  "audio/g726-24": {
    source: "iana"
  },
  "audio/g726-32": {
    source: "iana"
  },
  "audio/g726-40": {
    source: "iana"
  },
  "audio/g728": {
    source: "iana"
  },
  "audio/g729": {
    source: "iana"
  },
  "audio/g7291": {
    source: "iana"
  },
  "audio/g729d": {
    source: "iana"
  },
  "audio/g729e": {
    source: "iana"
  },
  "audio/gsm": {
    source: "iana"
  },
  "audio/gsm-efr": {
    source: "iana"
  },
  "audio/gsm-hr-08": {
    source: "iana"
  },
  "audio/ilbc": {
    source: "iana"
  },
  "audio/ip-mr_v2.5": {
    source: "iana"
  },
  "audio/isac": {
    source: "apache"
  },
  "audio/l16": {
    source: "iana"
  },
  "audio/l20": {
    source: "iana"
  },
  "audio/l24": {
    source: "iana",
    compressible: false
  },
  "audio/l8": {
    source: "iana"
  },
  "audio/lpc": {
    source: "iana"
  },
  "audio/melp": {
    source: "iana"
  },
  "audio/melp1200": {
    source: "iana"
  },
  "audio/melp2400": {
    source: "iana"
  },
  "audio/melp600": {
    source: "iana"
  },
  "audio/mhas": {
    source: "iana"
  },
  "audio/midi": {
    source: "apache",
    extensions: [
      "mid",
      "midi",
      "kar",
      "rmi"
    ]
  },
  "audio/mobile-xmf": {
    source: "iana",
    extensions: [
      "mxmf"
    ]
  },
  "audio/mp3": {
    compressible: false,
    extensions: [
      "mp3"
    ]
  },
  "audio/mp4": {
    source: "iana",
    compressible: false,
    extensions: [
      "m4a",
      "mp4a"
    ]
  },
  "audio/mp4a-latm": {
    source: "iana"
  },
  "audio/mpa": {
    source: "iana"
  },
  "audio/mpa-robust": {
    source: "iana"
  },
  "audio/mpeg": {
    source: "iana",
    compressible: false,
    extensions: [
      "mpga",
      "mp2",
      "mp2a",
      "mp3",
      "m2a",
      "m3a"
    ]
  },
  "audio/mpeg4-generic": {
    source: "iana"
  },
  "audio/musepack": {
    source: "apache"
  },
  "audio/ogg": {
    source: "iana",
    compressible: false,
    extensions: [
      "oga",
      "ogg",
      "spx",
      "opus"
    ]
  },
  "audio/opus": {
    source: "iana"
  },
  "audio/parityfec": {
    source: "iana"
  },
  "audio/pcma": {
    source: "iana"
  },
  "audio/pcma-wb": {
    source: "iana"
  },
  "audio/pcmu": {
    source: "iana"
  },
  "audio/pcmu-wb": {
    source: "iana"
  },
  "audio/prs.sid": {
    source: "iana"
  },
  "audio/qcelp": {
    source: "iana"
  },
  "audio/raptorfec": {
    source: "iana"
  },
  "audio/red": {
    source: "iana"
  },
  "audio/rtp-enc-aescm128": {
    source: "iana"
  },
  "audio/rtp-midi": {
    source: "iana"
  },
  "audio/rtploopback": {
    source: "iana"
  },
  "audio/rtx": {
    source: "iana"
  },
  "audio/s3m": {
    source: "apache",
    extensions: [
      "s3m"
    ]
  },
  "audio/scip": {
    source: "iana"
  },
  "audio/silk": {
    source: "apache",
    extensions: [
      "sil"
    ]
  },
  "audio/smv": {
    source: "iana"
  },
  "audio/smv-qcp": {
    source: "iana"
  },
  "audio/smv0": {
    source: "iana"
  },
  "audio/sofa": {
    source: "iana"
  },
  "audio/sp-midi": {
    source: "iana"
  },
  "audio/speex": {
    source: "iana"
  },
  "audio/t140c": {
    source: "iana"
  },
  "audio/t38": {
    source: "iana"
  },
  "audio/telephone-event": {
    source: "iana"
  },
  "audio/tetra_acelp": {
    source: "iana"
  },
  "audio/tetra_acelp_bb": {
    source: "iana"
  },
  "audio/tone": {
    source: "iana"
  },
  "audio/tsvcis": {
    source: "iana"
  },
  "audio/uemclip": {
    source: "iana"
  },
  "audio/ulpfec": {
    source: "iana"
  },
  "audio/usac": {
    source: "iana"
  },
  "audio/vdvi": {
    source: "iana"
  },
  "audio/vmr-wb": {
    source: "iana"
  },
  "audio/vnd.3gpp.iufp": {
    source: "iana"
  },
  "audio/vnd.4sb": {
    source: "iana"
  },
  "audio/vnd.audiokoz": {
    source: "iana"
  },
  "audio/vnd.celp": {
    source: "iana"
  },
  "audio/vnd.cisco.nse": {
    source: "iana"
  },
  "audio/vnd.cmles.radio-events": {
    source: "iana"
  },
  "audio/vnd.cns.anp1": {
    source: "iana"
  },
  "audio/vnd.cns.inf1": {
    source: "iana"
  },
  "audio/vnd.dece.audio": {
    source: "iana",
    extensions: [
      "uva",
      "uvva"
    ]
  },
  "audio/vnd.digital-winds": {
    source: "iana",
    extensions: [
      "eol"
    ]
  },
  "audio/vnd.dlna.adts": {
    source: "iana"
  },
  "audio/vnd.dolby.heaac.1": {
    source: "iana"
  },
  "audio/vnd.dolby.heaac.2": {
    source: "iana"
  },
  "audio/vnd.dolby.mlp": {
    source: "iana"
  },
  "audio/vnd.dolby.mps": {
    source: "iana"
  },
  "audio/vnd.dolby.pl2": {
    source: "iana"
  },
  "audio/vnd.dolby.pl2x": {
    source: "iana"
  },
  "audio/vnd.dolby.pl2z": {
    source: "iana"
  },
  "audio/vnd.dolby.pulse.1": {
    source: "iana"
  },
  "audio/vnd.dra": {
    source: "iana",
    extensions: [
      "dra"
    ]
  },
  "audio/vnd.dts": {
    source: "iana",
    extensions: [
      "dts"
    ]
  },
  "audio/vnd.dts.hd": {
    source: "iana",
    extensions: [
      "dtshd"
    ]
  },
  "audio/vnd.dts.uhd": {
    source: "iana"
  },
  "audio/vnd.dvb.file": {
    source: "iana"
  },
  "audio/vnd.everad.plj": {
    source: "iana"
  },
  "audio/vnd.hns.audio": {
    source: "iana"
  },
  "audio/vnd.lucent.voice": {
    source: "iana",
    extensions: [
      "lvp"
    ]
  },
  "audio/vnd.ms-playready.media.pya": {
    source: "iana",
    extensions: [
      "pya"
    ]
  },
  "audio/vnd.nokia.mobile-xmf": {
    source: "iana"
  },
  "audio/vnd.nortel.vbk": {
    source: "iana"
  },
  "audio/vnd.nuera.ecelp4800": {
    source: "iana",
    extensions: [
      "ecelp4800"
    ]
  },
  "audio/vnd.nuera.ecelp7470": {
    source: "iana",
    extensions: [
      "ecelp7470"
    ]
  },
  "audio/vnd.nuera.ecelp9600": {
    source: "iana",
    extensions: [
      "ecelp9600"
    ]
  },
  "audio/vnd.octel.sbc": {
    source: "iana"
  },
  "audio/vnd.presonus.multitrack": {
    source: "iana"
  },
  "audio/vnd.qcelp": {
    source: "iana"
  },
  "audio/vnd.rhetorex.32kadpcm": {
    source: "iana"
  },
  "audio/vnd.rip": {
    source: "iana",
    extensions: [
      "rip"
    ]
  },
  "audio/vnd.rn-realaudio": {
    compressible: false
  },
  "audio/vnd.sealedmedia.softseal.mpeg": {
    source: "iana"
  },
  "audio/vnd.vmx.cvsd": {
    source: "iana"
  },
  "audio/vnd.wave": {
    compressible: false
  },
  "audio/vorbis": {
    source: "iana",
    compressible: false
  },
  "audio/vorbis-config": {
    source: "iana"
  },
  "audio/wav": {
    compressible: false,
    extensions: [
      "wav"
    ]
  },
  "audio/wave": {
    compressible: false,
    extensions: [
      "wav"
    ]
  },
  "audio/webm": {
    source: "apache",
    compressible: false,
    extensions: [
      "weba"
    ]
  },
  "audio/x-aac": {
    source: "apache",
    compressible: false,
    extensions: [
      "aac"
    ]
  },
  "audio/x-aiff": {
    source: "apache",
    extensions: [
      "aif",
      "aiff",
      "aifc"
    ]
  },
  "audio/x-caf": {
    source: "apache",
    compressible: false,
    extensions: [
      "caf"
    ]
  },
  "audio/x-flac": {
    source: "apache",
    extensions: [
      "flac"
    ]
  },
  "audio/x-m4a": {
    source: "nginx",
    extensions: [
      "m4a"
    ]
  },
  "audio/x-matroska": {
    source: "apache",
    extensions: [
      "mka"
    ]
  },
  "audio/x-mpegurl": {
    source: "apache",
    extensions: [
      "m3u"
    ]
  },
  "audio/x-ms-wax": {
    source: "apache",
    extensions: [
      "wax"
    ]
  },
  "audio/x-ms-wma": {
    source: "apache",
    extensions: [
      "wma"
    ]
  },
  "audio/x-pn-realaudio": {
    source: "apache",
    extensions: [
      "ram",
      "ra"
    ]
  },
  "audio/x-pn-realaudio-plugin": {
    source: "apache",
    extensions: [
      "rmp"
    ]
  },
  "audio/x-realaudio": {
    source: "nginx",
    extensions: [
      "ra"
    ]
  },
  "audio/x-tta": {
    source: "apache"
  },
  "audio/x-wav": {
    source: "apache",
    extensions: [
      "wav"
    ]
  },
  "audio/xm": {
    source: "apache",
    extensions: [
      "xm"
    ]
  },
  "chemical/x-cdx": {
    source: "apache",
    extensions: [
      "cdx"
    ]
  },
  "chemical/x-cif": {
    source: "apache",
    extensions: [
      "cif"
    ]
  },
  "chemical/x-cmdf": {
    source: "apache",
    extensions: [
      "cmdf"
    ]
  },
  "chemical/x-cml": {
    source: "apache",
    extensions: [
      "cml"
    ]
  },
  "chemical/x-csml": {
    source: "apache",
    extensions: [
      "csml"
    ]
  },
  "chemical/x-pdb": {
    source: "apache"
  },
  "chemical/x-xyz": {
    source: "apache",
    extensions: [
      "xyz"
    ]
  },
  "font/collection": {
    source: "iana",
    extensions: [
      "ttc"
    ]
  },
  "font/otf": {
    source: "iana",
    compressible: true,
    extensions: [
      "otf"
    ]
  },
  "font/sfnt": {
    source: "iana"
  },
  "font/ttf": {
    source: "iana",
    compressible: true,
    extensions: [
      "ttf"
    ]
  },
  "font/woff": {
    source: "iana",
    extensions: [
      "woff"
    ]
  },
  "font/woff2": {
    source: "iana",
    extensions: [
      "woff2"
    ]
  },
  "image/aces": {
    source: "iana",
    extensions: [
      "exr"
    ]
  },
  "image/apng": {
    compressible: false,
    extensions: [
      "apng"
    ]
  },
  "image/avci": {
    source: "iana",
    extensions: [
      "avci"
    ]
  },
  "image/avcs": {
    source: "iana",
    extensions: [
      "avcs"
    ]
  },
  "image/avif": {
    source: "iana",
    compressible: false,
    extensions: [
      "avif"
    ]
  },
  "image/bmp": {
    source: "iana",
    compressible: true,
    extensions: [
      "bmp"
    ]
  },
  "image/cgm": {
    source: "iana",
    extensions: [
      "cgm"
    ]
  },
  "image/dicom-rle": {
    source: "iana",
    extensions: [
      "drle"
    ]
  },
  "image/emf": {
    source: "iana",
    extensions: [
      "emf"
    ]
  },
  "image/fits": {
    source: "iana",
    extensions: [
      "fits"
    ]
  },
  "image/g3fax": {
    source: "iana",
    extensions: [
      "g3"
    ]
  },
  "image/gif": {
    source: "iana",
    compressible: false,
    extensions: [
      "gif"
    ]
  },
  "image/heic": {
    source: "iana",
    extensions: [
      "heic"
    ]
  },
  "image/heic-sequence": {
    source: "iana",
    extensions: [
      "heics"
    ]
  },
  "image/heif": {
    source: "iana",
    extensions: [
      "heif"
    ]
  },
  "image/heif-sequence": {
    source: "iana",
    extensions: [
      "heifs"
    ]
  },
  "image/hej2k": {
    source: "iana",
    extensions: [
      "hej2"
    ]
  },
  "image/hsj2": {
    source: "iana",
    extensions: [
      "hsj2"
    ]
  },
  "image/ief": {
    source: "iana",
    extensions: [
      "ief"
    ]
  },
  "image/jls": {
    source: "iana",
    extensions: [
      "jls"
    ]
  },
  "image/jp2": {
    source: "iana",
    compressible: false,
    extensions: [
      "jp2",
      "jpg2"
    ]
  },
  "image/jpeg": {
    source: "iana",
    compressible: false,
    extensions: [
      "jpeg",
      "jpg",
      "jpe"
    ]
  },
  "image/jph": {
    source: "iana",
    extensions: [
      "jph"
    ]
  },
  "image/jphc": {
    source: "iana",
    extensions: [
      "jhc"
    ]
  },
  "image/jpm": {
    source: "iana",
    compressible: false,
    extensions: [
      "jpm"
    ]
  },
  "image/jpx": {
    source: "iana",
    compressible: false,
    extensions: [
      "jpx",
      "jpf"
    ]
  },
  "image/jxr": {
    source: "iana",
    extensions: [
      "jxr"
    ]
  },
  "image/jxra": {
    source: "iana",
    extensions: [
      "jxra"
    ]
  },
  "image/jxrs": {
    source: "iana",
    extensions: [
      "jxrs"
    ]
  },
  "image/jxs": {
    source: "iana",
    extensions: [
      "jxs"
    ]
  },
  "image/jxsc": {
    source: "iana",
    extensions: [
      "jxsc"
    ]
  },
  "image/jxsi": {
    source: "iana",
    extensions: [
      "jxsi"
    ]
  },
  "image/jxss": {
    source: "iana",
    extensions: [
      "jxss"
    ]
  },
  "image/ktx": {
    source: "iana",
    extensions: [
      "ktx"
    ]
  },
  "image/ktx2": {
    source: "iana",
    extensions: [
      "ktx2"
    ]
  },
  "image/naplps": {
    source: "iana"
  },
  "image/pjpeg": {
    compressible: false
  },
  "image/png": {
    source: "iana",
    compressible: false,
    extensions: [
      "png"
    ]
  },
  "image/prs.btif": {
    source: "iana",
    extensions: [
      "btif"
    ]
  },
  "image/prs.pti": {
    source: "iana",
    extensions: [
      "pti"
    ]
  },
  "image/pwg-raster": {
    source: "iana"
  },
  "image/sgi": {
    source: "apache",
    extensions: [
      "sgi"
    ]
  },
  "image/svg+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "svg",
      "svgz"
    ]
  },
  "image/t38": {
    source: "iana",
    extensions: [
      "t38"
    ]
  },
  "image/tiff": {
    source: "iana",
    compressible: false,
    extensions: [
      "tif",
      "tiff"
    ]
  },
  "image/tiff-fx": {
    source: "iana",
    extensions: [
      "tfx"
    ]
  },
  "image/vnd.adobe.photoshop": {
    source: "iana",
    compressible: true,
    extensions: [
      "psd"
    ]
  },
  "image/vnd.airzip.accelerator.azv": {
    source: "iana",
    extensions: [
      "azv"
    ]
  },
  "image/vnd.cns.inf2": {
    source: "iana"
  },
  "image/vnd.dece.graphic": {
    source: "iana",
    extensions: [
      "uvi",
      "uvvi",
      "uvg",
      "uvvg"
    ]
  },
  "image/vnd.djvu": {
    source: "iana",
    extensions: [
      "djvu",
      "djv"
    ]
  },
  "image/vnd.dvb.subtitle": {
    source: "iana",
    extensions: [
      "sub"
    ]
  },
  "image/vnd.dwg": {
    source: "iana",
    extensions: [
      "dwg"
    ]
  },
  "image/vnd.dxf": {
    source: "iana",
    extensions: [
      "dxf"
    ]
  },
  "image/vnd.fastbidsheet": {
    source: "iana",
    extensions: [
      "fbs"
    ]
  },
  "image/vnd.fpx": {
    source: "iana",
    extensions: [
      "fpx"
    ]
  },
  "image/vnd.fst": {
    source: "iana",
    extensions: [
      "fst"
    ]
  },
  "image/vnd.fujixerox.edmics-mmr": {
    source: "iana",
    extensions: [
      "mmr"
    ]
  },
  "image/vnd.fujixerox.edmics-rlc": {
    source: "iana",
    extensions: [
      "rlc"
    ]
  },
  "image/vnd.globalgraphics.pgb": {
    source: "iana"
  },
  "image/vnd.microsoft.icon": {
    source: "iana",
    compressible: true,
    extensions: [
      "ico"
    ]
  },
  "image/vnd.mix": {
    source: "iana"
  },
  "image/vnd.mozilla.apng": {
    source: "iana"
  },
  "image/vnd.ms-dds": {
    compressible: true,
    extensions: [
      "dds"
    ]
  },
  "image/vnd.ms-modi": {
    source: "iana",
    extensions: [
      "mdi"
    ]
  },
  "image/vnd.ms-photo": {
    source: "apache",
    extensions: [
      "wdp"
    ]
  },
  "image/vnd.net-fpx": {
    source: "iana",
    extensions: [
      "npx"
    ]
  },
  "image/vnd.pco.b16": {
    source: "iana",
    extensions: [
      "b16"
    ]
  },
  "image/vnd.radiance": {
    source: "iana"
  },
  "image/vnd.sealed.png": {
    source: "iana"
  },
  "image/vnd.sealedmedia.softseal.gif": {
    source: "iana"
  },
  "image/vnd.sealedmedia.softseal.jpg": {
    source: "iana"
  },
  "image/vnd.svf": {
    source: "iana"
  },
  "image/vnd.tencent.tap": {
    source: "iana",
    extensions: [
      "tap"
    ]
  },
  "image/vnd.valve.source.texture": {
    source: "iana",
    extensions: [
      "vtf"
    ]
  },
  "image/vnd.wap.wbmp": {
    source: "iana",
    extensions: [
      "wbmp"
    ]
  },
  "image/vnd.xiff": {
    source: "iana",
    extensions: [
      "xif"
    ]
  },
  "image/vnd.zbrush.pcx": {
    source: "iana",
    extensions: [
      "pcx"
    ]
  },
  "image/webp": {
    source: "apache",
    extensions: [
      "webp"
    ]
  },
  "image/wmf": {
    source: "iana",
    extensions: [
      "wmf"
    ]
  },
  "image/x-3ds": {
    source: "apache",
    extensions: [
      "3ds"
    ]
  },
  "image/x-cmu-raster": {
    source: "apache",
    extensions: [
      "ras"
    ]
  },
  "image/x-cmx": {
    source: "apache",
    extensions: [
      "cmx"
    ]
  },
  "image/x-freehand": {
    source: "apache",
    extensions: [
      "fh",
      "fhc",
      "fh4",
      "fh5",
      "fh7"
    ]
  },
  "image/x-icon": {
    source: "apache",
    compressible: true,
    extensions: [
      "ico"
    ]
  },
  "image/x-jng": {
    source: "nginx",
    extensions: [
      "jng"
    ]
  },
  "image/x-mrsid-image": {
    source: "apache",
    extensions: [
      "sid"
    ]
  },
  "image/x-ms-bmp": {
    source: "nginx",
    compressible: true,
    extensions: [
      "bmp"
    ]
  },
  "image/x-pcx": {
    source: "apache",
    extensions: [
      "pcx"
    ]
  },
  "image/x-pict": {
    source: "apache",
    extensions: [
      "pic",
      "pct"
    ]
  },
  "image/x-portable-anymap": {
    source: "apache",
    extensions: [
      "pnm"
    ]
  },
  "image/x-portable-bitmap": {
    source: "apache",
    extensions: [
      "pbm"
    ]
  },
  "image/x-portable-graymap": {
    source: "apache",
    extensions: [
      "pgm"
    ]
  },
  "image/x-portable-pixmap": {
    source: "apache",
    extensions: [
      "ppm"
    ]
  },
  "image/x-rgb": {
    source: "apache",
    extensions: [
      "rgb"
    ]
  },
  "image/x-tga": {
    source: "apache",
    extensions: [
      "tga"
    ]
  },
  "image/x-xbitmap": {
    source: "apache",
    extensions: [
      "xbm"
    ]
  },
  "image/x-xcf": {
    compressible: false
  },
  "image/x-xpixmap": {
    source: "apache",
    extensions: [
      "xpm"
    ]
  },
  "image/x-xwindowdump": {
    source: "apache",
    extensions: [
      "xwd"
    ]
  },
  "message/cpim": {
    source: "iana"
  },
  "message/delivery-status": {
    source: "iana"
  },
  "message/disposition-notification": {
    source: "iana",
    extensions: [
      "disposition-notification"
    ]
  },
  "message/external-body": {
    source: "iana"
  },
  "message/feedback-report": {
    source: "iana"
  },
  "message/global": {
    source: "iana",
    extensions: [
      "u8msg"
    ]
  },
  "message/global-delivery-status": {
    source: "iana",
    extensions: [
      "u8dsn"
    ]
  },
  "message/global-disposition-notification": {
    source: "iana",
    extensions: [
      "u8mdn"
    ]
  },
  "message/global-headers": {
    source: "iana",
    extensions: [
      "u8hdr"
    ]
  },
  "message/http": {
    source: "iana",
    compressible: false
  },
  "message/imdn+xml": {
    source: "iana",
    compressible: true
  },
  "message/news": {
    source: "iana"
  },
  "message/partial": {
    source: "iana",
    compressible: false
  },
  "message/rfc822": {
    source: "iana",
    compressible: true,
    extensions: [
      "eml",
      "mime"
    ]
  },
  "message/s-http": {
    source: "iana"
  },
  "message/sip": {
    source: "iana"
  },
  "message/sipfrag": {
    source: "iana"
  },
  "message/tracking-status": {
    source: "iana"
  },
  "message/vnd.si.simp": {
    source: "iana"
  },
  "message/vnd.wfa.wsc": {
    source: "iana",
    extensions: [
      "wsc"
    ]
  },
  "model/3mf": {
    source: "iana",
    extensions: [
      "3mf"
    ]
  },
  "model/e57": {
    source: "iana"
  },
  "model/gltf+json": {
    source: "iana",
    compressible: true,
    extensions: [
      "gltf"
    ]
  },
  "model/gltf-binary": {
    source: "iana",
    compressible: true,
    extensions: [
      "glb"
    ]
  },
  "model/iges": {
    source: "iana",
    compressible: false,
    extensions: [
      "igs",
      "iges"
    ]
  },
  "model/mesh": {
    source: "iana",
    compressible: false,
    extensions: [
      "msh",
      "mesh",
      "silo"
    ]
  },
  "model/mtl": {
    source: "iana",
    extensions: [
      "mtl"
    ]
  },
  "model/obj": {
    source: "iana",
    extensions: [
      "obj"
    ]
  },
  "model/step": {
    source: "iana"
  },
  "model/step+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "stpx"
    ]
  },
  "model/step+zip": {
    source: "iana",
    compressible: false,
    extensions: [
      "stpz"
    ]
  },
  "model/step-xml+zip": {
    source: "iana",
    compressible: false,
    extensions: [
      "stpxz"
    ]
  },
  "model/stl": {
    source: "iana",
    extensions: [
      "stl"
    ]
  },
  "model/vnd.collada+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "dae"
    ]
  },
  "model/vnd.dwf": {
    source: "iana",
    extensions: [
      "dwf"
    ]
  },
  "model/vnd.flatland.3dml": {
    source: "iana"
  },
  "model/vnd.gdl": {
    source: "iana",
    extensions: [
      "gdl"
    ]
  },
  "model/vnd.gs-gdl": {
    source: "apache"
  },
  "model/vnd.gs.gdl": {
    source: "iana"
  },
  "model/vnd.gtw": {
    source: "iana",
    extensions: [
      "gtw"
    ]
  },
  "model/vnd.moml+xml": {
    source: "iana",
    compressible: true
  },
  "model/vnd.mts": {
    source: "iana",
    extensions: [
      "mts"
    ]
  },
  "model/vnd.opengex": {
    source: "iana",
    extensions: [
      "ogex"
    ]
  },
  "model/vnd.parasolid.transmit.binary": {
    source: "iana",
    extensions: [
      "x_b"
    ]
  },
  "model/vnd.parasolid.transmit.text": {
    source: "iana",
    extensions: [
      "x_t"
    ]
  },
  "model/vnd.pytha.pyox": {
    source: "iana"
  },
  "model/vnd.rosette.annotated-data-model": {
    source: "iana"
  },
  "model/vnd.sap.vds": {
    source: "iana",
    extensions: [
      "vds"
    ]
  },
  "model/vnd.usdz+zip": {
    source: "iana",
    compressible: false,
    extensions: [
      "usdz"
    ]
  },
  "model/vnd.valve.source.compiled-map": {
    source: "iana",
    extensions: [
      "bsp"
    ]
  },
  "model/vnd.vtu": {
    source: "iana",
    extensions: [
      "vtu"
    ]
  },
  "model/vrml": {
    source: "iana",
    compressible: false,
    extensions: [
      "wrl",
      "vrml"
    ]
  },
  "model/x3d+binary": {
    source: "apache",
    compressible: false,
    extensions: [
      "x3db",
      "x3dbz"
    ]
  },
  "model/x3d+fastinfoset": {
    source: "iana",
    extensions: [
      "x3db"
    ]
  },
  "model/x3d+vrml": {
    source: "apache",
    compressible: false,
    extensions: [
      "x3dv",
      "x3dvz"
    ]
  },
  "model/x3d+xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "x3d",
      "x3dz"
    ]
  },
  "model/x3d-vrml": {
    source: "iana",
    extensions: [
      "x3dv"
    ]
  },
  "multipart/alternative": {
    source: "iana",
    compressible: false
  },
  "multipart/appledouble": {
    source: "iana"
  },
  "multipart/byteranges": {
    source: "iana"
  },
  "multipart/digest": {
    source: "iana"
  },
  "multipart/encrypted": {
    source: "iana",
    compressible: false
  },
  "multipart/form-data": {
    source: "iana",
    compressible: false
  },
  "multipart/header-set": {
    source: "iana"
  },
  "multipart/mixed": {
    source: "iana"
  },
  "multipart/multilingual": {
    source: "iana"
  },
  "multipart/parallel": {
    source: "iana"
  },
  "multipart/related": {
    source: "iana",
    compressible: false
  },
  "multipart/report": {
    source: "iana"
  },
  "multipart/signed": {
    source: "iana",
    compressible: false
  },
  "multipart/vnd.bint.med-plus": {
    source: "iana"
  },
  "multipart/voice-message": {
    source: "iana"
  },
  "multipart/x-mixed-replace": {
    source: "iana"
  },
  "text/1d-interleaved-parityfec": {
    source: "iana"
  },
  "text/cache-manifest": {
    source: "iana",
    compressible: true,
    extensions: [
      "appcache",
      "manifest"
    ]
  },
  "text/calendar": {
    source: "iana",
    extensions: [
      "ics",
      "ifb"
    ]
  },
  "text/calender": {
    compressible: true
  },
  "text/cmd": {
    compressible: true
  },
  "text/coffeescript": {
    extensions: [
      "coffee",
      "litcoffee"
    ]
  },
  "text/cql": {
    source: "iana"
  },
  "text/cql-expression": {
    source: "iana"
  },
  "text/cql-identifier": {
    source: "iana"
  },
  "text/css": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: [
      "css"
    ]
  },
  "text/csv": {
    source: "iana",
    compressible: true,
    extensions: [
      "csv"
    ]
  },
  "text/csv-schema": {
    source: "iana"
  },
  "text/directory": {
    source: "iana"
  },
  "text/dns": {
    source: "iana"
  },
  "text/ecmascript": {
    source: "iana"
  },
  "text/encaprtp": {
    source: "iana"
  },
  "text/enriched": {
    source: "iana"
  },
  "text/fhirpath": {
    source: "iana"
  },
  "text/flexfec": {
    source: "iana"
  },
  "text/fwdred": {
    source: "iana"
  },
  "text/gff3": {
    source: "iana"
  },
  "text/grammar-ref-list": {
    source: "iana"
  },
  "text/html": {
    source: "iana",
    compressible: true,
    extensions: [
      "html",
      "htm",
      "shtml"
    ]
  },
  "text/jade": {
    extensions: [
      "jade"
    ]
  },
  "text/javascript": {
    source: "iana",
    compressible: true
  },
  "text/jcr-cnd": {
    source: "iana"
  },
  "text/jsx": {
    compressible: true,
    extensions: [
      "jsx"
    ]
  },
  "text/less": {
    compressible: true,
    extensions: [
      "less"
    ]
  },
  "text/markdown": {
    source: "iana",
    compressible: true,
    extensions: [
      "markdown",
      "md"
    ]
  },
  "text/mathml": {
    source: "nginx",
    extensions: [
      "mml"
    ]
  },
  "text/mdx": {
    compressible: true,
    extensions: [
      "mdx"
    ]
  },
  "text/mizar": {
    source: "iana"
  },
  "text/n3": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: [
      "n3"
    ]
  },
  "text/parameters": {
    source: "iana",
    charset: "UTF-8"
  },
  "text/parityfec": {
    source: "iana"
  },
  "text/plain": {
    source: "iana",
    compressible: true,
    extensions: [
      "txt",
      "text",
      "conf",
      "def",
      "list",
      "log",
      "in",
      "ini"
    ]
  },
  "text/provenance-notation": {
    source: "iana",
    charset: "UTF-8"
  },
  "text/prs.fallenstein.rst": {
    source: "iana"
  },
  "text/prs.lines.tag": {
    source: "iana",
    extensions: [
      "dsc"
    ]
  },
  "text/prs.prop.logic": {
    source: "iana"
  },
  "text/raptorfec": {
    source: "iana"
  },
  "text/red": {
    source: "iana"
  },
  "text/rfc822-headers": {
    source: "iana"
  },
  "text/richtext": {
    source: "iana",
    compressible: true,
    extensions: [
      "rtx"
    ]
  },
  "text/rtf": {
    source: "iana",
    compressible: true,
    extensions: [
      "rtf"
    ]
  },
  "text/rtp-enc-aescm128": {
    source: "iana"
  },
  "text/rtploopback": {
    source: "iana"
  },
  "text/rtx": {
    source: "iana"
  },
  "text/sgml": {
    source: "iana",
    extensions: [
      "sgml",
      "sgm"
    ]
  },
  "text/shaclc": {
    source: "iana"
  },
  "text/shex": {
    source: "iana",
    extensions: [
      "shex"
    ]
  },
  "text/slim": {
    extensions: [
      "slim",
      "slm"
    ]
  },
  "text/spdx": {
    source: "iana",
    extensions: [
      "spdx"
    ]
  },
  "text/strings": {
    source: "iana"
  },
  "text/stylus": {
    extensions: [
      "stylus",
      "styl"
    ]
  },
  "text/t140": {
    source: "iana"
  },
  "text/tab-separated-values": {
    source: "iana",
    compressible: true,
    extensions: [
      "tsv"
    ]
  },
  "text/troff": {
    source: "iana",
    extensions: [
      "t",
      "tr",
      "roff",
      "man",
      "me",
      "ms"
    ]
  },
  "text/turtle": {
    source: "iana",
    charset: "UTF-8",
    extensions: [
      "ttl"
    ]
  },
  "text/ulpfec": {
    source: "iana"
  },
  "text/uri-list": {
    source: "iana",
    compressible: true,
    extensions: [
      "uri",
      "uris",
      "urls"
    ]
  },
  "text/vcard": {
    source: "iana",
    compressible: true,
    extensions: [
      "vcard"
    ]
  },
  "text/vnd.a": {
    source: "iana"
  },
  "text/vnd.abc": {
    source: "iana"
  },
  "text/vnd.ascii-art": {
    source: "iana"
  },
  "text/vnd.curl": {
    source: "iana",
    extensions: [
      "curl"
    ]
  },
  "text/vnd.curl.dcurl": {
    source: "apache",
    extensions: [
      "dcurl"
    ]
  },
  "text/vnd.curl.mcurl": {
    source: "apache",
    extensions: [
      "mcurl"
    ]
  },
  "text/vnd.curl.scurl": {
    source: "apache",
    extensions: [
      "scurl"
    ]
  },
  "text/vnd.debian.copyright": {
    source: "iana",
    charset: "UTF-8"
  },
  "text/vnd.dmclientscript": {
    source: "iana"
  },
  "text/vnd.dvb.subtitle": {
    source: "iana",
    extensions: [
      "sub"
    ]
  },
  "text/vnd.esmertec.theme-descriptor": {
    source: "iana",
    charset: "UTF-8"
  },
  "text/vnd.familysearch.gedcom": {
    source: "iana",
    extensions: [
      "ged"
    ]
  },
  "text/vnd.ficlab.flt": {
    source: "iana"
  },
  "text/vnd.fly": {
    source: "iana",
    extensions: [
      "fly"
    ]
  },
  "text/vnd.fmi.flexstor": {
    source: "iana",
    extensions: [
      "flx"
    ]
  },
  "text/vnd.gml": {
    source: "iana"
  },
  "text/vnd.graphviz": {
    source: "iana",
    extensions: [
      "gv"
    ]
  },
  "text/vnd.hans": {
    source: "iana"
  },
  "text/vnd.hgl": {
    source: "iana"
  },
  "text/vnd.in3d.3dml": {
    source: "iana",
    extensions: [
      "3dml"
    ]
  },
  "text/vnd.in3d.spot": {
    source: "iana",
    extensions: [
      "spot"
    ]
  },
  "text/vnd.iptc.newsml": {
    source: "iana"
  },
  "text/vnd.iptc.nitf": {
    source: "iana"
  },
  "text/vnd.latex-z": {
    source: "iana"
  },
  "text/vnd.motorola.reflex": {
    source: "iana"
  },
  "text/vnd.ms-mediapackage": {
    source: "iana"
  },
  "text/vnd.net2phone.commcenter.command": {
    source: "iana"
  },
  "text/vnd.radisys.msml-basic-layout": {
    source: "iana"
  },
  "text/vnd.senx.warpscript": {
    source: "iana"
  },
  "text/vnd.si.uricatalogue": {
    source: "iana"
  },
  "text/vnd.sosi": {
    source: "iana"
  },
  "text/vnd.sun.j2me.app-descriptor": {
    source: "iana",
    charset: "UTF-8",
    extensions: [
      "jad"
    ]
  },
  "text/vnd.trolltech.linguist": {
    source: "iana",
    charset: "UTF-8"
  },
  "text/vnd.wap.si": {
    source: "iana"
  },
  "text/vnd.wap.sl": {
    source: "iana"
  },
  "text/vnd.wap.wml": {
    source: "iana",
    extensions: [
      "wml"
    ]
  },
  "text/vnd.wap.wmlscript": {
    source: "iana",
    extensions: [
      "wmls"
    ]
  },
  "text/vtt": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: [
      "vtt"
    ]
  },
  "text/x-asm": {
    source: "apache",
    extensions: [
      "s",
      "asm"
    ]
  },
  "text/x-c": {
    source: "apache",
    extensions: [
      "c",
      "cc",
      "cxx",
      "cpp",
      "h",
      "hh",
      "dic"
    ]
  },
  "text/x-component": {
    source: "nginx",
    extensions: [
      "htc"
    ]
  },
  "text/x-fortran": {
    source: "apache",
    extensions: [
      "f",
      "for",
      "f77",
      "f90"
    ]
  },
  "text/x-gwt-rpc": {
    compressible: true
  },
  "text/x-handlebars-template": {
    extensions: [
      "hbs"
    ]
  },
  "text/x-java-source": {
    source: "apache",
    extensions: [
      "java"
    ]
  },
  "text/x-jquery-tmpl": {
    compressible: true
  },
  "text/x-lua": {
    extensions: [
      "lua"
    ]
  },
  "text/x-markdown": {
    compressible: true,
    extensions: [
      "mkd"
    ]
  },
  "text/x-nfo": {
    source: "apache",
    extensions: [
      "nfo"
    ]
  },
  "text/x-opml": {
    source: "apache",
    extensions: [
      "opml"
    ]
  },
  "text/x-org": {
    compressible: true,
    extensions: [
      "org"
    ]
  },
  "text/x-pascal": {
    source: "apache",
    extensions: [
      "p",
      "pas"
    ]
  },
  "text/x-processing": {
    compressible: true,
    extensions: [
      "pde"
    ]
  },
  "text/x-sass": {
    extensions: [
      "sass"
    ]
  },
  "text/x-scss": {
    extensions: [
      "scss"
    ]
  },
  "text/x-setext": {
    source: "apache",
    extensions: [
      "etx"
    ]
  },
  "text/x-sfv": {
    source: "apache",
    extensions: [
      "sfv"
    ]
  },
  "text/x-suse-ymp": {
    compressible: true,
    extensions: [
      "ymp"
    ]
  },
  "text/x-uuencode": {
    source: "apache",
    extensions: [
      "uu"
    ]
  },
  "text/x-vcalendar": {
    source: "apache",
    extensions: [
      "vcs"
    ]
  },
  "text/x-vcard": {
    source: "apache",
    extensions: [
      "vcf"
    ]
  },
  "text/xml": {
    source: "iana",
    compressible: true,
    extensions: [
      "xml"
    ]
  },
  "text/xml-external-parsed-entity": {
    source: "iana"
  },
  "text/yaml": {
    compressible: true,
    extensions: [
      "yaml",
      "yml"
    ]
  },
  "video/1d-interleaved-parityfec": {
    source: "iana"
  },
  "video/3gpp": {
    source: "iana",
    extensions: [
      "3gp",
      "3gpp"
    ]
  },
  "video/3gpp-tt": {
    source: "iana"
  },
  "video/3gpp2": {
    source: "iana",
    extensions: [
      "3g2"
    ]
  },
  "video/av1": {
    source: "iana"
  },
  "video/bmpeg": {
    source: "iana"
  },
  "video/bt656": {
    source: "iana"
  },
  "video/celb": {
    source: "iana"
  },
  "video/dv": {
    source: "iana"
  },
  "video/encaprtp": {
    source: "iana"
  },
  "video/ffv1": {
    source: "iana"
  },
  "video/flexfec": {
    source: "iana"
  },
  "video/h261": {
    source: "iana",
    extensions: [
      "h261"
    ]
  },
  "video/h263": {
    source: "iana",
    extensions: [
      "h263"
    ]
  },
  "video/h263-1998": {
    source: "iana"
  },
  "video/h263-2000": {
    source: "iana"
  },
  "video/h264": {
    source: "iana",
    extensions: [
      "h264"
    ]
  },
  "video/h264-rcdo": {
    source: "iana"
  },
  "video/h264-svc": {
    source: "iana"
  },
  "video/h265": {
    source: "iana"
  },
  "video/iso.segment": {
    source: "iana",
    extensions: [
      "m4s"
    ]
  },
  "video/jpeg": {
    source: "iana",
    extensions: [
      "jpgv"
    ]
  },
  "video/jpeg2000": {
    source: "iana"
  },
  "video/jpm": {
    source: "apache",
    extensions: [
      "jpm",
      "jpgm"
    ]
  },
  "video/jxsv": {
    source: "iana"
  },
  "video/mj2": {
    source: "iana",
    extensions: [
      "mj2",
      "mjp2"
    ]
  },
  "video/mp1s": {
    source: "iana"
  },
  "video/mp2p": {
    source: "iana"
  },
  "video/mp2t": {
    source: "iana",
    extensions: [
      "ts"
    ]
  },
  "video/mp4": {
    source: "iana",
    compressible: false,
    extensions: [
      "mp4",
      "mp4v",
      "mpg4"
    ]
  },
  "video/mp4v-es": {
    source: "iana"
  },
  "video/mpeg": {
    source: "iana",
    compressible: false,
    extensions: [
      "mpeg",
      "mpg",
      "mpe",
      "m1v",
      "m2v"
    ]
  },
  "video/mpeg4-generic": {
    source: "iana"
  },
  "video/mpv": {
    source: "iana"
  },
  "video/nv": {
    source: "iana"
  },
  "video/ogg": {
    source: "iana",
    compressible: false,
    extensions: [
      "ogv"
    ]
  },
  "video/parityfec": {
    source: "iana"
  },
  "video/pointer": {
    source: "iana"
  },
  "video/quicktime": {
    source: "iana",
    compressible: false,
    extensions: [
      "qt",
      "mov"
    ]
  },
  "video/raptorfec": {
    source: "iana"
  },
  "video/raw": {
    source: "iana"
  },
  "video/rtp-enc-aescm128": {
    source: "iana"
  },
  "video/rtploopback": {
    source: "iana"
  },
  "video/rtx": {
    source: "iana"
  },
  "video/scip": {
    source: "iana"
  },
  "video/smpte291": {
    source: "iana"
  },
  "video/smpte292m": {
    source: "iana"
  },
  "video/ulpfec": {
    source: "iana"
  },
  "video/vc1": {
    source: "iana"
  },
  "video/vc2": {
    source: "iana"
  },
  "video/vnd.cctv": {
    source: "iana"
  },
  "video/vnd.dece.hd": {
    source: "iana",
    extensions: [
      "uvh",
      "uvvh"
    ]
  },
  "video/vnd.dece.mobile": {
    source: "iana",
    extensions: [
      "uvm",
      "uvvm"
    ]
  },
  "video/vnd.dece.mp4": {
    source: "iana"
  },
  "video/vnd.dece.pd": {
    source: "iana",
    extensions: [
      "uvp",
      "uvvp"
    ]
  },
  "video/vnd.dece.sd": {
    source: "iana",
    extensions: [
      "uvs",
      "uvvs"
    ]
  },
  "video/vnd.dece.video": {
    source: "iana",
    extensions: [
      "uvv",
      "uvvv"
    ]
  },
  "video/vnd.directv.mpeg": {
    source: "iana"
  },
  "video/vnd.directv.mpeg-tts": {
    source: "iana"
  },
  "video/vnd.dlna.mpeg-tts": {
    source: "iana"
  },
  "video/vnd.dvb.file": {
    source: "iana",
    extensions: [
      "dvb"
    ]
  },
  "video/vnd.fvt": {
    source: "iana",
    extensions: [
      "fvt"
    ]
  },
  "video/vnd.hns.video": {
    source: "iana"
  },
  "video/vnd.iptvforum.1dparityfec-1010": {
    source: "iana"
  },
  "video/vnd.iptvforum.1dparityfec-2005": {
    source: "iana"
  },
  "video/vnd.iptvforum.2dparityfec-1010": {
    source: "iana"
  },
  "video/vnd.iptvforum.2dparityfec-2005": {
    source: "iana"
  },
  "video/vnd.iptvforum.ttsavc": {
    source: "iana"
  },
  "video/vnd.iptvforum.ttsmpeg2": {
    source: "iana"
  },
  "video/vnd.motorola.video": {
    source: "iana"
  },
  "video/vnd.motorola.videop": {
    source: "iana"
  },
  "video/vnd.mpegurl": {
    source: "iana",
    extensions: [
      "mxu",
      "m4u"
    ]
  },
  "video/vnd.ms-playready.media.pyv": {
    source: "iana",
    extensions: [
      "pyv"
    ]
  },
  "video/vnd.nokia.interleaved-multimedia": {
    source: "iana"
  },
  "video/vnd.nokia.mp4vr": {
    source: "iana"
  },
  "video/vnd.nokia.videovoip": {
    source: "iana"
  },
  "video/vnd.objectvideo": {
    source: "iana"
  },
  "video/vnd.radgamettools.bink": {
    source: "iana"
  },
  "video/vnd.radgamettools.smacker": {
    source: "iana"
  },
  "video/vnd.sealed.mpeg1": {
    source: "iana"
  },
  "video/vnd.sealed.mpeg4": {
    source: "iana"
  },
  "video/vnd.sealed.swf": {
    source: "iana"
  },
  "video/vnd.sealedmedia.softseal.mov": {
    source: "iana"
  },
  "video/vnd.uvvu.mp4": {
    source: "iana",
    extensions: [
      "uvu",
      "uvvu"
    ]
  },
  "video/vnd.vivo": {
    source: "iana",
    extensions: [
      "viv"
    ]
  },
  "video/vnd.youtube.yt": {
    source: "iana"
  },
  "video/vp8": {
    source: "iana"
  },
  "video/vp9": {
    source: "iana"
  },
  "video/webm": {
    source: "apache",
    compressible: false,
    extensions: [
      "webm"
    ]
  },
  "video/x-f4v": {
    source: "apache",
    extensions: [
      "f4v"
    ]
  },
  "video/x-fli": {
    source: "apache",
    extensions: [
      "fli"
    ]
  },
  "video/x-flv": {
    source: "apache",
    compressible: false,
    extensions: [
      "flv"
    ]
  },
  "video/x-m4v": {
    source: "apache",
    extensions: [
      "m4v"
    ]
  },
  "video/x-matroska": {
    source: "apache",
    compressible: false,
    extensions: [
      "mkv",
      "mk3d",
      "mks"
    ]
  },
  "video/x-mng": {
    source: "apache",
    extensions: [
      "mng"
    ]
  },
  "video/x-ms-asf": {
    source: "apache",
    extensions: [
      "asf",
      "asx"
    ]
  },
  "video/x-ms-vob": {
    source: "apache",
    extensions: [
      "vob"
    ]
  },
  "video/x-ms-wm": {
    source: "apache",
    extensions: [
      "wm"
    ]
  },
  "video/x-ms-wmv": {
    source: "apache",
    compressible: false,
    extensions: [
      "wmv"
    ]
  },
  "video/x-ms-wmx": {
    source: "apache",
    extensions: [
      "wmx"
    ]
  },
  "video/x-ms-wvx": {
    source: "apache",
    extensions: [
      "wvx"
    ]
  },
  "video/x-msvideo": {
    source: "apache",
    extensions: [
      "avi"
    ]
  },
  "video/x-sgi-movie": {
    source: "apache",
    extensions: [
      "movie"
    ]
  },
  "video/x-smv": {
    source: "apache",
    extensions: [
      "smv"
    ]
  },
  "x-conference/x-cooltalk": {
    source: "apache",
    extensions: [
      "ice"
    ]
  },
  "x-shader/x-fragment": {
    compressible: true
  },
  "x-shader/x-vertex": {
    compressible: true
  }
};
/*!
 * mime-db
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015-2022 Douglas Christopher Wilson
 * MIT Licensed
 */
var mimeDb = require$$0;
/*!
 * mime-types
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
(function(exports$1) {
  var db = mimeDb;
  var extname = path$1.extname;
  var EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/;
  var TEXT_TYPE_REGEXP = /^text\//i;
  exports$1.charset = charset;
  exports$1.charsets = { lookup: charset };
  exports$1.contentType = contentType;
  exports$1.extension = extension;
  exports$1.extensions = /* @__PURE__ */ Object.create(null);
  exports$1.lookup = lookup;
  exports$1.types = /* @__PURE__ */ Object.create(null);
  populateMaps(exports$1.extensions, exports$1.types);
  function charset(type2) {
    if (!type2 || typeof type2 !== "string") {
      return false;
    }
    var match = EXTRACT_TYPE_REGEXP.exec(type2);
    var mime2 = match && db[match[1].toLowerCase()];
    if (mime2 && mime2.charset) {
      return mime2.charset;
    }
    if (match && TEXT_TYPE_REGEXP.test(match[1])) {
      return "UTF-8";
    }
    return false;
  }
  function contentType(str) {
    if (!str || typeof str !== "string") {
      return false;
    }
    var mime2 = str.indexOf("/") === -1 ? exports$1.lookup(str) : str;
    if (!mime2) {
      return false;
    }
    if (mime2.indexOf("charset") === -1) {
      var charset2 = exports$1.charset(mime2);
      if (charset2) mime2 += "; charset=" + charset2.toLowerCase();
    }
    return mime2;
  }
  function extension(type2) {
    if (!type2 || typeof type2 !== "string") {
      return false;
    }
    var match = EXTRACT_TYPE_REGEXP.exec(type2);
    var exts = match && exports$1.extensions[match[1].toLowerCase()];
    if (!exts || !exts.length) {
      return false;
    }
    return exts[0];
  }
  function lookup(path2) {
    if (!path2 || typeof path2 !== "string") {
      return false;
    }
    var extension2 = extname("x." + path2).toLowerCase().substr(1);
    if (!extension2) {
      return false;
    }
    return exports$1.types[extension2] || false;
  }
  function populateMaps(extensions, types) {
    var preference = ["nginx", "apache", void 0, "iana"];
    Object.keys(db).forEach(function forEachMimeType(type2) {
      var mime2 = db[type2];
      var exts = mime2.extensions;
      if (!exts || !exts.length) {
        return;
      }
      extensions[type2] = exts;
      for (var i = 0; i < exts.length; i++) {
        var extension2 = exts[i];
        if (types[extension2]) {
          var from = preference.indexOf(db[types[extension2]].source);
          var to = preference.indexOf(mime2.source);
          if (types[extension2] !== "application/octet-stream" && (from > to || from === to && types[extension2].substr(0, 12) === "application/")) {
            continue;
          }
        }
        types[extension2] = type2;
      }
    });
  }
})(mimeTypes);
var defer_1 = defer$1;
function defer$1(fn) {
  var nextTick = typeof setImmediate == "function" ? setImmediate : typeof process == "object" && typeof process.nextTick == "function" ? process.nextTick : null;
  if (nextTick) {
    nextTick(fn);
  } else {
    setTimeout(fn, 0);
  }
}
var defer = defer_1;
var async_1 = async$2;
function async$2(callback) {
  var isAsync = false;
  defer(function() {
    isAsync = true;
  });
  return function async_callback(err, result) {
    if (isAsync) {
      callback(err, result);
    } else {
      defer(function nextTick_callback() {
        callback(err, result);
      });
    }
  };
}
var abort_1 = abort$2;
function abort$2(state2) {
  Object.keys(state2.jobs).forEach(clean.bind(state2));
  state2.jobs = {};
}
function clean(key) {
  if (typeof this.jobs[key] == "function") {
    this.jobs[key]();
  }
}
var async$1 = async_1, abort$1 = abort_1;
var iterate_1 = iterate$2;
function iterate$2(list, iterator2, state2, callback) {
  var key = state2["keyedList"] ? state2["keyedList"][state2.index] : state2.index;
  state2.jobs[key] = runJob(iterator2, key, list[key], function(error, output) {
    if (!(key in state2.jobs)) {
      return;
    }
    delete state2.jobs[key];
    if (error) {
      abort$1(state2);
    } else {
      state2.results[key] = output;
    }
    callback(error, state2.results);
  });
}
function runJob(iterator2, key, item, callback) {
  var aborter;
  if (iterator2.length == 2) {
    aborter = iterator2(item, async$1(callback));
  } else {
    aborter = iterator2(item, key, async$1(callback));
  }
  return aborter;
}
var state_1 = state;
function state(list, sortMethod) {
  var isNamedList = !Array.isArray(list), initState2 = {
    index: 0,
    keyedList: isNamedList || sortMethod ? Object.keys(list) : null,
    jobs: {},
    results: isNamedList ? {} : [],
    size: isNamedList ? Object.keys(list).length : list.length
  };
  if (sortMethod) {
    initState2.keyedList.sort(isNamedList ? sortMethod : function(a, b) {
      return sortMethod(list[a], list[b]);
    });
  }
  return initState2;
}
var abort = abort_1, async = async_1;
var terminator_1 = terminator$2;
function terminator$2(callback) {
  if (!Object.keys(this.jobs).length) {
    return;
  }
  this.index = this.size;
  abort(this);
  async(callback)(null, this.results);
}
var iterate$1 = iterate_1, initState$1 = state_1, terminator$1 = terminator_1;
var parallel_1 = parallel;
function parallel(list, iterator2, callback) {
  var state2 = initState$1(list);
  while (state2.index < (state2["keyedList"] || list).length) {
    iterate$1(list, iterator2, state2, function(error, result) {
      if (error) {
        callback(error, result);
        return;
      }
      if (Object.keys(state2.jobs).length === 0) {
        callback(null, state2.results);
        return;
      }
    });
    state2.index++;
  }
  return terminator$1.bind(state2, callback);
}
var serialOrdered$2 = { exports: {} };
var iterate = iterate_1, initState = state_1, terminator = terminator_1;
serialOrdered$2.exports = serialOrdered$1;
serialOrdered$2.exports.ascending = ascending;
serialOrdered$2.exports.descending = descending;
function serialOrdered$1(list, iterator2, sortMethod, callback) {
  var state2 = initState(list, sortMethod);
  iterate(list, iterator2, state2, function iteratorHandler(error, result) {
    if (error) {
      callback(error, result);
      return;
    }
    state2.index++;
    if (state2.index < (state2["keyedList"] || list).length) {
      iterate(list, iterator2, state2, iteratorHandler);
      return;
    }
    callback(null, state2.results);
  });
  return terminator.bind(state2, callback);
}
function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}
function descending(a, b) {
  return -1 * ascending(a, b);
}
var serialOrderedExports = serialOrdered$2.exports;
var serialOrdered = serialOrderedExports;
var serial_1 = serial;
function serial(list, iterator2, callback) {
  return serialOrdered(list, iterator2, null, callback);
}
var asynckit$1 = {
  parallel: parallel_1,
  serial: serial_1,
  serialOrdered: serialOrderedExports
};
var esObjectAtoms = Object;
var esErrors = Error;
var _eval = EvalError;
var range = RangeError;
var ref = ReferenceError;
var syntax = SyntaxError;
var type = TypeError;
var uri = URIError;
var abs$1 = Math.abs;
var floor$1 = Math.floor;
var max$2 = Math.max;
var min$1 = Math.min;
var pow$1 = Math.pow;
var round$1 = Math.round;
var _isNaN = Number.isNaN || function isNaN2(a) {
  return a !== a;
};
var $isNaN = _isNaN;
var sign$1 = function sign(number) {
  if ($isNaN(number) || number === 0) {
    return number;
  }
  return number < 0 ? -1 : 1;
};
var gOPD = Object.getOwnPropertyDescriptor;
var $gOPD$1 = gOPD;
if ($gOPD$1) {
  try {
    $gOPD$1([], "length");
  } catch (e) {
    $gOPD$1 = null;
  }
}
var gopd = $gOPD$1;
var $defineProperty$2 = Object.defineProperty || false;
if ($defineProperty$2) {
  try {
    $defineProperty$2({}, "a", { value: 1 });
  } catch (e) {
    $defineProperty$2 = false;
  }
}
var esDefineProperty = $defineProperty$2;
var shams$1;
var hasRequiredShams$1;
function requireShams$1() {
  if (hasRequiredShams$1) return shams$1;
  hasRequiredShams$1 = 1;
  shams$1 = function hasSymbols2() {
    if (typeof Symbol !== "function" || typeof Object.getOwnPropertySymbols !== "function") {
      return false;
    }
    if (typeof Symbol.iterator === "symbol") {
      return true;
    }
    var obj = {};
    var sym = Symbol("test");
    var symObj = Object(sym);
    if (typeof sym === "string") {
      return false;
    }
    if (Object.prototype.toString.call(sym) !== "[object Symbol]") {
      return false;
    }
    if (Object.prototype.toString.call(symObj) !== "[object Symbol]") {
      return false;
    }
    var symVal = 42;
    obj[sym] = symVal;
    for (var _ in obj) {
      return false;
    }
    if (typeof Object.keys === "function" && Object.keys(obj).length !== 0) {
      return false;
    }
    if (typeof Object.getOwnPropertyNames === "function" && Object.getOwnPropertyNames(obj).length !== 0) {
      return false;
    }
    var syms = Object.getOwnPropertySymbols(obj);
    if (syms.length !== 1 || syms[0] !== sym) {
      return false;
    }
    if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) {
      return false;
    }
    if (typeof Object.getOwnPropertyDescriptor === "function") {
      var descriptor = (
        /** @type {PropertyDescriptor} */
        Object.getOwnPropertyDescriptor(obj, sym)
      );
      if (descriptor.value !== symVal || descriptor.enumerable !== true) {
        return false;
      }
    }
    return true;
  };
  return shams$1;
}
var hasSymbols$1;
var hasRequiredHasSymbols;
function requireHasSymbols() {
  if (hasRequiredHasSymbols) return hasSymbols$1;
  hasRequiredHasSymbols = 1;
  var origSymbol = typeof Symbol !== "undefined" && Symbol;
  var hasSymbolSham = requireShams$1();
  hasSymbols$1 = function hasNativeSymbols() {
    if (typeof origSymbol !== "function") {
      return false;
    }
    if (typeof Symbol !== "function") {
      return false;
    }
    if (typeof origSymbol("foo") !== "symbol") {
      return false;
    }
    if (typeof Symbol("bar") !== "symbol") {
      return false;
    }
    return hasSymbolSham();
  };
  return hasSymbols$1;
}
var Reflect_getPrototypeOf;
var hasRequiredReflect_getPrototypeOf;
function requireReflect_getPrototypeOf() {
  if (hasRequiredReflect_getPrototypeOf) return Reflect_getPrototypeOf;
  hasRequiredReflect_getPrototypeOf = 1;
  Reflect_getPrototypeOf = typeof Reflect !== "undefined" && Reflect.getPrototypeOf || null;
  return Reflect_getPrototypeOf;
}
var Object_getPrototypeOf;
var hasRequiredObject_getPrototypeOf;
function requireObject_getPrototypeOf() {
  if (hasRequiredObject_getPrototypeOf) return Object_getPrototypeOf;
  hasRequiredObject_getPrototypeOf = 1;
  var $Object2 = esObjectAtoms;
  Object_getPrototypeOf = $Object2.getPrototypeOf || null;
  return Object_getPrototypeOf;
}
var ERROR_MESSAGE = "Function.prototype.bind called on incompatible ";
var toStr = Object.prototype.toString;
var max$1 = Math.max;
var funcType = "[object Function]";
var concatty = function concatty2(a, b) {
  var arr = [];
  for (var i = 0; i < a.length; i += 1) {
    arr[i] = a[i];
  }
  for (var j = 0; j < b.length; j += 1) {
    arr[j + a.length] = b[j];
  }
  return arr;
};
var slicy = function slicy2(arrLike, offset) {
  var arr = [];
  for (var i = offset, j = 0; i < arrLike.length; i += 1, j += 1) {
    arr[j] = arrLike[i];
  }
  return arr;
};
var joiny = function(arr, joiner) {
  var str = "";
  for (var i = 0; i < arr.length; i += 1) {
    str += arr[i];
    if (i + 1 < arr.length) {
      str += joiner;
    }
  }
  return str;
};
var implementation$1 = function bind(that) {
  var target = this;
  if (typeof target !== "function" || toStr.apply(target) !== funcType) {
    throw new TypeError(ERROR_MESSAGE + target);
  }
  var args = slicy(arguments, 1);
  var bound;
  var binder = function() {
    if (this instanceof bound) {
      var result = target.apply(
        this,
        concatty(args, arguments)
      );
      if (Object(result) === result) {
        return result;
      }
      return this;
    }
    return target.apply(
      that,
      concatty(args, arguments)
    );
  };
  var boundLength = max$1(0, target.length - args.length);
  var boundArgs = [];
  for (var i = 0; i < boundLength; i++) {
    boundArgs[i] = "$" + i;
  }
  bound = Function("binder", "return function (" + joiny(boundArgs, ",") + "){ return binder.apply(this,arguments); }")(binder);
  if (target.prototype) {
    var Empty = function Empty2() {
    };
    Empty.prototype = target.prototype;
    bound.prototype = new Empty();
    Empty.prototype = null;
  }
  return bound;
};
var implementation = implementation$1;
var functionBind = Function.prototype.bind || implementation;
var functionCall;
var hasRequiredFunctionCall;
function requireFunctionCall() {
  if (hasRequiredFunctionCall) return functionCall;
  hasRequiredFunctionCall = 1;
  functionCall = Function.prototype.call;
  return functionCall;
}
var functionApply;
var hasRequiredFunctionApply;
function requireFunctionApply() {
  if (hasRequiredFunctionApply) return functionApply;
  hasRequiredFunctionApply = 1;
  functionApply = Function.prototype.apply;
  return functionApply;
}
var reflectApply;
var hasRequiredReflectApply;
function requireReflectApply() {
  if (hasRequiredReflectApply) return reflectApply;
  hasRequiredReflectApply = 1;
  reflectApply = typeof Reflect !== "undefined" && Reflect && Reflect.apply;
  return reflectApply;
}
var actualApply;
var hasRequiredActualApply;
function requireActualApply() {
  if (hasRequiredActualApply) return actualApply;
  hasRequiredActualApply = 1;
  var bind3 = functionBind;
  var $apply2 = requireFunctionApply();
  var $call2 = requireFunctionCall();
  var $reflectApply = requireReflectApply();
  actualApply = $reflectApply || bind3.call($call2, $apply2);
  return actualApply;
}
var callBindApplyHelpers;
var hasRequiredCallBindApplyHelpers;
function requireCallBindApplyHelpers() {
  if (hasRequiredCallBindApplyHelpers) return callBindApplyHelpers;
  hasRequiredCallBindApplyHelpers = 1;
  var bind3 = functionBind;
  var $TypeError2 = type;
  var $call2 = requireFunctionCall();
  var $actualApply = requireActualApply();
  callBindApplyHelpers = function callBindBasic(args) {
    if (args.length < 1 || typeof args[0] !== "function") {
      throw new $TypeError2("a function is required");
    }
    return $actualApply(bind3, $call2, args);
  };
  return callBindApplyHelpers;
}
var get;
var hasRequiredGet;
function requireGet() {
  if (hasRequiredGet) return get;
  hasRequiredGet = 1;
  var callBind = requireCallBindApplyHelpers();
  var gOPD2 = gopd;
  var hasProtoAccessor;
  try {
    hasProtoAccessor = /** @type {{ __proto__?: typeof Array.prototype }} */
    [].__proto__ === Array.prototype;
  } catch (e) {
    if (!e || typeof e !== "object" || !("code" in e) || e.code !== "ERR_PROTO_ACCESS") {
      throw e;
    }
  }
  var desc = !!hasProtoAccessor && gOPD2 && gOPD2(
    Object.prototype,
    /** @type {keyof typeof Object.prototype} */
    "__proto__"
  );
  var $Object2 = Object;
  var $getPrototypeOf = $Object2.getPrototypeOf;
  get = desc && typeof desc.get === "function" ? callBind([desc.get]) : typeof $getPrototypeOf === "function" ? (
    /** @type {import('./get')} */
    function getDunder(value) {
      return $getPrototypeOf(value == null ? value : $Object2(value));
    }
  ) : false;
  return get;
}
var getProto$1;
var hasRequiredGetProto;
function requireGetProto() {
  if (hasRequiredGetProto) return getProto$1;
  hasRequiredGetProto = 1;
  var reflectGetProto = requireReflect_getPrototypeOf();
  var originalGetProto = requireObject_getPrototypeOf();
  var getDunderProto = requireGet();
  getProto$1 = reflectGetProto ? function getProto2(O) {
    return reflectGetProto(O);
  } : originalGetProto ? function getProto2(O) {
    if (!O || typeof O !== "object" && typeof O !== "function") {
      throw new TypeError("getProto: not an object");
    }
    return originalGetProto(O);
  } : getDunderProto ? function getProto2(O) {
    return getDunderProto(O);
  } : null;
  return getProto$1;
}
var call = Function.prototype.call;
var $hasOwn = Object.prototype.hasOwnProperty;
var bind$1 = functionBind;
var hasown = bind$1.call(call, $hasOwn);
var undefined$1;
var $Object = esObjectAtoms;
var $Error = esErrors;
var $EvalError = _eval;
var $RangeError = range;
var $ReferenceError = ref;
var $SyntaxError = syntax;
var $TypeError$1 = type;
var $URIError = uri;
var abs = abs$1;
var floor = floor$1;
var max = max$2;
var min = min$1;
var pow = pow$1;
var round = round$1;
var sign2 = sign$1;
var $Function = Function;
var getEvalledConstructor = function(expressionSyntax) {
  try {
    return $Function('"use strict"; return (' + expressionSyntax + ").constructor;")();
  } catch (e) {
  }
};
var $gOPD = gopd;
var $defineProperty$1 = esDefineProperty;
var throwTypeError = function() {
  throw new $TypeError$1();
};
var ThrowTypeError = $gOPD ? function() {
  try {
    arguments.callee;
    return throwTypeError;
  } catch (calleeThrows) {
    try {
      return $gOPD(arguments, "callee").get;
    } catch (gOPDthrows) {
      return throwTypeError;
    }
  }
}() : throwTypeError;
var hasSymbols = requireHasSymbols()();
var getProto = requireGetProto();
var $ObjectGPO = requireObject_getPrototypeOf();
var $ReflectGPO = requireReflect_getPrototypeOf();
var $apply = requireFunctionApply();
var $call = requireFunctionCall();
var needsEval = {};
var TypedArray = typeof Uint8Array === "undefined" || !getProto ? undefined$1 : getProto(Uint8Array);
var INTRINSICS = {
  __proto__: null,
  "%AggregateError%": typeof AggregateError === "undefined" ? undefined$1 : AggregateError,
  "%Array%": Array,
  "%ArrayBuffer%": typeof ArrayBuffer === "undefined" ? undefined$1 : ArrayBuffer,
  "%ArrayIteratorPrototype%": hasSymbols && getProto ? getProto([][Symbol.iterator]()) : undefined$1,
  "%AsyncFromSyncIteratorPrototype%": undefined$1,
  "%AsyncFunction%": needsEval,
  "%AsyncGenerator%": needsEval,
  "%AsyncGeneratorFunction%": needsEval,
  "%AsyncIteratorPrototype%": needsEval,
  "%Atomics%": typeof Atomics === "undefined" ? undefined$1 : Atomics,
  "%BigInt%": typeof BigInt === "undefined" ? undefined$1 : BigInt,
  "%BigInt64Array%": typeof BigInt64Array === "undefined" ? undefined$1 : BigInt64Array,
  "%BigUint64Array%": typeof BigUint64Array === "undefined" ? undefined$1 : BigUint64Array,
  "%Boolean%": Boolean,
  "%DataView%": typeof DataView === "undefined" ? undefined$1 : DataView,
  "%Date%": Date,
  "%decodeURI%": decodeURI,
  "%decodeURIComponent%": decodeURIComponent,
  "%encodeURI%": encodeURI,
  "%encodeURIComponent%": encodeURIComponent,
  "%Error%": $Error,
  "%eval%": eval,
  // eslint-disable-line no-eval
  "%EvalError%": $EvalError,
  "%Float16Array%": typeof Float16Array === "undefined" ? undefined$1 : Float16Array,
  "%Float32Array%": typeof Float32Array === "undefined" ? undefined$1 : Float32Array,
  "%Float64Array%": typeof Float64Array === "undefined" ? undefined$1 : Float64Array,
  "%FinalizationRegistry%": typeof FinalizationRegistry === "undefined" ? undefined$1 : FinalizationRegistry,
  "%Function%": $Function,
  "%GeneratorFunction%": needsEval,
  "%Int8Array%": typeof Int8Array === "undefined" ? undefined$1 : Int8Array,
  "%Int16Array%": typeof Int16Array === "undefined" ? undefined$1 : Int16Array,
  "%Int32Array%": typeof Int32Array === "undefined" ? undefined$1 : Int32Array,
  "%isFinite%": isFinite,
  "%isNaN%": isNaN,
  "%IteratorPrototype%": hasSymbols && getProto ? getProto(getProto([][Symbol.iterator]())) : undefined$1,
  "%JSON%": typeof JSON === "object" ? JSON : undefined$1,
  "%Map%": typeof Map === "undefined" ? undefined$1 : Map,
  "%MapIteratorPrototype%": typeof Map === "undefined" || !hasSymbols || !getProto ? undefined$1 : getProto((/* @__PURE__ */ new Map())[Symbol.iterator]()),
  "%Math%": Math,
  "%Number%": Number,
  "%Object%": $Object,
  "%Object.getOwnPropertyDescriptor%": $gOPD,
  "%parseFloat%": parseFloat,
  "%parseInt%": parseInt,
  "%Promise%": typeof Promise === "undefined" ? undefined$1 : Promise,
  "%Proxy%": typeof Proxy === "undefined" ? undefined$1 : Proxy,
  "%RangeError%": $RangeError,
  "%ReferenceError%": $ReferenceError,
  "%Reflect%": typeof Reflect === "undefined" ? undefined$1 : Reflect,
  "%RegExp%": RegExp,
  "%Set%": typeof Set === "undefined" ? undefined$1 : Set,
  "%SetIteratorPrototype%": typeof Set === "undefined" || !hasSymbols || !getProto ? undefined$1 : getProto((/* @__PURE__ */ new Set())[Symbol.iterator]()),
  "%SharedArrayBuffer%": typeof SharedArrayBuffer === "undefined" ? undefined$1 : SharedArrayBuffer,
  "%String%": String,
  "%StringIteratorPrototype%": hasSymbols && getProto ? getProto(""[Symbol.iterator]()) : undefined$1,
  "%Symbol%": hasSymbols ? Symbol : undefined$1,
  "%SyntaxError%": $SyntaxError,
  "%ThrowTypeError%": ThrowTypeError,
  "%TypedArray%": TypedArray,
  "%TypeError%": $TypeError$1,
  "%Uint8Array%": typeof Uint8Array === "undefined" ? undefined$1 : Uint8Array,
  "%Uint8ClampedArray%": typeof Uint8ClampedArray === "undefined" ? undefined$1 : Uint8ClampedArray,
  "%Uint16Array%": typeof Uint16Array === "undefined" ? undefined$1 : Uint16Array,
  "%Uint32Array%": typeof Uint32Array === "undefined" ? undefined$1 : Uint32Array,
  "%URIError%": $URIError,
  "%WeakMap%": typeof WeakMap === "undefined" ? undefined$1 : WeakMap,
  "%WeakRef%": typeof WeakRef === "undefined" ? undefined$1 : WeakRef,
  "%WeakSet%": typeof WeakSet === "undefined" ? undefined$1 : WeakSet,
  "%Function.prototype.call%": $call,
  "%Function.prototype.apply%": $apply,
  "%Object.defineProperty%": $defineProperty$1,
  "%Object.getPrototypeOf%": $ObjectGPO,
  "%Math.abs%": abs,
  "%Math.floor%": floor,
  "%Math.max%": max,
  "%Math.min%": min,
  "%Math.pow%": pow,
  "%Math.round%": round,
  "%Math.sign%": sign2,
  "%Reflect.getPrototypeOf%": $ReflectGPO
};
if (getProto) {
  try {
    null.error;
  } catch (e) {
    var errorProto = getProto(getProto(e));
    INTRINSICS["%Error.prototype%"] = errorProto;
  }
}
var doEval = function doEval2(name) {
  var value;
  if (name === "%AsyncFunction%") {
    value = getEvalledConstructor("async function () {}");
  } else if (name === "%GeneratorFunction%") {
    value = getEvalledConstructor("function* () {}");
  } else if (name === "%AsyncGeneratorFunction%") {
    value = getEvalledConstructor("async function* () {}");
  } else if (name === "%AsyncGenerator%") {
    var fn = doEval2("%AsyncGeneratorFunction%");
    if (fn) {
      value = fn.prototype;
    }
  } else if (name === "%AsyncIteratorPrototype%") {
    var gen = doEval2("%AsyncGenerator%");
    if (gen && getProto) {
      value = getProto(gen.prototype);
    }
  }
  INTRINSICS[name] = value;
  return value;
};
var LEGACY_ALIASES = {
  __proto__: null,
  "%ArrayBufferPrototype%": ["ArrayBuffer", "prototype"],
  "%ArrayPrototype%": ["Array", "prototype"],
  "%ArrayProto_entries%": ["Array", "prototype", "entries"],
  "%ArrayProto_forEach%": ["Array", "prototype", "forEach"],
  "%ArrayProto_keys%": ["Array", "prototype", "keys"],
  "%ArrayProto_values%": ["Array", "prototype", "values"],
  "%AsyncFunctionPrototype%": ["AsyncFunction", "prototype"],
  "%AsyncGenerator%": ["AsyncGeneratorFunction", "prototype"],
  "%AsyncGeneratorPrototype%": ["AsyncGeneratorFunction", "prototype", "prototype"],
  "%BooleanPrototype%": ["Boolean", "prototype"],
  "%DataViewPrototype%": ["DataView", "prototype"],
  "%DatePrototype%": ["Date", "prototype"],
  "%ErrorPrototype%": ["Error", "prototype"],
  "%EvalErrorPrototype%": ["EvalError", "prototype"],
  "%Float32ArrayPrototype%": ["Float32Array", "prototype"],
  "%Float64ArrayPrototype%": ["Float64Array", "prototype"],
  "%FunctionPrototype%": ["Function", "prototype"],
  "%Generator%": ["GeneratorFunction", "prototype"],
  "%GeneratorPrototype%": ["GeneratorFunction", "prototype", "prototype"],
  "%Int8ArrayPrototype%": ["Int8Array", "prototype"],
  "%Int16ArrayPrototype%": ["Int16Array", "prototype"],
  "%Int32ArrayPrototype%": ["Int32Array", "prototype"],
  "%JSONParse%": ["JSON", "parse"],
  "%JSONStringify%": ["JSON", "stringify"],
  "%MapPrototype%": ["Map", "prototype"],
  "%NumberPrototype%": ["Number", "prototype"],
  "%ObjectPrototype%": ["Object", "prototype"],
  "%ObjProto_toString%": ["Object", "prototype", "toString"],
  "%ObjProto_valueOf%": ["Object", "prototype", "valueOf"],
  "%PromisePrototype%": ["Promise", "prototype"],
  "%PromiseProto_then%": ["Promise", "prototype", "then"],
  "%Promise_all%": ["Promise", "all"],
  "%Promise_reject%": ["Promise", "reject"],
  "%Promise_resolve%": ["Promise", "resolve"],
  "%RangeErrorPrototype%": ["RangeError", "prototype"],
  "%ReferenceErrorPrototype%": ["ReferenceError", "prototype"],
  "%RegExpPrototype%": ["RegExp", "prototype"],
  "%SetPrototype%": ["Set", "prototype"],
  "%SharedArrayBufferPrototype%": ["SharedArrayBuffer", "prototype"],
  "%StringPrototype%": ["String", "prototype"],
  "%SymbolPrototype%": ["Symbol", "prototype"],
  "%SyntaxErrorPrototype%": ["SyntaxError", "prototype"],
  "%TypedArrayPrototype%": ["TypedArray", "prototype"],
  "%TypeErrorPrototype%": ["TypeError", "prototype"],
  "%Uint8ArrayPrototype%": ["Uint8Array", "prototype"],
  "%Uint8ClampedArrayPrototype%": ["Uint8ClampedArray", "prototype"],
  "%Uint16ArrayPrototype%": ["Uint16Array", "prototype"],
  "%Uint32ArrayPrototype%": ["Uint32Array", "prototype"],
  "%URIErrorPrototype%": ["URIError", "prototype"],
  "%WeakMapPrototype%": ["WeakMap", "prototype"],
  "%WeakSetPrototype%": ["WeakSet", "prototype"]
};
var bind2 = functionBind;
var hasOwn$2 = hasown;
var $concat = bind2.call($call, Array.prototype.concat);
var $spliceApply = bind2.call($apply, Array.prototype.splice);
var $replace = bind2.call($call, String.prototype.replace);
var $strSlice = bind2.call($call, String.prototype.slice);
var $exec = bind2.call($call, RegExp.prototype.exec);
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g;
var stringToPath = function stringToPath2(string) {
  var first = $strSlice(string, 0, 1);
  var last = $strSlice(string, -1);
  if (first === "%" && last !== "%") {
    throw new $SyntaxError("invalid intrinsic syntax, expected closing `%`");
  } else if (last === "%" && first !== "%") {
    throw new $SyntaxError("invalid intrinsic syntax, expected opening `%`");
  }
  var result = [];
  $replace(string, rePropName, function(match, number, quote, subString) {
    result[result.length] = quote ? $replace(subString, reEscapeChar, "$1") : number || match;
  });
  return result;
};
var getBaseIntrinsic = function getBaseIntrinsic2(name, allowMissing) {
  var intrinsicName = name;
  var alias;
  if (hasOwn$2(LEGACY_ALIASES, intrinsicName)) {
    alias = LEGACY_ALIASES[intrinsicName];
    intrinsicName = "%" + alias[0] + "%";
  }
  if (hasOwn$2(INTRINSICS, intrinsicName)) {
    var value = INTRINSICS[intrinsicName];
    if (value === needsEval) {
      value = doEval(intrinsicName);
    }
    if (typeof value === "undefined" && !allowMissing) {
      throw new $TypeError$1("intrinsic " + name + " exists, but is not available. Please file an issue!");
    }
    return {
      alias,
      name: intrinsicName,
      value
    };
  }
  throw new $SyntaxError("intrinsic " + name + " does not exist!");
};
var getIntrinsic = function GetIntrinsic(name, allowMissing) {
  if (typeof name !== "string" || name.length === 0) {
    throw new $TypeError$1("intrinsic name must be a non-empty string");
  }
  if (arguments.length > 1 && typeof allowMissing !== "boolean") {
    throw new $TypeError$1('"allowMissing" argument must be a boolean');
  }
  if ($exec(/^%?[^%]*%?$/, name) === null) {
    throw new $SyntaxError("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
  }
  var parts = stringToPath(name);
  var intrinsicBaseName = parts.length > 0 ? parts[0] : "";
  var intrinsic = getBaseIntrinsic("%" + intrinsicBaseName + "%", allowMissing);
  var intrinsicRealName = intrinsic.name;
  var value = intrinsic.value;
  var skipFurtherCaching = false;
  var alias = intrinsic.alias;
  if (alias) {
    intrinsicBaseName = alias[0];
    $spliceApply(parts, $concat([0, 1], alias));
  }
  for (var i = 1, isOwn = true; i < parts.length; i += 1) {
    var part = parts[i];
    var first = $strSlice(part, 0, 1);
    var last = $strSlice(part, -1);
    if ((first === '"' || first === "'" || first === "`" || (last === '"' || last === "'" || last === "`")) && first !== last) {
      throw new $SyntaxError("property names with quotes must have matching quotes");
    }
    if (part === "constructor" || !isOwn) {
      skipFurtherCaching = true;
    }
    intrinsicBaseName += "." + part;
    intrinsicRealName = "%" + intrinsicBaseName + "%";
    if (hasOwn$2(INTRINSICS, intrinsicRealName)) {
      value = INTRINSICS[intrinsicRealName];
    } else if (value != null) {
      if (!(part in value)) {
        if (!allowMissing) {
          throw new $TypeError$1("base intrinsic for " + name + " exists, but the property is not available.");
        }
        return void 0;
      }
      if ($gOPD && i + 1 >= parts.length) {
        var desc = $gOPD(value, part);
        isOwn = !!desc;
        if (isOwn && "get" in desc && !("originalValue" in desc.get)) {
          value = desc.get;
        } else {
          value = value[part];
        }
      } else {
        isOwn = hasOwn$2(value, part);
        value = value[part];
      }
      if (isOwn && !skipFurtherCaching) {
        INTRINSICS[intrinsicRealName] = value;
      }
    }
  }
  return value;
};
var shams;
var hasRequiredShams;
function requireShams() {
  if (hasRequiredShams) return shams;
  hasRequiredShams = 1;
  var hasSymbols2 = requireShams$1();
  shams = function hasToStringTagShams() {
    return hasSymbols2() && !!Symbol.toStringTag;
  };
  return shams;
}
var GetIntrinsic2 = getIntrinsic;
var $defineProperty = GetIntrinsic2("%Object.defineProperty%", true);
var hasToStringTag = requireShams()();
var hasOwn$1 = hasown;
var $TypeError = type;
var toStringTag = hasToStringTag ? Symbol.toStringTag : null;
var esSetTostringtag = function setToStringTag(object, value) {
  var overrideIfSet = arguments.length > 2 && !!arguments[2] && arguments[2].force;
  var nonConfigurable = arguments.length > 2 && !!arguments[2] && arguments[2].nonConfigurable;
  if (typeof overrideIfSet !== "undefined" && typeof overrideIfSet !== "boolean" || typeof nonConfigurable !== "undefined" && typeof nonConfigurable !== "boolean") {
    throw new $TypeError("if provided, the `overrideIfSet` and `nonConfigurable` options must be booleans");
  }
  if (toStringTag && (overrideIfSet || !hasOwn$1(object, toStringTag))) {
    if ($defineProperty) {
      $defineProperty(object, toStringTag, {
        configurable: !nonConfigurable,
        enumerable: false,
        value,
        writable: false
      });
    } else {
      object[toStringTag] = value;
    }
  }
};
var populate$1 = function(dst, src2) {
  Object.keys(src2).forEach(function(prop) {
    dst[prop] = dst[prop] || src2[prop];
  });
  return dst;
};
var CombinedStream = combined_stream;
var util = require$$1;
var path = path$1;
var http$1 = require$$3;
var https$1 = require$$4;
var parseUrl$2 = require$$5.parse;
var fs = fs$1;
var Stream = stream.Stream;
var crypto = crypto$1;
var mime = mimeTypes;
var asynckit = asynckit$1;
var setToStringTag2 = esSetTostringtag;
var hasOwn = hasown;
var populate = populate$1;
function FormData$1(options) {
  if (!(this instanceof FormData$1)) {
    return new FormData$1(options);
  }
  this._overheadLength = 0;
  this._valueLength = 0;
  this._valuesToMeasure = [];
  CombinedStream.call(this);
  options = options || {};
  for (var option in options) {
    this[option] = options[option];
  }
}
util.inherits(FormData$1, CombinedStream);
FormData$1.LINE_BREAK = "\r\n";
FormData$1.DEFAULT_CONTENT_TYPE = "application/octet-stream";
FormData$1.prototype.append = function(field, value, options) {
  options = options || {};
  if (typeof options === "string") {
    options = { filename: options };
  }
  var append2 = CombinedStream.prototype.append.bind(this);
  if (typeof value === "number" || value == null) {
    value = String(value);
  }
  if (Array.isArray(value)) {
    this._error(new Error("Arrays are not supported."));
    return;
  }
  var header = this._multiPartHeader(field, value, options);
  var footer = this._multiPartFooter();
  append2(header);
  append2(value);
  append2(footer);
  this._trackLength(header, value, options);
};
FormData$1.prototype._trackLength = function(header, value, options) {
  var valueLength = 0;
  if (options.knownLength != null) {
    valueLength += Number(options.knownLength);
  } else if (Buffer.isBuffer(value)) {
    valueLength = value.length;
  } else if (typeof value === "string") {
    valueLength = Buffer.byteLength(value);
  }
  this._valueLength += valueLength;
  this._overheadLength += Buffer.byteLength(header) + FormData$1.LINE_BREAK.length;
  if (!value || !value.path && !(value.readable && hasOwn(value, "httpVersion")) && !(value instanceof Stream)) {
    return;
  }
  if (!options.knownLength) {
    this._valuesToMeasure.push(value);
  }
};
FormData$1.prototype._lengthRetriever = function(value, callback) {
  if (hasOwn(value, "fd")) {
    if (value.end != void 0 && value.end != Infinity && value.start != void 0) {
      callback(null, value.end + 1 - (value.start ? value.start : 0));
    } else {
      fs.stat(value.path, function(err, stat) {
        if (err) {
          callback(err);
          return;
        }
        var fileSize = stat.size - (value.start ? value.start : 0);
        callback(null, fileSize);
      });
    }
  } else if (hasOwn(value, "httpVersion")) {
    callback(null, Number(value.headers["content-length"]));
  } else if (hasOwn(value, "httpModule")) {
    value.on("response", function(response) {
      value.pause();
      callback(null, Number(response.headers["content-length"]));
    });
    value.resume();
  } else {
    callback("Unknown stream");
  }
};
FormData$1.prototype._multiPartHeader = function(field, value, options) {
  if (typeof options.header === "string") {
    return options.header;
  }
  var contentDisposition = this._getContentDisposition(value, options);
  var contentType = this._getContentType(value, options);
  var contents = "";
  var headers = {
    // add custom disposition as third element or keep it two elements if not
    "Content-Disposition": ["form-data", 'name="' + field + '"'].concat(contentDisposition || []),
    // if no content type. allow it to be empty array
    "Content-Type": [].concat(contentType || [])
  };
  if (typeof options.header === "object") {
    populate(headers, options.header);
  }
  var header;
  for (var prop in headers) {
    if (hasOwn(headers, prop)) {
      header = headers[prop];
      if (header == null) {
        continue;
      }
      if (!Array.isArray(header)) {
        header = [header];
      }
      if (header.length) {
        contents += prop + ": " + header.join("; ") + FormData$1.LINE_BREAK;
      }
    }
  }
  return "--" + this.getBoundary() + FormData$1.LINE_BREAK + contents + FormData$1.LINE_BREAK;
};
FormData$1.prototype._getContentDisposition = function(value, options) {
  var filename;
  if (typeof options.filepath === "string") {
    filename = path.normalize(options.filepath).replace(/\\/g, "/");
  } else if (options.filename || value && (value.name || value.path)) {
    filename = path.basename(options.filename || value && (value.name || value.path));
  } else if (value && value.readable && hasOwn(value, "httpVersion")) {
    filename = path.basename(value.client._httpMessage.path || "");
  }
  if (filename) {
    return 'filename="' + filename + '"';
  }
};
FormData$1.prototype._getContentType = function(value, options) {
  var contentType = options.contentType;
  if (!contentType && value && value.name) {
    contentType = mime.lookup(value.name);
  }
  if (!contentType && value && value.path) {
    contentType = mime.lookup(value.path);
  }
  if (!contentType && value && value.readable && hasOwn(value, "httpVersion")) {
    contentType = value.headers["content-type"];
  }
  if (!contentType && (options.filepath || options.filename)) {
    contentType = mime.lookup(options.filepath || options.filename);
  }
  if (!contentType && value && typeof value === "object") {
    contentType = FormData$1.DEFAULT_CONTENT_TYPE;
  }
  return contentType;
};
FormData$1.prototype._multiPartFooter = function() {
  return function(next) {
    var footer = FormData$1.LINE_BREAK;
    var lastPart = this._streams.length === 0;
    if (lastPart) {
      footer += this._lastBoundary();
    }
    next(footer);
  }.bind(this);
};
FormData$1.prototype._lastBoundary = function() {
  return "--" + this.getBoundary() + "--" + FormData$1.LINE_BREAK;
};
FormData$1.prototype.getHeaders = function(userHeaders) {
  var header;
  var formHeaders = {
    "content-type": "multipart/form-data; boundary=" + this.getBoundary()
  };
  for (header in userHeaders) {
    if (hasOwn(userHeaders, header)) {
      formHeaders[header.toLowerCase()] = userHeaders[header];
    }
  }
  return formHeaders;
};
FormData$1.prototype.setBoundary = function(boundary) {
  if (typeof boundary !== "string") {
    throw new TypeError("FormData boundary must be a string");
  }
  this._boundary = boundary;
};
FormData$1.prototype.getBoundary = function() {
  if (!this._boundary) {
    this._generateBoundary();
  }
  return this._boundary;
};
FormData$1.prototype.getBuffer = function() {
  var dataBuffer = new Buffer.alloc(0);
  var boundary = this.getBoundary();
  for (var i = 0, len = this._streams.length; i < len; i++) {
    if (typeof this._streams[i] !== "function") {
      if (Buffer.isBuffer(this._streams[i])) {
        dataBuffer = Buffer.concat([dataBuffer, this._streams[i]]);
      } else {
        dataBuffer = Buffer.concat([dataBuffer, Buffer.from(this._streams[i])]);
      }
      if (typeof this._streams[i] !== "string" || this._streams[i].substring(2, boundary.length + 2) !== boundary) {
        dataBuffer = Buffer.concat([dataBuffer, Buffer.from(FormData$1.LINE_BREAK)]);
      }
    }
  }
  return Buffer.concat([dataBuffer, Buffer.from(this._lastBoundary())]);
};
FormData$1.prototype._generateBoundary = function() {
  this._boundary = "--------------------------" + crypto.randomBytes(12).toString("hex");
};
FormData$1.prototype.getLengthSync = function() {
  var knownLength = this._overheadLength + this._valueLength;
  if (this._streams.length) {
    knownLength += this._lastBoundary().length;
  }
  if (!this.hasKnownLength()) {
    this._error(new Error("Cannot calculate proper length in synchronous way."));
  }
  return knownLength;
};
FormData$1.prototype.hasKnownLength = function() {
  var hasKnownLength = true;
  if (this._valuesToMeasure.length) {
    hasKnownLength = false;
  }
  return hasKnownLength;
};
FormData$1.prototype.getLength = function(cb) {
  var knownLength = this._overheadLength + this._valueLength;
  if (this._streams.length) {
    knownLength += this._lastBoundary().length;
  }
  if (!this._valuesToMeasure.length) {
    process.nextTick(cb.bind(this, null, knownLength));
    return;
  }
  asynckit.parallel(this._valuesToMeasure, this._lengthRetriever, function(err, values) {
    if (err) {
      cb(err);
      return;
    }
    values.forEach(function(length) {
      knownLength += length;
    });
    cb(null, knownLength);
  });
};
FormData$1.prototype.submit = function(params, cb) {
  var request;
  var options;
  var defaults2 = { method: "post" };
  if (typeof params === "string") {
    params = parseUrl$2(params);
    options = populate({
      port: params.port,
      path: params.pathname,
      host: params.hostname,
      protocol: params.protocol
    }, defaults2);
  } else {
    options = populate(params, defaults2);
    if (!options.port) {
      options.port = options.protocol === "https:" ? 443 : 80;
    }
  }
  options.headers = this.getHeaders(params.headers);
  if (options.protocol === "https:") {
    request = https$1.request(options);
  } else {
    request = http$1.request(options);
  }
  this.getLength(function(err, length) {
    if (err && err !== "Unknown stream") {
      this._error(err);
      return;
    }
    if (length) {
      request.setHeader("Content-Length", length);
    }
    this.pipe(request);
    if (cb) {
      var onResponse;
      var callback = function(error, responce) {
        request.removeListener("error", callback);
        request.removeListener("response", onResponse);
        return cb.call(this, error, responce);
      };
      onResponse = callback.bind(this, null);
      request.on("error", callback);
      request.on("response", onResponse);
    }
  }.bind(this));
  return request;
};
FormData$1.prototype._error = function(err) {
  if (!this.error) {
    this.error = err;
    this.pause();
    this.emit("error", err);
  }
};
FormData$1.prototype.toString = function() {
  return "[object FormData]";
};
setToStringTag2(FormData$1.prototype, "FormData");
var form_data = FormData$1;
const FormData$2 = /* @__PURE__ */ getDefaultExportFromCjs(form_data);
function isVisitable(thing) {
  return utils$1.isPlainObject(thing) || utils$1.isArray(thing);
}
function removeBrackets(key) {
  return utils$1.endsWith(key, "[]") ? key.slice(0, -2) : key;
}
function renderKey(path2, key, dots) {
  if (!path2) return key;
  return path2.concat(key).map(function each(token, i) {
    token = removeBrackets(token);
    return !dots && i ? "[" + token + "]" : token;
  }).join(dots ? "." : "");
}
function isFlatArray(arr) {
  return utils$1.isArray(arr) && !arr.some(isVisitable);
}
const predicates = utils$1.toFlatObject(utils$1, {}, null, function filter(prop) {
  return /^is[A-Z]/.test(prop);
});
function toFormData$1(obj, formData, options) {
  if (!utils$1.isObject(obj)) {
    throw new TypeError("target must be an object");
  }
  formData = formData || new (FormData$2 || FormData)();
  options = utils$1.toFlatObject(
    options,
    {
      metaTokens: true,
      dots: false,
      indexes: false
    },
    false,
    function defined(option, source) {
      return !utils$1.isUndefined(source[option]);
    }
  );
  const metaTokens = options.metaTokens;
  const visitor = options.visitor || defaultVisitor;
  const dots = options.dots;
  const indexes = options.indexes;
  const _Blob = options.Blob || typeof Blob !== "undefined" && Blob;
  const maxDepth = options.maxDepth === void 0 ? 100 : options.maxDepth;
  const useBlob = _Blob && utils$1.isSpecCompliantForm(formData);
  if (!utils$1.isFunction(visitor)) {
    throw new TypeError("visitor must be a function");
  }
  function convertValue(value) {
    if (value === null) return "";
    if (utils$1.isDate(value)) {
      return value.toISOString();
    }
    if (utils$1.isBoolean(value)) {
      return value.toString();
    }
    if (!useBlob && utils$1.isBlob(value)) {
      throw new AxiosError$1("Blob is not supported. Use a Buffer instead.");
    }
    if (utils$1.isArrayBuffer(value) || utils$1.isTypedArray(value)) {
      return useBlob && typeof Blob === "function" ? new Blob([value]) : Buffer.from(value);
    }
    return value;
  }
  function defaultVisitor(value, key, path2) {
    let arr = value;
    if (utils$1.isReactNative(formData) && utils$1.isReactNativeBlob(value)) {
      formData.append(renderKey(path2, key, dots), convertValue(value));
      return false;
    }
    if (value && !path2 && typeof value === "object") {
      if (utils$1.endsWith(key, "{}")) {
        key = metaTokens ? key : key.slice(0, -2);
        value = JSON.stringify(value);
      } else if (utils$1.isArray(value) && isFlatArray(value) || (utils$1.isFileList(value) || utils$1.endsWith(key, "[]")) && (arr = utils$1.toArray(value))) {
        key = removeBrackets(key);
        arr.forEach(function each(el, index) {
          !(utils$1.isUndefined(el) || el === null) && formData.append(
            // eslint-disable-next-line no-nested-ternary
            indexes === true ? renderKey([key], index, dots) : indexes === null ? key : key + "[]",
            convertValue(el)
          );
        });
        return false;
      }
    }
    if (isVisitable(value)) {
      return true;
    }
    formData.append(renderKey(path2, key, dots), convertValue(value));
    return false;
  }
  const stack = [];
  const exposedHelpers = Object.assign(predicates, {
    defaultVisitor,
    convertValue,
    isVisitable
  });
  function build(value, path2, depth = 0) {
    if (utils$1.isUndefined(value)) return;
    if (depth > maxDepth) {
      throw new AxiosError$1(
        "Object is too deeply nested (" + depth + " levels). Max depth: " + maxDepth,
        AxiosError$1.ERR_FORM_DATA_DEPTH_EXCEEDED
      );
    }
    if (stack.indexOf(value) !== -1) {
      throw Error("Circular reference detected in " + path2.join("."));
    }
    stack.push(value);
    utils$1.forEach(value, function each(el, key) {
      const result = !(utils$1.isUndefined(el) || el === null) && visitor.call(formData, el, utils$1.isString(key) ? key.trim() : key, path2, exposedHelpers);
      if (result === true) {
        build(el, path2 ? path2.concat(key) : [key], depth + 1);
      }
    });
    stack.pop();
  }
  if (!utils$1.isObject(obj)) {
    throw new TypeError("data must be an object");
  }
  build(obj);
  return formData;
}
function encode$1(str) {
  const charMap = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+"
  };
  return encodeURIComponent(str).replace(/[!'()~]|%20/g, function replacer(match) {
    return charMap[match];
  });
}
function AxiosURLSearchParams(params, options) {
  this._pairs = [];
  params && toFormData$1(params, this, options);
}
const prototype = AxiosURLSearchParams.prototype;
prototype.append = function append(name, value) {
  this._pairs.push([name, value]);
};
prototype.toString = function toString2(encoder) {
  const _encode = encoder ? function(value) {
    return encoder.call(this, value, encode$1);
  } : encode$1;
  return this._pairs.map(function each(pair) {
    return _encode(pair[0]) + "=" + _encode(pair[1]);
  }, "").join("&");
};
function encode(val) {
  return encodeURIComponent(val).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+");
}
function buildURL(url2, params, options) {
  if (!params) {
    return url2;
  }
  const _encode = options && options.encode || encode;
  const _options = utils$1.isFunction(options) ? {
    serialize: options
  } : options;
  const serializeFn = _options && _options.serialize;
  let serializedParams;
  if (serializeFn) {
    serializedParams = serializeFn(params, _options);
  } else {
    serializedParams = utils$1.isURLSearchParams(params) ? params.toString() : new AxiosURLSearchParams(params, _options).toString(_encode);
  }
  if (serializedParams) {
    const hashmarkIndex = url2.indexOf("#");
    if (hashmarkIndex !== -1) {
      url2 = url2.slice(0, hashmarkIndex);
    }
    url2 += (url2.indexOf("?") === -1 ? "?" : "&") + serializedParams;
  }
  return url2;
}
class InterceptorManager {
  constructor() {
    this.handlers = [];
  }
  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   * @param {Object} options The options for the interceptor, synchronous and runWhen
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(fulfilled, rejected, options) {
    this.handlers.push({
      fulfilled,
      rejected,
      synchronous: options ? options.synchronous : false,
      runWhen: options ? options.runWhen : null
    });
    return this.handlers.length - 1;
  }
  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {void}
   */
  eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }
  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    if (this.handlers) {
      this.handlers = [];
    }
  }
  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(fn) {
    utils$1.forEach(this.handlers, function forEachHandler(h) {
      if (h !== null) {
        fn(h);
      }
    });
  }
}
const transitionalDefaults = {
  silentJSONParsing: true,
  forcedJSONParsing: true,
  clarifyTimeoutError: false,
  legacyInterceptorReqResOrdering: true
};
const URLSearchParams = require$$5.URLSearchParams;
const ALPHA = "abcdefghijklmnopqrstuvwxyz";
const DIGIT = "0123456789";
const ALPHABET = {
  DIGIT,
  ALPHA,
  ALPHA_DIGIT: ALPHA + ALPHA.toUpperCase() + DIGIT
};
const generateString = (size = 16, alphabet = ALPHABET.ALPHA_DIGIT) => {
  let str = "";
  const { length } = alphabet;
  const randomValues = new Uint32Array(size);
  crypto$1.randomFillSync(randomValues);
  for (let i = 0; i < size; i++) {
    str += alphabet[randomValues[i] % length];
  }
  return str;
};
const platform$1 = {
  isNode: true,
  classes: {
    URLSearchParams,
    FormData: FormData$2,
    Blob: typeof Blob !== "undefined" && Blob || null
  },
  ALPHABET,
  generateString,
  protocols: ["http", "https", "file", "data"]
};
const hasBrowserEnv = typeof window !== "undefined" && typeof document !== "undefined";
const _navigator = typeof navigator === "object" && navigator || void 0;
const hasStandardBrowserEnv = hasBrowserEnv && (!_navigator || ["ReactNative", "NativeScript", "NS"].indexOf(_navigator.product) < 0);
const hasStandardBrowserWebWorkerEnv = (() => {
  return typeof WorkerGlobalScope !== "undefined" && // eslint-disable-next-line no-undef
  self instanceof WorkerGlobalScope && typeof self.importScripts === "function";
})();
const origin = hasBrowserEnv && window.location.href || "http://localhost";
const utils = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  hasBrowserEnv,
  hasStandardBrowserEnv,
  hasStandardBrowserWebWorkerEnv,
  navigator: _navigator,
  origin
}, Symbol.toStringTag, { value: "Module" }));
const platform = {
  ...utils,
  ...platform$1
};
function toURLEncodedForm(data, options) {
  return toFormData$1(data, new platform.classes.URLSearchParams(), {
    visitor: function(value, key, path2, helpers) {
      if (platform.isNode && utils$1.isBuffer(value)) {
        this.append(key, value.toString("base64"));
        return false;
      }
      return helpers.defaultVisitor.apply(this, arguments);
    },
    ...options
  });
}
function parsePropPath(name) {
  return utils$1.matchAll(/\w+|\[(\w*)]/g, name).map((match) => {
    return match[0] === "[]" ? "" : match[1] || match[0];
  });
}
function arrayToObject(arr) {
  const obj = {};
  const keys = Object.keys(arr);
  let i;
  const len = keys.length;
  let key;
  for (i = 0; i < len; i++) {
    key = keys[i];
    obj[key] = arr[key];
  }
  return obj;
}
function formDataToJSON(formData) {
  function buildPath(path2, value, target, index) {
    let name = path2[index++];
    if (name === "__proto__") return true;
    const isNumericKey = Number.isFinite(+name);
    const isLast = index >= path2.length;
    name = !name && utils$1.isArray(target) ? target.length : name;
    if (isLast) {
      if (utils$1.hasOwnProp(target, name)) {
        target[name] = utils$1.isArray(target[name]) ? target[name].concat(value) : [target[name], value];
      } else {
        target[name] = value;
      }
      return !isNumericKey;
    }
    if (!target[name] || !utils$1.isObject(target[name])) {
      target[name] = [];
    }
    const result = buildPath(path2, value, target[name], index);
    if (result && utils$1.isArray(target[name])) {
      target[name] = arrayToObject(target[name]);
    }
    return !isNumericKey;
  }
  if (utils$1.isFormData(formData) && utils$1.isFunction(formData.entries)) {
    const obj = {};
    utils$1.forEachEntry(formData, (name, value) => {
      buildPath(parsePropPath(name), value, obj, 0);
    });
    return obj;
  }
  return null;
}
const own = (obj, key) => obj != null && utils$1.hasOwnProp(obj, key) ? obj[key] : void 0;
function stringifySafely(rawValue, parser, encoder) {
  if (utils$1.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils$1.trim(rawValue);
    } catch (e) {
      if (e.name !== "SyntaxError") {
        throw e;
      }
    }
  }
  return (encoder || JSON.stringify)(rawValue);
}
const defaults = {
  transitional: transitionalDefaults,
  adapter: ["xhr", "http", "fetch"],
  transformRequest: [
    function transformRequest(data, headers) {
      const contentType = headers.getContentType() || "";
      const hasJSONContentType = contentType.indexOf("application/json") > -1;
      const isObjectPayload = utils$1.isObject(data);
      if (isObjectPayload && utils$1.isHTMLForm(data)) {
        data = new FormData(data);
      }
      const isFormData2 = utils$1.isFormData(data);
      if (isFormData2) {
        return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data;
      }
      if (utils$1.isArrayBuffer(data) || utils$1.isBuffer(data) || utils$1.isStream(data) || utils$1.isFile(data) || utils$1.isBlob(data) || utils$1.isReadableStream(data)) {
        return data;
      }
      if (utils$1.isArrayBufferView(data)) {
        return data.buffer;
      }
      if (utils$1.isURLSearchParams(data)) {
        headers.setContentType("application/x-www-form-urlencoded;charset=utf-8", false);
        return data.toString();
      }
      let isFileList2;
      if (isObjectPayload) {
        const formSerializer = own(this, "formSerializer");
        if (contentType.indexOf("application/x-www-form-urlencoded") > -1) {
          return toURLEncodedForm(data, formSerializer).toString();
        }
        if ((isFileList2 = utils$1.isFileList(data)) || contentType.indexOf("multipart/form-data") > -1) {
          const env2 = own(this, "env");
          const _FormData = env2 && env2.FormData;
          return toFormData$1(
            isFileList2 ? { "files[]": data } : data,
            _FormData && new _FormData(),
            formSerializer
          );
        }
      }
      if (isObjectPayload || hasJSONContentType) {
        headers.setContentType("application/json", false);
        return stringifySafely(data);
      }
      return data;
    }
  ],
  transformResponse: [
    function transformResponse(data) {
      const transitional2 = own(this, "transitional") || defaults.transitional;
      const forcedJSONParsing = transitional2 && transitional2.forcedJSONParsing;
      const responseType = own(this, "responseType");
      const JSONRequested = responseType === "json";
      if (utils$1.isResponse(data) || utils$1.isReadableStream(data)) {
        return data;
      }
      if (data && utils$1.isString(data) && (forcedJSONParsing && !responseType || JSONRequested)) {
        const silentJSONParsing = transitional2 && transitional2.silentJSONParsing;
        const strictJSONParsing = !silentJSONParsing && JSONRequested;
        try {
          return JSON.parse(data, own(this, "parseReviver"));
        } catch (e) {
          if (strictJSONParsing) {
            if (e.name === "SyntaxError") {
              throw AxiosError$1.from(e, AxiosError$1.ERR_BAD_RESPONSE, this, null, own(this, "response"));
            }
            throw e;
          }
        }
      }
      return data;
    }
  ],
  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: {
    FormData: platform.classes.FormData,
    Blob: platform.classes.Blob
  },
  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  },
  headers: {
    common: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": void 0
    }
  }
};
utils$1.forEach(["delete", "get", "head", "post", "put", "patch"], (method) => {
  defaults.headers[method] = {};
});
const ignoreDuplicateOf = utils$1.toObjectSet([
  "age",
  "authorization",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "from",
  "host",
  "if-modified-since",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "proxy-authorization",
  "referer",
  "retry-after",
  "user-agent"
]);
const parseHeaders = (rawHeaders) => {
  const parsed = {};
  let key;
  let val;
  let i;
  rawHeaders && rawHeaders.split("\n").forEach(function parser(line) {
    i = line.indexOf(":");
    key = line.substring(0, i).trim().toLowerCase();
    val = line.substring(i + 1).trim();
    if (!key || parsed[key] && ignoreDuplicateOf[key]) {
      return;
    }
    if (key === "set-cookie") {
      if (parsed[key]) {
        parsed[key].push(val);
      } else {
        parsed[key] = [val];
      }
    } else {
      parsed[key] = parsed[key] ? parsed[key] + ", " + val : val;
    }
  });
  return parsed;
};
const $internals = Symbol("internals");
const INVALID_HEADER_VALUE_CHARS_RE = /[^\x09\x20-\x7E\x80-\xFF]/g;
function trimSPorHTAB(str) {
  let start = 0;
  let end = str.length;
  while (start < end) {
    const code = str.charCodeAt(start);
    if (code !== 9 && code !== 32) {
      break;
    }
    start += 1;
  }
  while (end > start) {
    const code = str.charCodeAt(end - 1);
    if (code !== 9 && code !== 32) {
      break;
    }
    end -= 1;
  }
  return start === 0 && end === str.length ? str : str.slice(start, end);
}
function normalizeHeader(header) {
  return header && String(header).trim().toLowerCase();
}
function sanitizeHeaderValue(str) {
  return trimSPorHTAB(str.replace(INVALID_HEADER_VALUE_CHARS_RE, ""));
}
function normalizeValue(value) {
  if (value === false || value == null) {
    return value;
  }
  return utils$1.isArray(value) ? value.map(normalizeValue) : sanitizeHeaderValue(String(value));
}
function parseTokens(str) {
  const tokens = /* @__PURE__ */ Object.create(null);
  const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let match;
  while (match = tokensRE.exec(str)) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}
const isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());
function matchHeaderValue(context, value, header, filter2, isHeaderNameFilter) {
  if (utils$1.isFunction(filter2)) {
    return filter2.call(this, value, header);
  }
  if (isHeaderNameFilter) {
    value = header;
  }
  if (!utils$1.isString(value)) return;
  if (utils$1.isString(filter2)) {
    return value.indexOf(filter2) !== -1;
  }
  if (utils$1.isRegExp(filter2)) {
    return filter2.test(value);
  }
}
function formatHeader(header) {
  return header.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
    return char.toUpperCase() + str;
  });
}
function buildAccessors(obj, header) {
  const accessorName = utils$1.toCamelCase(" " + header);
  ["get", "set", "has"].forEach((methodName) => {
    Object.defineProperty(obj, methodName + accessorName, {
      value: function(arg1, arg2, arg3) {
        return this[methodName].call(this, header, arg1, arg2, arg3);
      },
      configurable: true
    });
  });
}
let AxiosHeaders$1 = class AxiosHeaders {
  constructor(headers) {
    headers && this.set(headers);
  }
  set(header, valueOrRewrite, rewrite) {
    const self2 = this;
    function setHeader(_value, _header, _rewrite) {
      const lHeader = normalizeHeader(_header);
      if (!lHeader) {
        throw new Error("header name must be a non-empty string");
      }
      const key = utils$1.findKey(self2, lHeader);
      if (!key || self2[key] === void 0 || _rewrite === true || _rewrite === void 0 && self2[key] !== false) {
        self2[key || _header] = normalizeValue(_value);
      }
    }
    const setHeaders = (headers, _rewrite) => utils$1.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));
    if (utils$1.isPlainObject(header) || header instanceof this.constructor) {
      setHeaders(header, valueOrRewrite);
    } else if (utils$1.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
      setHeaders(parseHeaders(header), valueOrRewrite);
    } else if (utils$1.isObject(header) && utils$1.isIterable(header)) {
      let obj = {}, dest, key;
      for (const entry of header) {
        if (!utils$1.isArray(entry)) {
          throw TypeError("Object iterator must return a key-value pair");
        }
        obj[key = entry[0]] = (dest = obj[key]) ? utils$1.isArray(dest) ? [...dest, entry[1]] : [dest, entry[1]] : entry[1];
      }
      setHeaders(obj, valueOrRewrite);
    } else {
      header != null && setHeader(valueOrRewrite, header, rewrite);
    }
    return this;
  }
  get(header, parser) {
    header = normalizeHeader(header);
    if (header) {
      const key = utils$1.findKey(this, header);
      if (key) {
        const value = this[key];
        if (!parser) {
          return value;
        }
        if (parser === true) {
          return parseTokens(value);
        }
        if (utils$1.isFunction(parser)) {
          return parser.call(this, value, key);
        }
        if (utils$1.isRegExp(parser)) {
          return parser.exec(value);
        }
        throw new TypeError("parser must be boolean|regexp|function");
      }
    }
  }
  has(header, matcher) {
    header = normalizeHeader(header);
    if (header) {
      const key = utils$1.findKey(this, header);
      return !!(key && this[key] !== void 0 && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
    }
    return false;
  }
  delete(header, matcher) {
    const self2 = this;
    let deleted = false;
    function deleteHeader(_header) {
      _header = normalizeHeader(_header);
      if (_header) {
        const key = utils$1.findKey(self2, _header);
        if (key && (!matcher || matchHeaderValue(self2, self2[key], key, matcher))) {
          delete self2[key];
          deleted = true;
        }
      }
    }
    if (utils$1.isArray(header)) {
      header.forEach(deleteHeader);
    } else {
      deleteHeader(header);
    }
    return deleted;
  }
  clear(matcher) {
    const keys = Object.keys(this);
    let i = keys.length;
    let deleted = false;
    while (i--) {
      const key = keys[i];
      if (!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
        delete this[key];
        deleted = true;
      }
    }
    return deleted;
  }
  normalize(format) {
    const self2 = this;
    const headers = {};
    utils$1.forEach(this, (value, header) => {
      const key = utils$1.findKey(headers, header);
      if (key) {
        self2[key] = normalizeValue(value);
        delete self2[header];
        return;
      }
      const normalized = format ? formatHeader(header) : String(header).trim();
      if (normalized !== header) {
        delete self2[header];
      }
      self2[normalized] = normalizeValue(value);
      headers[normalized] = true;
    });
    return this;
  }
  concat(...targets) {
    return this.constructor.concat(this, ...targets);
  }
  toJSON(asStrings) {
    const obj = /* @__PURE__ */ Object.create(null);
    utils$1.forEach(this, (value, header) => {
      value != null && value !== false && (obj[header] = asStrings && utils$1.isArray(value) ? value.join(", ") : value);
    });
    return obj;
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([header, value]) => header + ": " + value).join("\n");
  }
  getSetCookie() {
    return this.get("set-cookie") || [];
  }
  get [Symbol.toStringTag]() {
    return "AxiosHeaders";
  }
  static from(thing) {
    return thing instanceof this ? thing : new this(thing);
  }
  static concat(first, ...targets) {
    const computed = new this(first);
    targets.forEach((target) => computed.set(target));
    return computed;
  }
  static accessor(header) {
    const internals = this[$internals] = this[$internals] = {
      accessors: {}
    };
    const accessors = internals.accessors;
    const prototype2 = this.prototype;
    function defineAccessor(_header) {
      const lHeader = normalizeHeader(_header);
      if (!accessors[lHeader]) {
        buildAccessors(prototype2, _header);
        accessors[lHeader] = true;
      }
    }
    utils$1.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);
    return this;
  }
};
AxiosHeaders$1.accessor([
  "Content-Type",
  "Content-Length",
  "Accept",
  "Accept-Encoding",
  "User-Agent",
  "Authorization"
]);
utils$1.reduceDescriptors(AxiosHeaders$1.prototype, ({ value }, key) => {
  let mapped = key[0].toUpperCase() + key.slice(1);
  return {
    get: () => value,
    set(headerValue) {
      this[mapped] = headerValue;
    }
  };
});
utils$1.freezeMethods(AxiosHeaders$1);
function transformData(fns, response) {
  const config = this || defaults;
  const context = response || config;
  const headers = AxiosHeaders$1.from(context.headers);
  let data = context.data;
  utils$1.forEach(fns, function transform(fn) {
    data = fn.call(config, data, headers.normalize(), response ? response.status : void 0);
  });
  headers.normalize();
  return data;
}
function isCancel$1(value) {
  return !!(value && value.__CANCEL__);
}
let CanceledError$1 = class CanceledError extends AxiosError$1 {
  /**
   * A `CanceledError` is an object that is thrown when an operation is canceled.
   *
   * @param {string=} message The message.
   * @param {Object=} config The config.
   * @param {Object=} request The request.
   *
   * @returns {CanceledError} The created error.
   */
  constructor(message, config, request) {
    super(message == null ? "canceled" : message, AxiosError$1.ERR_CANCELED, config, request);
    this.name = "CanceledError";
    this.__CANCEL__ = true;
  }
};
function settle(resolve, reject, response) {
  const validateStatus2 = response.config.validateStatus;
  if (!response.status || !validateStatus2 || validateStatus2(response.status)) {
    resolve(response);
  } else {
    reject(
      new AxiosError$1(
        "Request failed with status code " + response.status,
        [AxiosError$1.ERR_BAD_REQUEST, AxiosError$1.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
        response.config,
        response.request,
        response
      )
    );
  }
}
function isAbsoluteURL(url2) {
  if (typeof url2 !== "string") {
    return false;
  }
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url2);
}
function combineURLs(baseURL, relativeURL) {
  return relativeURL ? baseURL.replace(/\/?\/$/, "") + "/" + relativeURL.replace(/^\/+/, "") : baseURL;
}
function buildFullPath(baseURL, requestedURL, allowAbsoluteUrls) {
  let isRelativeUrl = !isAbsoluteURL(requestedURL);
  if (baseURL && (isRelativeUrl || allowAbsoluteUrls === false)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
}
var DEFAULT_PORTS$1 = {
  ftp: 21,
  gopher: 70,
  http: 80,
  https: 443,
  ws: 80,
  wss: 443
};
function parseUrl$1(urlString) {
  try {
    return new URL(urlString);
  } catch {
    return null;
  }
}
function getProxyForUrl(url2) {
  var parsedUrl = (typeof url2 === "string" ? parseUrl$1(url2) : url2) || {};
  var proto = parsedUrl.protocol;
  var hostname = parsedUrl.host;
  var port = parsedUrl.port;
  if (typeof hostname !== "string" || !hostname || typeof proto !== "string") {
    return "";
  }
  proto = proto.split(":", 1)[0];
  hostname = hostname.replace(/:\d*$/, "");
  port = parseInt(port) || DEFAULT_PORTS$1[proto] || 0;
  if (!shouldProxy(hostname, port)) {
    return "";
  }
  var proxy = getEnv(proto + "_proxy") || getEnv("all_proxy");
  if (proxy && proxy.indexOf("://") === -1) {
    proxy = proto + "://" + proxy;
  }
  return proxy;
}
function shouldProxy(hostname, port) {
  var NO_PROXY = getEnv("no_proxy").toLowerCase();
  if (!NO_PROXY) {
    return true;
  }
  if (NO_PROXY === "*") {
    return false;
  }
  return NO_PROXY.split(/[,\s]/).every(function(proxy) {
    if (!proxy) {
      return true;
    }
    var parsedProxy = proxy.match(/^(.+):(\d+)$/);
    var parsedProxyHostname = parsedProxy ? parsedProxy[1] : proxy;
    var parsedProxyPort = parsedProxy ? parseInt(parsedProxy[2]) : 0;
    if (parsedProxyPort && parsedProxyPort !== port) {
      return true;
    }
    if (!/^[.*]/.test(parsedProxyHostname)) {
      return hostname !== parsedProxyHostname;
    }
    if (parsedProxyHostname.charAt(0) === "*") {
      parsedProxyHostname = parsedProxyHostname.slice(1);
    }
    return !hostname.endsWith(parsedProxyHostname);
  });
}
function getEnv(key) {
  return process.env[key.toLowerCase()] || process.env[key.toUpperCase()] || "";
}
var followRedirects$1 = { exports: {} };
var src = { exports: {} };
var browser = { exports: {} };
var ms;
var hasRequiredMs;
function requireMs() {
  if (hasRequiredMs) return ms;
  hasRequiredMs = 1;
  var s = 1e3;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var w = d * 7;
  var y = d * 365.25;
  ms = function(val, options) {
    options = options || {};
    var type2 = typeof val;
    if (type2 === "string" && val.length > 0) {
      return parse(val);
    } else if (type2 === "number" && isFinite(val)) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
    );
  };
  function parse(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
      str
    );
    if (!match) {
      return;
    }
    var n = parseFloat(match[1]);
    var type2 = (match[2] || "ms").toLowerCase();
    switch (type2) {
      case "years":
      case "year":
      case "yrs":
      case "yr":
      case "y":
        return n * y;
      case "weeks":
      case "week":
      case "w":
        return n * w;
      case "days":
      case "day":
      case "d":
        return n * d;
      case "hours":
      case "hour":
      case "hrs":
      case "hr":
      case "h":
        return n * h;
      case "minutes":
      case "minute":
      case "mins":
      case "min":
      case "m":
        return n * m;
      case "seconds":
      case "second":
      case "secs":
      case "sec":
      case "s":
        return n * s;
      case "milliseconds":
      case "millisecond":
      case "msecs":
      case "msec":
      case "ms":
        return n;
      default:
        return void 0;
    }
  }
  function fmtShort(ms2) {
    var msAbs = Math.abs(ms2);
    if (msAbs >= d) {
      return Math.round(ms2 / d) + "d";
    }
    if (msAbs >= h) {
      return Math.round(ms2 / h) + "h";
    }
    if (msAbs >= m) {
      return Math.round(ms2 / m) + "m";
    }
    if (msAbs >= s) {
      return Math.round(ms2 / s) + "s";
    }
    return ms2 + "ms";
  }
  function fmtLong(ms2) {
    var msAbs = Math.abs(ms2);
    if (msAbs >= d) {
      return plural(ms2, msAbs, d, "day");
    }
    if (msAbs >= h) {
      return plural(ms2, msAbs, h, "hour");
    }
    if (msAbs >= m) {
      return plural(ms2, msAbs, m, "minute");
    }
    if (msAbs >= s) {
      return plural(ms2, msAbs, s, "second");
    }
    return ms2 + " ms";
  }
  function plural(ms2, msAbs, n, name) {
    var isPlural = msAbs >= n * 1.5;
    return Math.round(ms2 / n) + " " + name + (isPlural ? "s" : "");
  }
  return ms;
}
var common;
var hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon) return common;
  hasRequiredCommon = 1;
  function setup(env2) {
    createDebug.debug = createDebug;
    createDebug.default = createDebug;
    createDebug.coerce = coerce;
    createDebug.disable = disable;
    createDebug.enable = enable;
    createDebug.enabled = enabled;
    createDebug.humanize = requireMs();
    createDebug.destroy = destroy2;
    Object.keys(env2).forEach((key) => {
      createDebug[key] = env2[key];
    });
    createDebug.names = [];
    createDebug.skips = [];
    createDebug.formatters = {};
    function selectColor(namespace) {
      let hash = 0;
      for (let i = 0; i < namespace.length; i++) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i);
        hash |= 0;
      }
      return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    }
    createDebug.selectColor = selectColor;
    function createDebug(namespace) {
      let prevTime;
      let enableOverride = null;
      let namespacesCache;
      let enabledCache;
      function debug2(...args) {
        if (!debug2.enabled) {
          return;
        }
        const self2 = debug2;
        const curr = Number(/* @__PURE__ */ new Date());
        const ms2 = curr - (prevTime || curr);
        self2.diff = ms2;
        self2.prev = prevTime;
        self2.curr = curr;
        prevTime = curr;
        args[0] = createDebug.coerce(args[0]);
        if (typeof args[0] !== "string") {
          args.unshift("%O");
        }
        let index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
          if (match === "%%") {
            return "%";
          }
          index++;
          const formatter = createDebug.formatters[format];
          if (typeof formatter === "function") {
            const val = args[index];
            match = formatter.call(self2, val);
            args.splice(index, 1);
            index--;
          }
          return match;
        });
        createDebug.formatArgs.call(self2, args);
        const logFn = self2.log || createDebug.log;
        logFn.apply(self2, args);
      }
      debug2.namespace = namespace;
      debug2.useColors = createDebug.useColors();
      debug2.color = createDebug.selectColor(namespace);
      debug2.extend = extend2;
      debug2.destroy = createDebug.destroy;
      Object.defineProperty(debug2, "enabled", {
        enumerable: true,
        configurable: false,
        get: () => {
          if (enableOverride !== null) {
            return enableOverride;
          }
          if (namespacesCache !== createDebug.namespaces) {
            namespacesCache = createDebug.namespaces;
            enabledCache = createDebug.enabled(namespace);
          }
          return enabledCache;
        },
        set: (v) => {
          enableOverride = v;
        }
      });
      if (typeof createDebug.init === "function") {
        createDebug.init(debug2);
      }
      return debug2;
    }
    function extend2(namespace, delimiter) {
      const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
      newDebug.log = this.log;
      return newDebug;
    }
    function enable(namespaces) {
      createDebug.save(namespaces);
      createDebug.namespaces = namespaces;
      createDebug.names = [];
      createDebug.skips = [];
      const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const ns of split) {
        if (ns[0] === "-") {
          createDebug.skips.push(ns.slice(1));
        } else {
          createDebug.names.push(ns);
        }
      }
    }
    function matchesTemplate(search, template) {
      let searchIndex = 0;
      let templateIndex = 0;
      let starIndex = -1;
      let matchIndex = 0;
      while (searchIndex < search.length) {
        if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
          if (template[templateIndex] === "*") {
            starIndex = templateIndex;
            matchIndex = searchIndex;
            templateIndex++;
          } else {
            searchIndex++;
            templateIndex++;
          }
        } else if (starIndex !== -1) {
          templateIndex = starIndex + 1;
          matchIndex++;
          searchIndex = matchIndex;
        } else {
          return false;
        }
      }
      while (templateIndex < template.length && template[templateIndex] === "*") {
        templateIndex++;
      }
      return templateIndex === template.length;
    }
    function disable() {
      const namespaces = [
        ...createDebug.names,
        ...createDebug.skips.map((namespace) => "-" + namespace)
      ].join(",");
      createDebug.enable("");
      return namespaces;
    }
    function enabled(name) {
      for (const skip of createDebug.skips) {
        if (matchesTemplate(name, skip)) {
          return false;
        }
      }
      for (const ns of createDebug.names) {
        if (matchesTemplate(name, ns)) {
          return true;
        }
      }
      return false;
    }
    function coerce(val) {
      if (val instanceof Error) {
        return val.stack || val.message;
      }
      return val;
    }
    function destroy2() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    createDebug.enable(createDebug.load());
    return createDebug;
  }
  common = setup;
  return common;
}
var hasRequiredBrowser;
function requireBrowser() {
  if (hasRequiredBrowser) return browser.exports;
  hasRequiredBrowser = 1;
  (function(module2, exports$1) {
    exports$1.formatArgs = formatArgs;
    exports$1.save = save;
    exports$1.load = load;
    exports$1.useColors = useColors;
    exports$1.storage = localstorage();
    exports$1.destroy = /* @__PURE__ */ (() => {
      let warned = false;
      return () => {
        if (!warned) {
          warned = true;
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
      };
    })();
    exports$1.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
        return true;
      }
      if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }
      let m;
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module2.exports.humanize(this.diff);
      if (!this.useColors) {
        return;
      }
      const c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      let index = 0;
      let lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match) => {
        if (match === "%%") {
          return;
        }
        index++;
        if (match === "%c") {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    exports$1.log = console.debug || console.log || (() => {
    });
    function save(namespaces) {
      try {
        if (namespaces) {
          exports$1.storage.setItem("debug", namespaces);
        } else {
          exports$1.storage.removeItem("debug");
        }
      } catch (error) {
      }
    }
    function load() {
      let r;
      try {
        r = exports$1.storage.getItem("debug") || exports$1.storage.getItem("DEBUG");
      } catch (error) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    function localstorage() {
      try {
        return localStorage;
      } catch (error) {
      }
    }
    module2.exports = requireCommon()(exports$1);
    const { formatters } = module2.exports;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error) {
        return "[UnexpectedJSONParseError]: " + error.message;
      }
    };
  })(browser, browser.exports);
  return browser.exports;
}
var node = { exports: {} };
var hasFlag;
var hasRequiredHasFlag;
function requireHasFlag() {
  if (hasRequiredHasFlag) return hasFlag;
  hasRequiredHasFlag = 1;
  hasFlag = (flag, argv = process.argv) => {
    const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
    const position = argv.indexOf(prefix + flag);
    const terminatorPosition = argv.indexOf("--");
    return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
  };
  return hasFlag;
}
var supportsColor_1;
var hasRequiredSupportsColor;
function requireSupportsColor() {
  if (hasRequiredSupportsColor) return supportsColor_1;
  hasRequiredSupportsColor = 1;
  const os$1 = os;
  const tty = require$$1$1;
  const hasFlag2 = requireHasFlag();
  const { env: env2 } = process;
  let forceColor;
  if (hasFlag2("no-color") || hasFlag2("no-colors") || hasFlag2("color=false") || hasFlag2("color=never")) {
    forceColor = 0;
  } else if (hasFlag2("color") || hasFlag2("colors") || hasFlag2("color=true") || hasFlag2("color=always")) {
    forceColor = 1;
  }
  if ("FORCE_COLOR" in env2) {
    if (env2.FORCE_COLOR === "true") {
      forceColor = 1;
    } else if (env2.FORCE_COLOR === "false") {
      forceColor = 0;
    } else {
      forceColor = env2.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env2.FORCE_COLOR, 10), 3);
    }
  }
  function translateLevel(level) {
    if (level === 0) {
      return false;
    }
    return {
      level,
      hasBasic: true,
      has256: level >= 2,
      has16m: level >= 3
    };
  }
  function supportsColor(haveStream, streamIsTTY) {
    if (forceColor === 0) {
      return 0;
    }
    if (hasFlag2("color=16m") || hasFlag2("color=full") || hasFlag2("color=truecolor")) {
      return 3;
    }
    if (hasFlag2("color=256")) {
      return 2;
    }
    if (haveStream && !streamIsTTY && forceColor === void 0) {
      return 0;
    }
    const min2 = forceColor || 0;
    if (env2.TERM === "dumb") {
      return min2;
    }
    if (process.platform === "win32") {
      const osRelease = os$1.release().split(".");
      if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
        return Number(osRelease[2]) >= 14931 ? 3 : 2;
      }
      return 1;
    }
    if ("CI" in env2) {
      if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((sign3) => sign3 in env2) || env2.CI_NAME === "codeship") {
        return 1;
      }
      return min2;
    }
    if ("TEAMCITY_VERSION" in env2) {
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env2.TEAMCITY_VERSION) ? 1 : 0;
    }
    if (env2.COLORTERM === "truecolor") {
      return 3;
    }
    if ("TERM_PROGRAM" in env2) {
      const version = parseInt((env2.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (env2.TERM_PROGRAM) {
        case "iTerm.app":
          return version >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    if (/-256(color)?$/i.test(env2.TERM)) {
      return 2;
    }
    if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env2.TERM)) {
      return 1;
    }
    if ("COLORTERM" in env2) {
      return 1;
    }
    return min2;
  }
  function getSupportLevel(stream2) {
    const level = supportsColor(stream2, stream2 && stream2.isTTY);
    return translateLevel(level);
  }
  supportsColor_1 = {
    supportsColor: getSupportLevel,
    stdout: translateLevel(supportsColor(true, tty.isatty(1))),
    stderr: translateLevel(supportsColor(true, tty.isatty(2)))
  };
  return supportsColor_1;
}
var hasRequiredNode;
function requireNode() {
  if (hasRequiredNode) return node.exports;
  hasRequiredNode = 1;
  (function(module2, exports$1) {
    const tty = require$$1$1;
    const util2 = require$$1;
    exports$1.init = init;
    exports$1.log = log;
    exports$1.formatArgs = formatArgs;
    exports$1.save = save;
    exports$1.load = load;
    exports$1.useColors = useColors;
    exports$1.destroy = util2.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    );
    exports$1.colors = [6, 2, 3, 4, 5, 1];
    try {
      const supportsColor = requireSupportsColor();
      if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
        exports$1.colors = [
          20,
          21,
          26,
          27,
          32,
          33,
          38,
          39,
          40,
          41,
          42,
          43,
          44,
          45,
          56,
          57,
          62,
          63,
          68,
          69,
          74,
          75,
          76,
          77,
          78,
          79,
          80,
          81,
          92,
          93,
          98,
          99,
          112,
          113,
          128,
          129,
          134,
          135,
          148,
          149,
          160,
          161,
          162,
          163,
          164,
          165,
          166,
          167,
          168,
          169,
          170,
          171,
          172,
          173,
          178,
          179,
          184,
          185,
          196,
          197,
          198,
          199,
          200,
          201,
          202,
          203,
          204,
          205,
          206,
          207,
          208,
          209,
          214,
          215,
          220,
          221
        ];
      }
    } catch (error) {
    }
    exports$1.inspectOpts = Object.keys(process.env).filter((key) => {
      return /^debug_/i.test(key);
    }).reduce((obj, key) => {
      const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
        return k.toUpperCase();
      });
      let val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) {
        val = true;
      } else if (/^(no|off|false|disabled)$/i.test(val)) {
        val = false;
      } else if (val === "null") {
        val = null;
      } else {
        val = Number(val);
      }
      obj[prop] = val;
      return obj;
    }, {});
    function useColors() {
      return "colors" in exports$1.inspectOpts ? Boolean(exports$1.inspectOpts.colors) : tty.isatty(process.stderr.fd);
    }
    function formatArgs(args) {
      const { namespace: name, useColors: useColors2 } = this;
      if (useColors2) {
        const c = this.color;
        const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
        const prefix = `  ${colorCode};1m${name} \x1B[0m`;
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push(colorCode + "m+" + module2.exports.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = getDate() + name + " " + args[0];
      }
    }
    function getDate() {
      if (exports$1.inspectOpts.hideDate) {
        return "";
      }
      return (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function log(...args) {
      return process.stderr.write(util2.formatWithOptions(exports$1.inspectOpts, ...args) + "\n");
    }
    function save(namespaces) {
      if (namespaces) {
        process.env.DEBUG = namespaces;
      } else {
        delete process.env.DEBUG;
      }
    }
    function load() {
      return process.env.DEBUG;
    }
    function init(debug2) {
      debug2.inspectOpts = {};
      const keys = Object.keys(exports$1.inspectOpts);
      for (let i = 0; i < keys.length; i++) {
        debug2.inspectOpts[keys[i]] = exports$1.inspectOpts[keys[i]];
      }
    }
    module2.exports = requireCommon()(exports$1);
    const { formatters } = module2.exports;
    formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util2.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
    };
    formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util2.inspect(v, this.inspectOpts);
    };
  })(node, node.exports);
  return node.exports;
}
var hasRequiredSrc;
function requireSrc() {
  if (hasRequiredSrc) return src.exports;
  hasRequiredSrc = 1;
  if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) {
    src.exports = requireBrowser();
  } else {
    src.exports = requireNode();
  }
  return src.exports;
}
var debug$1;
var debug_1 = function() {
  if (!debug$1) {
    try {
      debug$1 = requireSrc()("follow-redirects");
    } catch (error) {
    }
    if (typeof debug$1 !== "function") {
      debug$1 = function() {
      };
    }
  }
  debug$1.apply(null, arguments);
};
var url = require$$5;
var URL$1 = url.URL;
var http = require$$3;
var https = require$$4;
var Writable = stream.Writable;
var assert = require$$4$1;
var debug = debug_1;
(function detectUnsupportedEnvironment() {
  var looksLikeNode = typeof process !== "undefined";
  var looksLikeBrowser = typeof window !== "undefined" && typeof document !== "undefined";
  var looksLikeV8 = isFunction$1(Error.captureStackTrace);
  if (!looksLikeNode && (looksLikeBrowser || !looksLikeV8)) {
    console.warn("The follow-redirects package should be excluded from browser builds.");
  }
})();
var useNativeURL = false;
try {
  assert(new URL$1(""));
} catch (error) {
  useNativeURL = error.code === "ERR_INVALID_URL";
}
var sensitiveHeaders = [
  "Authorization",
  "Proxy-Authorization",
  "Cookie"
];
var preservedUrlFields = [
  "auth",
  "host",
  "hostname",
  "href",
  "path",
  "pathname",
  "port",
  "protocol",
  "query",
  "search",
  "hash"
];
var events = ["abort", "aborted", "connect", "error", "socket", "timeout"];
var eventHandlers = /* @__PURE__ */ Object.create(null);
events.forEach(function(event) {
  eventHandlers[event] = function(arg1, arg2, arg3) {
    this._redirectable.emit(event, arg1, arg2, arg3);
  };
});
var InvalidUrlError = createErrorType(
  "ERR_INVALID_URL",
  "Invalid URL",
  TypeError
);
var RedirectionError = createErrorType(
  "ERR_FR_REDIRECTION_FAILURE",
  "Redirected request failed"
);
var TooManyRedirectsError = createErrorType(
  "ERR_FR_TOO_MANY_REDIRECTS",
  "Maximum number of redirects exceeded",
  RedirectionError
);
var MaxBodyLengthExceededError = createErrorType(
  "ERR_FR_MAX_BODY_LENGTH_EXCEEDED",
  "Request body larger than maxBodyLength limit"
);
var WriteAfterEndError = createErrorType(
  "ERR_STREAM_WRITE_AFTER_END",
  "write after end"
);
var destroy = Writable.prototype.destroy || noop;
function RedirectableRequest(options, responseCallback) {
  Writable.call(this);
  this._sanitizeOptions(options);
  this._options = options;
  this._ended = false;
  this._ending = false;
  this._redirectCount = 0;
  this._redirects = [];
  this._requestBodyLength = 0;
  this._requestBodyBuffers = [];
  if (responseCallback) {
    this.on("response", responseCallback);
  }
  var self2 = this;
  this._onNativeResponse = function(response) {
    try {
      self2._processResponse(response);
    } catch (cause) {
      self2.emit("error", cause instanceof RedirectionError ? cause : new RedirectionError({ cause }));
    }
  };
  this._headerFilter = new RegExp("^(?:" + sensitiveHeaders.concat(options.sensitiveHeaders).map(escapeRegex).join("|") + ")$", "i");
  this._performRequest();
}
RedirectableRequest.prototype = Object.create(Writable.prototype);
RedirectableRequest.prototype.abort = function() {
  destroyRequest(this._currentRequest);
  this._currentRequest.abort();
  this.emit("abort");
};
RedirectableRequest.prototype.destroy = function(error) {
  destroyRequest(this._currentRequest, error);
  destroy.call(this, error);
  return this;
};
RedirectableRequest.prototype.write = function(data, encoding, callback) {
  if (this._ending) {
    throw new WriteAfterEndError();
  }
  if (!isString(data) && !isBuffer(data)) {
    throw new TypeError("data should be a string, Buffer or Uint8Array");
  }
  if (isFunction$1(encoding)) {
    callback = encoding;
    encoding = null;
  }
  if (data.length === 0) {
    if (callback) {
      callback();
    }
    return;
  }
  if (this._requestBodyLength + data.length <= this._options.maxBodyLength) {
    this._requestBodyLength += data.length;
    this._requestBodyBuffers.push({ data, encoding });
    this._currentRequest.write(data, encoding, callback);
  } else {
    this.emit("error", new MaxBodyLengthExceededError());
    this.abort();
  }
};
RedirectableRequest.prototype.end = function(data, encoding, callback) {
  if (isFunction$1(data)) {
    callback = data;
    data = encoding = null;
  } else if (isFunction$1(encoding)) {
    callback = encoding;
    encoding = null;
  }
  if (!data) {
    this._ended = this._ending = true;
    this._currentRequest.end(null, null, callback);
  } else {
    var self2 = this;
    var currentRequest = this._currentRequest;
    this.write(data, encoding, function() {
      self2._ended = true;
      currentRequest.end(null, null, callback);
    });
    this._ending = true;
  }
};
RedirectableRequest.prototype.setHeader = function(name, value) {
  this._options.headers[name] = value;
  this._currentRequest.setHeader(name, value);
};
RedirectableRequest.prototype.removeHeader = function(name) {
  delete this._options.headers[name];
  this._currentRequest.removeHeader(name);
};
RedirectableRequest.prototype.setTimeout = function(msecs, callback) {
  var self2 = this;
  function destroyOnTimeout(socket) {
    socket.setTimeout(msecs);
    socket.removeListener("timeout", socket.destroy);
    socket.addListener("timeout", socket.destroy);
  }
  function startTimer(socket) {
    if (self2._timeout) {
      clearTimeout(self2._timeout);
    }
    self2._timeout = setTimeout(function() {
      self2.emit("timeout");
      clearTimer();
    }, msecs);
    destroyOnTimeout(socket);
  }
  function clearTimer() {
    if (self2._timeout) {
      clearTimeout(self2._timeout);
      self2._timeout = null;
    }
    self2.removeListener("abort", clearTimer);
    self2.removeListener("error", clearTimer);
    self2.removeListener("response", clearTimer);
    self2.removeListener("close", clearTimer);
    if (callback) {
      self2.removeListener("timeout", callback);
    }
    if (!self2.socket) {
      self2._currentRequest.removeListener("socket", startTimer);
    }
  }
  if (callback) {
    this.on("timeout", callback);
  }
  if (this.socket) {
    startTimer(this.socket);
  } else {
    this._currentRequest.once("socket", startTimer);
  }
  this.on("socket", destroyOnTimeout);
  this.on("abort", clearTimer);
  this.on("error", clearTimer);
  this.on("response", clearTimer);
  this.on("close", clearTimer);
  return this;
};
[
  "flushHeaders",
  "getHeader",
  "setNoDelay",
  "setSocketKeepAlive"
].forEach(function(method) {
  RedirectableRequest.prototype[method] = function(a, b) {
    return this._currentRequest[method](a, b);
  };
});
["aborted", "connection", "socket"].forEach(function(property) {
  Object.defineProperty(RedirectableRequest.prototype, property, {
    get: function() {
      return this._currentRequest[property];
    }
  });
});
RedirectableRequest.prototype._sanitizeOptions = function(options) {
  if (!options.headers) {
    options.headers = {};
  }
  if (!isArray(options.sensitiveHeaders)) {
    options.sensitiveHeaders = [];
  }
  if (options.host) {
    if (!options.hostname) {
      options.hostname = options.host;
    }
    delete options.host;
  }
  if (!options.pathname && options.path) {
    var searchPos = options.path.indexOf("?");
    if (searchPos < 0) {
      options.pathname = options.path;
    } else {
      options.pathname = options.path.substring(0, searchPos);
      options.search = options.path.substring(searchPos);
    }
  }
};
RedirectableRequest.prototype._performRequest = function() {
  var protocol = this._options.protocol;
  var nativeProtocol = this._options.nativeProtocols[protocol];
  if (!nativeProtocol) {
    throw new TypeError("Unsupported protocol " + protocol);
  }
  if (this._options.agents) {
    var scheme = protocol.slice(0, -1);
    this._options.agent = this._options.agents[scheme];
  }
  var request = this._currentRequest = nativeProtocol.request(this._options, this._onNativeResponse);
  request._redirectable = this;
  for (var event of events) {
    request.on(event, eventHandlers[event]);
  }
  this._currentUrl = /^\//.test(this._options.path) ? url.format(this._options) : (
    // When making a request to a proxy, […]
    // a client MUST send the target URI in absolute-form […].
    this._options.path
  );
  if (this._isRedirect) {
    var i = 0;
    var self2 = this;
    var buffers = this._requestBodyBuffers;
    (function writeNext(error) {
      if (request === self2._currentRequest) {
        if (error) {
          self2.emit("error", error);
        } else if (i < buffers.length) {
          var buffer = buffers[i++];
          if (!request.finished) {
            request.write(buffer.data, buffer.encoding, writeNext);
          }
        } else if (self2._ended) {
          request.end();
        }
      }
    })();
  }
};
RedirectableRequest.prototype._processResponse = function(response) {
  var statusCode = response.statusCode;
  if (this._options.trackRedirects) {
    this._redirects.push({
      url: this._currentUrl,
      headers: response.headers,
      statusCode
    });
  }
  var location = response.headers.location;
  if (!location || this._options.followRedirects === false || statusCode < 300 || statusCode >= 400) {
    response.responseUrl = this._currentUrl;
    response.redirects = this._redirects;
    this.emit("response", response);
    this._requestBodyBuffers = [];
    return;
  }
  destroyRequest(this._currentRequest);
  response.destroy();
  if (++this._redirectCount > this._options.maxRedirects) {
    throw new TooManyRedirectsError();
  }
  var requestHeaders;
  var beforeRedirect = this._options.beforeRedirect;
  if (beforeRedirect) {
    requestHeaders = Object.assign({
      // The Host header was set by nativeProtocol.request
      Host: response.req.getHeader("host")
    }, this._options.headers);
  }
  var method = this._options.method;
  if ((statusCode === 301 || statusCode === 302) && this._options.method === "POST" || // RFC7231§6.4.4: The 303 (See Other) status code indicates that
  // the server is redirecting the user agent to a different resource […]
  // A user agent can perform a retrieval request targeting that URI
  // (a GET or HEAD request if using HTTP) […]
  statusCode === 303 && !/^(?:GET|HEAD)$/.test(this._options.method)) {
    this._options.method = "GET";
    this._requestBodyBuffers = [];
    removeMatchingHeaders(/^content-/i, this._options.headers);
  }
  var currentHostHeader = removeMatchingHeaders(/^host$/i, this._options.headers);
  var currentUrlParts = parseUrl(this._currentUrl);
  var currentHost = currentHostHeader || currentUrlParts.host;
  var currentUrl = /^\w+:/.test(location) ? this._currentUrl : url.format(Object.assign(currentUrlParts, { host: currentHost }));
  var redirectUrl = resolveUrl(location, currentUrl);
  debug("redirecting to", redirectUrl.href);
  this._isRedirect = true;
  spreadUrlObject(redirectUrl, this._options);
  if (redirectUrl.protocol !== currentUrlParts.protocol && redirectUrl.protocol !== "https:" || redirectUrl.host !== currentHost && !isSubdomain(redirectUrl.host, currentHost)) {
    removeMatchingHeaders(this._headerFilter, this._options.headers);
  }
  if (isFunction$1(beforeRedirect)) {
    var responseDetails = {
      headers: response.headers,
      statusCode
    };
    var requestDetails = {
      url: currentUrl,
      method,
      headers: requestHeaders
    };
    beforeRedirect(this._options, responseDetails, requestDetails);
    this._sanitizeOptions(this._options);
  }
  this._performRequest();
};
function wrap(protocols) {
  var exports$1 = {
    maxRedirects: 21,
    maxBodyLength: 10 * 1024 * 1024
  };
  var nativeProtocols = {};
  Object.keys(protocols).forEach(function(scheme) {
    var protocol = scheme + ":";
    var nativeProtocol = nativeProtocols[protocol] = protocols[scheme];
    var wrappedProtocol = exports$1[scheme] = Object.create(nativeProtocol);
    function request(input, options, callback) {
      if (isURL(input)) {
        input = spreadUrlObject(input);
      } else if (isString(input)) {
        input = spreadUrlObject(parseUrl(input));
      } else {
        callback = options;
        options = validateUrl(input);
        input = { protocol };
      }
      if (isFunction$1(options)) {
        callback = options;
        options = null;
      }
      options = Object.assign({
        maxRedirects: exports$1.maxRedirects,
        maxBodyLength: exports$1.maxBodyLength
      }, input, options);
      options.nativeProtocols = nativeProtocols;
      if (!isString(options.host) && !isString(options.hostname)) {
        options.hostname = "::1";
      }
      assert.equal(options.protocol, protocol, "protocol mismatch");
      debug("options", options);
      return new RedirectableRequest(options, callback);
    }
    function get2(input, options, callback) {
      var wrappedRequest = wrappedProtocol.request(input, options, callback);
      wrappedRequest.end();
      return wrappedRequest;
    }
    Object.defineProperties(wrappedProtocol, {
      request: { value: request, configurable: true, enumerable: true, writable: true },
      get: { value: get2, configurable: true, enumerable: true, writable: true }
    });
  });
  return exports$1;
}
function noop() {
}
function parseUrl(input) {
  var parsed;
  if (useNativeURL) {
    parsed = new URL$1(input);
  } else {
    parsed = validateUrl(url.parse(input));
    if (!isString(parsed.protocol)) {
      throw new InvalidUrlError({ input });
    }
  }
  return parsed;
}
function resolveUrl(relative, base) {
  return useNativeURL ? new URL$1(relative, base) : parseUrl(url.resolve(base, relative));
}
function validateUrl(input) {
  if (/^\[/.test(input.hostname) && !/^\[[:0-9a-f]+\]$/i.test(input.hostname)) {
    throw new InvalidUrlError({ input: input.href || input });
  }
  if (/^\[/.test(input.host) && !/^\[[:0-9a-f]+\](:\d+)?$/i.test(input.host)) {
    throw new InvalidUrlError({ input: input.href || input });
  }
  return input;
}
function spreadUrlObject(urlObject, target) {
  var spread2 = target || {};
  for (var key of preservedUrlFields) {
    spread2[key] = urlObject[key];
  }
  if (spread2.hostname.startsWith("[")) {
    spread2.hostname = spread2.hostname.slice(1, -1);
  }
  if (spread2.port !== "") {
    spread2.port = Number(spread2.port);
  }
  spread2.path = spread2.search ? spread2.pathname + spread2.search : spread2.pathname;
  return spread2;
}
function removeMatchingHeaders(regex, headers) {
  var lastValue;
  for (var header in headers) {
    if (regex.test(header)) {
      lastValue = headers[header];
      delete headers[header];
    }
  }
  return lastValue === null || typeof lastValue === "undefined" ? void 0 : String(lastValue).trim();
}
function createErrorType(code, message, baseClass) {
  function CustomError(properties) {
    if (isFunction$1(Error.captureStackTrace)) {
      Error.captureStackTrace(this, this.constructor);
    }
    Object.assign(this, properties || {});
    this.code = code;
    this.message = this.cause ? message + ": " + this.cause.message : message;
  }
  CustomError.prototype = new (baseClass || Error)();
  Object.defineProperties(CustomError.prototype, {
    constructor: {
      value: CustomError,
      enumerable: false
    },
    name: {
      value: "Error [" + code + "]",
      enumerable: false
    }
  });
  return CustomError;
}
function destroyRequest(request, error) {
  for (var event of events) {
    request.removeListener(event, eventHandlers[event]);
  }
  request.on("error", noop);
  request.destroy(error);
}
function isSubdomain(subdomain, domain) {
  assert(isString(subdomain) && isString(domain));
  var dot = subdomain.length - domain.length - 1;
  return dot > 0 && subdomain[dot] === "." && subdomain.endsWith(domain);
}
function isArray(value) {
  return value instanceof Array;
}
function isString(value) {
  return typeof value === "string" || value instanceof String;
}
function isFunction$1(value) {
  return typeof value === "function";
}
function isBuffer(value) {
  return typeof value === "object" && "length" in value;
}
function isURL(value) {
  return URL$1 && value instanceof URL$1;
}
function escapeRegex(regex) {
  return regex.replace(/[\]\\/()*+?.$]/g, "\\$&");
}
followRedirects$1.exports = wrap({ http, https });
followRedirects$1.exports.wrap = wrap;
var followRedirectsExports = followRedirects$1.exports;
const followRedirects = /* @__PURE__ */ getDefaultExportFromCjs(followRedirectsExports);
const VERSION$1 = "1.15.2";
function parseProtocol(url2) {
  const match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url2);
  return match && match[1] || "";
}
const DATA_URL_PATTERN = /^(?:([^;]+);)?(?:[^;]+;)?(base64|),([\s\S]*)$/;
function fromDataURI(uri2, asBlob, options) {
  const _Blob = options && options.Blob || platform.classes.Blob;
  const protocol = parseProtocol(uri2);
  if (asBlob === void 0 && _Blob) {
    asBlob = true;
  }
  if (protocol === "data") {
    uri2 = protocol.length ? uri2.slice(protocol.length + 1) : uri2;
    const match = DATA_URL_PATTERN.exec(uri2);
    if (!match) {
      throw new AxiosError$1("Invalid URL", AxiosError$1.ERR_INVALID_URL);
    }
    const mime2 = match[1];
    const isBase64 = match[2];
    const body = match[3];
    const buffer = Buffer.from(decodeURIComponent(body), isBase64 ? "base64" : "utf8");
    if (asBlob) {
      if (!_Blob) {
        throw new AxiosError$1("Blob is not supported", AxiosError$1.ERR_NOT_SUPPORT);
      }
      return new _Blob([buffer], { type: mime2 });
    }
    return buffer;
  }
  throw new AxiosError$1("Unsupported protocol " + protocol, AxiosError$1.ERR_NOT_SUPPORT);
}
const kInternals = Symbol("internals");
class AxiosTransformStream extends stream.Transform {
  constructor(options) {
    options = utils$1.toFlatObject(
      options,
      {
        maxRate: 0,
        chunkSize: 64 * 1024,
        minChunkSize: 100,
        timeWindow: 500,
        ticksRate: 2,
        samplesCount: 15
      },
      null,
      (prop, source) => {
        return !utils$1.isUndefined(source[prop]);
      }
    );
    super({
      readableHighWaterMark: options.chunkSize
    });
    const internals = this[kInternals] = {
      timeWindow: options.timeWindow,
      chunkSize: options.chunkSize,
      maxRate: options.maxRate,
      minChunkSize: options.minChunkSize,
      bytesSeen: 0,
      isCaptured: false,
      notifiedBytesLoaded: 0,
      ts: Date.now(),
      bytes: 0,
      onReadCallback: null
    };
    this.on("newListener", (event) => {
      if (event === "progress") {
        if (!internals.isCaptured) {
          internals.isCaptured = true;
        }
      }
    });
  }
  _read(size) {
    const internals = this[kInternals];
    if (internals.onReadCallback) {
      internals.onReadCallback();
    }
    return super._read(size);
  }
  _transform(chunk, encoding, callback) {
    const internals = this[kInternals];
    const maxRate = internals.maxRate;
    const readableHighWaterMark = this.readableHighWaterMark;
    const timeWindow = internals.timeWindow;
    const divider = 1e3 / timeWindow;
    const bytesThreshold = maxRate / divider;
    const minChunkSize = internals.minChunkSize !== false ? Math.max(internals.minChunkSize, bytesThreshold * 0.01) : 0;
    const pushChunk = (_chunk, _callback) => {
      const bytes = Buffer.byteLength(_chunk);
      internals.bytesSeen += bytes;
      internals.bytes += bytes;
      internals.isCaptured && this.emit("progress", internals.bytesSeen);
      if (this.push(_chunk)) {
        process.nextTick(_callback);
      } else {
        internals.onReadCallback = () => {
          internals.onReadCallback = null;
          process.nextTick(_callback);
        };
      }
    };
    const transformChunk = (_chunk, _callback) => {
      const chunkSize = Buffer.byteLength(_chunk);
      let chunkRemainder = null;
      let maxChunkSize = readableHighWaterMark;
      let bytesLeft;
      let passed = 0;
      if (maxRate) {
        const now = Date.now();
        if (!internals.ts || (passed = now - internals.ts) >= timeWindow) {
          internals.ts = now;
          bytesLeft = bytesThreshold - internals.bytes;
          internals.bytes = bytesLeft < 0 ? -bytesLeft : 0;
          passed = 0;
        }
        bytesLeft = bytesThreshold - internals.bytes;
      }
      if (maxRate) {
        if (bytesLeft <= 0) {
          return setTimeout(() => {
            _callback(null, _chunk);
          }, timeWindow - passed);
        }
        if (bytesLeft < maxChunkSize) {
          maxChunkSize = bytesLeft;
        }
      }
      if (maxChunkSize && chunkSize > maxChunkSize && chunkSize - maxChunkSize > minChunkSize) {
        chunkRemainder = _chunk.subarray(maxChunkSize);
        _chunk = _chunk.subarray(0, maxChunkSize);
      }
      pushChunk(
        _chunk,
        chunkRemainder ? () => {
          process.nextTick(_callback, null, chunkRemainder);
        } : _callback
      );
    };
    transformChunk(chunk, function transformNextChunk(err, _chunk) {
      if (err) {
        return callback(err);
      }
      if (_chunk) {
        transformChunk(_chunk, transformNextChunk);
      } else {
        callback(null);
      }
    });
  }
}
const { asyncIterator } = Symbol;
const readBlob = async function* (blob) {
  if (blob.stream) {
    yield* blob.stream();
  } else if (blob.arrayBuffer) {
    yield await blob.arrayBuffer();
  } else if (blob[asyncIterator]) {
    yield* blob[asyncIterator]();
  } else {
    yield blob;
  }
};
const BOUNDARY_ALPHABET = platform.ALPHABET.ALPHA_DIGIT + "-_";
const textEncoder = typeof TextEncoder === "function" ? new TextEncoder() : new require$$1.TextEncoder();
const CRLF = "\r\n";
const CRLF_BYTES = textEncoder.encode(CRLF);
const CRLF_BYTES_COUNT = 2;
class FormDataPart {
  constructor(name, value) {
    const { escapeName } = this.constructor;
    const isStringValue = utils$1.isString(value);
    let headers = `Content-Disposition: form-data; name="${escapeName(name)}"${!isStringValue && value.name ? `; filename="${escapeName(value.name)}"` : ""}${CRLF}`;
    if (isStringValue) {
      value = textEncoder.encode(String(value).replace(/\r?\n|\r\n?/g, CRLF));
    } else {
      const safeType = String(value.type || "application/octet-stream").replace(/[\r\n]/g, "");
      headers += `Content-Type: ${safeType}${CRLF}`;
    }
    this.headers = textEncoder.encode(headers + CRLF);
    this.contentLength = isStringValue ? value.byteLength : value.size;
    this.size = this.headers.byteLength + this.contentLength + CRLF_BYTES_COUNT;
    this.name = name;
    this.value = value;
  }
  async *encode() {
    yield this.headers;
    const { value } = this;
    if (utils$1.isTypedArray(value)) {
      yield value;
    } else {
      yield* readBlob(value);
    }
    yield CRLF_BYTES;
  }
  static escapeName(name) {
    return String(name).replace(
      /[\r\n"]/g,
      (match) => ({
        "\r": "%0D",
        "\n": "%0A",
        '"': "%22"
      })[match]
    );
  }
}
const formDataToStream = (form, headersHandler, options) => {
  const {
    tag = "form-data-boundary",
    size = 25,
    boundary = tag + "-" + platform.generateString(size, BOUNDARY_ALPHABET)
  } = options || {};
  if (!utils$1.isFormData(form)) {
    throw TypeError("FormData instance required");
  }
  if (boundary.length < 1 || boundary.length > 70) {
    throw Error("boundary must be 10-70 characters long");
  }
  const boundaryBytes = textEncoder.encode("--" + boundary + CRLF);
  const footerBytes = textEncoder.encode("--" + boundary + "--" + CRLF);
  let contentLength = footerBytes.byteLength;
  const parts = Array.from(form.entries()).map(([name, value]) => {
    const part = new FormDataPart(name, value);
    contentLength += part.size;
    return part;
  });
  contentLength += boundaryBytes.byteLength * parts.length;
  contentLength = utils$1.toFiniteNumber(contentLength);
  const computedHeaders = {
    "Content-Type": `multipart/form-data; boundary=${boundary}`
  };
  if (Number.isFinite(contentLength)) {
    computedHeaders["Content-Length"] = contentLength;
  }
  headersHandler && headersHandler(computedHeaders);
  return stream.Readable.from(
    async function* () {
      for (const part of parts) {
        yield boundaryBytes;
        yield* part.encode();
      }
      yield footerBytes;
    }()
  );
};
class ZlibHeaderTransformStream extends stream.Transform {
  __transform(chunk, encoding, callback) {
    this.push(chunk);
    callback();
  }
  _transform(chunk, encoding, callback) {
    if (chunk.length !== 0) {
      this._transform = this.__transform;
      if (chunk[0] !== 120) {
        const header = Buffer.alloc(2);
        header[0] = 120;
        header[1] = 156;
        this.push(header, encoding);
      }
    }
    this.__transform(chunk, encoding, callback);
  }
}
const callbackify = (fn, reducer) => {
  return utils$1.isAsyncFn(fn) ? function(...args) {
    const cb = args.pop();
    fn.apply(this, args).then((value) => {
      try {
        reducer ? cb(null, ...reducer(value)) : cb(null, value);
      } catch (err) {
        cb(err);
      }
    }, cb);
  } : fn;
};
const LOOPBACK_HOSTNAMES = /* @__PURE__ */ new Set(["localhost"]);
const isIPv4Loopback = (host) => {
  const parts = host.split(".");
  if (parts.length !== 4) return false;
  if (parts[0] !== "127") return false;
  return parts.every((p) => /^\d+$/.test(p) && Number(p) >= 0 && Number(p) <= 255);
};
const isIPv6Loopback = (host) => {
  if (host === "::1") return true;
  const v4MappedDotted = host.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (v4MappedDotted) return isIPv4Loopback(v4MappedDotted[1]);
  const v4MappedHex = host.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (v4MappedHex) {
    const high = parseInt(v4MappedHex[1], 16);
    return high >= 32512 && high <= 32767;
  }
  const groups = host.split(":");
  if (groups.length === 8) {
    for (let i = 0; i < 7; i++) {
      if (!/^0+$/.test(groups[i])) return false;
    }
    return /^0*1$/.test(groups[7]);
  }
  return false;
};
const isLoopback = (host) => {
  if (!host) return false;
  if (LOOPBACK_HOSTNAMES.has(host)) return true;
  if (isIPv4Loopback(host)) return true;
  return isIPv6Loopback(host);
};
const DEFAULT_PORTS = {
  http: 80,
  https: 443,
  ws: 80,
  wss: 443,
  ftp: 21
};
const parseNoProxyEntry = (entry) => {
  let entryHost = entry;
  let entryPort = 0;
  if (entryHost.charAt(0) === "[") {
    const bracketIndex = entryHost.indexOf("]");
    if (bracketIndex !== -1) {
      const host = entryHost.slice(1, bracketIndex);
      const rest = entryHost.slice(bracketIndex + 1);
      if (rest.charAt(0) === ":" && /^\d+$/.test(rest.slice(1))) {
        entryPort = Number.parseInt(rest.slice(1), 10);
      }
      return [host, entryPort];
    }
  }
  const firstColon = entryHost.indexOf(":");
  const lastColon = entryHost.lastIndexOf(":");
  if (firstColon !== -1 && firstColon === lastColon && /^\d+$/.test(entryHost.slice(lastColon + 1))) {
    entryPort = Number.parseInt(entryHost.slice(lastColon + 1), 10);
    entryHost = entryHost.slice(0, lastColon);
  }
  return [entryHost, entryPort];
};
const normalizeNoProxyHost = (hostname) => {
  if (!hostname) {
    return hostname;
  }
  if (hostname.charAt(0) === "[" && hostname.charAt(hostname.length - 1) === "]") {
    hostname = hostname.slice(1, -1);
  }
  return hostname.replace(/\.+$/, "");
};
function shouldBypassProxy(location) {
  let parsed;
  try {
    parsed = new URL(location);
  } catch (_err) {
    return false;
  }
  const noProxy = (process.env.no_proxy || process.env.NO_PROXY || "").toLowerCase();
  if (!noProxy) {
    return false;
  }
  if (noProxy === "*") {
    return true;
  }
  const port = Number.parseInt(parsed.port, 10) || DEFAULT_PORTS[parsed.protocol.split(":", 1)[0]] || 0;
  const hostname = normalizeNoProxyHost(parsed.hostname.toLowerCase());
  return noProxy.split(/[\s,]+/).some((entry) => {
    if (!entry) {
      return false;
    }
    let [entryHost, entryPort] = parseNoProxyEntry(entry);
    entryHost = normalizeNoProxyHost(entryHost);
    if (!entryHost) {
      return false;
    }
    if (entryPort && entryPort !== port) {
      return false;
    }
    if (entryHost.charAt(0) === "*") {
      entryHost = entryHost.slice(1);
    }
    if (entryHost.charAt(0) === ".") {
      return hostname.endsWith(entryHost);
    }
    return hostname === entryHost || isLoopback(hostname) && isLoopback(entryHost);
  });
}
function speedometer(samplesCount, min2) {
  samplesCount = samplesCount || 10;
  const bytes = new Array(samplesCount);
  const timestamps = new Array(samplesCount);
  let head = 0;
  let tail = 0;
  let firstSampleTS;
  min2 = min2 !== void 0 ? min2 : 1e3;
  return function push(chunkLength) {
    const now = Date.now();
    const startedAt = timestamps[tail];
    if (!firstSampleTS) {
      firstSampleTS = now;
    }
    bytes[head] = chunkLength;
    timestamps[head] = now;
    let i = tail;
    let bytesCount = 0;
    while (i !== head) {
      bytesCount += bytes[i++];
      i = i % samplesCount;
    }
    head = (head + 1) % samplesCount;
    if (head === tail) {
      tail = (tail + 1) % samplesCount;
    }
    if (now - firstSampleTS < min2) {
      return;
    }
    const passed = startedAt && now - startedAt;
    return passed ? Math.round(bytesCount * 1e3 / passed) : void 0;
  };
}
function throttle(fn, freq) {
  let timestamp = 0;
  let threshold = 1e3 / freq;
  let lastArgs;
  let timer;
  const invoke = (args, now = Date.now()) => {
    timestamp = now;
    lastArgs = null;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    fn(...args);
  };
  const throttled = (...args) => {
    const now = Date.now();
    const passed = now - timestamp;
    if (passed >= threshold) {
      invoke(args, now);
    } else {
      lastArgs = args;
      if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          invoke(lastArgs);
        }, threshold - passed);
      }
    }
  };
  const flush = () => lastArgs && invoke(lastArgs);
  return [throttled, flush];
}
const progressEventReducer = (listener, isDownloadStream, freq = 3) => {
  let bytesNotified = 0;
  const _speedometer = speedometer(50, 250);
  return throttle((e) => {
    const rawLoaded = e.loaded;
    const total = e.lengthComputable ? e.total : void 0;
    const loaded = total != null ? Math.min(rawLoaded, total) : rawLoaded;
    const progressBytes = Math.max(0, loaded - bytesNotified);
    const rate = _speedometer(progressBytes);
    bytesNotified = Math.max(bytesNotified, loaded);
    const data = {
      loaded,
      total,
      progress: total ? loaded / total : void 0,
      bytes: progressBytes,
      rate: rate ? rate : void 0,
      estimated: rate && total ? (total - loaded) / rate : void 0,
      event: e,
      lengthComputable: total != null,
      [isDownloadStream ? "download" : "upload"]: true
    };
    listener(data);
  }, freq);
};
const progressEventDecorator = (total, throttled) => {
  const lengthComputable = total != null;
  return [
    (loaded) => throttled[0]({
      lengthComputable,
      total,
      loaded
    }),
    throttled[1]
  ];
};
const asyncDecorator = (fn) => (...args) => utils$1.asap(() => fn(...args));
function estimateDataURLDecodedBytes(url2) {
  if (!url2 || typeof url2 !== "string") return 0;
  if (!url2.startsWith("data:")) return 0;
  const comma = url2.indexOf(",");
  if (comma < 0) return 0;
  const meta = url2.slice(5, comma);
  const body = url2.slice(comma + 1);
  const isBase64 = /;base64/i.test(meta);
  if (isBase64) {
    let effectiveLen = body.length;
    const len = body.length;
    for (let i = 0; i < len; i++) {
      if (body.charCodeAt(i) === 37 && i + 2 < len) {
        const a = body.charCodeAt(i + 1);
        const b = body.charCodeAt(i + 2);
        const isHex = (a >= 48 && a <= 57 || a >= 65 && a <= 70 || a >= 97 && a <= 102) && (b >= 48 && b <= 57 || b >= 65 && b <= 70 || b >= 97 && b <= 102);
        if (isHex) {
          effectiveLen -= 2;
          i += 2;
        }
      }
    }
    let pad = 0;
    let idx = len - 1;
    const tailIsPct3D = (j) => j >= 2 && body.charCodeAt(j - 2) === 37 && // '%'
    body.charCodeAt(j - 1) === 51 && // '3'
    (body.charCodeAt(j) === 68 || body.charCodeAt(j) === 100);
    if (idx >= 0) {
      if (body.charCodeAt(idx) === 61) {
        pad++;
        idx--;
      } else if (tailIsPct3D(idx)) {
        pad++;
        idx -= 3;
      }
    }
    if (pad === 1 && idx >= 0) {
      if (body.charCodeAt(idx) === 61) {
        pad++;
      } else if (tailIsPct3D(idx)) {
        pad++;
      }
    }
    const groups = Math.floor(effectiveLen / 4);
    const bytes = groups * 3 - (pad || 0);
    return bytes > 0 ? bytes : 0;
  }
  return Buffer.byteLength(body, "utf8");
}
const zlibOptions = {
  flush: zlib.constants.Z_SYNC_FLUSH,
  finishFlush: zlib.constants.Z_SYNC_FLUSH
};
const brotliOptions = {
  flush: zlib.constants.BROTLI_OPERATION_FLUSH,
  finishFlush: zlib.constants.BROTLI_OPERATION_FLUSH
};
const isBrotliSupported = utils$1.isFunction(zlib.createBrotliDecompress);
const { http: httpFollow, https: httpsFollow } = followRedirects;
const isHttps = /https:?/;
const kAxiosSocketListener = Symbol("axios.http.socketListener");
const kAxiosCurrentReq = Symbol("axios.http.currentReq");
const supportedProtocols = platform.protocols.map((protocol) => {
  return protocol + ":";
});
const flushOnFinish = (stream2, [throttled, flush]) => {
  stream2.on("end", flush).on("error", flush);
  return throttled;
};
class Http2Sessions {
  constructor() {
    this.sessions = /* @__PURE__ */ Object.create(null);
  }
  getSession(authority, options) {
    options = Object.assign(
      {
        sessionTimeout: 1e3
      },
      options
    );
    let authoritySessions = this.sessions[authority];
    if (authoritySessions) {
      let len = authoritySessions.length;
      for (let i = 0; i < len; i++) {
        const [sessionHandle, sessionOptions] = authoritySessions[i];
        if (!sessionHandle.destroyed && !sessionHandle.closed && require$$1.isDeepStrictEqual(sessionOptions, options)) {
          return sessionHandle;
        }
      }
    }
    const session = http2.connect(authority, options);
    let removed;
    const removeSession = () => {
      if (removed) {
        return;
      }
      removed = true;
      let entries = authoritySessions, len = entries.length, i = len;
      while (i--) {
        if (entries[i][0] === session) {
          if (len === 1) {
            delete this.sessions[authority];
          } else {
            entries.splice(i, 1);
          }
          if (!session.closed) {
            session.close();
          }
          return;
        }
      }
    };
    const originalRequestFn = session.request;
    const { sessionTimeout } = options;
    if (sessionTimeout != null) {
      let timer;
      let streamsCount = 0;
      session.request = function() {
        const stream2 = originalRequestFn.apply(this, arguments);
        streamsCount++;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        stream2.once("close", () => {
          if (!--streamsCount) {
            timer = setTimeout(() => {
              timer = null;
              removeSession();
            }, sessionTimeout);
          }
        });
        return stream2;
      };
    }
    session.once("close", removeSession);
    let entry = [session, options];
    authoritySessions ? authoritySessions.push(entry) : authoritySessions = this.sessions[authority] = [entry];
    return session;
  }
}
const http2Sessions = new Http2Sessions();
function dispatchBeforeRedirect(options, responseDetails) {
  if (options.beforeRedirects.proxy) {
    options.beforeRedirects.proxy(options);
  }
  if (options.beforeRedirects.config) {
    options.beforeRedirects.config(options, responseDetails);
  }
}
function setProxy(options, configProxy, location) {
  let proxy = configProxy;
  if (!proxy && proxy !== false) {
    const proxyUrl = getProxyForUrl(location);
    if (proxyUrl) {
      if (!shouldBypassProxy(location)) {
        proxy = new URL(proxyUrl);
      }
    }
  }
  if (proxy) {
    if (proxy.username) {
      proxy.auth = (proxy.username || "") + ":" + (proxy.password || "");
    }
    if (proxy.auth) {
      const validProxyAuth = Boolean(proxy.auth.username || proxy.auth.password);
      if (validProxyAuth) {
        proxy.auth = (proxy.auth.username || "") + ":" + (proxy.auth.password || "");
      } else if (typeof proxy.auth === "object") {
        throw new AxiosError$1("Invalid proxy authorization", AxiosError$1.ERR_BAD_OPTION, { proxy });
      }
      const base64 = Buffer.from(proxy.auth, "utf8").toString("base64");
      options.headers["Proxy-Authorization"] = "Basic " + base64;
    }
    options.headers.host = options.hostname + (options.port ? ":" + options.port : "");
    const proxyHost = proxy.hostname || proxy.host;
    options.hostname = proxyHost;
    options.host = proxyHost;
    options.port = proxy.port;
    options.path = location;
    if (proxy.protocol) {
      options.protocol = proxy.protocol.includes(":") ? proxy.protocol : `${proxy.protocol}:`;
    }
  }
  options.beforeRedirects.proxy = function beforeRedirect(redirectOptions) {
    setProxy(redirectOptions, configProxy, redirectOptions.href);
  };
}
const isHttpAdapterSupported = typeof process !== "undefined" && utils$1.kindOf(process) === "process";
const wrapAsync = (asyncExecutor) => {
  return new Promise((resolve, reject) => {
    let onDone;
    let isDone;
    const done = (value, isRejected) => {
      if (isDone) return;
      isDone = true;
      onDone && onDone(value, isRejected);
    };
    const _resolve = (value) => {
      done(value);
      resolve(value);
    };
    const _reject = (reason) => {
      done(reason, true);
      reject(reason);
    };
    asyncExecutor(_resolve, _reject, (onDoneHandler) => onDone = onDoneHandler).catch(_reject);
  });
};
const resolveFamily = ({ address, family }) => {
  if (!utils$1.isString(address)) {
    throw TypeError("address must be a string");
  }
  return {
    address,
    family: family || (address.indexOf(".") < 0 ? 6 : 4)
  };
};
const buildAddressEntry = (address, family) => resolveFamily(utils$1.isObject(address) ? address : { address, family });
const http2Transport = {
  request(options, cb) {
    const authority = options.protocol + "//" + options.hostname + ":" + (options.port || (options.protocol === "https:" ? 443 : 80));
    const { http2Options, headers } = options;
    const session = http2Sessions.getSession(authority, http2Options);
    const { HTTP2_HEADER_SCHEME, HTTP2_HEADER_METHOD, HTTP2_HEADER_PATH, HTTP2_HEADER_STATUS } = http2.constants;
    const http2Headers = {
      [HTTP2_HEADER_SCHEME]: options.protocol.replace(":", ""),
      [HTTP2_HEADER_METHOD]: options.method,
      [HTTP2_HEADER_PATH]: options.path
    };
    utils$1.forEach(headers, (header, name) => {
      name.charAt(0) !== ":" && (http2Headers[name] = header);
    });
    const req = session.request(http2Headers);
    req.once("response", (responseHeaders) => {
      const response = req;
      responseHeaders = Object.assign({}, responseHeaders);
      const status = responseHeaders[HTTP2_HEADER_STATUS];
      delete responseHeaders[HTTP2_HEADER_STATUS];
      response.headers = responseHeaders;
      response.statusCode = +status;
      cb(response);
    });
    return req;
  }
};
const httpAdapter = isHttpAdapterSupported && function httpAdapter2(config) {
  return wrapAsync(async function dispatchHttpRequest(resolve, reject, onDone) {
    const own2 = (key) => utils$1.hasOwnProp(config, key) ? config[key] : void 0;
    let data = own2("data");
    let lookup = own2("lookup");
    let family = own2("family");
    let httpVersion = own2("httpVersion");
    if (httpVersion === void 0) httpVersion = 1;
    let http2Options = own2("http2Options");
    const responseType = own2("responseType");
    const responseEncoding = own2("responseEncoding");
    const method = config.method.toUpperCase();
    let isDone;
    let rejected = false;
    let req;
    httpVersion = +httpVersion;
    if (Number.isNaN(httpVersion)) {
      throw TypeError(`Invalid protocol version: '${config.httpVersion}' is not a number`);
    }
    if (httpVersion !== 1 && httpVersion !== 2) {
      throw TypeError(`Unsupported protocol version '${httpVersion}'`);
    }
    const isHttp2 = httpVersion === 2;
    if (lookup) {
      const _lookup = callbackify(lookup, (value) => utils$1.isArray(value) ? value : [value]);
      lookup = (hostname, opt, cb) => {
        _lookup(hostname, opt, (err, arg0, arg1) => {
          if (err) {
            return cb(err);
          }
          const addresses = utils$1.isArray(arg0) ? arg0.map((addr) => buildAddressEntry(addr)) : [buildAddressEntry(arg0, arg1)];
          opt.all ? cb(err, addresses) : cb(err, addresses[0].address, addresses[0].family);
        });
      };
    }
    const abortEmitter = new EventEmitter.EventEmitter();
    function abort2(reason) {
      try {
        abortEmitter.emit(
          "abort",
          !reason || reason.type ? new CanceledError$1(null, config, req) : reason
        );
      } catch (err) {
        console.warn("emit error", err);
      }
    }
    abortEmitter.once("abort", reject);
    const onFinished = () => {
      if (config.cancelToken) {
        config.cancelToken.unsubscribe(abort2);
      }
      if (config.signal) {
        config.signal.removeEventListener("abort", abort2);
      }
      abortEmitter.removeAllListeners();
    };
    if (config.cancelToken || config.signal) {
      config.cancelToken && config.cancelToken.subscribe(abort2);
      if (config.signal) {
        config.signal.aborted ? abort2() : config.signal.addEventListener("abort", abort2);
      }
    }
    onDone((response, isRejected) => {
      isDone = true;
      if (isRejected) {
        rejected = true;
        onFinished();
        return;
      }
      const { data: data2 } = response;
      if (data2 instanceof stream.Readable || data2 instanceof stream.Duplex) {
        const offListeners = stream.finished(data2, () => {
          offListeners();
          onFinished();
        });
      } else {
        onFinished();
      }
    });
    const fullPath = buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls);
    const parsed = new URL(fullPath, platform.hasBrowserEnv ? platform.origin : void 0);
    const protocol = parsed.protocol || supportedProtocols[0];
    if (protocol === "data:") {
      if (config.maxContentLength > -1) {
        const dataUrl = String(config.url || fullPath || "");
        const estimated = estimateDataURLDecodedBytes(dataUrl);
        if (estimated > config.maxContentLength) {
          return reject(
            new AxiosError$1(
              "maxContentLength size of " + config.maxContentLength + " exceeded",
              AxiosError$1.ERR_BAD_RESPONSE,
              config
            )
          );
        }
      }
      let convertedData;
      if (method !== "GET") {
        return settle(resolve, reject, {
          status: 405,
          statusText: "method not allowed",
          headers: {},
          config
        });
      }
      try {
        convertedData = fromDataURI(config.url, responseType === "blob", {
          Blob: config.env && config.env.Blob
        });
      } catch (err) {
        throw AxiosError$1.from(err, AxiosError$1.ERR_BAD_REQUEST, config);
      }
      if (responseType === "text") {
        convertedData = convertedData.toString(responseEncoding);
        if (!responseEncoding || responseEncoding === "utf8") {
          convertedData = utils$1.stripBOM(convertedData);
        }
      } else if (responseType === "stream") {
        convertedData = stream.Readable.from(convertedData);
      }
      return settle(resolve, reject, {
        data: convertedData,
        status: 200,
        statusText: "OK",
        headers: new AxiosHeaders$1(),
        config
      });
    }
    if (supportedProtocols.indexOf(protocol) === -1) {
      return reject(
        new AxiosError$1("Unsupported protocol " + protocol, AxiosError$1.ERR_BAD_REQUEST, config)
      );
    }
    const headers = AxiosHeaders$1.from(config.headers).normalize();
    headers.set("User-Agent", "axios/" + VERSION$1, false);
    const { onUploadProgress, onDownloadProgress } = config;
    const maxRate = config.maxRate;
    let maxUploadRate = void 0;
    let maxDownloadRate = void 0;
    if (utils$1.isSpecCompliantForm(data)) {
      const userBoundary = headers.getContentType(/boundary=([-_\w\d]{10,70})/i);
      data = formDataToStream(
        data,
        (formHeaders) => {
          headers.set(formHeaders);
        },
        {
          tag: `axios-${VERSION$1}-boundary`,
          boundary: userBoundary && userBoundary[1] || void 0
        }
      );
    } else if (utils$1.isFormData(data) && utils$1.isFunction(data.getHeaders) && data.getHeaders !== Object.prototype.getHeaders) {
      headers.set(data.getHeaders());
      if (!headers.hasContentLength()) {
        try {
          const knownLength = await require$$1.promisify(data.getLength).call(data);
          Number.isFinite(knownLength) && knownLength >= 0 && headers.setContentLength(knownLength);
        } catch (e) {
        }
      }
    } else if (utils$1.isBlob(data) || utils$1.isFile(data)) {
      data.size && headers.setContentType(data.type || "application/octet-stream");
      headers.setContentLength(data.size || 0);
      data = stream.Readable.from(readBlob(data));
    } else if (data && !utils$1.isStream(data)) {
      if (Buffer.isBuffer(data)) ;
      else if (utils$1.isArrayBuffer(data)) {
        data = Buffer.from(new Uint8Array(data));
      } else if (utils$1.isString(data)) {
        data = Buffer.from(data, "utf-8");
      } else {
        return reject(
          new AxiosError$1(
            "Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream",
            AxiosError$1.ERR_BAD_REQUEST,
            config
          )
        );
      }
      headers.setContentLength(data.length, false);
      if (config.maxBodyLength > -1 && data.length > config.maxBodyLength) {
        return reject(
          new AxiosError$1(
            "Request body larger than maxBodyLength limit",
            AxiosError$1.ERR_BAD_REQUEST,
            config
          )
        );
      }
    }
    const contentLength = utils$1.toFiniteNumber(headers.getContentLength());
    if (utils$1.isArray(maxRate)) {
      maxUploadRate = maxRate[0];
      maxDownloadRate = maxRate[1];
    } else {
      maxUploadRate = maxDownloadRate = maxRate;
    }
    if (data && (onUploadProgress || maxUploadRate)) {
      if (!utils$1.isStream(data)) {
        data = stream.Readable.from(data, { objectMode: false });
      }
      data = stream.pipeline(
        [
          data,
          new AxiosTransformStream({
            maxRate: utils$1.toFiniteNumber(maxUploadRate)
          })
        ],
        utils$1.noop
      );
      onUploadProgress && data.on(
        "progress",
        flushOnFinish(
          data,
          progressEventDecorator(
            contentLength,
            progressEventReducer(asyncDecorator(onUploadProgress), false, 3)
          )
        )
      );
    }
    let auth = void 0;
    const configAuth = own2("auth");
    if (configAuth) {
      const username = configAuth.username || "";
      const password = configAuth.password || "";
      auth = username + ":" + password;
    }
    if (!auth && parsed.username) {
      const urlUsername = parsed.username;
      const urlPassword = parsed.password;
      auth = urlUsername + ":" + urlPassword;
    }
    auth && headers.delete("authorization");
    let path2;
    try {
      path2 = buildURL(
        parsed.pathname + parsed.search,
        config.params,
        config.paramsSerializer
      ).replace(/^\?/, "");
    } catch (err) {
      const customErr = new Error(err.message);
      customErr.config = config;
      customErr.url = config.url;
      customErr.exists = true;
      return reject(customErr);
    }
    headers.set(
      "Accept-Encoding",
      "gzip, compress, deflate" + (isBrotliSupported ? ", br" : ""),
      false
    );
    const options = Object.assign(/* @__PURE__ */ Object.create(null), {
      path: path2,
      method,
      headers: headers.toJSON(),
      agents: { http: config.httpAgent, https: config.httpsAgent },
      auth,
      protocol,
      family,
      beforeRedirect: dispatchBeforeRedirect,
      beforeRedirects: /* @__PURE__ */ Object.create(null),
      http2Options
    });
    !utils$1.isUndefined(lookup) && (options.lookup = lookup);
    if (config.socketPath) {
      if (typeof config.socketPath !== "string") {
        return reject(new AxiosError$1(
          "socketPath must be a string",
          AxiosError$1.ERR_BAD_OPTION_VALUE,
          config
        ));
      }
      if (config.allowedSocketPaths != null) {
        const allowed = Array.isArray(config.allowedSocketPaths) ? config.allowedSocketPaths : [config.allowedSocketPaths];
        const resolvedSocket = path$1.resolve(config.socketPath);
        const isAllowed = allowed.some(
          (entry) => typeof entry === "string" && path$1.resolve(entry) === resolvedSocket
        );
        if (!isAllowed) {
          return reject(new AxiosError$1(
            `socketPath "${config.socketPath}" is not permitted by allowedSocketPaths`,
            AxiosError$1.ERR_BAD_OPTION_VALUE,
            config
          ));
        }
      }
      options.socketPath = config.socketPath;
    } else {
      options.hostname = parsed.hostname.startsWith("[") ? parsed.hostname.slice(1, -1) : parsed.hostname;
      options.port = parsed.port;
      setProxy(
        options,
        config.proxy,
        protocol + "//" + parsed.hostname + (parsed.port ? ":" + parsed.port : "") + options.path
      );
    }
    let transport;
    const isHttpsRequest = isHttps.test(options.protocol);
    options.agent = isHttpsRequest ? config.httpsAgent : config.httpAgent;
    if (isHttp2) {
      transport = http2Transport;
    } else {
      const configTransport = own2("transport");
      if (configTransport) {
        transport = configTransport;
      } else if (config.maxRedirects === 0) {
        transport = isHttpsRequest ? require$$4 : require$$3;
      } else {
        if (config.maxRedirects) {
          options.maxRedirects = config.maxRedirects;
        }
        const configBeforeRedirect = own2("beforeRedirect");
        if (configBeforeRedirect) {
          options.beforeRedirects.config = configBeforeRedirect;
        }
        transport = isHttpsRequest ? httpsFollow : httpFollow;
      }
    }
    if (config.maxBodyLength > -1) {
      options.maxBodyLength = config.maxBodyLength;
    } else {
      options.maxBodyLength = Infinity;
    }
    options.insecureHTTPParser = Boolean(own2("insecureHTTPParser"));
    req = transport.request(options, function handleResponse(res) {
      if (req.destroyed) return;
      const streams = [res];
      const responseLength = utils$1.toFiniteNumber(res.headers["content-length"]);
      if (onDownloadProgress || maxDownloadRate) {
        const transformStream = new AxiosTransformStream({
          maxRate: utils$1.toFiniteNumber(maxDownloadRate)
        });
        onDownloadProgress && transformStream.on(
          "progress",
          flushOnFinish(
            transformStream,
            progressEventDecorator(
              responseLength,
              progressEventReducer(asyncDecorator(onDownloadProgress), true, 3)
            )
          )
        );
        streams.push(transformStream);
      }
      let responseStream = res;
      const lastRequest = res.req || req;
      if (config.decompress !== false && res.headers["content-encoding"]) {
        if (method === "HEAD" || res.statusCode === 204) {
          delete res.headers["content-encoding"];
        }
        switch ((res.headers["content-encoding"] || "").toLowerCase()) {
          case "gzip":
          case "x-gzip":
          case "compress":
          case "x-compress":
            streams.push(zlib.createUnzip(zlibOptions));
            delete res.headers["content-encoding"];
            break;
          case "deflate":
            streams.push(new ZlibHeaderTransformStream());
            streams.push(zlib.createUnzip(zlibOptions));
            delete res.headers["content-encoding"];
            break;
          case "br":
            if (isBrotliSupported) {
              streams.push(zlib.createBrotliDecompress(brotliOptions));
              delete res.headers["content-encoding"];
            }
        }
      }
      responseStream = streams.length > 1 ? stream.pipeline(streams, utils$1.noop) : streams[0];
      const response = {
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: new AxiosHeaders$1(res.headers),
        config,
        request: lastRequest
      };
      if (responseType === "stream") {
        if (config.maxContentLength > -1) {
          const limit = config.maxContentLength;
          const source = responseStream;
          async function* enforceMaxContentLength() {
            let totalResponseBytes = 0;
            for await (const chunk of source) {
              totalResponseBytes += chunk.length;
              if (totalResponseBytes > limit) {
                throw new AxiosError$1(
                  "maxContentLength size of " + limit + " exceeded",
                  AxiosError$1.ERR_BAD_RESPONSE,
                  config,
                  lastRequest
                );
              }
              yield chunk;
            }
          }
          responseStream = stream.Readable.from(enforceMaxContentLength(), {
            objectMode: false
          });
        }
        response.data = responseStream;
        settle(resolve, reject, response);
      } else {
        const responseBuffer = [];
        let totalResponseBytes = 0;
        responseStream.on("data", function handleStreamData(chunk) {
          responseBuffer.push(chunk);
          totalResponseBytes += chunk.length;
          if (config.maxContentLength > -1 && totalResponseBytes > config.maxContentLength) {
            rejected = true;
            responseStream.destroy();
            abort2(
              new AxiosError$1(
                "maxContentLength size of " + config.maxContentLength + " exceeded",
                AxiosError$1.ERR_BAD_RESPONSE,
                config,
                lastRequest
              )
            );
          }
        });
        responseStream.on("aborted", function handlerStreamAborted() {
          if (rejected) {
            return;
          }
          const err = new AxiosError$1(
            "stream has been aborted",
            AxiosError$1.ERR_BAD_RESPONSE,
            config,
            lastRequest
          );
          responseStream.destroy(err);
          reject(err);
        });
        responseStream.on("error", function handleStreamError(err) {
          if (req.destroyed) return;
          reject(AxiosError$1.from(err, null, config, lastRequest));
        });
        responseStream.on("end", function handleStreamEnd() {
          try {
            let responseData = responseBuffer.length === 1 ? responseBuffer[0] : Buffer.concat(responseBuffer);
            if (responseType !== "arraybuffer") {
              responseData = responseData.toString(responseEncoding);
              if (!responseEncoding || responseEncoding === "utf8") {
                responseData = utils$1.stripBOM(responseData);
              }
            }
            response.data = responseData;
          } catch (err) {
            return reject(AxiosError$1.from(err, null, config, response.request, response));
          }
          settle(resolve, reject, response);
        });
      }
      abortEmitter.once("abort", (err) => {
        if (!responseStream.destroyed) {
          responseStream.emit("error", err);
          responseStream.destroy();
        }
      });
    });
    abortEmitter.once("abort", (err) => {
      if (req.close) {
        req.close();
      } else {
        req.destroy(err);
      }
    });
    req.on("error", function handleRequestError(err) {
      reject(AxiosError$1.from(err, null, config, req));
    });
    req.on("socket", function handleRequestSocket(socket) {
      socket.setKeepAlive(true, 1e3 * 60);
      if (!socket[kAxiosSocketListener]) {
        socket.on("error", function handleSocketError(err) {
          const current = socket[kAxiosCurrentReq];
          if (current && !current.destroyed) {
            current.destroy(err);
          }
        });
        socket[kAxiosSocketListener] = true;
      }
      socket[kAxiosCurrentReq] = req;
      req.once("close", function clearCurrentReq() {
        if (socket[kAxiosCurrentReq] === req) {
          socket[kAxiosCurrentReq] = null;
        }
      });
    });
    if (config.timeout) {
      const timeout = parseInt(config.timeout, 10);
      if (Number.isNaN(timeout)) {
        abort2(
          new AxiosError$1(
            "error trying to parse `config.timeout` to int",
            AxiosError$1.ERR_BAD_OPTION_VALUE,
            config,
            req
          )
        );
        return;
      }
      req.setTimeout(timeout, function handleRequestTimeout() {
        if (isDone) return;
        let timeoutErrorMessage = config.timeout ? "timeout of " + config.timeout + "ms exceeded" : "timeout exceeded";
        const transitional2 = config.transitional || transitionalDefaults;
        if (config.timeoutErrorMessage) {
          timeoutErrorMessage = config.timeoutErrorMessage;
        }
        abort2(
          new AxiosError$1(
            timeoutErrorMessage,
            transitional2.clarifyTimeoutError ? AxiosError$1.ETIMEDOUT : AxiosError$1.ECONNABORTED,
            config,
            req
          )
        );
      });
    } else {
      req.setTimeout(0);
    }
    if (utils$1.isStream(data)) {
      let ended = false;
      let errored = false;
      data.on("end", () => {
        ended = true;
      });
      data.once("error", (err) => {
        errored = true;
        req.destroy(err);
      });
      data.on("close", () => {
        if (!ended && !errored) {
          abort2(new CanceledError$1("Request stream has been aborted", config, req));
        }
      });
      let uploadStream = data;
      if (config.maxBodyLength > -1 && config.maxRedirects === 0) {
        const limit = config.maxBodyLength;
        let bytesSent = 0;
        uploadStream = stream.pipeline(
          [
            data,
            new stream.Transform({
              transform(chunk, _enc, cb) {
                bytesSent += chunk.length;
                if (bytesSent > limit) {
                  return cb(
                    new AxiosError$1(
                      "Request body larger than maxBodyLength limit",
                      AxiosError$1.ERR_BAD_REQUEST,
                      config,
                      req
                    )
                  );
                }
                cb(null, chunk);
              }
            })
          ],
          utils$1.noop
        );
        uploadStream.on("error", (err) => {
          if (!req.destroyed) req.destroy(err);
        });
      }
      uploadStream.pipe(req);
    } else {
      data && req.write(data);
      req.end();
    }
  });
};
const isURLSameOrigin = platform.hasStandardBrowserEnv ? /* @__PURE__ */ ((origin2, isMSIE) => (url2) => {
  url2 = new URL(url2, platform.origin);
  return origin2.protocol === url2.protocol && origin2.host === url2.host && (isMSIE || origin2.port === url2.port);
})(
  new URL(platform.origin),
  platform.navigator && /(msie|trident)/i.test(platform.navigator.userAgent)
) : () => true;
const cookies = platform.hasStandardBrowserEnv ? (
  // Standard browser envs support document.cookie
  {
    write(name, value, expires, path2, domain, secure, sameSite) {
      if (typeof document === "undefined") return;
      const cookie = [`${name}=${encodeURIComponent(value)}`];
      if (utils$1.isNumber(expires)) {
        cookie.push(`expires=${new Date(expires).toUTCString()}`);
      }
      if (utils$1.isString(path2)) {
        cookie.push(`path=${path2}`);
      }
      if (utils$1.isString(domain)) {
        cookie.push(`domain=${domain}`);
      }
      if (secure === true) {
        cookie.push("secure");
      }
      if (utils$1.isString(sameSite)) {
        cookie.push(`SameSite=${sameSite}`);
      }
      document.cookie = cookie.join("; ");
    },
    read(name) {
      if (typeof document === "undefined") return null;
      const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
      return match ? decodeURIComponent(match[1]) : null;
    },
    remove(name) {
      this.write(name, "", Date.now() - 864e5, "/");
    }
  }
) : (
  // Non-standard browser env (web workers, react-native) lack needed support.
  {
    write() {
    },
    read() {
      return null;
    },
    remove() {
    }
  }
);
const headersToObject = (thing) => thing instanceof AxiosHeaders$1 ? { ...thing } : thing;
function mergeConfig$1(config1, config2) {
  config2 = config2 || {};
  const config = /* @__PURE__ */ Object.create(null);
  Object.defineProperty(config, "hasOwnProperty", {
    value: Object.prototype.hasOwnProperty,
    enumerable: false,
    writable: true,
    configurable: true
  });
  function getMergedValue(target, source, prop, caseless) {
    if (utils$1.isPlainObject(target) && utils$1.isPlainObject(source)) {
      return utils$1.merge.call({ caseless }, target, source);
    } else if (utils$1.isPlainObject(source)) {
      return utils$1.merge({}, source);
    } else if (utils$1.isArray(source)) {
      return source.slice();
    }
    return source;
  }
  function mergeDeepProperties(a, b, prop, caseless) {
    if (!utils$1.isUndefined(b)) {
      return getMergedValue(a, b, prop, caseless);
    } else if (!utils$1.isUndefined(a)) {
      return getMergedValue(void 0, a, prop, caseless);
    }
  }
  function valueFromConfig2(a, b) {
    if (!utils$1.isUndefined(b)) {
      return getMergedValue(void 0, b);
    }
  }
  function defaultToConfig2(a, b) {
    if (!utils$1.isUndefined(b)) {
      return getMergedValue(void 0, b);
    } else if (!utils$1.isUndefined(a)) {
      return getMergedValue(void 0, a);
    }
  }
  function mergeDirectKeys(a, b, prop) {
    if (utils$1.hasOwnProp(config2, prop)) {
      return getMergedValue(a, b);
    } else if (utils$1.hasOwnProp(config1, prop)) {
      return getMergedValue(void 0, a);
    }
  }
  const mergeMap = {
    url: valueFromConfig2,
    method: valueFromConfig2,
    data: valueFromConfig2,
    baseURL: defaultToConfig2,
    transformRequest: defaultToConfig2,
    transformResponse: defaultToConfig2,
    paramsSerializer: defaultToConfig2,
    timeout: defaultToConfig2,
    timeoutMessage: defaultToConfig2,
    withCredentials: defaultToConfig2,
    withXSRFToken: defaultToConfig2,
    adapter: defaultToConfig2,
    responseType: defaultToConfig2,
    xsrfCookieName: defaultToConfig2,
    xsrfHeaderName: defaultToConfig2,
    onUploadProgress: defaultToConfig2,
    onDownloadProgress: defaultToConfig2,
    decompress: defaultToConfig2,
    maxContentLength: defaultToConfig2,
    maxBodyLength: defaultToConfig2,
    beforeRedirect: defaultToConfig2,
    transport: defaultToConfig2,
    httpAgent: defaultToConfig2,
    httpsAgent: defaultToConfig2,
    cancelToken: defaultToConfig2,
    socketPath: defaultToConfig2,
    allowedSocketPaths: defaultToConfig2,
    responseEncoding: defaultToConfig2,
    validateStatus: mergeDirectKeys,
    headers: (a, b, prop) => mergeDeepProperties(headersToObject(a), headersToObject(b), prop, true)
  };
  utils$1.forEach(Object.keys({ ...config1, ...config2 }), function computeConfigValue(prop) {
    if (prop === "__proto__" || prop === "constructor" || prop === "prototype") return;
    const merge2 = utils$1.hasOwnProp(mergeMap, prop) ? mergeMap[prop] : mergeDeepProperties;
    const a = utils$1.hasOwnProp(config1, prop) ? config1[prop] : void 0;
    const b = utils$1.hasOwnProp(config2, prop) ? config2[prop] : void 0;
    const configValue = merge2(a, b, prop);
    utils$1.isUndefined(configValue) && merge2 !== mergeDirectKeys || (config[prop] = configValue);
  });
  return config;
}
const resolveConfig = (config) => {
  const newConfig = mergeConfig$1({}, config);
  const own2 = (key) => utils$1.hasOwnProp(newConfig, key) ? newConfig[key] : void 0;
  const data = own2("data");
  let withXSRFToken = own2("withXSRFToken");
  const xsrfHeaderName = own2("xsrfHeaderName");
  const xsrfCookieName = own2("xsrfCookieName");
  let headers = own2("headers");
  const auth = own2("auth");
  const baseURL = own2("baseURL");
  const allowAbsoluteUrls = own2("allowAbsoluteUrls");
  const url2 = own2("url");
  newConfig.headers = headers = AxiosHeaders$1.from(headers);
  newConfig.url = buildURL(
    buildFullPath(baseURL, url2, allowAbsoluteUrls),
    config.params,
    config.paramsSerializer
  );
  if (auth) {
    headers.set(
      "Authorization",
      "Basic " + btoa(
        (auth.username || "") + ":" + (auth.password ? unescape(encodeURIComponent(auth.password)) : "")
      )
    );
  }
  if (utils$1.isFormData(data)) {
    if (platform.hasStandardBrowserEnv || platform.hasStandardBrowserWebWorkerEnv) {
      headers.setContentType(void 0);
    } else if (utils$1.isFunction(data.getHeaders)) {
      const formHeaders = data.getHeaders();
      const allowedHeaders = ["content-type", "content-length"];
      Object.entries(formHeaders).forEach(([key, val]) => {
        if (allowedHeaders.includes(key.toLowerCase())) {
          headers.set(key, val);
        }
      });
    }
  }
  if (platform.hasStandardBrowserEnv) {
    if (utils$1.isFunction(withXSRFToken)) {
      withXSRFToken = withXSRFToken(newConfig);
    }
    const shouldSendXSRF = withXSRFToken === true || withXSRFToken == null && isURLSameOrigin(newConfig.url);
    if (shouldSendXSRF) {
      const xsrfValue = xsrfHeaderName && xsrfCookieName && cookies.read(xsrfCookieName);
      if (xsrfValue) {
        headers.set(xsrfHeaderName, xsrfValue);
      }
    }
  }
  return newConfig;
};
const isXHRAdapterSupported = typeof XMLHttpRequest !== "undefined";
const xhrAdapter = isXHRAdapterSupported && function(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    const _config = resolveConfig(config);
    let requestData = _config.data;
    const requestHeaders = AxiosHeaders$1.from(_config.headers).normalize();
    let { responseType, onUploadProgress, onDownloadProgress } = _config;
    let onCanceled;
    let uploadThrottled, downloadThrottled;
    let flushUpload, flushDownload;
    function done() {
      flushUpload && flushUpload();
      flushDownload && flushDownload();
      _config.cancelToken && _config.cancelToken.unsubscribe(onCanceled);
      _config.signal && _config.signal.removeEventListener("abort", onCanceled);
    }
    let request = new XMLHttpRequest();
    request.open(_config.method.toUpperCase(), _config.url, true);
    request.timeout = _config.timeout;
    function onloadend() {
      if (!request) {
        return;
      }
      const responseHeaders = AxiosHeaders$1.from(
        "getAllResponseHeaders" in request && request.getAllResponseHeaders()
      );
      const responseData = !responseType || responseType === "text" || responseType === "json" ? request.responseText : request.response;
      const response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config,
        request
      };
      settle(
        function _resolve(value) {
          resolve(value);
          done();
        },
        function _reject(err) {
          reject(err);
          done();
        },
        response
      );
      request = null;
    }
    if ("onloadend" in request) {
      request.onloadend = onloadend;
    } else {
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf("file:") === 0)) {
          return;
        }
        setTimeout(onloadend);
      };
    }
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }
      reject(new AxiosError$1("Request aborted", AxiosError$1.ECONNABORTED, config, request));
      request = null;
    };
    request.onerror = function handleError(event) {
      const msg = event && event.message ? event.message : "Network Error";
      const err = new AxiosError$1(msg, AxiosError$1.ERR_NETWORK, config, request);
      err.event = event || null;
      reject(err);
      request = null;
    };
    request.ontimeout = function handleTimeout() {
      let timeoutErrorMessage = _config.timeout ? "timeout of " + _config.timeout + "ms exceeded" : "timeout exceeded";
      const transitional2 = _config.transitional || transitionalDefaults;
      if (_config.timeoutErrorMessage) {
        timeoutErrorMessage = _config.timeoutErrorMessage;
      }
      reject(
        new AxiosError$1(
          timeoutErrorMessage,
          transitional2.clarifyTimeoutError ? AxiosError$1.ETIMEDOUT : AxiosError$1.ECONNABORTED,
          config,
          request
        )
      );
      request = null;
    };
    requestData === void 0 && requestHeaders.setContentType(null);
    if ("setRequestHeader" in request) {
      utils$1.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
        request.setRequestHeader(key, val);
      });
    }
    if (!utils$1.isUndefined(_config.withCredentials)) {
      request.withCredentials = !!_config.withCredentials;
    }
    if (responseType && responseType !== "json") {
      request.responseType = _config.responseType;
    }
    if (onDownloadProgress) {
      [downloadThrottled, flushDownload] = progressEventReducer(onDownloadProgress, true);
      request.addEventListener("progress", downloadThrottled);
    }
    if (onUploadProgress && request.upload) {
      [uploadThrottled, flushUpload] = progressEventReducer(onUploadProgress);
      request.upload.addEventListener("progress", uploadThrottled);
      request.upload.addEventListener("loadend", flushUpload);
    }
    if (_config.cancelToken || _config.signal) {
      onCanceled = (cancel) => {
        if (!request) {
          return;
        }
        reject(!cancel || cancel.type ? new CanceledError$1(null, config, request) : cancel);
        request.abort();
        request = null;
      };
      _config.cancelToken && _config.cancelToken.subscribe(onCanceled);
      if (_config.signal) {
        _config.signal.aborted ? onCanceled() : _config.signal.addEventListener("abort", onCanceled);
      }
    }
    const protocol = parseProtocol(_config.url);
    if (protocol && platform.protocols.indexOf(protocol) === -1) {
      reject(
        new AxiosError$1(
          "Unsupported protocol " + protocol + ":",
          AxiosError$1.ERR_BAD_REQUEST,
          config
        )
      );
      return;
    }
    request.send(requestData || null);
  });
};
const composeSignals = (signals, timeout) => {
  const { length } = signals = signals ? signals.filter(Boolean) : [];
  if (timeout || length) {
    let controller = new AbortController();
    let aborted;
    const onabort = function(reason) {
      if (!aborted) {
        aborted = true;
        unsubscribe();
        const err = reason instanceof Error ? reason : this.reason;
        controller.abort(
          err instanceof AxiosError$1 ? err : new CanceledError$1(err instanceof Error ? err.message : err)
        );
      }
    };
    let timer = timeout && setTimeout(() => {
      timer = null;
      onabort(new AxiosError$1(`timeout of ${timeout}ms exceeded`, AxiosError$1.ETIMEDOUT));
    }, timeout);
    const unsubscribe = () => {
      if (signals) {
        timer && clearTimeout(timer);
        timer = null;
        signals.forEach((signal2) => {
          signal2.unsubscribe ? signal2.unsubscribe(onabort) : signal2.removeEventListener("abort", onabort);
        });
        signals = null;
      }
    };
    signals.forEach((signal2) => signal2.addEventListener("abort", onabort));
    const { signal } = controller;
    signal.unsubscribe = () => utils$1.asap(unsubscribe);
    return signal;
  }
};
const streamChunk = function* (chunk, chunkSize) {
  let len = chunk.byteLength;
  if (len < chunkSize) {
    yield chunk;
    return;
  }
  let pos = 0;
  let end;
  while (pos < len) {
    end = pos + chunkSize;
    yield chunk.slice(pos, end);
    pos = end;
  }
};
const readBytes = async function* (iterable, chunkSize) {
  for await (const chunk of readStream(iterable)) {
    yield* streamChunk(chunk, chunkSize);
  }
};
const readStream = async function* (stream2) {
  if (stream2[Symbol.asyncIterator]) {
    yield* stream2;
    return;
  }
  const reader = stream2.getReader();
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      yield value;
    }
  } finally {
    await reader.cancel();
  }
};
const trackStream = (stream2, chunkSize, onProgress, onFinish) => {
  const iterator2 = readBytes(stream2, chunkSize);
  let bytes = 0;
  let done;
  let _onFinish = (e) => {
    if (!done) {
      done = true;
      onFinish && onFinish(e);
    }
  };
  return new ReadableStream(
    {
      async pull(controller) {
        try {
          const { done: done2, value } = await iterator2.next();
          if (done2) {
            _onFinish();
            controller.close();
            return;
          }
          let len = value.byteLength;
          if (onProgress) {
            let loadedBytes = bytes += len;
            onProgress(loadedBytes);
          }
          controller.enqueue(new Uint8Array(value));
        } catch (err) {
          _onFinish(err);
          throw err;
        }
      },
      cancel(reason) {
        _onFinish(reason);
        return iterator2.return();
      }
    },
    {
      highWaterMark: 2
    }
  );
};
const DEFAULT_CHUNK_SIZE = 64 * 1024;
const { isFunction } = utils$1;
const globalFetchAPI = (({ Request, Response: Response2 }) => ({
  Request,
  Response: Response2
}))(utils$1.global);
const { ReadableStream: ReadableStream$1, TextEncoder: TextEncoder$1 } = utils$1.global;
const test = (fn, ...args) => {
  try {
    return !!fn(...args);
  } catch (e) {
    return false;
  }
};
const factory = (env2) => {
  env2 = utils$1.merge.call(
    {
      skipUndefined: true
    },
    globalFetchAPI,
    env2
  );
  const { fetch: envFetch, Request, Response: Response2 } = env2;
  const isFetchSupported = envFetch ? isFunction(envFetch) : typeof fetch === "function";
  const isRequestSupported = isFunction(Request);
  const isResponseSupported = isFunction(Response2);
  if (!isFetchSupported) {
    return false;
  }
  const isReadableStreamSupported = isFetchSupported && isFunction(ReadableStream$1);
  const encodeText = isFetchSupported && (typeof TextEncoder$1 === "function" ? /* @__PURE__ */ ((encoder) => (str) => encoder.encode(str))(new TextEncoder$1()) : async (str) => new Uint8Array(await new Request(str).arrayBuffer()));
  const supportsRequestStream = isRequestSupported && isReadableStreamSupported && test(() => {
    let duplexAccessed = false;
    const request = new Request(platform.origin, {
      body: new ReadableStream$1(),
      method: "POST",
      get duplex() {
        duplexAccessed = true;
        return "half";
      }
    });
    const hasContentType = request.headers.has("Content-Type");
    if (request.body != null) {
      request.body.cancel();
    }
    return duplexAccessed && !hasContentType;
  });
  const supportsResponseStream = isResponseSupported && isReadableStreamSupported && test(() => utils$1.isReadableStream(new Response2("").body));
  const resolvers = {
    stream: supportsResponseStream && ((res) => res.body)
  };
  isFetchSupported && (() => {
    ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((type2) => {
      !resolvers[type2] && (resolvers[type2] = (res, config) => {
        let method = res && res[type2];
        if (method) {
          return method.call(res);
        }
        throw new AxiosError$1(
          `Response type '${type2}' is not supported`,
          AxiosError$1.ERR_NOT_SUPPORT,
          config
        );
      });
    });
  })();
  const getBodyLength = async (body) => {
    if (body == null) {
      return 0;
    }
    if (utils$1.isBlob(body)) {
      return body.size;
    }
    if (utils$1.isSpecCompliantForm(body)) {
      const _request = new Request(platform.origin, {
        method: "POST",
        body
      });
      return (await _request.arrayBuffer()).byteLength;
    }
    if (utils$1.isArrayBufferView(body) || utils$1.isArrayBuffer(body)) {
      return body.byteLength;
    }
    if (utils$1.isURLSearchParams(body)) {
      body = body + "";
    }
    if (utils$1.isString(body)) {
      return (await encodeText(body)).byteLength;
    }
  };
  const resolveBodyLength = async (headers, body) => {
    const length = utils$1.toFiniteNumber(headers.getContentLength());
    return length == null ? getBodyLength(body) : length;
  };
  return async (config) => {
    let {
      url: url2,
      method,
      data,
      signal,
      cancelToken,
      timeout,
      onDownloadProgress,
      onUploadProgress,
      responseType,
      headers,
      withCredentials = "same-origin",
      fetchOptions
    } = resolveConfig(config);
    let _fetch = envFetch || fetch;
    responseType = responseType ? (responseType + "").toLowerCase() : "text";
    let composedSignal = composeSignals(
      [signal, cancelToken && cancelToken.toAbortSignal()],
      timeout
    );
    let request = null;
    const unsubscribe = composedSignal && composedSignal.unsubscribe && (() => {
      composedSignal.unsubscribe();
    });
    let requestContentLength;
    try {
      if (onUploadProgress && supportsRequestStream && method !== "get" && method !== "head" && (requestContentLength = await resolveBodyLength(headers, data)) !== 0) {
        let _request = new Request(url2, {
          method: "POST",
          body: data,
          duplex: "half"
        });
        let contentTypeHeader;
        if (utils$1.isFormData(data) && (contentTypeHeader = _request.headers.get("content-type"))) {
          headers.setContentType(contentTypeHeader);
        }
        if (_request.body) {
          const [onProgress, flush] = progressEventDecorator(
            requestContentLength,
            progressEventReducer(asyncDecorator(onUploadProgress))
          );
          data = trackStream(_request.body, DEFAULT_CHUNK_SIZE, onProgress, flush);
        }
      }
      if (!utils$1.isString(withCredentials)) {
        withCredentials = withCredentials ? "include" : "omit";
      }
      const isCredentialsSupported = isRequestSupported && "credentials" in Request.prototype;
      if (utils$1.isFormData(data)) {
        const contentType = headers.getContentType();
        if (contentType && /^multipart\/form-data/i.test(contentType) && !/boundary=/i.test(contentType)) {
          headers.delete("content-type");
        }
      }
      const resolvedOptions = {
        ...fetchOptions,
        signal: composedSignal,
        method: method.toUpperCase(),
        headers: headers.normalize().toJSON(),
        body: data,
        duplex: "half",
        credentials: isCredentialsSupported ? withCredentials : void 0
      };
      request = isRequestSupported && new Request(url2, resolvedOptions);
      let response = await (isRequestSupported ? _fetch(request, fetchOptions) : _fetch(url2, resolvedOptions));
      const isStreamResponse = supportsResponseStream && (responseType === "stream" || responseType === "response");
      if (supportsResponseStream && (onDownloadProgress || isStreamResponse && unsubscribe)) {
        const options = {};
        ["status", "statusText", "headers"].forEach((prop) => {
          options[prop] = response[prop];
        });
        const responseContentLength = utils$1.toFiniteNumber(response.headers.get("content-length"));
        const [onProgress, flush] = onDownloadProgress && progressEventDecorator(
          responseContentLength,
          progressEventReducer(asyncDecorator(onDownloadProgress), true)
        ) || [];
        response = new Response2(
          trackStream(response.body, DEFAULT_CHUNK_SIZE, onProgress, () => {
            flush && flush();
            unsubscribe && unsubscribe();
          }),
          options
        );
      }
      responseType = responseType || "text";
      let responseData = await resolvers[utils$1.findKey(resolvers, responseType) || "text"](
        response,
        config
      );
      !isStreamResponse && unsubscribe && unsubscribe();
      return await new Promise((resolve, reject) => {
        settle(resolve, reject, {
          data: responseData,
          headers: AxiosHeaders$1.from(response.headers),
          status: response.status,
          statusText: response.statusText,
          config,
          request
        });
      });
    } catch (err) {
      unsubscribe && unsubscribe();
      if (err && err.name === "TypeError" && /Load failed|fetch/i.test(err.message)) {
        throw Object.assign(
          new AxiosError$1(
            "Network Error",
            AxiosError$1.ERR_NETWORK,
            config,
            request,
            err && err.response
          ),
          {
            cause: err.cause || err
          }
        );
      }
      throw AxiosError$1.from(err, err && err.code, config, request, err && err.response);
    }
  };
};
const seedCache = /* @__PURE__ */ new Map();
const getFetch = (config) => {
  let env2 = config && config.env || {};
  const { fetch: fetch2, Request, Response: Response2 } = env2;
  const seeds = [Request, Response2, fetch2];
  let len = seeds.length, i = len, seed, target, map = seedCache;
  while (i--) {
    seed = seeds[i];
    target = map.get(seed);
    target === void 0 && map.set(seed, target = i ? /* @__PURE__ */ new Map() : factory(env2));
    map = target;
  }
  return target;
};
getFetch();
const knownAdapters = {
  http: httpAdapter,
  xhr: xhrAdapter,
  fetch: {
    get: getFetch
  }
};
utils$1.forEach(knownAdapters, (fn, value) => {
  if (fn) {
    try {
      Object.defineProperty(fn, "name", { value });
    } catch (e) {
    }
    Object.defineProperty(fn, "adapterName", { value });
  }
});
const renderReason = (reason) => `- ${reason}`;
const isResolvedHandle = (adapter) => utils$1.isFunction(adapter) || adapter === null || adapter === false;
function getAdapter$1(adapters2, config) {
  adapters2 = utils$1.isArray(adapters2) ? adapters2 : [adapters2];
  const { length } = adapters2;
  let nameOrAdapter;
  let adapter;
  const rejectedReasons = {};
  for (let i = 0; i < length; i++) {
    nameOrAdapter = adapters2[i];
    let id;
    adapter = nameOrAdapter;
    if (!isResolvedHandle(nameOrAdapter)) {
      adapter = knownAdapters[(id = String(nameOrAdapter)).toLowerCase()];
      if (adapter === void 0) {
        throw new AxiosError$1(`Unknown adapter '${id}'`);
      }
    }
    if (adapter && (utils$1.isFunction(adapter) || (adapter = adapter.get(config)))) {
      break;
    }
    rejectedReasons[id || "#" + i] = adapter;
  }
  if (!adapter) {
    const reasons = Object.entries(rejectedReasons).map(
      ([id, state2]) => `adapter ${id} ` + (state2 === false ? "is not supported by the environment" : "is not available in the build")
    );
    let s = length ? reasons.length > 1 ? "since :\n" + reasons.map(renderReason).join("\n") : " " + renderReason(reasons[0]) : "as no adapter specified";
    throw new AxiosError$1(
      `There is no suitable adapter to dispatch the request ` + s,
      "ERR_NOT_SUPPORT"
    );
  }
  return adapter;
}
const adapters = {
  /**
   * Resolve an adapter from a list of adapter names or functions.
   * @type {Function}
   */
  getAdapter: getAdapter$1,
  /**
   * Exposes all known adapters
   * @type {Object<string, Function|Object>}
   */
  adapters: knownAdapters
};
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
  if (config.signal && config.signal.aborted) {
    throw new CanceledError$1(null, config);
  }
}
function dispatchRequest(config) {
  throwIfCancellationRequested(config);
  config.headers = AxiosHeaders$1.from(config.headers);
  config.data = transformData.call(config, config.transformRequest);
  if (["post", "put", "patch"].indexOf(config.method) !== -1) {
    config.headers.setContentType("application/x-www-form-urlencoded", false);
  }
  const adapter = adapters.getAdapter(config.adapter || defaults.adapter, config);
  return adapter(config).then(
    function onAdapterResolution(response) {
      throwIfCancellationRequested(config);
      response.data = transformData.call(config, config.transformResponse, response);
      response.headers = AxiosHeaders$1.from(response.headers);
      return response;
    },
    function onAdapterRejection(reason) {
      if (!isCancel$1(reason)) {
        throwIfCancellationRequested(config);
        if (reason && reason.response) {
          reason.response.data = transformData.call(
            config,
            config.transformResponse,
            reason.response
          );
          reason.response.headers = AxiosHeaders$1.from(reason.response.headers);
        }
      }
      return Promise.reject(reason);
    }
  );
}
const validators$1 = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach((type2, i) => {
  validators$1[type2] = function validator2(thing) {
    return typeof thing === type2 || "a" + (i < 1 ? "n " : " ") + type2;
  };
});
const deprecatedWarnings = {};
validators$1.transitional = function transitional(validator2, version, message) {
  function formatMessage(opt, desc) {
    return "[Axios v" + VERSION$1 + "] Transitional option '" + opt + "'" + desc + (message ? ". " + message : "");
  }
  return (value, opt, opts) => {
    if (validator2 === false) {
      throw new AxiosError$1(
        formatMessage(opt, " has been removed" + (version ? " in " + version : "")),
        AxiosError$1.ERR_DEPRECATED
      );
    }
    if (version && !deprecatedWarnings[opt]) {
      deprecatedWarnings[opt] = true;
      console.warn(
        formatMessage(
          opt,
          " has been deprecated since v" + version + " and will be removed in the near future"
        )
      );
    }
    return validator2 ? validator2(value, opt, opts) : true;
  };
};
validators$1.spelling = function spelling(correctSpelling) {
  return (value, opt) => {
    console.warn(`${opt} is likely a misspelling of ${correctSpelling}`);
    return true;
  };
};
function assertOptions(options, schema, allowUnknown) {
  if (typeof options !== "object") {
    throw new AxiosError$1("options must be an object", AxiosError$1.ERR_BAD_OPTION_VALUE);
  }
  const keys = Object.keys(options);
  let i = keys.length;
  while (i-- > 0) {
    const opt = keys[i];
    const validator2 = Object.prototype.hasOwnProperty.call(schema, opt) ? schema[opt] : void 0;
    if (validator2) {
      const value = options[opt];
      const result = value === void 0 || validator2(value, opt, options);
      if (result !== true) {
        throw new AxiosError$1(
          "option " + opt + " must be " + result,
          AxiosError$1.ERR_BAD_OPTION_VALUE
        );
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw new AxiosError$1("Unknown option " + opt, AxiosError$1.ERR_BAD_OPTION);
    }
  }
}
const validator = {
  assertOptions,
  validators: validators$1
};
const validators = validator.validators;
let Axios$1 = class Axios {
  constructor(instanceConfig) {
    this.defaults = instanceConfig || {};
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    };
  }
  /**
   * Dispatch a request
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  async request(configOrUrl, config) {
    try {
      return await this._request(configOrUrl, config);
    } catch (err) {
      if (err instanceof Error) {
        let dummy = {};
        Error.captureStackTrace ? Error.captureStackTrace(dummy) : dummy = new Error();
        const stack = (() => {
          if (!dummy.stack) {
            return "";
          }
          const firstNewlineIndex = dummy.stack.indexOf("\n");
          return firstNewlineIndex === -1 ? "" : dummy.stack.slice(firstNewlineIndex + 1);
        })();
        try {
          if (!err.stack) {
            err.stack = stack;
          } else if (stack) {
            const firstNewlineIndex = stack.indexOf("\n");
            const secondNewlineIndex = firstNewlineIndex === -1 ? -1 : stack.indexOf("\n", firstNewlineIndex + 1);
            const stackWithoutTwoTopLines = secondNewlineIndex === -1 ? "" : stack.slice(secondNewlineIndex + 1);
            if (!String(err.stack).endsWith(stackWithoutTwoTopLines)) {
              err.stack += "\n" + stack;
            }
          }
        } catch (e) {
        }
      }
      throw err;
    }
  }
  _request(configOrUrl, config) {
    if (typeof configOrUrl === "string") {
      config = config || {};
      config.url = configOrUrl;
    } else {
      config = configOrUrl || {};
    }
    config = mergeConfig$1(this.defaults, config);
    const { transitional: transitional2, paramsSerializer, headers } = config;
    if (transitional2 !== void 0) {
      validator.assertOptions(
        transitional2,
        {
          silentJSONParsing: validators.transitional(validators.boolean),
          forcedJSONParsing: validators.transitional(validators.boolean),
          clarifyTimeoutError: validators.transitional(validators.boolean),
          legacyInterceptorReqResOrdering: validators.transitional(validators.boolean)
        },
        false
      );
    }
    if (paramsSerializer != null) {
      if (utils$1.isFunction(paramsSerializer)) {
        config.paramsSerializer = {
          serialize: paramsSerializer
        };
      } else {
        validator.assertOptions(
          paramsSerializer,
          {
            encode: validators.function,
            serialize: validators.function
          },
          true
        );
      }
    }
    if (config.allowAbsoluteUrls !== void 0) ;
    else if (this.defaults.allowAbsoluteUrls !== void 0) {
      config.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls;
    } else {
      config.allowAbsoluteUrls = true;
    }
    validator.assertOptions(
      config,
      {
        baseUrl: validators.spelling("baseURL"),
        withXsrfToken: validators.spelling("withXSRFToken")
      },
      true
    );
    config.method = (config.method || this.defaults.method || "get").toLowerCase();
    let contextHeaders = headers && utils$1.merge(headers.common, headers[config.method]);
    headers && utils$1.forEach(["delete", "get", "head", "post", "put", "patch", "common"], (method) => {
      delete headers[method];
    });
    config.headers = AxiosHeaders$1.concat(contextHeaders, headers);
    const requestInterceptorChain = [];
    let synchronousRequestInterceptors = true;
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      if (typeof interceptor.runWhen === "function" && interceptor.runWhen(config) === false) {
        return;
      }
      synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;
      const transitional3 = config.transitional || transitionalDefaults;
      const legacyInterceptorReqResOrdering = transitional3 && transitional3.legacyInterceptorReqResOrdering;
      if (legacyInterceptorReqResOrdering) {
        requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
      } else {
        requestInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
      }
    });
    const responseInterceptorChain = [];
    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });
    let promise;
    let i = 0;
    let len;
    if (!synchronousRequestInterceptors) {
      const chain = [dispatchRequest.bind(this), void 0];
      chain.unshift(...requestInterceptorChain);
      chain.push(...responseInterceptorChain);
      len = chain.length;
      promise = Promise.resolve(config);
      while (i < len) {
        promise = promise.then(chain[i++], chain[i++]);
      }
      return promise;
    }
    len = requestInterceptorChain.length;
    let newConfig = config;
    while (i < len) {
      const onFulfilled = requestInterceptorChain[i++];
      const onRejected = requestInterceptorChain[i++];
      try {
        newConfig = onFulfilled(newConfig);
      } catch (error) {
        onRejected.call(this, error);
        break;
      }
    }
    try {
      promise = dispatchRequest.call(this, newConfig);
    } catch (error) {
      return Promise.reject(error);
    }
    i = 0;
    len = responseInterceptorChain.length;
    while (i < len) {
      promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
    }
    return promise;
  }
  getUri(config) {
    config = mergeConfig$1(this.defaults, config);
    const fullPath = buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls);
    return buildURL(fullPath, config.params, config.paramsSerializer);
  }
};
utils$1.forEach(["delete", "get", "head", "options"], function forEachMethodNoData(method) {
  Axios$1.prototype[method] = function(url2, config) {
    return this.request(
      mergeConfig$1(config || {}, {
        method,
        url: url2,
        data: (config || {}).data
      })
    );
  };
});
utils$1.forEach(["post", "put", "patch"], function forEachMethodWithData(method) {
  function generateHTTPMethod(isForm) {
    return function httpMethod(url2, data, config) {
      return this.request(
        mergeConfig$1(config || {}, {
          method,
          headers: isForm ? {
            "Content-Type": "multipart/form-data"
          } : {},
          url: url2,
          data
        })
      );
    };
  }
  Axios$1.prototype[method] = generateHTTPMethod();
  Axios$1.prototype[method + "Form"] = generateHTTPMethod(true);
});
let CancelToken$1 = class CancelToken {
  constructor(executor) {
    if (typeof executor !== "function") {
      throw new TypeError("executor must be a function.");
    }
    let resolvePromise;
    this.promise = new Promise(function promiseExecutor(resolve) {
      resolvePromise = resolve;
    });
    const token = this;
    this.promise.then((cancel) => {
      if (!token._listeners) return;
      let i = token._listeners.length;
      while (i-- > 0) {
        token._listeners[i](cancel);
      }
      token._listeners = null;
    });
    this.promise.then = (onfulfilled) => {
      let _resolve;
      const promise = new Promise((resolve) => {
        token.subscribe(resolve);
        _resolve = resolve;
      }).then(onfulfilled);
      promise.cancel = function reject() {
        token.unsubscribe(_resolve);
      };
      return promise;
    };
    executor(function cancel(message, config, request) {
      if (token.reason) {
        return;
      }
      token.reason = new CanceledError$1(message, config, request);
      resolvePromise(token.reason);
    });
  }
  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  }
  /**
   * Subscribe to the cancel signal
   */
  subscribe(listener) {
    if (this.reason) {
      listener(this.reason);
      return;
    }
    if (this._listeners) {
      this._listeners.push(listener);
    } else {
      this._listeners = [listener];
    }
  }
  /**
   * Unsubscribe from the cancel signal
   */
  unsubscribe(listener) {
    if (!this._listeners) {
      return;
    }
    const index = this._listeners.indexOf(listener);
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }
  toAbortSignal() {
    const controller = new AbortController();
    const abort2 = (err) => {
      controller.abort(err);
    };
    this.subscribe(abort2);
    controller.signal.unsubscribe = () => this.unsubscribe(abort2);
    return controller.signal;
  }
  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static source() {
    let cancel;
    const token = new CancelToken(function executor(c) {
      cancel = c;
    });
    return {
      token,
      cancel
    };
  }
};
function spread$1(callback) {
  return function wrap2(arr) {
    return callback.apply(null, arr);
  };
}
function isAxiosError$1(payload) {
  return utils$1.isObject(payload) && payload.isAxiosError === true;
}
const HttpStatusCode$1 = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511,
  WebServerIsDown: 521,
  ConnectionTimedOut: 522,
  OriginIsUnreachable: 523,
  TimeoutOccurred: 524,
  SslHandshakeFailed: 525,
  InvalidSslCertificate: 526
};
Object.entries(HttpStatusCode$1).forEach(([key, value]) => {
  HttpStatusCode$1[value] = key;
});
function createInstance(defaultConfig) {
  const context = new Axios$1(defaultConfig);
  const instance = bind$2(Axios$1.prototype.request, context);
  utils$1.extend(instance, Axios$1.prototype, context, { allOwnKeys: true });
  utils$1.extend(instance, context, null, { allOwnKeys: true });
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig$1(defaultConfig, instanceConfig));
  };
  return instance;
}
const axios = createInstance(defaults);
axios.Axios = Axios$1;
axios.CanceledError = CanceledError$1;
axios.CancelToken = CancelToken$1;
axios.isCancel = isCancel$1;
axios.VERSION = VERSION$1;
axios.toFormData = toFormData$1;
axios.AxiosError = AxiosError$1;
axios.Cancel = axios.CanceledError;
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = spread$1;
axios.isAxiosError = isAxiosError$1;
axios.mergeConfig = mergeConfig$1;
axios.AxiosHeaders = AxiosHeaders$1;
axios.formToJSON = (thing) => formDataToJSON(utils$1.isHTMLForm(thing) ? new FormData(thing) : thing);
axios.getAdapter = adapters.getAdapter;
axios.HttpStatusCode = HttpStatusCode$1;
axios.default = axios;
const {
  Axios: Axios2,
  AxiosError: AxiosError2,
  CanceledError: CanceledError2,
  isCancel,
  CancelToken: CancelToken2,
  VERSION,
  all: all2,
  Cancel,
  isAxiosError,
  spread,
  toFormData,
  AxiosHeaders: AxiosHeaders2,
  HttpStatusCode,
  formToJSON,
  getAdapter,
  mergeConfig
} = axios;
function apiRequest(path2, options = {}) {
  console.log(`[API disabled] ${path2}`);
  return Promise.resolve({ success: false, ok: false, message: REMOTE_API_DISABLED_MESSAGE });
}
function runCmd(exe, args, options = {}) {
  const result = child_process.spawnSync(exe, args, {
    encoding: options.encoding || "utf8",
    timeout: options.timeout || 5e3,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: options.maxBuffer || 1024 * 1024
  });
  if (result.error) throw result.error;
  return result.stdout;
}
function runPS(script, options = {}) {
  return runCmd(getPSExe(), [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ${script}`
  ], options);
}
function runWmic(args, options = {}) {
  return runCmd("wmic.exe", args, options);
}
function runReg(args, options = {}) {
  return runCmd("reg.exe", args, options);
}
function getPSExe() {
  const sysRoot = process.env.SystemRoot || "C:\\Windows";
  return `${sysRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;
}
function getCurrentDiskSerial(appPath) {
  const targetPath = appPath || process.execPath;
  if (process.platform === "darwin") {
    const volumeSerial = getVolumeSerialMac(targetPath);
    return volumeSerial;
  }
  if (process.platform === "win32") {
    const pathModule = require("path");
    const driveLetter = pathModule.parse(process.execPath).root;
    console.log("[usbSerial] process.execPath =", process.execPath);
    console.log("[usbSerial] driveLetter =", driveLetter);
    if (!driveLetter) {
      console.log("[usbSerial] 无法从 execPath 解析盘符，返回 null");
      return null;
    }
    const dl = driveLetter[0] + ":";
    console.log("[usbSerial] 目标盘符:", dl);
    const serial2 = getWindowsDiskSerial(dl);
    return serial2;
  }
  return null;
}
function isRunningFromUSB(appPath) {
  try {
    const targetPath = appPath || process.execPath;
    if (process.platform === "darwin") {
      return targetPath.startsWith("/Volumes/");
    } else if (process.platform === "win32") {
      const driveMatch = targetPath.match(/^([A-Za-z]):/);
      if (!driveMatch) return false;
      const driveLetter = driveMatch[1].toUpperCase();
      if (driveLetter === "C") {
        console.log("[isUSB] 盘符为 C:，系统盘不可能是 USB，直接返回 false");
        return false;
      }
      try {
        try {
          const psNet = `[System.IO.DriveInfo]::GetDrives()|Where-Object{$_.Name -eq '${driveLetter}:\\'}|Select-Object -ExpandProperty DriveType`;
          const output = runPS(psNet, { timeout: 5e3 });
          console.log("[isUSB] 方法A(DriveInfo) 原始输出:", JSON.stringify(output));
          const driveType = parseInt(output.trim(), 10);
          if (!isNaN(driveType)) {
            console.log(`[isUSB] 方法A(DriveInfo) 成功, DriveType=${driveType}, Removable=${driveType === 2}`);
            return driveType === 2;
          }
          console.log("[isUSB] 方法A(DriveInfo) parseInt 失败, output:", JSON.stringify(output));
        } catch (e) {
          console.error("[isUSB] 方法A(DriveInfo) 异常:", e.message);
        }
        try {
          const psCim = `Get-CimInstance Win32_LogicalDisk|Where-Object{$_.DeviceID -eq '${driveLetter}:'}|Select-Object -ExpandProperty DriveType`;
          const output = runPS(psCim, { timeout: 15e3 });
          console.log("[isUSB] 方法B(CimInstance) 原始输出:", JSON.stringify(output));
          const dt = parseInt(output.trim(), 10);
          if (!isNaN(dt)) {
            console.log(`[isUSB] 方法B(CimInstance) 成功, DriveType=${dt}, Removable=${dt === 2}`);
            return dt === 2;
          }
          console.log("[isUSB] 方法B(CimInstance) parseInt 失败, output:", JSON.stringify(output));
        } catch (e) {
          console.error("[isUSB] 方法B(CimInstance) 异常:", e.message);
        }
        try {
          const fsOutputBuf = runCmd("fsutil.exe", ["fsinfo", "drivetype", `${driveLetter}:`], { encoding: "buffer", timeout: 5e3 });
          const fsOutputUtf8 = fsOutputBuf.toString("utf8");
          console.log("[isUSB] 方法C(fsutil) UTF-8输出:", JSON.stringify(fsOutputUtf8));
          if (/可移动|Removable/i.test(fsOutputUtf8)) {
            console.log("[isUSB] 方法C(fsutil) UTF-8匹配: 可移动驱动器");
            return true;
          }
          if (/固定|Fixed/i.test(fsOutputUtf8)) {
            console.log("[isUSB] 方法C(fsutil) UTF-8匹配: 固定驱动器");
            return false;
          }
          const buf = fsOutputBuf;
          const gbkRemovable = Buffer.from([191, 201, 210, 198, 182, 175]);
          const gbkFixed = Buffer.from([185, 204, 182, 168]);
          if (buf.includes(gbkRemovable)) {
            console.log("[isUSB] 方法C(fsutil) GBK字节匹配: 可移动驱动器");
            return true;
          }
          if (buf.includes(gbkFixed)) {
            console.log("[isUSB] 方法C(fsutil) GBK字节匹配: 固定驱动器");
            return false;
          }
          console.log("[isUSB] 方法C(fsutil) 未匹配到关键字");
        } catch (e) {
          console.error("[isUSB] 方法C(fsutil) 异常:", e.message);
        }
        try {
          const wmicOutput = runWmic(["logicaldisk", "where", `DeviceID='${driveLetter}:'`, "get", "DriveType"], { timeout: 3e3 });
          console.log("[isUSB] 方法D(wmic) 原始输出:", JSON.stringify(wmicOutput));
          const lines = wmicOutput.trim().split(/\r?\n/).filter((l) => l.trim());
          for (let i = 1; i < lines.length; i++) {
            const dt = parseInt(lines[i].trim(), 10);
            if (!isNaN(dt)) {
              console.log(`[isUSB] 方法D(wmic) 成功, DriveType=${dt}, Removable=${dt === 2}`);
              return dt === 2;
            }
          }
          console.log("[isUSB] 方法D(wmic) 未解析到有效数值");
        } catch (e) {
          console.error("[isUSB] 方法D(wmic) 异常:", e.message);
        }
        try {
          const psWmi = `Get-WmiObject Win32_LogicalDisk|Where-Object{$_.DeviceID -eq '${driveLetter}:'}|Select-Object -ExpandProperty DriveType`;
          const output = runPS(psWmi, { timeout: 5e3 });
          console.log("[isUSB] 方法E(WmiObject) 原始输出:", JSON.stringify(output));
          const dt = parseInt(output.trim(), 10);
          if (!isNaN(dt)) {
            console.log(`[isUSB] 方法E(WmiObject) 成功, DriveType=${dt}, Removable=${dt === 2}`);
            return dt === 2;
          }
          console.log("[isUSB] 方法E(WmiObject) parseInt 失败, output:", JSON.stringify(output));
        } catch (e) {
          console.error("[isUSB] 方法E(WmiObject) 异常:", e.message);
        }
        console.log("[isUSB] 所有方法均未成功判定");
        return false;
      } catch (_) {
        return false;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}
function getVolumeSerialMac(appPath) {
  try {
    const targetPath = appPath || process.execPath;
    const dfOutput = child_process.execSync(`df "${targetPath}"`, { encoding: "utf8" });
    const lines = dfOutput.trim().split("\n");
    if (lines.length < 2) return null;
    const fields = lines[1].trim().split(/\s+/);
    if (fields.length < 4) return null;
    const device = fields[0];
    const mountPoint = fields[fields.length - 1];
    if (!mountPoint.startsWith("/Volumes/") || mountPoint === "/") {
      return null;
    }
    const diskInfo = child_process.execSync(`diskutil info "${device}"`, { encoding: "utf8" });
    const serialMatch = diskInfo.match(/Volume Serial Number:\s*(.+)/);
    if (serialMatch && serialMatch[1].trim()) {
      return serialMatch[1].trim();
    }
    const uuidMatch = diskInfo.match(/Device UUID:\s*(.+)/);
    if (uuidMatch && uuidMatch[1].trim()) {
      return uuidMatch[1].trim();
    }
    return null;
  } catch (error) {
    console.error("[usbSerial] getVolumeSerialMac failed:", error.message);
    return null;
  }
}
async function getAppDriveInfo() {
  let targetPath = process.execPath;
  let usingFallback = false;
  if (process.platform === "win32") {
    const match = targetPath.match(/^([A-Za-z]):/);
    if (!match) {
      targetPath = process.cwd();
      usingFallback = true;
    }
  }
  const isUSB = isRunningFromUSB(targetPath);
  const serial2 = isUSB ? await getCurrentDiskSerial(targetPath) : null;
  let driveLetter = null;
  let rootPath = null;
  if (process.platform === "win32") {
    const match = targetPath.match(/^([A-Za-z]):/);
    driveLetter = match ? match[1].toUpperCase() + ":" : null;
    rootPath = driveLetter ? driveLetter + "\\" : null;
  } else if (process.platform === "darwin") {
    if (targetPath.startsWith("/Volumes/")) {
      const parts = targetPath.split("/");
      rootPath = "/" + parts[1] + "/" + parts[2];
      driveLetter = null;
    }
  }
  return {
    driveLetter,
    rootPath,
    isUSB,
    serial: serial2,
    platform: process.platform,
    _usingFallback: usingFallback
  };
}
function getWindowsDiskSerial(drive) {
  const available = {};
  let preCheckProbablyFailed = false;
  try {
    const psCheck = runPS(
      "Get-Command Get-WmiObject,Get-CimInstance,Get-PhysicalDisk,Get-Disk,Get-Partition -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name",
      { timeout: 5e3 }
    );
    const cmds = psCheck.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    for (const cmd of cmds) available[cmd] = true;
    console.log("[usbSerial] 预检 PS 输出:", JSON.stringify(psCheck.substring(0, 200)));
  } catch (e) {
    console.log("[usbSerial] 预检 PowerShell Get-Command 失败:", e.message);
  }
  for (const cmd of ["wmic", "diskpart", "reg"]) {
    try {
      const whereResult = runCmd("where.exe", [cmd], { timeout: 2e3 });
      if (whereResult && whereResult.trim()) {
        available[cmd] = true;
      }
    } catch (_) {
    }
  }
  console.log("[usbSerial] 命令可用性:", JSON.stringify(available));
  const allPsCmds = ["Get-WmiObject", "Get-CimInstance", "Get-PhysicalDisk", "Get-Disk", "Get-Partition"];
  const anyPsAvailable = allPsCmds.some((c) => available[c]);
  if (!anyPsAvailable) {
    preCheckProbablyFailed = true;
    console.log("[usbSerial] ⚠ 预检未发现任何 PowerShell cmdlet，可能是预检本身失败，将尝试所有方法（不跳过）");
  }
  const methods = [
    // ===== 原有方法 =====
    // 方法1: Win32_LogicalDisk + WMI 关联查询（经典方式）
    () => {
      const psScript = `& { $d = '${drive}'; Get-WmiObject Win32_LogicalDisk -Filter ([string]::Format('DeviceID=''{0}''', $d)) | ForEach-Object { Get-WmiObject -Query ([string]::Format('ASSOCIATORS OF {{Win32_LogicalDisk.DeviceID=''{0}''}} WHERE AssocClass=Win32_LogicalDiskToPartition', $_.DeviceID)) | ForEach-Object { Get-WmiObject -Query ([string]::Format('ASSOCIATORS OF {{Win32_DiskPartition.DeviceID=''{0}''}} WHERE AssocClass=Win32_DiskDriveToDiskPartition', $_.DeviceID)) | Select-Object -ExpandProperty SerialNumber } } | Select-Object -First 1 } | ForEach-Object { if ($_) { $_.Replace('[^ -~]', '').Trim() } }`;
      console.log("[usbSerial] 尝试方法1: WMI Win32_LogicalDisk");
      const result = runPS(psScript, { timeout: 5e3 });
      return result.trim() || null;
    },
    // 方法2: wmic 从盘符关联到物理磁盘序列号
    () => {
      console.log("[usbSerial] 尝试方法2: wmic LogicalDisk→DiskDrive");
      const assocOutput = runWmic(["logicaldisk", "where", `DeviceID='${drive}'`, "assoc"], { timeout: 5e3 });
      console.log("[usbSerial] wmic assoc 输出:", assocOutput);
      const diskMatch = assocOutput.match(/Disk\s*#(\d+)/i);
      if (diskMatch) {
        const diskIndex = diskMatch[1];
        console.log("[usbSerial] 找到磁盘索引:", diskIndex);
        const result = runWmic(["diskdrive", "where", `Index=${diskIndex}`, "get", "serialnumber"], { timeout: 5e3 });
        const lines = result.trim().split(/\r?\n/);
        for (let i = 1; i < lines.length; i++) {
          const s = lines[i].trim();
          if (s && s.length > 0) return s;
        }
      }
      return null;
    },
    // 方法3: CIM 关联查询（临时 .ps1 文件方式，不经过 cmd.exe）
    () => {
      const fs2 = require("fs");
      const os2 = require("os");
      const path2 = require("path");
      const psScript = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $d = '${drive}'; Get-CimInstance Win32_LogicalDisk -Filter ([string]::Format('DeviceID=''{0}''', $d)) | ForEach-Object { Get-CimAssociatedInstance -InputObject $_ -ResultClassName Win32_DiskPartition } | ForEach-Object { Get-CimAssociatedInstance -InputObject $_ -ResultClassName Win32_DiskDrive } | Select-Object -ExpandProperty SerialNumber -First 1 | ForEach-Object { if ($_) { $_ -replace '[^\\x20-\\x7E]', '' -replace '^\\s+|\\s+$', '' } }`;
      const tmpFile = path2.join(os2.tmpdir(), `_usb_serial_${Date.now()}.ps1`);
      const psExe = getPSExe();
      console.log("[usbSerial] 尝试方法3: CIM Win32_LogicalDisk (临时文件+直接PS)");
      try {
        fs2.writeFileSync(tmpFile, psScript, "utf8");
        const result = runCmd(psExe, [
          "-NoProfile",
          "-NonInteractive",
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          tmpFile
        ], { timeout: 15e3 });
        return result.trim() || null;
      } finally {
        try {
          fs2.unlinkSync(tmpFile);
        } catch (_) {
        }
      }
    },
    // 方法4: Win32_USBHub 获取设备序列号
    () => {
      console.log("[usbSerial] 尝试方法4: Win32_USBHub");
      const psScript = `Get-CimInstance Win32_USBHub | Where-Object { $_.DeviceID -like '*${drive[0]}*' } | Select-Object -ExpandProperty SerialNumber | Select-Object -First 1`;
      const result = runPS(psScript, { timeout: 5e3 });
      return result.trim() || null;
    },
    // 方法5: 使用 VolumeSerialNumber
    () => {
      console.log("[usbSerial] 尝试方法5: VolumeSerialNumber");
      const psScript = `(Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='${drive}'").VolumeSerialNumber`;
      const result = runPS(psScript, { timeout: 5e3 });
      return result.trim() || null;
    },
    // 方法6: Get-Partition → Get-PhysicalDisk
    () => {
      console.log("[usbSerial] 尝试方法6: Get-Partition + Get-PhysicalDisk");
      const psScript = `& { $d = '${drive}'; Get-Partition -DriveLetter $d[0] -ErrorAction SilentlyContinue | Get-PhysicalDisk | Select-Object -ExpandProperty SerialNumber }`;
      const result = runPS(psScript, { timeout: 5e3 });
      return result.trim() || null;
    },
    // ===== 补充方法 =====
    // 方法7: Get-CimInstance Win32_LogicalDisk（CIM 方式）
    () => {
      const psScript = `& { $d = '${drive}'; Get-CimInstance Win32_LogicalDisk -Filter ([string]::Format('DeviceID=''{0}''', $d)) | ForEach-Object { Get-CimInstance -Query ([string]::Format('ASSOCIATORS OF {{Win32_LogicalDisk.DeviceID=''{0}''}} WHERE AssocClass=Win32_LogicalDiskToPartition', $_.DeviceID)) | ForEach-Object { Get-CimInstance -Query ([string]::Format('ASSOCIATORS OF {{Win32_DiskPartition.DeviceID=''{0}''}} WHERE AssocClass=Win32_DiskDriveToDiskPartition', $_.DeviceID)) | Select-Object -ExpandProperty SerialNumber } } | Select-Object -First 1 } | ForEach-Object { if ($_) { $_.Replace('[^ -~]', '').Trim() } }`;
      console.log("[usbSerial] 尝试方法7: CIM Win32_LogicalDisk");
      const result = runPS(psScript, { timeout: 5e3 });
      return result.trim() || null;
    },
    // 方法8: wmic 从盘符关联到 Win32_PhysicalMedia 序列号
    () => {
      console.log("[usbSerial] 尝试方法8: wmic LogicalDisk→PhysicalMedia");
      const assocOutput = runWmic(["logicaldisk", "where", `DeviceID='${drive}'`, "assoc"], { timeout: 5e3 });
      const diskMatch = assocOutput.match(/Disk\s*#(\d+)/i);
      if (diskMatch) {
        const diskIndex = diskMatch[1];
        const result = runWmic(["path", "Win32_PhysicalMedia", "where", `Tag='\\\\\\\\.\\\\PHYSICALDRIVE${diskIndex}'`, "get", "SerialNumber"], { timeout: 5e3 });
        const lines = result.trim().split(/\r?\n/);
        for (let i = 1; i < lines.length; i++) {
          const s = lines[i].trim();
          if (s && s.length > 0) return s;
        }
      }
      return null;
    },
    // 方法9: diskpart 脚本方式
    () => {
      console.log("[usbSerial] 尝试方法9: diskpart (脚本文件)");
      const fs2 = require("fs");
      const os2 = require("os");
      const path2 = require("path");
      const volLetter = drive[0];
      const scriptFile = path2.join(os2.tmpdir(), `_diskpart_${Date.now()}.txt`);
      try {
        fs2.writeFileSync(scriptFile, `select volume=${volLetter}\r
detail volume\r
`, "utf8");
        const result = runCmd("diskpart.exe", ["/s", scriptFile], { timeout: 15e3 });
        console.log("[usbSerial] diskpart detail volume 输出:", result.substring(0, 300));
        const match = result.match(/Disk\s*(\d+)/i);
        if (match) {
          const diskNum = match[1];
          const diskScript = path2.join(os2.tmpdir(), `_diskpart2_${Date.now()}.txt`);
          try {
            fs2.writeFileSync(diskScript, `select disk ${diskNum}\r
detail disk\r
`, "utf8");
            const diskResult = runCmd("diskpart.exe", ["/s", diskScript], { timeout: 15e3 });
            console.log("[usbSerial] diskpart detail disk 输出:", diskResult.substring(0, 300));
            const snMatch = diskResult.match(/Disk ID\s*:\s*([0-9A-Fa-f]{8})/i);
            if (snMatch) return snMatch[1].trim();
            const vidMatch = diskResult.match(/Vendor ID\s*:\s*(.+)/i);
            if (vidMatch) return vidMatch[1].trim();
          } finally {
            try {
              fs2.unlinkSync(diskScript);
            } catch (_) {
            }
          }
        }
      } finally {
        try {
          fs2.unlinkSync(scriptFile);
        } catch (_) {
        }
      }
      return null;
    },
    // ===== 补充方法（PowerShell 新途径）=====
    // 方法10: Get-PhysicalDisk 按 USB 总线类型查
    () => {
      console.log("[usbSerial] 尝试方法10: Get-PhysicalDisk USB");
      const psScript = `Get-PhysicalDisk | Where-Object { $_.BusType -eq 'USB' } | Select-Object -ExpandProperty SerialNumber | Select-Object -First 1`;
      const result = runPS(psScript, { timeout: 5e3 });
      return result.trim() || null;
    },
    // 方法11: Get-Disk 按 USB 总线类型查
    () => {
      console.log("[usbSerial] 尝试方法11: Get-Disk USB");
      const psScript = `Get-Disk | Where-Object { $_.BusType -eq 'USB' } | Select-Object -ExpandProperty SerialNumber | Select-Object -First 1`;
      const result = runPS(psScript, { timeout: 5e3 });
      return result.trim() || null;
    },
    // 方法12: Win32_DiskDrive 通过盘符关联查硬件序列号
    () => {
      console.log("[usbSerial] 尝试方法12: Win32_DiskDrive 盘符关联");
      const psScript = `$d='${drive}';$part=(Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$d'"|Get-CimAssociatedInstance -ResultClassName Win32_DiskPartition);Get-CimInstance Win32_DiskDrive|Where-Object{$_.Index -eq $part.DiskIndex}|Select -Expand SerialNumber`;
      const result = runPS(psScript, { timeout: 5e3 });
      return result.trim() || null;
    },
    // 方法13: WMI 关联查询 LogicalDisk → DiskPartition → DiskDrive（简化版）
    () => {
      console.log("[usbSerial] 尝试方法13: WMI 关联查询（简化）");
      const psScript = `$d='${drive}';Get-WmiObject Win32_LogicalDisk -Filter "DeviceID='$d'"|%{Get-WmiObject -Query "ASSOCIATORS OF {Win32_LogicalDisk.DeviceID='$($_.DeviceID)'} WHERE AssocClass=Win32_LogicalDiskToPartition"}|%{Get-WmiObject -Query "ASSOCIATORS OF {Win32_DiskPartition.DeviceID='$($_.DeviceID)'} WHERE AssocClass=Win32_DiskDriveToDiskPartition"}|Select -Expand SerialNumber`;
      const result = runPS(psScript, { timeout: 5e3 });
      return result.trim() || null;
    },
    // 方法14: 注册表 MountedDevices → Volume GUID → USBSTOR 序列号
    () => {
      console.log("[usbSerial] 尝试方法14: 注册表 MountedDevices → USBSTOR");
      try {
        const mountedResult = runReg(["query", "HKLM\\SYSTEM\\MountedDevices"], { timeout: 5e3 });
        const mountedLines = mountedResult.split(/\r?\n/);
        let volumeGuid = null;
        for (const line of mountedLines) {
          if (line.includes(`\\\\DosDevices\\\\${drive[0]}:`)) {
            console.log("[usbSerial] 找到 DosDevices 条目:", line.substring(0, 80));
          }
        }
        for (let i = 0; i < mountedLines.length; i++) {
          const line = mountedLines[i];
          const guidMatch = line.match(/(\{[a-f0-9\-]{36}\})/i);
          if (guidMatch && i + 1 < mountedLines.length) {
            if (mountedLines[i + 1].includes(`DosDevices\\\\${drive[0]}:`)) {
              volumeGuid = guidMatch[1];
              console.log("[usbSerial] 找到 Volume GUID:", volumeGuid);
              break;
            }
          }
        }
        if (volumeGuid) {
          const volumeRegPath = `HKLM\\SYSTEM\\CurrentControlSet\\Enum\\STORAGE\\Volume\\${volumeGuid}`;
          try {
            runReg(["query", volumeRegPath, "/v", "ParentIdPrefix"], { timeout: 5e3 });
          } catch (_) {
          }
        }
        try {
          const usbstorResult = runReg(["query", "HKLM\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR"], { timeout: 5e3 });
          const deviceLines = usbstorResult.split(/\r?\n/).filter((l) => l.includes("HKEY_LOCAL_MACHINE"));
          for (const deviceLine of deviceLines) {
            const devicePath = deviceLine.replace("HKEY_LOCAL_MACHINE", "HKLM").trim();
            if (devicePath.includes("USBSTOR") && !devicePath.endsWith("USBSTOR")) {
              try {
                const subResult = runReg(["query", devicePath], { timeout: 3e3 });
                const subLines = subResult.split(/\r?\n/).filter((l) => l.includes("HKEY_LOCAL_MACHINE"));
                for (const subLine of subLines) {
                  const snPath = subLine.replace("HKEY_LOCAL_MACHINE", "HKLM").trim();
                  const snMatch = snPath.match(/\\\\([^\\&]+)$/);
                  if (snMatch && snMatch[1].length > 4) {
                    try {
                      const friendlyResult = runReg(["query", snPath, "/v", "FriendlyName"], { timeout: 3e3 });
                      if (friendlyResult.includes("FriendlyName")) {
                        console.log("[usbSerial] USBSTOR 找到设备:", snMatch[1], "at", snPath);
                        return snMatch[1];
                      }
                    } catch (_) {
                    }
                  }
                }
              } catch (_) {
              }
            }
          }
        } catch (_) {
        }
      } catch (_) {
      }
      return null;
    },
    // 方法15: Win32_USBControllerDevice 获取 USB 设备 ID
    () => {
      console.log("[usbSerial] 尝试方法15: USB Controller Device");
      const psScript = `Get-CimInstance Win32_USBControllerDevice | %{[wmi]$_.Dependent} | Where-Object { $_.DeviceID -match 'USB\\\\VID' } | Select-Object -ExpandProperty DeviceID | Select-Object -First 1`;
      const result = runPS(psScript, { timeout: 5e3 });
      const trimmed = result.trim();
      if (trimmed) {
        const serialMatch = trimmed.match(/\\\\([^\\&]+)$/);
        if (serialMatch) return serialMatch[1];
      }
      return null;
    },
    // ===== 新增兜底方法 =====
    // 方法16: 用完整路径尝试 wmic（绕过 PATH 问题）
    () => {
      console.log("[usbSerial] 尝试方法16: wmic 完整路径 DiskDrive");
      const wmicPath = process.env.SystemRoot ? `${process.env.SystemRoot}\\System32\\wbem\\wmic.exe` : "C:\\Windows\\System32\\wbem\\wmic.exe";
      try {
        const result = runCmd(wmicPath, ["diskdrive", "get", "Index,SerialNumber"], { timeout: 5e3 });
        console.log("[usbSerial] wmic 完整路径 diskdrive 输出:", result.substring(0, 200));
        const assocResult = runCmd(wmicPath, ["logicaldisk", "where", `DeviceID='${drive}'`, "assoc"], { timeout: 5e3 });
        const diskMatch = assocResult.match(/Disk\s*#(\d+)/i);
        if (diskMatch) {
          const lines = result.split(/\r?\n/);
          for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].trim().split(/\s+/);
            if (parts.length >= 2 && parts[0] === diskMatch[1]) {
              const sn = parts[parts.length - 1];
              if (sn && sn.length > 0) return sn;
            }
          }
        }
      } catch (_) {
      }
      return null;
    },
    // 方法17: 通过 PowerShell 直接调用 .NET 获取 Win32_DiskDrive
    () => {
      console.log("[usbSerial] 尝试方法17: PS .NET WMI 查询");
      const psScript = `$d='${drive}';$searcher=New-Object System.Management.ManagementObjectSearcher('root\\CIMV2','SELECT * FROM Win32_LogicalDisk WHERE DeviceID=\\''+$d+''');$disk=$searcher.Get();$disk|%{$_.GetRelated('Win32_DiskPartition')}|%{$_.GetRelated('Win32_DiskDrive')}|Select -Expand SerialNumber`;
      const result = runPS(psScript, { timeout: 1e4 });
      return result.trim() || null;
    },
    // 方法18: 注册表 SCSI 枚举获取磁盘序列号
    () => {
      console.log("[usbSerial] 尝试方法18: 注册表 SCSI 枚举");
      try {
        const scsiResult = runReg(["query", "HKLM\\HARDWARE\\DEVICEMAP\\Scsi"], { timeout: 5e3 });
        const scsiPorts = scsiResult.split(/\r?\n/).filter((l) => l.includes("Scsi Port"));
        for (const portLine of scsiPorts) {
          const portPath = portLine.replace("HKEY_LOCAL_MACHINE", "HKLM").trim();
          if (portPath.includes("Scsi Port")) {
            try {
              const portResult = runReg(["query", portPath, "/s"], { timeout: 5e3 });
              const snRegex = /Serial\s*Number\s+REG_SZ\s+(.+)/i;
              const snMatch = portResult.match(snRegex);
              if (snMatch) {
                const sn = snMatch[1].trim();
                if (sn && sn.length > 3 && sn !== "0") {
                  console.log("[usbSerial] SCSI 枚举找到序列号:", sn);
                  return sn;
                }
              }
              const idRegex = /Identifier\s+REG_SZ\s+(.+)/i;
              const idMatch = portResult.match(idRegex);
              if (idMatch) {
                const id = idMatch[1].trim();
                if (id && id.length > 3) {
                  console.log("[usbSerial] SCSI 枚举找到 Identifier:", id);
                  return id;
                }
              }
            } catch (_) {
            }
          }
        }
      } catch (_) {
      }
      return null;
    }
  ];
  const methodRequirements = [
    ["Get-WmiObject"],
    // 方法1
    ["wmic"],
    // 方法2
    ["Get-CimInstance"],
    // 方法3
    ["Get-CimInstance"],
    // 方法4
    ["Get-CimInstance"],
    // 方法5
    ["Get-Partition", "Get-PhysicalDisk"],
    // 方法6
    ["Get-CimInstance"],
    // 方法7
    ["wmic"],
    // 方法8
    ["diskpart"],
    // 方法9
    ["Get-PhysicalDisk"],
    // 方法10
    ["Get-Disk"],
    // 方法11
    ["Get-CimInstance"],
    // 方法12
    ["Get-WmiObject"],
    // 方法13
    ["reg"],
    // 方法14
    ["Get-CimInstance"],
    // 方法15
    [],
    // 方法16: wmic 完整路径，不需要预检
    [],
    // 方法17: .NET WMI，不需要预检
    ["reg"]
    // 方法18: SCSI 注册表
  ];
  for (let i = 0; i < methods.length; i++) {
    const reqs = methodRequirements[i];
    const missing = reqs.filter((r) => !available[r]);
    if (missing.length > 0 && !preCheckProbablyFailed) {
      console.log(`[usbSerial] 跳过方法 ${i + 1}: 缺少 ${missing.join(", ")}`);
      continue;
    }
    if (missing.length > 0 && preCheckProbablyFailed) {
      console.log(`[usbSerial] 方法 ${i + 1} 依赖 ${missing.join(", ")} 预检未通过，但预检可能失败，仍尝试...`);
    }
    try {
      console.log(`[usbSerial] 执行方法 ${i + 1}...`);
      const startTime = Date.now();
      const serial2 = methods[i]();
      const elapsed = Date.now() - startTime;
      if (serial2) {
        console.log(`[usbSerial] 方法 ${i + 1} 成功，耗时: ${elapsed}ms，序列号: ${serial2}`);
        return serial2;
      }
    } catch (e) {
      console.log(`[usbSerial] 方法 ${i + 1} 失败: ${e.message}`);
    }
  }
  console.log("[usbSerial] 所有方法都无法获取序列号");
  return null;
}
async function detectUSBStatus() {
  const info = await getAppDriveInfo();
  const appPath = process.execPath;
  const result = {
    isOnUSB: info.isUSB,
    serial: info.serial,
    path: appPath,
    driveLetter: info.driveLetter,
    rootPath: info.rootPath
  };
  return result;
}
const skillNameMap = {
  // 文档处理
  "document-pro": "文档专家",
  "nano-pdf": "PDF编辑",
  "pdf-ocr": "PDF转Word",
  "pdf-smart-tool-cn": "PDF智能工具",
  "summarize": "内容摘要",
  // 视频相关
  "video-download": "视频下载",
  "video-clip": "视频剪辑",
  "video-frames": "视频截帧",
  "video-subtitles": "视频字幕",
  "douyin-video-fetch": "抖音视频获取",
  "lh-video-gen": "视频生成",
  "ffmpeg-cli": "FFmpeg处理",
  "ffmpeg-video-editor": "视频编辑器",
  // 社交媒体
  "weibo-hot-trend": "微博热搜",
  "douyin-hot-trend": "抖音热榜",
  "xiaohongshu-crawler": "小红书爬虫",
  "discord": "Discord助手",
  // 电商购物
  "cn-ecommerce-search": "电商搜索",
  "ecommerce-price-comparison": "价格比较",
  "1688-shopkeeper": "1688铺货",
  "shopping-assistant": "购物助手",
  "coupon-finder-cn": "查券助手",
  "shopmind-price-compare": "全网比价",
  // 股票金融
  "tushare-finance": "金融数据",
  "stock-select": "智能选股",
  "stock-query": "股票查询",
  "stock-monitor": "股票监控",
  "agent-stock": "量化交易",
  "china-stock-analysis": "A股分析",
  // 效率办公
  "tiangong-wps-word-automation": "WPS文字自动化",
  "tiangong-wps-ppt-automation": "WPS演示自动化",
  "automate-excel": "Excel自动化",
  "ke-office-automation": "金山文档自动化",
  // 浏览器自动化
  "agent-browser": "浏览器代理",
  "openclaw-agent-browser": "浏览器代理",
  "smart-crawler": "智能爬虫",
  "firecrawl-scrape-cn": "网页抓取",
  // 搜索
  "openclaw-tavily-search": "Tavily搜索",
  "multi-search-engine": "多搜索引擎",
  // 开发工具
  "skill-creator": "创建技能",
  "skill-creator-2": "技能创建",
  "skill-vetter": "技能审查",
  "skill-finder-cn": "技能查找",
  "find-skills": "发现技能",
  "clawhub": "技能市场",
  "skillhub": "技能中心",
  "github": "GitHub助手",
  "mcporter": "MCP服务器管理",
  // AI能力
  "self-improving-agent-cn": "自我改进",
  "proactive-agent": "主动代理",
  "coding-agent": "编码代理",
  "gemini": "Gemini助手",
  // 其他工具
  "weather": "天气查询",
  "obsidian": "Obsidian笔记",
  "healthcheck": "健康追踪",
  "nano-banana-pro": "图片生成",
  "daily-trending": "今日热榜"
};
const PLUGIN_ID = "openclaw-lark";
const PLUGIN_SPEC = "@larksuite/openclaw-lark";
class FeishuManager extends EventEmitter {
  constructor({ runtimeDir, dataDir, isDev, usbRuntime }) {
    super();
    this.runtimeDir = runtimeDir;
    this.usbRuntime = usbRuntime || "";
    this.dataDir = dataDir;
    this.isDev = isDev;
    this.installProcess = null;
    this.status = "disconnected";
  }
  _getEnv() {
    const nodeBin = path$1.join(this.runtimeDir, "node.exe");
    const portableNodeDir = process.platform === "win32" || !this.usbRuntime ? "" : path$1.join(this.usbRuntime, "node", "bin");
    const nodeDir = fs$1.existsSync(nodeBin) ? this.runtimeDir : portableNodeDir || path$1.dirname(process.execPath);
    const paths = [nodeDir, this.runtimeDir, this.usbRuntime].filter(Boolean);
    return {
      ...process.env,
      OPENCLAW_HOME: this.dataDir,
      OPENCLAW_STATE_DIR: path$1.join(this.dataDir, ".openclaw"),
      PATH: `${paths.join(path$1.delimiter)}${path$1.delimiter}${process.env.PATH}`
    };
  }
  _getCliBin() {
    if (this.isDev) return "openclaw";
    const ext = process.platform === "win32" ? "openclaw.cmd" : "openclaw";
    const cmd1 = path$1.join(this.runtimeDir, ext);
    if (fs$1.existsSync(cmd1)) return cmd1;
    if (this.usbRuntime) {
      const cmd2 = path$1.join(this.usbRuntime, ext);
      if (fs$1.existsSync(cmd2)) return cmd2;
    }
    return cmd1;
  }
  _getNpxBin() {
    const isWin2 = process.platform === "win32";
    const npx1 = path$1.join(this.runtimeDir, isWin2 ? "npx.cmd" : "npx");
    if (fs$1.existsSync(npx1)) return npx1;
    const npx2 = path$1.join(this.runtimeDir, "node_modules", ".bin", isWin2 ? "npx.cmd" : "npx");
    if (fs$1.existsSync(npx2)) return npx2;
    if (this.usbRuntime) {
      const npx3 = path$1.join(this.usbRuntime, isWin2 ? "npx.cmd" : "npx");
      if (fs$1.existsSync(npx3)) return npx3;
    }
    try {
      const which = isWin2 ? "where npx" : "which npx";
      const found = child_process.execSync(which, { timeout: 3e3 }).toString().trim().split("\n")[0];
      if (found) return found;
    } catch {
    }
    return null;
  }
  /** Check if feishu plugin is installed (cached 60s) */
  _getMarkerPath() {
    return path$1.join(this.dataDir, ".openclaw", "feishu-configured.json");
  }
  _writeMarker() {
    try {
      const markerPath = this._getMarkerPath();
      fs$1.mkdirSync(path$1.dirname(markerPath), { recursive: true });
      fs$1.writeFileSync(markerPath, JSON.stringify({ configured: true, installedAt: (/* @__PURE__ */ new Date()).toISOString() }));
      console.log("[feishu] wrote configured marker:", markerPath);
    } catch (e) {
      console.error("[feishu] failed to write marker:", e.message);
    }
  }
  _readMarker() {
    try {
      const markerPath = this._getMarkerPath();
      if (fs$1.existsSync(markerPath)) {
        const data = JSON.parse(fs$1.readFileSync(markerPath, "utf-8"));
        return !!data?.configured;
      }
    } catch {
    }
    return false;
  }
  isPluginInstalled() {
    if (this._pluginCacheTime && Date.now() - this._pluginCacheTime < 6e4) {
      return this._pluginCached;
    }
    const extDir = path$1.join(this.dataDir, ".openclaw", "extensions", PLUGIN_ID);
    const oldDir = path$1.join(this.dataDir, ".openclaw", "extensions", "feishu");
    if (fs$1.existsSync(extDir) && fs$1.existsSync(oldDir)) {
      try {
        fs$1.rmSync(oldDir, { recursive: true, force: true });
        console.log("[feishu] cleaned up old extensions/feishu dir");
      } catch {
      }
    }
    const result = fs$1.existsSync(extDir) || fs$1.existsSync(oldDir) || this._readMarker();
    console.log(`[feishu] isPluginInstalled check: extDir=${extDir} exists=${fs$1.existsSync(extDir)}, marker=${this._readMarker()}, result=${result}`);
    this._pluginCached = result;
    this._pluginCacheTime = Date.now();
    return result;
  }
  _ensurePluginsAllow() {
    try {
      const configFile = path$1.join(this.dataDir, ".openclaw", "openclaw.json");
      if (fs$1.existsSync(configFile)) {
        const config = JSON.parse(fs$1.readFileSync(configFile, "utf-8"));
        let dirty = false;
        if (!config.plugins) config.plugins = {};
        if (!Array.isArray(config.plugins.allow)) config.plugins.allow = [];
        if (!config.plugins.allow.includes(PLUGIN_ID)) {
          config.plugins.allow.push(PLUGIN_ID);
          dirty = true;
          console.log("[feishu] Added feishu to plugins.allow");
        }
        if (!config.plugins.entries) config.plugins.entries = {};
        if (!config.plugins.entries[PLUGIN_ID]) {
          config.plugins.entries[PLUGIN_ID] = { enabled: true, config: {} };
          dirty = true;
          console.log("[feishu] Added feishu to plugins.entries");
        }
        if (!config.channels) config.channels = {};
        if (!config.channels["feishu"]) {
          config.channels["feishu"] = {};
          dirty = true;
          console.log("[feishu] Added feishu to channels");
        }
        if (dirty) {
          atomicWriteFileSync(configFile, JSON.stringify(config, null, 2), "utf-8");
        }
      }
    } catch (e) {
      console.log(`[feishu] plugins.allow update error: ${e.message}`);
    }
  }
  _copyDirSync(src2, dest) {
    fs$1.mkdirSync(dest, { recursive: true });
    for (const entry of fs$1.readdirSync(src2, { withFileTypes: true })) {
      const s = path$1.join(src2, entry.name);
      const d = path$1.join(dest, entry.name);
      if (entry.isDirectory()) this._copyDirSync(s, d);
      else fs$1.copyFileSync(s, d);
    }
  }
  /**
   * Auto install — runs npx @larksuite/openclaw-lark install (interactive wizard with QR code).
   * First ensures plugin files are present (offline or online), then launches wizard.
   */
  async installPlugin({ usbRoot, forceOnline = false } = {}) {
    this.status = "installing";
    this.emit("status", this.status);
    this.emit("log", "正在启动飞书插件安装向导...");
    const extDir = path$1.join(this.dataDir, ".openclaw", "extensions", PLUGIN_ID);
    if (!forceOnline && !this.isPluginInstalled() && usbRoot) {
      await this._offlineInstallFiles(usbRoot, extDir);
    }
    return this._runNpxWizard();
  }
  /** Offline install just the plugin files (no wizard) */
  async _offlineInstallFiles(usbRoot, extDir) {
    const bundledZip = path$1.join(usbRoot, "runtime", "feishu-plugin.zip");
    let bundledDir = path$1.join(usbRoot, "extensions", PLUGIN_ID);
    if (!fs$1.existsSync(bundledDir)) bundledDir = path$1.join(usbRoot, "extensions", "feishu");
    if (fs$1.existsSync(bundledZip)) {
      this.emit("log", "从本地安装包解压插件文件...");
      try {
        const targetExtDir = path$1.join(this.dataDir, ".openclaw", "extensions");
        fs$1.mkdirSync(targetExtDir, { recursive: true });
        if (fs$1.existsSync(extDir)) fs$1.rmSync(extDir, { recursive: true, force: true });
        if (process.platform === "win32") {
          child_process.execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${bundledZip}' -DestinationPath '${extDir}' -Force"`, { timeout: 6e4 });
        } else {
          fs$1.mkdirSync(extDir, { recursive: true });
          child_process.execSync(`unzip -o "${bundledZip}" -d "${extDir}"`, { timeout: 6e4 });
        }
        this._pluginCached = true;
        this._pluginCacheTime = Date.now();
        this._ensurePluginsAllow();
        this.emit("log", "✅ 插件文件已就绪");
        return true;
      } catch (e) {
        this.emit("log", `[warn] 解压失败: ${e.message}`);
      }
    }
    if (fs$1.existsSync(bundledDir)) {
      this.emit("log", "从本地目录复制插件文件...");
      try {
        const targetExtDir = path$1.join(this.dataDir, ".openclaw", "extensions");
        fs$1.mkdirSync(targetExtDir, { recursive: true });
        if (fs$1.existsSync(extDir)) fs$1.rmSync(extDir, { recursive: true, force: true });
        this._copyDirSync(bundledDir, extDir);
        this._pluginCached = true;
        this._pluginCacheTime = Date.now();
        this._ensurePluginsAllow();
        this.emit("log", "✅ 插件文件已就绪");
        return true;
      } catch (e) {
        this.emit("log", `[warn] 复制失败: ${e.message}`);
      }
    }
    return false;
  }
  /**
   * Run the interactive wizard: npx -y @larksuite/openclaw-lark install
   * This wizard shows QR code for creating/linking a bot.
   */
  _runNpxWizard() {
    return new Promise((resolve) => {
      const isWin2 = process.platform === "win32";
      const env2 = this._getEnv();
      const npxBin = this._getNpxBin();
      let cmd, args;
      if (npxBin) {
        this.emit("log", "启动飞书安装向导（npx）...");
        if (isWin2) {
          cmd = `"${npxBin}" -y ${PLUGIN_SPEC} install --skip-version-check`;
          args = [];
        } else {
          cmd = npxBin;
          args = ["-y", PLUGIN_SPEC, "install", "--skip-version-check"];
        }
      } else {
        const cliBin = this._getCliBin();
        if (!cliBin || !fs$1.existsSync(cliBin)) {
          this.emit("log", "❌ 找不到 npx 或 OpenClaw 运行环境");
          this.status = "error";
          this.emit("status", this.status);
          resolve({ success: false, error: "npx/openclaw not found" });
          return;
        }
        this.emit("log", "使用 OpenClaw CLI 安装插件（无向导模式）...");
        if (isWin2) {
          cmd = `"${cliBin}" plugins install "${PLUGIN_SPEC}@latest"`;
          args = [];
        } else {
          cmd = cliBin;
          args = ["plugins", "install", `${PLUGIN_SPEC}@latest`];
        }
      }
      console.log(`[feishu] wizard spawn: cmd=${cmd}, args=${JSON.stringify(args)}`);
      const proc = child_process.spawn(cmd, args, {
        env: env2,
        stdio: ["pipe", "pipe", "pipe"],
        shell: isWin2,
        cwd: this.dataDir
      });
      this.installProcess = proc;
      let qrBuffer = [];
      let qrCollecting = false;
      let recentLines = [];
      proc.stdout?.on("data", (d) => {
        const raw = d.toString();
        const text = raw.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "").trim();
        if (!text) return;
        const lines = text.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const blockChars = (trimmed.match(/[▄▀█▌▐░▒▓■□▪▫]/g) || []).length;
          if (blockChars > 10) {
            qrCollecting = true;
            qrBuffer.push(trimmed);
            continue;
          }
          if (qrCollecting && blockChars < 5) {
            const qrText = qrBuffer.join("\n");
            console.log(`[feishu] QR ASCII art detected (${qrBuffer.length} lines)`);
            this.emit("qr-ascii", qrText);
            qrBuffer = [];
            qrCollecting = false;
          }
          const urlMatch = trimmed.match(/https?:\/\/[^\s"'<>]+/);
          if (urlMatch) {
            const url2 = urlMatch[0];
            if (url2.includes("feishu") || url2.includes("lark") || url2.includes("applink")) {
              console.log(`[feishu] QR URL detected: ${url2}`);
              this.emit("qr-url", url2);
            }
          }
          if (/\(Y\/n\)|\(y\/N\)/i.test(trimmed)) {
            const fullQuestion = [...recentLines.slice(-5), trimmed].filter((l) => !/^[▄▀█▌▐░▒▓■□▪▫]/.test(l)).join("\n");
            console.log(`[feishu] Interactive prompt detected: ${fullQuestion}`);
            this.emit("prompt", { question: fullQuestion, options: ["Y", "n"], proc });
            recentLines = [];
          } else {
            recentLines.push(trimmed);
            if (recentLines.length > 10) recentLines.shift();
          }
          this.emit("log", trimmed);
        }
        if (qrCollecting && qrBuffer.length > 5) {
          const qrText = qrBuffer.join("\n");
          console.log(`[feishu] QR ASCII art emitted (${qrBuffer.length} lines)`);
          this.emit("qr-ascii", qrText);
          qrBuffer = [];
          qrCollecting = false;
        }
      });
      proc.stderr?.on("data", (d) => {
        const text = d.toString().replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "").trim();
        if (text) this.emit("log", `[stderr] ${text}`);
      });
      proc.on("exit", (code) => {
        this.installProcess = null;
        if (code === 0) {
          this._pluginCached = true;
          this._pluginCacheTime = Date.now();
          this._ensurePluginsAllow();
          this._writeMarker();
          this.emit("log", "✅ 飞书插件安装完成");
          this.status = "connected";
          this.emit("status", this.status);
          resolve({ success: true });
        } else {
          this.emit("log", `❌ 安装失败 (exit code ${code})`);
          this.status = "error";
          this.emit("status", this.status);
          resolve({ success: false, error: `exit code ${code}` });
        }
      });
      proc.on("error", (err) => {
        this.installProcess = null;
        this.emit("log", `❌ 安装失败: ${err.message}`);
        this.status = "error";
        this.emit("status", this.status);
        resolve({ success: false, error: err.message });
      });
    });
  }
  /**
   * Install with existing app credentials (non-interactive).
   * Installs plugin files + writes config directly — no npx wizard needed.
   */
  async installWithApp(appId, appSecret) {
    if (!this.isPluginInstalled()) {
      const usbRoot = this.usbRuntime ? path$1.dirname(this.usbRuntime) : void 0;
      const extDir = path$1.join(this.dataDir, ".openclaw", "extensions", PLUGIN_ID);
      let installed = false;
      if (usbRoot) {
        installed = await this._offlineInstallFiles(usbRoot, extDir);
      }
      if (!installed) {
        this.emit("log", "正在下载飞书插件...");
        const result = await this._installFilesOnline();
        if (!result?.success) return result;
      }
    }
    this.emit("log", "正在配置飞书应用凭证...");
    try {
      const configFile = path$1.join(this.dataDir, ".openclaw", "openclaw.json");
      let config = {};
      if (fs$1.existsSync(configFile)) {
        config = JSON.parse(fs$1.readFileSync(configFile, "utf-8"));
      }
      if (!config.plugins) config.plugins = {};
      if (!Array.isArray(config.plugins.allow)) config.plugins.allow = [];
      if (!config.plugins.allow.includes(PLUGIN_ID)) {
        config.plugins.allow.push(PLUGIN_ID);
      }
      if (!config.channels) config.channels = {};
      if (!config.channels["openclaw-lark"]) config.channels["openclaw-lark"] = {};
      config.channels["openclaw-lark"].appId = appId;
      config.channels["openclaw-lark"].appSecret = appSecret;
      if (!config.channels["feishu"]) config.channels["feishu"] = {};
      config.channels["feishu"].appId = appId;
      config.channels["feishu"].appSecret = appSecret;
      atomicWriteFileSync(configFile, JSON.stringify(config, null, 2), "utf-8");
      this._writeMarker();
      this.emit("log", "✅ 飞书应用凭证已配置，重启 Gateway 后生效");
      this.status = "connected";
      this.emit("status", this.status);
      return { success: true };
    } catch (e) {
      this.emit("log", `❌ 配置失败: ${e.message}`);
      this.status = "error";
      this.emit("status", this.status);
      return { success: false, error: e.message };
    }
  }
  /** Install just the plugin files via openclaw CLI (no wizard) */
  _installFilesOnline() {
    return new Promise((resolve) => {
      const bin = this._getCliBin();
      const isWin2 = process.platform === "win32";
      if (!fs$1.existsSync(bin)) {
        resolve({ success: false, error: "openclaw CLI not found" });
        return;
      }
      const proc = isWin2 ? child_process.spawn(`"${bin}" plugins install "${PLUGIN_SPEC}@latest"`, [], { env: this._getEnv(), stdio: ["ignore", "pipe", "pipe"], shell: true }) : child_process.spawn(bin, ["plugins", "install", `${PLUGIN_SPEC}@latest`], { env: this._getEnv(), stdio: ["ignore", "pipe", "pipe"], shell: true });
      proc.stdout?.on("data", (d) => {
        const text = d.toString().replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "").trim();
        if (text) this.emit("log", text);
      });
      proc.stderr?.on("data", (d) => {
        const text = d.toString().replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "").trim();
        if (text) this.emit("log", `[stderr] ${text}`);
      });
      proc.on("exit", (code) => {
        if (code === 0) {
          this._pluginCached = true;
          this._pluginCacheTime = Date.now();
          this._ensurePluginsAllow();
          resolve({ success: true });
        } else {
          resolve({ success: false, error: `exit code ${code}` });
        }
      });
      proc.on("error", (err) => resolve({ success: false, error: err.message }));
    });
  }
  destroy() {
    if (this.installProcess) {
      this.installProcess.kill();
      this.installProcess = null;
    }
  }
}
let feishuManager = null;
function initFeishu() {
  const feishuRuntimeDir = getOpenClawRuntimeBinDir();
  feishuManager = new FeishuManager({
    runtimeDir: feishuRuntimeDir,
    usbRuntime: getActiveRuntimeDir(),
    dataDir: getDataRoot(),
    isDev: IS_DEV
  });
  feishuManager.on("status", (status) => {
    safeSend("feishu-status", status);
  });
  feishuManager.on("qr-url", (url2) => {
    console.log("飞书二维码URL===>", url2);
    safeSend("feishu-qr-url", url2);
  });
  feishuManager.on("qr-ascii", (text) => {
    console.log("飞书二维码ASCII===>", text.substring(0, 100));
    safeSend("feishu-qr-ascii", text);
  });
  feishuManager.on("log", (msg) => {
    safeSend("feishu-log", msg);
  });
  feishuManager.on("prompt", ({ question }) => {
    console.log("飞书交互提示===>", question);
    safeSend("feishu-prompt", { question });
  });
}
function getFeishuManagerInstance() {
  return feishuManager;
}
const DEVICE_KEY_FILE = "usb-device-key.json";
const WS_SCOPES = ["operator.admin", "operator.approvals", "operator.pairing", "operator.read", "operator.write"];
function getOcDir() {
  return path$1.join(getDataRoot(), ".openclaw");
}
function getOrCreateDeviceKey() {
  const dir = getOcDir();
  const keyPath = path$1.join(dir, DEVICE_KEY_FILE);
  if (fs$1.existsSync(keyPath)) {
    try {
      const data = JSON.parse(fs$1.readFileSync(keyPath, "utf-8"));
      return { deviceId: data.deviceId, publicKey: data.publicKey, secretHex: data.secretKey };
    } catch {
    }
  }
  const { publicKey, privateKey } = crypto$1.generateKeyPairSync("ed25519");
  const pubDer = publicKey.export({ type: "spki", format: "der" });
  const pubRaw = pubDer.slice(-32);
  const privDer = privateKey.export({ type: "pkcs8", format: "der" });
  const privRaw = privDer.slice(-32);
  const deviceId = crypto$1.createHash("sha256").update(pubRaw).digest("hex");
  const pubB64 = pubRaw.toString("base64url");
  const secretHex = privRaw.toString("hex");
  fs$1.mkdirSync(dir, { recursive: true });
  fs$1.writeFileSync(keyPath, JSON.stringify({ deviceId, publicKey: pubB64, secretKey: secretHex }, null, 2));
  return { deviceId, publicKey: pubB64, secretHex };
}
function makeEd25519PrivateKey(seedHex) {
  const seedBuf = Buffer.from(seedHex, "hex");
  const prefix = Buffer.from("302e020100300506032b657004220420", "hex");
  return crypto$1.createPrivateKey({ key: Buffer.concat([prefix, seedBuf]), format: "der", type: "pkcs8" });
}
function createConnectFrame(nonce, gatewayToken, gatewayPassword) {
  const { deviceId, publicKey, secretHex } = getOrCreateDeviceKey();
  const signedAt = Date.now();
  const authSecret = gatewayToken || gatewayPassword || "";
  const scopesStr = WS_SCOPES.join(",");
  const platform2 = process.platform === "darwin" ? "macos" : process.platform;
  const payloadStr = `v3|${deviceId}|openclaw-control-ui|ui|operator|${scopesStr}|${signedAt}|${authSecret}|${nonce}|${platform2}|desktop`;
  const privKey = makeEd25519PrivateKey(secretHex);
  const sig = crypto$1.sign(null, Buffer.from(payloadStr), privKey);
  const sigB64 = sig.toString("base64url");
  const auth = gatewayToken ? { token: gatewayToken } : gatewayPassword ? { password: gatewayPassword } : {};
  return {
    type: "req",
    id: `connect-${(signedAt & 4294967295).toString(16).padStart(8, "0")}-${Math.floor(Math.random() * 65535).toString(16).padStart(4, "0")}`,
    method: "connect",
    params: {
      minProtocol: 3,
      maxProtocol: 4,
      client: { id: "openclaw-control-ui", version: electron.app.getVersion(), platform: platform2, deviceFamily: "desktop", mode: "ui" },
      role: "operator",
      scopes: WS_SCOPES,
      caps: ["tool-events"],
      auth,
      device: { id: deviceId, publicKey, signedAt, nonce, signature: sigB64 },
      locale: "zh-CN",
      userAgent: `${APP_NAME}-USB/${electron.app.getVersion()}`
    }
  };
}
function autoPairDevice() {
  const ocDir = getOcDir();
  const cfgFile = path$1.join(ocDir, "openclaw.json");
  if (fs$1.existsSync(cfgFile)) {
    try {
      const cfg = JSON.parse(fs$1.readFileSync(cfgFile, "utf-8"));
      if (!cfg.gateway) cfg.gateway = {};
      if (!cfg.gateway.controlUi) cfg.gateway.controlUi = {};
      const required = [
        "file://",
        "http://localhost",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:18789",
        "http://127.0.0.1:18789",
        "app://",
        "null"
      ];
      const existing = cfg.gateway.controlUi.allowedOrigins || [];
      const merged = [...existing];
      for (const r of required) {
        if (!merged.includes(r)) merged.push(r);
      }
      cfg.gateway.controlUi.allowedOrigins = merged;
      atomicWriteFileSync(cfgFile, JSON.stringify(cfg, null, 2));
    } catch {
    }
  }
  const { deviceId, publicKey } = getOrCreateDeviceKey();
  const devicesDir = path$1.join(ocDir, "devices");
  fs$1.mkdirSync(devicesDir, { recursive: true });
  const pairedPath = path$1.join(devicesDir, "paired.json");
  let paired = {};
  if (fs$1.existsSync(pairedPath)) {
    try {
      paired = JSON.parse(fs$1.readFileSync(pairedPath, "utf-8"));
    } catch {
    }
  }
  if (paired[deviceId]) return "设备已配对";
  const nowMs = Date.now();
  paired[deviceId] = {
    deviceId,
    publicKey,
    platform: process.platform === "darwin" ? "macos" : process.platform,
    deviceFamily: "desktop",
    clientId: "openclaw-control-ui",
    clientMode: "ui",
    role: "operator",
    roles: ["operator"],
    scopes: WS_SCOPES,
    approvedScopes: WS_SCOPES,
    tokens: {},
    createdAtMs: nowMs,
    approvedAtMs: nowMs
  };
  fs$1.writeFileSync(pairedPath, JSON.stringify(paired, null, 2));
  return "设备配对成功";
}
function reloadGateway() {
  try {
    const ocBin = getOpenClawPath();
    if (fs$1.existsSync(ocBin)) {
      const child = child_process.spawn(ocBin, ["gateway", "reload"], {
        stdio: "ignore",
        windowsHide: true,
        shell: false
      });
      const timer = setTimeout(() => {
        try {
          child.kill();
        } catch {
        }
      }, 6000);
      child.on("exit", () => clearTimeout(timer));
      child.on("error", (err) => {
        clearTimeout(timer);
        console.error("[ws-auth] reload-gateway async error:", err);
      });
      return { ok: true, pending: true };
    }
    return { ok: false, error: "openclaw runtime not found" };
  } catch (e) {
    console.error("[ws-auth] reload-gateway error:", e);
    return { ok: false, error: e?.message || String(e) };
  }
}
function readGatewayAuthFromConfig() {
  try {
    const configPath2 = path$1.join(getDataRoot(), ".openclaw", "openclaw.json");
    if (!fs$1.existsSync(configPath2)) return {};
    const config = JSON.parse(fs$1.readFileSync(configPath2, "utf-8"));
    const gw = config?.gateway || {};
    return {
      port: Number(gw.port || GATEWAY_DEFAULT_PORT),
      token: gw?.auth?.token || gw.authToken || "",
      password: gw?.auth?.password || gw.password || ""
    };
  } catch (e) {
    console.warn("[gateway-ipc] read config failed:", e?.message || e);
    return {};
  }
}
function gatewayRpcViaMain(method, params = {}, options = {}) {
  return new Promise((resolve, reject) => {
    const auth = readGatewayAuthFromConfig();
    const port = Number(options.port || auth.port || GATEWAY_DEFAULT_PORT);
    const token = options.token ?? auth.token ?? "";
    const password = options.password ?? auth.password ?? "";
    const reqTimeoutMs = Number(options.timeoutMs || 45e3);
    const wsUrl = `ws://127.0.0.1:${port}/ws?token=${encodeURIComponent(token)}`;
    const id = `ipc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    let settled = false;
    let ws;
    let timer;
    const finish = (err, value) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      try {
        ws?.close();
      } catch {
      }
      if (err) reject(err);
      else resolve(value);
    };
    timer = setTimeout(() => finish(new Error("Gateway IPC request timed out")), reqTimeoutMs);
    try {
      ws = new WebSocket(wsUrl, {
        headers: {
          Origin: `http://127.0.0.1:${port}`,
          "User-Agent": `${APP_NAME}-USB/${electron.app.getVersion()} main-ipc`
        }
      });
    } catch (e) {
      finish(e);
      return;
    }
    ws.onopen = () => {
    };
    ws.onerror = (e) => {
      finish(new Error(e?.message || "Gateway IPC WebSocket error"));
    };
    ws.onclose = (event) => {
      if (!settled) {
        finish(new Error(`Gateway IPC WebSocket closed (${event?.code || "unknown"})`));
      }
    };
    ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(typeof event.data === "string" ? event.data : Buffer.from(event.data).toString("utf-8"));
      } catch {
        return;
      }
      if (msg.type === "event" && msg.event === "connect.challenge") {
        try {
          ws.send(JSON.stringify(createConnectFrame(msg.payload?.nonce || "", token, password)));
        } catch (e) {
          finish(e);
        }
        return;
      }
      if (msg.type === "res" && msg.id?.startsWith("connect-")) {
        if (!msg.ok || msg.error) {
          finish(new Error(msg.error?.message || "Gateway handshake failed"));
          return;
        }
        try {
          ws.send(JSON.stringify({ type: "req", id, method, params }));
        } catch (e) {
          finish(e);
        }
        return;
      }
      if (msg.type === "res" && msg.id === id) {
        if (msg.error) {
          finish(new Error(msg.error.message || "Gateway request failed"));
        } else {
          finish(null, msg.result || msg.payload || msg);
        }
      }
    };
  });
}
async function sendGatewayChatViaMain(payload = {}) {
  const sessionKey = payload.sessionKey || "main";
  const message = payload.message || "";
  const params = {
    sessionKey,
    message,
    deliver: false,
    idempotencyKey: payload.idempotencyKey || `ipc-chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  };
  if (payload.attachments?.length) params.attachments = payload.attachments;
  return gatewayRpcViaMain("chat.send", params, payload);
}
async function getGatewayChatHistoryViaMain(payload = {}) {
  const sessionKey = payload.sessionKey || "main";
  const limit = Number(payload.limit || 200);
  return gatewayRpcViaMain("chat.history", { sessionKey, limit }, payload);
}
function parseSkillMeta(skillFilePath) {
  try {
    const content = fs$1.readFileSync(skillFilePath, "utf-8");
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) {
      return null;
    }
    const frontmatter = match[1];
    const lines = frontmatter.split(/\r?\n/);
    const result = {};
    let currentKey = null;
    let currentValue = "";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const indentMatch = line.match(/^(\s*)(\w+):\s*(.*)$/);
      if (indentMatch) {
        if (currentKey !== null) {
          result[currentKey] = currentValue.trim();
        }
        currentKey = indentMatch[2];
        currentValue = indentMatch[3];
      } else if (currentKey !== null && (line.match(/^\s+\|/) || line.match(/^\s+>/))) {
        currentValue = lines[++i] || "";
        while (i < lines.length && lines[i].match(/^\s{2,}[^:#]/)) {
          currentValue += "\n" + lines[i];
          i++;
        }
        i--;
      } else if (currentKey !== null && line.match(/^\s+- /)) {
        currentValue += "\n" + line;
      } else if (currentKey !== null && line.match(/^\s{2,}.*:/) && !line.match(/^\s+- .*:/)) {
        const nested = line.match(/^\s{2,}([\w-]+):\s*(.*)$/);
        if (nested) {
          if (!result[currentKey]) result[currentKey] = {};
          result[currentKey][nested[1]] = nested[2] || "";
        }
      } else if (currentKey !== null && line.match(/^\s{2,}/) && currentKey !== "description") {
        currentValue += " " + line.trim();
      }
    }
    if (currentKey !== null) {
      result[currentKey] = currentValue.trim();
    }
    let emoji = result.emoji || null;
    if (!emoji && result.metadata) {
      try {
        const metadata = JSON.parse(result.metadata);
        emoji = metadata.clawdbot?.emoji || metadata.openclaw?.emoji || null;
      } catch {
        if (!emoji) {
          const emojiMatch = result.metadata.match(/"emoji"\s*:\s*["']([\p{Emoji}]+)/u);
          if (emojiMatch) {
            emoji = emojiMatch[1];
          }
        }
      }
    }
    if (!emoji) {
      const frontmatterEmojiMatch = frontmatter.match(/"emoji"\s*:\s*["']([\p{Emoji}]+)/u);
      if (frontmatterEmojiMatch) {
        emoji = frontmatterEmojiMatch[1];
      }
    }
    return {
      name: result.name || null,
      description: result.description || null,
      emoji,
      raw: result
    };
  } catch (err) {
    console.error("parseSkillMeta error:", err);
    return null;
  }
}
function registerIPCHandlers({ gateway }) {
  const { appRoot, configDir, configPath, openclawEntry, dataRoot } = getPaths();
  electron.ipcMain.handle("open-dashboard", () => {
    if (gateway.isGatewayReady()) {
      electron.shell.openExternal(`http://127.0.0.1:${GATEWAY_DEFAULT_PORT}/?token=newToken`);
    }
  });
  let chatWindow = null;
  electron.ipcMain.handle("open-chat-window", async () => {
    if (chatWindow && !chatWindow.isDestroyed()) {
      chatWindow.focus();
      return { success: true };
    }
    let token = "";
    let uiConfig = {};
    try {
      const { configPath: configPath2 } = getPaths();
      if (fs$1.existsSync(configPath2)) {
        const config = JSON.parse(fs$1.readFileSync(configPath2, "utf-8"));
        token = config?.gateway?.auth?.token || "";
        uiConfig = config?.ui || {};
      }
    } catch {
    }
    const url2 = token ? `http://127.0.0.1:${GATEWAY_DEFAULT_PORT}/?token=${encodeURIComponent(token)}` : `http://127.0.0.1:${GATEWAY_DEFAULT_PORT}/`;
    chatWindow = new electron.BrowserWindow({
      width: 480,
      height: 720,
      minWidth: 360,
      minHeight: 500,
      title: "OpenClaw 网页端",
      icon: appIconPath,
      webPreferences: { contextIsolation: true, nodeIntegration: false }
    });
    chatWindow.setMenuBarVisibility(false);
    if (uiConfig.fontFamily) {
      const safeFamily = uiConfig.fontFamily.replace(/"/g, "'");
      chatWindow.webContents.on("did-finish-load", () => {
        chatWindow.webContents.insertCSS(
          `body,button,input,textarea,select,pre,code{font-family:${safeFamily}!important}`
        ).catch(() => {
        });
      });
    }
    chatWindow.loadURL(url2);
    chatWindow.on("closed", () => {
      chatWindow = null;
    });
    return { success: true, url: url2 };
  });
  electron.ipcMain.handle("open-external-url", (_, url2) => {
    if (typeof url2 === "string" && (url2.startsWith("http://127.0.0.1:17520") || url2.startsWith("http://127.0.0.1:9119") || url2.startsWith("http://127.0.0.1:8642"))) {
      return openHermesInMainWindow(url2);
    }
    electron.shell.openExternal(url2);
    return true;
  });
  electron.ipcMain.handle("show-error-dialog", async (_, { title, message }) => {
    await electron.dialog.showMessageBox({
      type: "error",
      title: title || "错误",
      message,
      buttons: ["确定"]
    });
    return { ok: true };
  });
  electron.ipcMain.handle("show-confirm-dialog", async (_, { title, message }) => {
    const result = await electron.dialog.showMessageBox({
      type: "question",
      title: title || "确认",
      message,
      buttons: ["取消", "确认"],
      defaultId: 1,
      cancelId: 0
    });
    return { ok: true, confirmed: result.response === 1 };
  });
  electron.ipcMain.handle("select-download-dir", async (_, opts) => {
    const type2 = opts && opts.type || "image";
    const isVideo = type2 === "video";
    const result = await electron.dialog.showSaveDialog({
      title: isVideo ? "保存视频" : "保存图片",
      defaultPath: isVideo ? `video-${Date.now()}.mp4` : `image-${Date.now()}.png`,
      filters: [
        isVideo ? { name: "Videos", extensions: ["mp4", "webm", "mov", "avi"] } : { name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] }
      ]
    });
    if (result.canceled) {
      return { ok: false, canceled: true };
    }
    return { ok: true, path: result.filePath };
  });
  electron.ipcMain.handle("save-file", async (_, { filepath, buffer }) => {
    try {
      fs$1.writeFileSync(filepath, Buffer.from(buffer, "base64"));
      return { ok: true };
    } catch (e) {
      console.error("save-file failed:", e.message);
      return { ok: false, error: e.message };
    }
  });
  async function fetchWithRetry(url2, maxRetries = 5) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url2);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response;
      } catch (e) {
        lastError = e;
        if (attempt < maxRetries) {
          const delay = Math.min(1e3 * Math.pow(2, attempt), 16e3);
          console.log(`[fetchWithRetry] attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${delay}ms: ${e.message}`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }
  electron.ipcMain.handle("download-image", async (_, { url: url2 }) => {
    try {
      const response = await fetchWithRetry(url2);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      return { ok: true, base64 };
    } catch (e) {
      console.error("download-image failed:", e.message);
      return { ok: false, error: e.message };
    }
  });
  electron.ipcMain.handle("save-media-image", async (_, { url: url2, taskId }) => {
    try {
      const imageDir = getMediaImageDir();
      if (!fs$1.existsSync(imageDir)) {
        fs$1.mkdirSync(imageDir, { recursive: true });
      }
      const ext = url2.match(/\.(png|jpg|jpeg|webp)(?:\?|$)/i)?.[1] || "png";
      const filename = `${taskId}.${ext}`;
      const filepath = path$1.join(imageDir, filename);
      const response = await fetchWithRetry(url2);
      const arrayBuffer = await response.arrayBuffer();
      fs$1.writeFileSync(filepath, Buffer.from(arrayBuffer));
      console.log("[save-media-image] saved:", filepath);
      return { ok: true, filepath };
    } catch (e) {
      console.error("save-media-image failed:", e.message);
      return { ok: false, error: e.message };
    }
  });
  electron.ipcMain.handle("write-openclaw-config", async (_, { models }, type2) => {
    await writeOpenClawConfig({ models }, type2);
    return { ok: true };
  });
  electron.ipcMain.handle("write-license-file", async (_, { serial: serial2, activationCode, license }) => {
    try {
      const ok = writeLicenseFile(serial2, activationCode, license);
      return ok ? { ok: true } : { ok: false, error: "license 写入失败" };
    } catch (e) {
      console.error("write-license-file failed:", e.message);
      return { ok: false, error: e.message };
    }
  });
  electron.ipcMain.handle("get-data-dir", () => dataRoot);
  electron.ipcMain.handle("read-config", async () => {
    try {
      const configPath2 = path$1.join(getDataRoot(), ".openclaw", "openclaw.json");
      if (!fs$1.existsSync(configPath2)) return {};
      return JSON.parse(fs$1.readFileSync(configPath2, "utf-8"));
    } catch {
      return {};
    }
  });
  electron.ipcMain.handle("get-default-port", () => GATEWAY_DEFAULT_PORT);
  electron.ipcMain.handle("gateway-chat-send", async (_, payload) => {
    try {
      const result = await sendGatewayChatViaMain(payload || {});
      return { ok: true, result };
    } catch (e) {
      console.error("[gateway-ipc] chat.send failed:", e?.message || e);
      return { ok: false, error: e?.message || String(e) };
    }
  });
  electron.ipcMain.handle("gateway-chat-history", async (_, payload) => {
    try {
      const result = await getGatewayChatHistoryViaMain(payload || {});
      return { ok: true, result };
    } catch (e) {
      console.error("[gateway-ipc] chat.history failed:", e?.message || e);
      return { ok: false, error: e?.message || String(e) };
    }
  });
  electron.ipcMain.handle("check-step-serial", async () => {
    try {
      const info = await detectUSBStatus();
      Object.assign(runtimeStore, { usb: info, rootPath: info.rootPath, serial: info.serial });
      if (!info.serial) {
        return { ok: false, error: "无法获取 U 盘序列号" };
      }
      return { ok: true, serial: info.serial };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });
  electron.ipcMain.handle("check-step-license", async (_, serial2) => {
    console.log("[check-step-license] 收到序列号:", serial2);
    try {
      const licenseData = readLicenseFile(serial2);
      if (!licenseData) {
        return { ok: false, error: fs$1.existsSync(getLicensePath()) ? "权限文件无效或U盘序列号不匹配" : "权限文件不存在" };
      }
      if (!licenseData.serial) {
        return { ok: false, error: "权限信息不完整" };
      }
      if (serial2 !== licenseData.serial) {
        return { ok: false, error: "U盘序列号不匹配" };
      }
      return { ok: true, license: licenseData };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });
  electron.ipcMain.handle("check-step-login", async (_, { serial: serial2, activation_code }) => {
    console.log("[check-step-login] 远程登录功能已移除");
    return { ok: false, error: REMOTE_API_DISABLED_MESSAGE };
  });
  async function setUclawSessionCookie(cookieValue) {
    try {
      await electron.session.defaultSession.cookies.set({
        url: "app://local",
        name: "uclaw_session",
        value: cookieValue,
        path: "/",
        secure: false,
        httpOnly: false,
        expirationDate: Math.floor(Date.now() / 1e3) + 30 * 24 * 3600
      });
      console.log("[setUclawSessionCookie] cookie set successfully");
    } catch (e) {
      console.error("[setUclawSessionCookie] failed:", e.message);
    }
  }
  electron.ipcMain.handle("set-session-cookie", async (_, value) => {
    await setUclawSessionCookie(value);
    return { ok: true };
  });
  electron.ipcMain.handle("store-get", async (_, key) => {
    return runtimeStore[key];
  });
  electron.ipcMain.handle("store-set", async (_, { key, value }) => {
    runtimeStore[key] = value;
    return { ok: true };
  });
  electron.ipcMain.handle("scan-local-skills", async () => {
    const skillsMap = /* @__PURE__ */ new Map();
    try {
      let extraDirs = [];
      let skillEntries = {};
      if (fs$1.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs$1.readFileSync(configPath, "utf-8"));
          extraDirs = config.skills?.load?.extraDirs || [];
          skillEntries = config.skills?.entries || {};
        } catch (e) {
          console.warn("读取 openclw.json extraDirs 失败:", e.message);
        }
      }
      for (const extraDir of extraDirs) {
        let resolvedDir = extraDir;
        if (!path$1.isAbsolute(extraDir)) {
          resolvedDir = path$1.join(getAppRoot(), extraDir);
        }
        if (!fs$1.existsSync(resolvedDir)) {
          continue;
        }
        const entries = fs$1.readdirSync(resolvedDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const skillPath = path$1.join(resolvedDir, entry.name);
            const skillFile = path$1.join(skillPath, "SKILL.md");
            if (fs$1.existsSync(skillFile)) {
              const meta = parseSkillMeta(skillFile);
              const name = meta?.name || entry.name;
              if (!skillsMap.has(name)) {
                skillsMap.set(name, {
                  name,
                  cnName: skillNameMap[entry.name] || null,
                  description: meta?.description || null,
                  emoji: meta?.emoji || null,
                  source: "local",
                  path: skillPath,
                  enabled: skillEntries[name]?.enabled !== false
                });
              }
            }
          } else if (entry.name.endsWith(".md")) {
            const skillFile = path$1.join(resolvedDir, entry.name);
            const meta = parseSkillMeta(skillFile);
            const name = meta?.name || entry.name.replace(".md", "");
            if (!skillsMap.has(name)) {
              skillsMap.set(name, {
                name,
                cnName: skillNameMap[entry.name] || null,
                description: meta?.description || null,
                emoji: meta?.emoji || null,
                source: "local",
                path: resolvedDir,
                enabled: skillEntries[name]?.enabled !== false
              });
            }
          }
        }
      }
      const skills = Array.from(skillsMap.values());
      return { ok: true, skills };
    } catch (err) {
      console.error("扫描本地skill失败:", err);
      return { ok: false, error: err.message, skills: [] };
    }
  });
  electron.ipcMain.handle("toggle-skill", async (_, { skillName, enabled }) => {
    try {
      await writeOpenClawConfig({
        skills: {
          entries: {
            [skillName]: { enabled }
          }
        }
      }, "skills");
      return { ok: true };
    } catch (err) {
      console.error("toggle-skill 失败:", err);
      return { ok: false, error: err.message };
    }
  });

  electron.ipcMain.handle("sync-hermes-skills", async () => {
    try {
      return getHermesManager().syncOpenClawSkillsToHermes({ silent: false });
      const hermesSkillsRoot = path$1.join(getAppRoot(), "data", ".hermes", "skills");
      fs$1.mkdirSync(hermesSkillsRoot, { recursive: true });
      let extraDirs = [];
      let skillEntries = {};
      if (fs$1.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs$1.readFileSync(configPath, "utf-8"));
          extraDirs = config.skills?.load?.extraDirs || [];
          skillEntries = config.skills?.entries || {};
        } catch (e) {
          console.warn("读取 openclaw skills 配置失败:", e.message);
        }
      }
      let copied = 0;
      const seen = new Set();
      function copySkillEntry(skillPath, name) {
        if (!name || seen.has(name) || skillEntries[name]?.enabled === false) return;
        seen.add(name);
        const target = path$1.join(hermesSkillsRoot, name.replace(/[\\/:*?\"<>|]/g, "_"));
        fs$1.rmSync(target, { recursive: true, force: true });
        if (fs$1.statSync(skillPath).isDirectory()) {
          fs$1.cpSync(skillPath, target, { recursive: true });
        } else {
          fs$1.mkdirSync(target, { recursive: true });
          fs$1.copyFileSync(skillPath, path$1.join(target, "SKILL.md"));
        }
        copied += 1;
      }
      for (const extraDir of extraDirs) {
        let resolvedDir = extraDir;
        if (!path$1.isAbsolute(extraDir)) resolvedDir = path$1.join(getAppRoot(), extraDir);
        if (!fs$1.existsSync(resolvedDir)) continue;
        for (const entry of fs$1.readdirSync(resolvedDir, { withFileTypes: true })) {
          const skillPath = path$1.join(resolvedDir, entry.name);
          if (entry.isDirectory()) {
            const skillFile = path$1.join(skillPath, "SKILL.md");
            if (!fs$1.existsSync(skillFile)) continue;
            const meta = parseSkillMeta(skillFile);
            copySkillEntry(skillPath, meta?.name || entry.name);
          } else if (entry.name.toLowerCase().endsWith(".md")) {
            const meta = parseSkillMeta(skillPath);
            copySkillEntry(skillPath, meta?.name || entry.name.replace(/\.md$/i, ""));
          }
        }
      }
      safeSend("hermes-log", { type: "system", msg: "[skills] synced " + copied + " OpenClaw skills to Hermes: " + hermesSkillsRoot });
      return { ok: true, copied, path: hermesSkillsRoot };
    } catch (err) {
      console.error("sync-hermes-skills 失败:", err);
      return { ok: false, error: err.message };
    }
  });

  electron.ipcMain.handle("hermes:start", async (_, options) => {
    return await getHermesManager().start(options || {});
  });
  electron.ipcMain.handle("hermes:stop", async () => {
    return await getHermesManager().stop();
  });
  electron.ipcMain.handle("hermes:getStatus", async () => {
    return await getHermesManager().getStatus({ fast: true });
  });
  electron.ipcMain.handle("hermes:getLogs", async (_, options = {}) => {
    const limit = Number.isFinite(options?.limit) ? Math.max(1, Math.min(300, Number(options.limit))) : 100;
    const logsRoot = path$1.join(getAppRoot(), "data", ".hermes", "logs");
    const files = ["launcher.log", "gateway.log", "agent.log", "errors.log", "gui.log", "gateway-exit-diag.log"];
    const rows = [];
    for (const name of files) {
      const filePath = path$1.join(logsRoot, name);
      try {
        if (!fs$1.existsSync(filePath)) continue;
        const lines = readFileTailLines(filePath, limit, 192 * 1024);
        for (const line of lines) rows.push({ type: name.includes("error") ? "stderr" : "system", msg: "[" + name + "] " + line, file: name });
      } catch (err) {
        rows.push({ type: "stderr", msg: "[" + name + "] read failed: " + err.message, file: name });
      }
    }
    return rows.slice(-limit);
  });
  electron.ipcMain.handle("hermes:startDashboard", async (_, options) => {
    return await getHermesManager().startDashboard(options || {});
  });
  electron.ipcMain.handle("hermes:startApiServer", async (_, options) => {
    return await getHermesManager().startApiServer(options || {});
  });
  electron.ipcMain.handle("hermes:openConfig", async () => {
    return await getHermesManager().openConfig();
  });
  electron.ipcMain.handle("hermes:openDashboard", async () => {
    return await getHermesManager().openDashboard();
  });
  electron.ipcMain.handle("hermes:openApiServer", async () => {
    return await getHermesManager().openApiServer();
  });
  electron.ipcMain.handle("hermes:chat", async (_, options) => {
    const chatOptions = options || {};
    if (!chatOptions.background) {
      return await getHermesManager().chat(chatOptions);
    }
    const taskId = chatOptions.taskId || "hermes-chat-task-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    safeSend("hermes-log", { type: "system", msg: "[hermes-chat] accepted background task " + taskId + " session=" + (chatOptions.sessionId || "hermes-ai-chat") + " messageLength=" + String(chatOptions.message || "").length });
    setTimeout(() => {
      getHermesManager().chat({ ...chatOptions, taskId }).then((result) => {
        const payload = { taskId, sessionId: chatOptions.sessionId || "hermes-ai-chat", mode: chatOptions.sessionId === "openclaw-hermes-collab" ? "collab" : "hermes", result, finishedAt: Date.now(), runId: result?.runId, runDir: result?.runDir, stdoutPath: result?.stdoutPath, stderrPath: result?.stderrPath };
        hermesChatResults.set(taskId, payload);
        safeSend("hermes-chat-result", payload);
      }).catch((err) => {
        const payload = { taskId, sessionId: chatOptions.sessionId || "hermes-ai-chat", mode: chatOptions.sessionId === "openclaw-hermes-collab" ? "collab" : "hermes", result: { ok: false, error: err instanceof Error ? err.message : String(err) }, finishedAt: Date.now() };
        hermesChatResults.set(taskId, payload);
        safeSend("hermes-chat-result", payload);
      });
    }, 0);
    return { ok: true, pending: true, taskId };
  });
  electron.ipcMain.handle("hermes:chatResult", async (_, taskId) => {
    if (!taskId) return null;
    const payload = hermesChatResults.get(taskId) || readHermesChatResultFromRuns(taskId) || null;
    if (payload?.finishedAt && Date.now() - payload.finishedAt > 10 * 60 * 1000) {
      hermesChatResults.delete(taskId);
    }
    return payload;
  });
  electron.ipcMain.handle("hermes:cancelChat", async (_, taskId) => {
    if (!taskId) return { ok: false, error: "missing taskId" };
    const manager = getHermesManager();
    const child = manager.chatChildren.get(taskId);
    if (!child) return { ok: false, error: "task not running" };
    child.__uclawCancelled = true;
    const meta = manager.chatRunMeta.get(taskId);
    if (meta?.statusPath && meta?.resultPath) {
      try {
        const payload = { ok: false, errorKind: "cancelled", error: "Hermes task was cancelled by the user.", runId: meta.runId, runDir: meta.runDir, stdoutPath: meta.stdoutPath, stderrPath: meta.stderrPath };
        fs$1.writeFileSync(meta.resultPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
        fs$1.writeFileSync(meta.statusPath, JSON.stringify({ status: "cancelled", finishedAt: new Date().toISOString(), taskId, sessionId: meta.sessionId, runId: meta.runId, runDir: meta.runDir, stdoutPath: meta.stdoutPath, stderrPath: meta.stderrPath, resultPath: meta.resultPath }, null, 2) + "\n", "utf8");
        const completed = { taskId, sessionId: meta.sessionId, mode: meta.sessionId === "openclaw-hermes-collab" ? "collab" : "hermes", result: payload, finishedAt: Date.now() };
        hermesChatResults.set(taskId, completed);
        safeSend("hermes-chat-result", completed);
      } catch (err) {
        safeSend("hermes-log", { type: "stderr", msg: "[chat-cancel] write failed: " + (err?.message || err) });
      }
    }
    manager.killChild(child);
    manager.chatChildren.delete(taskId);
    manager.chatRunMeta.delete(taskId);
    return { ok: true, taskId };
  });
  electron.ipcMain.handle("hermes:openInternal", async (_, targetUrl) => {
    const url2 = typeof targetUrl === "string" && targetUrl.startsWith("http") ? targetUrl : "http://127.0.0.1:17520";
    return openHermesInternalWindow(url2, "Hermes");
  });
  electron.ipcMain.handle("hermes:openEmbedded", async (_, targetUrl) => {
    const url2 = typeof targetUrl === "string" && targetUrl.startsWith("http") ? targetUrl : "http://127.0.0.1:17520";
    return openHermesInMainWindow(url2);
  });
  electron.ipcMain.handle("hermes:getFrameUrl", async (_, targetUrl) => {
    const url2 = typeof targetUrl === "string" && targetUrl.startsWith("http") ? targetUrl : "http://127.0.0.1:17520";
    return getHermesFrameFileUrl(url2);
  });

  electron.ipcMain.handle("start-gateway", async () => {
    try {
      await gateway.startGateway();
      return { ok: true };
    } catch (err) {
      console.error(`启动 Gateway 失败:`, err);
      return { ok: false, error: err.message };
    }
  });
  electron.ipcMain.handle("gateway-status-read", async () => {
    let ready = !!gateway.isGatewayReady();
    if (!ready) {
      ready = await new Promise((resolve) => {
        try {
          const req = http.get(`http://127.0.0.1:${GATEWAY_DEFAULT_PORT}/health`, { timeout: 1200 }, (res) => {
            res.resume();
            resolve(res.statusCode === 200);
          });
          req.on("error", () => resolve(false));
          req.on("timeout", () => {
            req.destroy();
            resolve(false);
          });
        } catch {
          resolve(false);
        }
      });
    }
    const portOpen = ready ? true : await checkTcpPortOpen(GATEWAY_DEFAULT_PORT, 500);
    return { running: ready || portOpen, gatewayReady: ready, healthReady: ready, portOpen, port: GATEWAY_DEFAULT_PORT };
  });
  electron.ipcMain.handle("stop-gateway", async () => {
    await gateway.stopGateway();
    return { ok: true };
  });
  electron.ipcMain.handle("restart-gateway", async () => {
    try {
      await gateway.restartGateway();
      setTimeout(() => {
        if (gateway.isGatewayReady()) {
          const token = runtimeStore.gatewayToken || "uclawKey";
          electron.shell.openExternal(`http://127.0.0.1:${GATEWAY_DEFAULT_PORT}/?token=newToken`);
        }
      }, 100);
      return { ok: true, port: GATEWAY_DEFAULT_PORT };
    } catch (err) {
      console.error(`重启 Gateway 失败:`, err);
      return { ok: false, error: err.message };
    }
  });
  electron.ipcMain.handle("restart-app", async () => {
    electron.app.relaunch();
    electron.app.exit(0);
  });
  electron.ipcMain.handle("get-node-version", async () => {
    try {
      const nodeBin = getNodeBin();
      const { execFileSync } = require("child_process");
      const version = execFileSync(nodeBin, ["--version"], { encoding: "utf8", timeout: 5e3 }).trim();
      return { ok: true, version };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
  electron.ipcMain.handle("get-npm-version", async () => {
    try {
      const nodeBin = getNodeBin();
      const { execFileSync } = require("child_process");
      const version = execFileSync(nodeBin, ["-v"], { encoding: "utf8", timeout: 5e3 }).trim();
      return { ok: true, version };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
  electron.ipcMain.handle("get-openclaw-version", async () => {
    try {
      const nodeBin = getNodeBin();
      const { execFileSync } = require("child_process");
      const version = execFileSync(nodeBin, [openclawEntry, "--version"], { encoding: "utf8", timeout: 1e4 }).trim();
      return { ok: true, version };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
  electron.ipcMain.handle("check-port", async (_, port) => {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return { ok: false, error: "Invalid port number" };
    }
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once("error", (err) => {
        if (err.code === "EADDRINUSE") {
          resolve({ ok: true, available: false });
        } else {
          resolve({ ok: false, error: err.message });
        }
      });
      server.once("listening", () => {
        server.close();
        resolve({ ok: true, available: true });
      });
      server.listen(port, "127.0.0.1");
    });
  });
  electron.ipcMain.handle("load-message-json", async () => {
    try {
      const mediaDir = getMediaDir();
      const file = path$1.join(mediaDir, "message.json");
      if (!fs$1.existsSync(file)) {
        return { ok: true, data: [] };
      }
      const content = fs$1.readFileSync(file, "utf-8");
      const data = JSON.parse(content);
      return { ok: true, data: Array.isArray(data) ? data : [] };
    } catch (err) {
      console.error("[load-message-json] failed:", err);
      return { ok: true, data: [] };
    }
  });
  electron.ipcMain.handle("save-message-json", async (_, { messages }) => {
    try {
      const mediaDir = getMediaDir();
      if (!fs$1.existsSync(mediaDir)) {
        fs$1.mkdirSync(mediaDir, { recursive: true });
      }
      const file = path$1.join(mediaDir, "message.json");
      fs$1.writeFileSync(file, JSON.stringify(messages, null, 2), "utf-8");
      return { ok: true };
    } catch (err) {
      console.error("[save-message-json] failed:", err);
      return { ok: false, error: err.message };
    }
  });
  const CHAT_DIR = path$1.join(getDataRoot(), ".openclaw", "chat-history");
  const CHAT_PROFILE_PATH = path$1.join(getDataRoot(), ".openclaw", "chat-profile.json");
  function sanitizeSessionKey(key) {
    return (key || "default").replace(/[:]/g, "-").replace(/[^a-zA-Z0-9_\-.]/g, "_");
  }
  electron.ipcMain.handle("save-chat-message", async (_, sessionKey, message) => {
    try {
      const dir = path$1.join(CHAT_DIR, sanitizeSessionKey(sessionKey));
      fs$1.mkdirSync(dir, { recursive: true });
      const msgFile = path$1.join(dir, "messages.jsonl");
      fs$1.appendFileSync(msgFile, JSON.stringify(message) + "\n");
      return true;
    } catch (e) {
      console.error("[chat-persist] save error:", e);
      return false;
    }
  });
  electron.ipcMain.handle("save-chat-messages-bulk", async (_, sessionKey, messages) => {
    try {
      const dir = path$1.join(CHAT_DIR, sanitizeSessionKey(sessionKey));
      fs$1.mkdirSync(dir, { recursive: true });
      const msgFile = path$1.join(dir, "messages.jsonl");
      const lines = messages.map((m) => JSON.stringify(m)).join("\n") + "\n";
      fs$1.writeFileSync(msgFile, lines);
      return true;
    } catch (e) {
      console.error("[chat-persist] bulk save error:", e);
      return false;
    }
  });
  electron.ipcMain.handle("load-chat-messages", async (_, sessionKey, limit) => {
    try {
      const dir = path$1.join(CHAT_DIR, sanitizeSessionKey(sessionKey));
      const msgFile = path$1.join(dir, "messages.jsonl");
      if (!fs$1.existsSync(msgFile)) return [];
      const content = fs$1.readFileSync(msgFile, "utf-8");
      const lines = content.split("\n").filter((l) => l.trim());
      const messages = [];
      for (const line of lines) {
        try {
          messages.push(JSON.parse(line));
        } catch {
        }
      }
      const seen = /* @__PURE__ */ new Map();
      for (const m of messages) {
        if (m.id) seen.set(m.id, m);
        else seen.set(Math.random(), m);
      }
      const deduped = [...seen.values()];
      return limit ? deduped.slice(-limit) : deduped;
    } catch (e) {
      console.error("[chat-persist] load error:", e);
      return [];
    }
  });
  electron.ipcMain.handle("clear-chat-messages", async (_, sessionKey) => {
    try {
      const dir = path$1.join(CHAT_DIR, sanitizeSessionKey(sessionKey));
      const msgFile = path$1.join(dir, "messages.jsonl");
      if (fs$1.existsSync(msgFile)) fs$1.writeFileSync(msgFile, "");
      return true;
    } catch (e) {
      console.error("[chat-persist] clear error:", e);
      return false;
    }
  });
  electron.ipcMain.handle("load-chat-profile", async () => {
    try {
      const data = fs$1.readFileSync(CHAT_PROFILE_PATH, "utf-8");
      return JSON.parse(data);
    } catch {
      return {};
    }
  });
  electron.ipcMain.handle("save-chat-profile", async (_, profile) => {
    try {
      fs$1.mkdirSync(path$1.dirname(CHAT_PROFILE_PATH), { recursive: true });
      fs$1.writeFileSync(CHAT_PROFILE_PATH, JSON.stringify(profile, null, 2), "utf-8");
      return true;
    } catch (e) {
      console.error("[chat-profile] save error:", e);
      return false;
    }
  });
  const USER_STATE_DIR = path$1.join(getDataRoot(), ".openclaw", "state");
  electron.ipcMain.handle("save-user-state", async (_, key, value) => {
    try {
      fs$1.mkdirSync(USER_STATE_DIR, { recursive: true });
      const filePath = path$1.join(USER_STATE_DIR, `${key}.json`);
      fs$1.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf-8");
      return true;
    } catch (e) {
      console.error(`[user-state] save ${key} error:`, e);
      return false;
    }
  });
  electron.ipcMain.handle("load-user-state", async (_, key) => {
    try {
      const filePath = path$1.join(USER_STATE_DIR, `${key}.json`);
      const data = fs$1.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    } catch {
      return null;
    }
  });
  electron.ipcMain.handle("delete-user-state", async (_, key) => {
    try {
      const filePath = path$1.join(USER_STATE_DIR, `${key}.json`);
      if (fs$1.existsSync(filePath)) {
        fs$1.unlinkSync(filePath);
      }
      return true;
    } catch (e) {
      console.error(`[user-state] delete ${key} error:`, e);
      return false;
    }
  });
  const MEDIA_DIR = getMediaDir();
  electron.ipcMain.handle("save-media-file", async (_, fileName, base64Data, subDir) => {
    try {
      const dir = path$1.join(MEDIA_DIR, subDir || "general");
      fs$1.mkdirSync(dir, { recursive: true });
      const filePath = path$1.join(dir, fileName);
      fs$1.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
      return filePath;
    } catch (e) {
      console.error("[media] save error:", e);
      return null;
    }
  });
  electron.ipcMain.handle("get-media-path", async (_, fileName, subDir) => {
    const filePath = path$1.join(MEDIA_DIR, subDir || "general", fileName);
    return fs$1.existsSync(filePath) ? filePath : null;
  });
  electron.ipcMain.handle("open-media-dir", async (_, subDir) => {
    try {
      const { shell } = await import("electron");
      const dir = path$1.join(MEDIA_DIR, subDir || "general");
      fs$1.mkdirSync(dir, { recursive: true });
      const err = await shell.openPath(dir);
      if (err) return { ok: false, error: err };
      return { ok: true, path: dir };
    } catch (e) {
      return { ok: false, error: String(e?.message || e) };
    }
  });
  electron.ipcMain.handle("open-media-folder", async () => {
    try {
      const mediaDir = getMediaDir();
      if (!fs$1.existsSync(mediaDir)) {
        fs$1.mkdirSync(mediaDir, { recursive: true });
      }
      const { shell } = await import("electron");
      await shell.openPath(mediaDir);
      return { ok: true };
    } catch (err) {
      console.error("[open-media-folder] failed:", err);
      return { ok: false, error: err.message };
    }
  });
  electron.ipcMain.handle("open-media-image-folder", async () => {
    try {
      const imageDir = getMediaImageDir();
      if (!fs$1.existsSync(imageDir)) {
        fs$1.mkdirSync(imageDir, { recursive: true });
      }
      const { shell } = await import("electron");
      await shell.openPath(imageDir);
      return { ok: true };
    } catch (err) {
      console.error("[open-media-image-folder] failed:", err);
      return { ok: false, error: err.message };
    }
  });
  electron.ipcMain.handle("get-media-file-count", async () => {
    try {
      const imageDir = getMediaImageDir();
      const videoDir = getMediaVideoDir();
      let imageCount = 0;
      let videoCount = 0;
      if (fs$1.existsSync(imageDir)) {
        imageCount = fs$1.readdirSync(imageDir).filter((f) => {
          try {
            return fs$1.statSync(path$1.join(imageDir, f)).isFile();
          } catch {
            return false;
          }
        }).length;
      }
      if (fs$1.existsSync(videoDir)) {
        videoCount = fs$1.readdirSync(videoDir).filter((f) => {
          try {
            return fs$1.statSync(path$1.join(videoDir, f)).isFile();
          } catch {
            return false;
          }
        }).length;
      }
      return { ok: true, data: { imageCount, videoCount } };
    } catch (err) {
      console.error("[get-media-file-count] failed:", err);
      return { ok: false, error: err.message };
    }
  });
  electron.ipcMain.handle("open-media-video-folder", async () => {
    try {
      const videoDir = getMediaVideoDir();
      if (!fs$1.existsSync(videoDir)) {
        fs$1.mkdirSync(videoDir, { recursive: true });
      }
      const { shell } = await import("electron");
      await shell.openPath(videoDir);
      return { ok: true };
    } catch (err) {
      console.error("[open-media-video-folder] failed:", err);
      return { ok: false, error: err.message };
    }
  });
  electron.ipcMain.handle("save-image-sessions", async (_, { sessions, currentSessionId }) => {
    try {
      const dir = path$1.join(dataRoot, ".openclaw", "chat-history");
      if (!fs$1.existsSync(dir)) {
        fs$1.mkdirSync(dir, { recursive: true });
      }
      const file = path$1.join(dir, "image-sessions.json");
      fs$1.writeFileSync(file, JSON.stringify({ sessions, currentSessionId }, null, 2), "utf-8");
      return { ok: true };
    } catch (err) {
      console.error("[save-image-sessions] failed:", err);
      return { ok: false, error: err.message };
    }
  });
  electron.ipcMain.handle("load-image-sessions", async () => {
    try {
      const file = path$1.join(dataRoot, ".openclaw", "chat-history", "image-sessions.json");
      if (!fs$1.existsSync(file)) {
        return { ok: true, data: { sessions: [], currentSessionId: null } };
      }
      const content = fs$1.readFileSync(file, "utf-8");
      const data = JSON.parse(content);
      return { ok: true, data };
    } catch (err) {
      console.error("[load-image-sessions] failed:", err);
      return { ok: true, data: { sessions: [], currentSessionId: null } };
    }
  });
  electron.ipcMain.handle("save-video-sessions", async (_, { sessions, currentSessionId }) => {
    try {
      const dir = path$1.join(dataRoot, ".openclaw", "chat-history");
      if (!fs$1.existsSync(dir)) {
        fs$1.mkdirSync(dir, { recursive: true });
      }
      const file = path$1.join(dir, "video-sessions.json");
      fs$1.writeFileSync(file, JSON.stringify({ sessions, currentSessionId }, null, 2), "utf-8");
      return { ok: true };
    } catch (err) {
      console.error("[save-video-sessions] failed:", err);
      return { ok: false, error: err.message };
    }
  });
  electron.ipcMain.handle("load-video-sessions", async () => {
    try {
      const file = path$1.join(dataRoot, ".openclaw", "chat-history", "video-sessions.json");
      if (!fs$1.existsSync(file)) {
        return { ok: true, data: { sessions: [], currentSessionId: null } };
      }
      const content = fs$1.readFileSync(file, "utf-8");
      const data = JSON.parse(content);
      return { ok: true, data };
    } catch (err) {
      console.error("[load-video-sessions] failed:", err);
      return { ok: true, data: { sessions: [], currentSessionId: null } };
    }
  });
  electron.ipcMain.handle("save-media-video", async (_, { url: url2, taskId }) => {
    try {
      const videoDir = getMediaVideoDir();
      if (!fs$1.existsSync(videoDir)) {
        fs$1.mkdirSync(videoDir, { recursive: true });
      }
      const ext = url2.match(/\.(mp4|webm|mov|avi)(?:\?|$)/i)?.[1] || "mp4";
      const filename = `${taskId}.${ext}`;
      const filepath = path$1.join(videoDir, filename);
      const response = await fetchWithRetry(url2);
      const arrayBuffer = await response.arrayBuffer();
      fs$1.writeFileSync(filepath, Buffer.from(arrayBuffer));
      console.log("[save-media-video] saved:", filepath);
      return { ok: true, filepath };
    } catch (e) {
      console.error("save-media-video failed:", e.message);
      return { ok: false, error: e.message };
    }
  });
  electron.ipcMain.handle("copy-local-file", async (_, { sourceUrl, destPath }) => {
    try {
      let sourcePath = sourceUrl;
      if (sourcePath.startsWith("local-media://")) {
        const url2 = new URL(sourcePath);
        const drive = url2.hostname.toUpperCase() + ":";
        sourcePath = drive + url2.pathname.replace(/\//g, "\\");
      } else if (sourcePath.startsWith("file://")) {
        sourcePath = sourcePath.replace(/^file:\/\/\//, "");
        if (process.platform === "win32" && /^[a-zA-Z]:/.test(sourcePath)) {
          sourcePath = sourcePath.replace(/\//g, "\\");
        }
      }
      const destDir = path$1.dirname(destPath);
      if (!fs$1.existsSync(destDir)) {
        fs$1.mkdirSync(destDir, { recursive: true });
      }
      fs$1.copyFileSync(sourcePath, destPath);
      console.log("[copy-local-file] copied:", sourcePath, "->", destPath);
      return { ok: true };
    } catch (e) {
      console.error("copy-local-file failed:", e.message);
      return { ok: false, error: e.message };
    }
  });
  electron.ipcMain.handle("generate-image", async (_, { prompt, model, size, quality }) => {
    try {
      const url2 = `http://127.0.0.1:${GATEWAY_DEFAULT_PORT}/v1/images/generations`;
      const body = {
        model: model || "dall-e-3",
        prompt,
        size: size || "1024x1024",
        quality: quality || "standard",
        n: 1
      };
      console.log("[generate-image] Request:", body);
      const response = await fetch(url2, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      console.log("[generate-image] Response:", data);
      if (!response.ok) {
        return { error: data.error?.message || `HTTP ${response.status}` };
      }
      if (data.data && data.data[0]) {
        return {
          url: data.data[0].url,
          revisedPrompt: data.data[0].revised_prompt || ""
        };
      }
      return { error: "No image returned" };
    } catch (err) {
      console.error("[generate-image] Error:", err);
      return { error: err.message };
    }
  });
  electron.ipcMain.on("window-minimize", () => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) win.minimize();
  });
  electron.ipcMain.on("window-close", () => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) win.close();
  });
  electron.ipcMain.handle("create-connect-frame", (_, nonce, gatewayToken, gatewayPassword) => {
    try {
      return createConnectFrame(nonce, gatewayToken, gatewayPassword);
    } catch (e) {
      console.error("[ipc] create-connect-frame error:", e);
      throw e;
    }
  });
  electron.ipcMain.handle("auto-pair-device", () => {
    try {
      return autoPairDevice();
    } catch (e) {
      console.error("[ipc] auto-pair-device error:", e);
      throw e;
    }
  });
  electron.ipcMain.handle("reload-gateway", async () => {
    return reloadGateway();
  });
}
function registerWechatIPCHandler({ gateway }) {
  initWechat();
  const wechatManagerForGateway = getWechatManagerInstance();
  wechatManagerForGateway?.on("login-exit", async (code) => {
    try {
      if (code === 0 || wechatManagerForGateway.getStatus() === "connected") {
        wechatManagerForGateway.emit("log", "[weixin] login complete; Gateway will keep running.");
        safeSend("wechat-status", { status: "connected", diagnostics: getWeChatDiagnostics() });
      }
    } catch (err) {
      wechatManagerForGateway?.emit("log", "[weixin] Gateway 重启失败: " + (err instanceof Error ? err.message : String(err)));
    }
  });
  electron.ipcMain.handle("wechat-start-login", async () => {
    const wechatManager2 = getWechatManagerInstance();
    console.log("[wechat] start-login called, manager exists:", !!wechatManager2);
    if (!wechatManager2) return { success: false, error: "no manager" };
    if (!wechatManager2.isPluginInstalled()) {
      wechatManager2.emit("log", "[weixin] 本地微信插件未安装，正在从 U 盘内置插件安装...");
      const installResult = await wechatManager2.installPlugin({ usbRoot: getAppRoot() });
      if (!installResult?.success) {
        const message = installResult?.error || "微信插件安装失败，请检查 extensions/openclaw-weixin 是否存在。";
        wechatManager2.emit("log", "[weixin] " + message);
        return { success: false, error: message, diagnostics: getWeChatDiagnostics() };
      }
    } else {
      wechatManager2._ensurePluginsAllow?.();
    }
    const result = wechatManager2.startLogin();
    console.log("[wechat] startLogin result:", result);
    return result;
  });
  function getWeChatDiagnostics() {
    const stateRoot = path$1.join(getDataRoot(), ".openclaw");
    const weixinRoot = path$1.join(stateRoot, "openclaw-weixin");
    const indexPath = path$1.join(weixinRoot, "accounts.json");
    const accountsDir = path$1.join(weixinRoot, "accounts");
    let accountIds = [];
    try {
      if (fs$1.existsSync(indexPath)) {
        const parsed = JSON.parse(fs$1.readFileSync(indexPath, "utf8"));
        if (Array.isArray(parsed)) accountIds = parsed.filter((id) => typeof id === "string" && id.trim());
      }
    } catch {
      accountIds = [];
    }
    const accountFiles = fs$1.existsSync(accountsDir) ? fs$1.readdirSync(accountsDir).filter((name) => name.endsWith(".json")) : [];
    return { stateRoot, weixinRoot, indexPath, accountsDir, indexExists: fs$1.existsSync(indexPath), accountIds, accountFiles, accountCount: accountIds.length || accountFiles.filter((name) => !name.includes(".sync") && !name.includes("context-tokens")).length };
  }
  electron.ipcMain.handle("get-wechat-status", () => {
    const status = getWechatManagerInstance().getStatus();
    return { ...(typeof status === "object" && status ? status : { status }), diagnostics: getWeChatDiagnostics() };
  });
  electron.ipcMain.handle("wechat:diagnostics", () => getWeChatDiagnostics());
  electron.ipcMain.handle("openclaw-wechat-cancel", () => {
    getWechatManagerInstance().cancelLogin();
    return { ok: true };
  });
  electron.ipcMain.handle("is-wechat-plugin-installed", () => {
    return getWechatManagerInstance().isPluginInstalled();
  });
  electron.ipcMain.handle("update-wechat-plugin", async () => {
    const manager = getWechatManagerInstance();
    return manager.installPlugin({ usbRoot: getAppRoot(), forceOnline: true });
  });
  electron.ipcMain.handle("uninstall-reinstall-wechat", async () => {
    const manager = getWechatManagerInstance();
    return manager.installPlugin({ usbRoot: getAppRoot() });
  });
  electron.ipcMain.handle("wechat-install", async () => {
    const manager = getWechatManagerInstance();
    return manager.installPlugin({ usbRoot: getAppRoot() });
  });
  electron.ipcMain.handle("wechat-uninstall", async () => {
    try {
      const manager = getWechatManagerInstance();
      manager?.cancelLogin?.();
      await gateway.stopGateway();
      const dataDir = getDataRoot();
      const extDir = path$1.join(dataDir, ".openclaw", "extensions", "openclaw-weixin");
      if (fs$1.existsSync(extDir)) {
        fs$1.rmSync(extDir, { recursive: true, force: true });
      }
      const wechatDataDir = path$1.join(dataDir, ".openclaw", "openclaw-weixin");
      if (fs$1.existsSync(wechatDataDir)) {
        fs$1.rmSync(wechatDataDir, { recursive: true, force: true });
      }
      const configFile = path$1.join(dataDir, ".openclaw", "openclaw.json");
      if (fs$1.existsSync(configFile)) {
        const config = JSON.parse(fs$1.readFileSync(configFile, "utf-8"));
        if (Array.isArray(config.plugins?.allow)) {
          config.plugins.allow = config.plugins.allow.filter((p) => p !== "openclaw-weixin");
        }
        if (config.plugins?.entries?.["openclaw-weixin"]) {
          delete config.plugins.entries["openclaw-weixin"];
        }
        if (config.channels?.["openclaw-weixin"]) {
          delete config.channels["openclaw-weixin"];
        }
        atomicWriteFileSync(configFile, JSON.stringify(config, null, 2), "utf-8");
      }
      console.log("[wechat] Uninstalled successfully");
      return { success: true };
    } catch (e) {
      console.error("[wechat] Uninstall error:", e);
      return { success: false, error: e.message };
    }
  });
}
function registerFeishuIPCHandler({ gateway }) {
  initFeishu();
  function fixFeishuChannelKey() {
    try {
      const dataDir = getDataRoot();
      const configFile = path$1.join(dataDir, ".openclaw", "openclaw.json");
      if (!fs$1.existsSync(configFile)) return;
      const config = JSON.parse(fs$1.readFileSync(configFile, "utf-8"));
      if (config.channels?.["openclaw-lark"] && !config.channels?.["feishu"]) {
        config.channels["feishu"] = config.channels["openclaw-lark"];
        delete config.channels["openclaw-lark"];
        atomicWriteFileSync(configFile, JSON.stringify(config, null, 2));
        console.log("[feishu-fix] Renamed channels.openclaw-lark → channels.feishu");
      }
    } catch (e) {
      console.error("[feishu-fix] Failed:", e.message);
    }
  }
  function syncPluginAllow(pluginId, shouldExist) {
    try {
      const dataDir = getDataRoot();
      const configFile = path$1.join(dataDir, ".openclaw", "openclaw.json");
      if (!fs$1.existsSync(configFile)) return;
      const config = JSON.parse(fs$1.readFileSync(configFile, "utf-8"));
      if (!config.plugins) config.plugins = {};
      if (!Array.isArray(config.plugins.allow)) config.plugins.allow = [];
      const has = config.plugins.allow.includes(pluginId);
      if (shouldExist && !has) {
        config.plugins.allow.push(pluginId);
        atomicWriteFileSync(configFile, JSON.stringify(config, null, 2));
        console.log(`[plugin-sync] Added ${pluginId} to plugins.allow`);
      } else if (!shouldExist && has) ;
    } catch (e) {
      console.error(`[plugin-sync] Failed:`, e.message);
    }
  }
  electron.ipcMain.handle("feishu-get-status", () => {
    const manager = getFeishuManagerInstance();
    const installed = manager?.isPluginInstalled() || false;
    let configured = false;
    const dataDir = getDataRoot();
    try {
      const configFile = path$1.join(dataDir, ".openclaw", "openclaw.json");
      if (fs$1.existsSync(configFile)) {
        const config = JSON.parse(fs$1.readFileSync(configFile, "utf-8"));
        const lark = config?.channels?.["openclaw-lark"] || config?.channels?.feishu;
        configured = !!(lark?.accounts?.[0]?.appId || lark?.appId);
      }
    } catch {
    }
    if (!configured) {
      try {
        const markerFile = path$1.join(dataDir, ".openclaw", "feishu-configured.json");
        if (fs$1.existsSync(markerFile)) {
          const marker = JSON.parse(fs$1.readFileSync(markerFile, "utf-8"));
          if (marker?.configured) configured = true;
        }
      } catch {
      }
    }
    if (!configured) {
      try {
        const homeConfig = path$1.join(os.homedir(), ".openclaw", "openclaw.json");
        if (fs$1.existsSync(homeConfig)) {
          const config = JSON.parse(fs$1.readFileSync(homeConfig, "utf-8"));
          const lark = config?.channels?.["openclaw-lark"] || config?.channels?.feishu;
          configured = !!(lark?.accounts?.[0]?.appId || lark?.appId);
        }
      } catch {
      }
    }
    return { installed, configured, installing: !!manager?.installProcess };
  });
  electron.ipcMain.handle("feishu-is-installed", () => {
    return getFeishuManagerInstance()?.isPluginInstalled() || false;
  });
  electron.ipcMain.handle("feishu-install", async () => {
    const manager = getFeishuManagerInstance();
    if (!manager) return { success: false, error: "飞书管理器未初始化" };
    const result = await manager.installPlugin({ usbRoot: getAppRoot() });
    if (result?.success) {
      syncPluginAllow("openclaw-lark", true);
      fixFeishuChannelKey();
    }
    safeSend("feishu-done", result);
    return result;
  });
  electron.ipcMain.handle("feishu-update", async () => {
    const manager = getFeishuManagerInstance();
    if (!manager) return { success: false, error: "飞书管理器未初始化" };
    const result = await manager.installPlugin({ usbRoot: getAppRoot(), forceOnline: true });
    if (result?.success) {
      syncPluginAllow("openclaw-lark", true);
      fixFeishuChannelKey();
    }
    safeSend("feishu-done", result);
    return result;
  });
  electron.ipcMain.handle("feishu-install-with-app", async (_, appId, appSecret) => {
    const manager = getFeishuManagerInstance();
    if (!manager) return { success: false, error: "飞书管理器未初始化" };
    const result = await manager.installWithApp(appId, appSecret);
    if (result?.success) {
      syncPluginAllow("openclaw-lark", true);
      fixFeishuChannelKey();
    }
    safeSend("feishu-done", result);
    return result;
  });
  electron.ipcMain.handle("feishu-cancel-install", () => {
    const manager = getFeishuManagerInstance();
    if (manager?.installProcess) {
      manager.installProcess.kill();
      manager.installProcess = null;
      safeSend("feishu-log", "安装已取消");
      safeSend("feishu-done", { success: false, cancelled: true });
    }
  });
  electron.ipcMain.handle("feishu-answer-prompt", (_, answer) => {
    const manager = getFeishuManagerInstance();
    if (manager?.installProcess?.stdin && !manager.installProcess.stdin.destroyed) {
      try {
        manager.installProcess.stdin.write(answer + "\n");
      } catch {
      }
    }
  });
  electron.ipcMain.handle("feishu-uninstall", async () => {
    try {
      const manager = getFeishuManagerInstance();
      if (manager?.installProcess) {
        manager.installProcess.kill();
        manager.installProcess = null;
      }
      await gateway.stopGateway();
      const dataDir = getDataRoot();
      const extDir = path$1.join(dataDir, ".openclaw", "extensions", "openclaw-lark");
      if (fs$1.existsSync(extDir)) {
        fs$1.rmSync(extDir, { recursive: true, force: true });
      }
      for (const d of ["openclaw-lark", "feishu", "lark"]) {
        const dataPath = path$1.join(dataDir, ".openclaw", d);
        if (fs$1.existsSync(dataPath)) fs$1.rmSync(dataPath, { recursive: true, force: true });
        const dataPath2 = path$1.join(dataDir, d);
        if (fs$1.existsSync(dataPath2)) fs$1.rmSync(dataPath2, { recursive: true, force: true });
      }
      const configFile = path$1.join(dataDir, ".openclaw", "openclaw.json");
      if (fs$1.existsSync(configFile)) {
        const config = JSON.parse(fs$1.readFileSync(configFile, "utf-8"));
        if (Array.isArray(config.plugins?.allow)) {
          config.plugins.allow = config.plugins.allow.filter((p) => p !== "openclaw-lark");
        }
        if (config.plugins?.entries?.["openclaw-lark"]) delete config.plugins.entries["openclaw-lark"];
        if (config.channels?.["feishu"]) delete config.channels["feishu"];
        if (config.channels?.["openclaw-lark"]) delete config.channels["openclaw-lark"];
        atomicWriteFileSync(configFile, JSON.stringify(config, null, 2), "utf-8");
      }
      const markerFile = path$1.join(dataDir, ".openclaw", "feishu-configured.json");
      if (fs$1.existsSync(markerFile)) fs$1.unlinkSync(markerFile);
      console.log("[feishu] Uninstalled successfully (all data cleaned)");
      return { success: true };
    } catch (e) {
      console.error("[feishu] Uninstall error:", e);
      return { success: false, error: e.message };
    }
  });
}
try {
  const configPath = path$1.join(electron.app.getPath("userData"), ".openclaw", "openclaw.json");
  if (fs$1.existsSync(configPath)) {
    const config = JSON.parse(fs$1.readFileSync(configPath, "utf-8"));
    if (config?.ui?.disableGpu) {
      electron.app.disableHardwareAcceleration();
      console.log("[startup] GPU 加速已禁用（ui.disableGpu=true）");
    }
  }
} catch {
}
electron.protocol.registerSchemesAsPrivileged([
  {
    scheme: "local-media",
    privileges: {
      standard: true,
      // 按标准 URL 语法处理（http/https 同款），让 Chromium 媒体栈识别该协议
      secure: true,
      // 标记为安全协议（等同于 HTTPS），允许在安全上下文中加载
      bypassCSP: true,
      // 绕过 Content-Security-Policy
      stream: true,
      // 支持流式读取（视频播放必需）
      supportFetchAPI: true,
      // 支持 Fetch API
      corsEnabled: true
      // 允许跨协议请求（video 标签加载必需）
    }
  }
]);
if (!electron.app.requestSingleInstanceLock()) {
  console.log("[startup] another instance is running, quitting...");
  electron.app.quit();
} else {
  electron.app.on("second-instance", () => {
    const win = getMainWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}
installDesktopCrashDiagnostics();
electron.app.whenReady().then(async () => {
  console.log("[DEBUG] App ready, creating window...");
  const debugLogPath = path$1.join(electron.app.getPath("temp"), "local-media-debug.log");
  fs$1.writeFileSync(debugLogPath, (/* @__PURE__ */ new Date()).toISOString() + " [init] handler registered\n");
  electron.protocol.handle("local-media", async (request) => {
    try {
      const url2 = new URL(request.url);
      const drive = url2.hostname.toUpperCase() + ":";
      const filePath = drive + url2.pathname.replace(/\//g, "\\");
      console.log("[local-media] request:", request.url, "→", filePath);
      fs$1.appendFileSync(debugLogPath, (/* @__PURE__ */ new Date()).toISOString() + " [req] " + request.url + "\n");
      fs$1.appendFileSync(debugLogPath, (/* @__PURE__ */ new Date()).toISOString() + " [path] " + filePath + " exists=" + fs$1.existsSync(filePath) + "\n");
      if (!fs$1.existsSync(filePath)) {
        fs$1.appendFileSync(debugLogPath, (/* @__PURE__ */ new Date()).toISOString() + " [404] " + filePath + "\n");
        return new Response("File not found", { status: 404 });
      }
      const stat = fs$1.statSync(filePath);
      const fileSize = stat.size;
      const ext = path$1.extname(filePath).toLowerCase();
      const mimeTypes2 = {
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".mov": "video/quicktime",
        ".avi": "video/x-msvideo",
        ".mkv": "video/x-matroska",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp"
      };
      const contentType = mimeTypes2[ext] || "application/octet-stream";
      const rangeHeader = request.headers.get("range");
      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
        if (match) {
          const start = parseInt(match[1], 10);
          const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
          const chunkSize = end - start + 1;
          const buffer = Buffer.alloc(chunkSize);
          const fd = fs$1.openSync(filePath, "r");
          fs$1.readSync(fd, buffer, 0, chunkSize, start);
          fs$1.closeSync(fd);
          return new Response(buffer, {
            status: 206,
            headers: {
              "Content-Type": contentType,
              "Content-Range": `bytes ${start}-${end}/${fileSize}`,
              "Content-Length": String(chunkSize),
              "Accept-Ranges": "bytes"
            }
          });
        }
      }
      const data = fs$1.readFileSync(filePath);
      return new Response(data, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(fileSize),
          "Accept-Ranges": "bytes"
        }
      });
    } catch (e) {
      console.error("[local-media] error:", e.message);
      try {
        fs$1.appendFileSync(debugLogPath, (/* @__PURE__ */ new Date()).toISOString() + " [ERR] " + e.message + "\n");
      } catch {
      }
      return new Response("Internal error", { status: 500 });
    }
  });
  if (isWin()) {
    console.log("[startup] skipping global node.exe cleanup");
    try {
      console.log("finding port start");
      const netstat = child_process.execSync(`netstat -ano | findstr :${GATEWAY_DEFAULT_PORT} | findstr LISTENING`, { encoding: "utf-8", shell: true });
      console.log("finding port result", netstat);
      const pid = netstat.trim().split(/\s+/).pop();
      if (pid && pid !== "0") {
        child_process.execSync(`taskkill /f /pid ${pid} 2>nul`, { stdio: "ignore" });
        console.log(`[startup] killed orphaned process on port ${GATEWAY_DEFAULT_PORT} (pid ${pid})`);
      }
      console.log("finding port end");
    } catch (e) {
      if (e.status === 1 && e.stdout === "") {
        console.log(`[startup] port ${GATEWAY_DEFAULT_PORT} is free`);
      } else {
        console.error("finding port error", e.message);
      }
    }
  }
  createSplash();
  updateSplash("正在启动...");
  const gateway = createGatewayManager();
  if (!IS_DEV) {
    electron.Menu.setApplicationMenu(null);
  }
  electron.app.isQuitting = false;
  registerIPCHandlers({ gateway });
  setupLifecycle({ getGateway: () => gateway });
  updateSplash("正在清理旧程序...", 4);
  await extractRuntime();
  await ensureOpenClawDirectories();
  updateSplash("正在加载微信插件...", 80);
  registerWechatIPCHandler({ gateway });
  updateSplash("正在加载飞书插件...", 85);
  registerFeishuIPCHandler({ gateway });
  updateSplash("正在加载界面...", 100);
  createWindow(gateway);
  loadActivationPage();
});
