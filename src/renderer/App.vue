<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  Bot,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  Download,
  KeyRound,
  Play,
  RefreshCw,
  Send,
  Square,
  TerminalSquare,
  Upload
} from "lucide-vue-next";
import type {
  ActionResult,
  AgentId,
  AgentLogLine,
  AgentStatus,
  ChatResponse,
  ConnectorConfig,
  HermesConfig,
  ModelConfig,
  SandboxConfig
} from "../shared/types";

type ChatMode = AgentId | "collab";
type ChatMessage = { role: "user" | "assistant"; content: string; speaker?: string };

const activeAgent = ref<AgentId>("hermes");
const activeChatMode = ref<ChatMode>("hermes");
const statuses = reactive<Record<AgentId, AgentStatus | null>>({ openclaw: null, hermes: null });
const openClawConfig = ref<ModelConfig | null>(null);
const hermesConfig = ref<HermesConfig | null>(null);
const logs = ref<AgentLogLine[]>([]);
const embeddedUrl = ref("");
const embeddedTitle = ref("");
const chatInput = ref("");
const chatSessions = reactive<Record<ChatMode, ChatMessage[]>>({ openclaw: [], hermes: [], collab: [] });
const busy = ref(false);
const chatBusy = ref(false);
const statusMessage = ref("");
const statusOk = ref(true);
const importPath = ref("");
const lastTestResult = ref<ActionResult | null>(null);
const scheduleDraft = reactive({ title: "", naturalLanguage: "", cron: "" });

const activeStatus = computed(() => statuses[activeAgent.value]);
const chatMessages = computed(() => chatSessions[activeChatMode.value]);
const connectorFields: Record<ConnectorConfig["id"], string[]> = {
  telegram: ["botToken"],
  discord: ["botToken"],
  slack: ["appToken", "botToken"],
  whatsapp: ["sessionName"],
  signal: ["phoneNumber"],
  email: ["imapUrl", "smtpUrl", "username"],
  cli: []
};

function chatModeLabel(mode: ChatMode): string {
  if (mode === "openclaw") return "OpenClaw";
  if (mode === "hermes") return "Hermes";
  return "协同";
}
const sandboxFields: Record<SandboxConfig["id"], string[]> = {
  local: [],
  docker: ["socket"],
  ssh: ["host", "user"],
  singularity: ["image"],
  modal: ["tokenId"]
};

async function refresh() {
  const next = await window.agentHub.listStatus();
  statuses.openclaw = next.openclaw;
  statuses.hermes = next.hermes;
}

async function loadConfig() {
  hermesConfig.value = await window.agentHub.readHermesConfig();
}

async function loadOpenClawConfig() {
  openClawConfig.value = await window.agentHub.readOpenClawModelConfig();
}

async function saveConfig() {
  if (!hermesConfig.value) return;
  hermesConfig.value = await window.agentHub.writeHermesConfig(hermesConfig.value);
  statusOk.value = true;
  statusMessage.value = "配置已保存到 U 盘 data/.hermes。";
  await refresh();
}

async function saveOpenClawConfig() {
  if (!openClawConfig.value) return;
  openClawConfig.value = await window.agentHub.writeOpenClawModelConfig(openClawConfig.value);
  statusOk.value = true;
  statusMessage.value = "OpenClaw 模型配置已保存到 U 盘 data/.openclaw。";
  await refresh();
}

async function start(agent: AgentId) {
  busy.value = true;
  try {
    statuses[agent] = await window.agentHub.startAgent(agent);
    await refresh();
  } finally {
    busy.value = false;
  }
}

async function stop(agent: AgentId) {
  busy.value = true;
  try {
    statuses[agent] = await window.agentHub.stopAgent(agent);
    await refresh();
  } finally {
    busy.value = false;
  }
}

async function openHermes(target: "config" | "dashboard" | "api") {
  await window.agentHub.openHermes(target);
  await refresh();
}

async function testConnector(id: ConnectorConfig["id"]) {
  if (!hermesConfig.value) return;
  await saveConfig();
  const result = await window.agentHub.testHermesConnector(id) as ActionResult;
  lastTestResult.value = result;
  statusOk.value = result.ok;
  statusMessage.value = result.message;
  await loadConfig();
}

async function testSandbox(id: SandboxConfig["id"]) {
  if (!hermesConfig.value) return;
  await saveConfig();
  const result = await window.agentHub.testHermesSandbox(id) as ActionResult;
  lastTestResult.value = result;
  statusOk.value = result.ok;
  statusMessage.value = result.message;
}

async function addSchedule() {
  if (!scheduleDraft.naturalLanguage.trim()) return;
  await window.agentHub.addHermesSchedule({
    title: scheduleDraft.title,
    naturalLanguage: scheduleDraft.naturalLanguage,
    cron: scheduleDraft.cron,
    enabled: true
  });
  scheduleDraft.title = "";
  scheduleDraft.naturalLanguage = "";
  scheduleDraft.cron = "";
  statusOk.value = true;
  statusMessage.value = "自动化任务已加入 Hermes cron 配置。";
  await loadConfig();
}

async function removeSchedule(id: string) {
  hermesConfig.value = await window.agentHub.removeHermesSchedule(id);
  statusOk.value = true;
  statusMessage.value = "自动化任务已删除。";
}

async function exportConfig() {
  const result = await window.agentHub.exportHermesConfig() as ActionResult;
  statusOk.value = result.ok;
  statusMessage.value = result.path ? `${result.message} ${result.path}` : result.message;
}

async function pickImportFile() {
  const result = await window.agentHub.pickHermesConfigFile();
  statusOk.value = result.ok;
  statusMessage.value = result.message;
  if (result.filePath) importPath.value = result.filePath;
}

async function importConfig() {
  if (!importPath.value.trim()) return;
  const result = await window.agentHub.importHermesConfig(importPath.value.trim());
  statusOk.value = result.ok;
  statusMessage.value = result.message;
  if (result.config) hermesConfig.value = result.config;
  await refresh();
}

async function sendChat() {
  const text = chatInput.value.trim();
  if (!text || chatBusy.value) return;
  chatInput.value = "";
  const mode = activeChatMode.value;
  const session = chatSessions[mode];
  session.push({ role: "user", content: text });
  chatBusy.value = true;
  try {
    if (mode === "collab") {
      await sendCollaborativeChat(text);
      return;
    }
    const history = session.map((item) => ({ role: item.role, content: item.content }));
    const result = await window.agentHub.sendChat({ agent: mode, message: text, messages: history }) as ChatResponse;
    session.push({
      role: "assistant",
      speaker: chatModeLabel(mode),
      content: result.ok ? (result.reply || "") : `调用失败: ${result.error || "unknown error"}`
    });
  } finally {
    chatBusy.value = false;
  }
}

async function sendCollaborativeChat(text: string) {
  const session = chatSessions.collab;
  const openClawResult = await window.agentHub.sendChat({ agent: "openclaw", message: text, messages: [] }) as ChatResponse;
  const openClawReply = openClawResult.ok ? (openClawResult.reply || "") : `调用失败: ${openClawResult.error || "unknown error"}`;
  session.push({ role: "assistant", speaker: "OpenClaw 草案", content: openClawReply });

  const hermesPrompt = [
    "请作为 Hermes 对 OpenClaw 的草案进行复核、补充和整理。",
    `用户请求：${text}`,
    `OpenClaw 草案：${openClawReply}`
  ].join("\n\n");
  const hermesResult = await window.agentHub.sendChat({
    agent: "hermes",
    message: hermesPrompt,
    messages: [{ role: "system", content: "你负责复核 OpenClaw 的草案，指出风险、补充遗漏，并给出最终建议。" }]
  }) as ChatResponse;
  session.push({
    role: "assistant",
    speaker: "Hermes 复核",
    content: hermesResult.ok ? (hermesResult.reply || "") : `调用失败: ${hermesResult.error || "unknown error"}`
  });
}

onMounted(async () => {
  await Promise.all([refresh(), loadConfig(), loadOpenClawConfig()]);
  logs.value = await window.agentHub.readLogs();
  window.agentHub.onLog((line) => {
    logs.value.push(line);
    if (logs.value.length > 300) logs.value.shift();
  });
  window.agentHub.onOpenUrl((payload) => {
    embeddedUrl.value = payload.url;
    embeddedTitle.value = payload.target === "api" ? "Hermes Agent API" : payload.target === "config" ? "Hermes Config" : "Hermes Dashboard";
  });
  window.setInterval(refresh, 3000);
});
</script>

<template>
  <main class="shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">OC</div>
        <div>
          <strong>OpenClawPro</strong>
          <span>Agent Hub</span>
        </div>
      </div>
      <button class="nav-item" :class="{ active: activeAgent === 'openclaw' }" @click="activeAgent = 'openclaw'">
        <Bot :size="18" /> OpenClaw
      </button>
      <button class="nav-item" :class="{ active: activeAgent === 'hermes' }" @click="activeAgent = 'hermes'">
        <BrainCircuit :size="18" /> Hermes
      </button>
      <div class="sidebar-status">
        <span>Portable Root</span>
        <strong>{{ activeStatus?.portableRoot || "..." }}</strong>
      </div>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <div>
          <h1>{{ activeAgent === "hermes" ? "Hermes Agent" : "OpenClaw Agent" }}</h1>
          <p>{{ activeStatus?.runtimeRoot || "正在读取运行时..." }}</p>
        </div>
        <div class="actions">
          <button class="icon-button" title="刷新状态" @click="refresh"><RefreshCw :size="18" /></button>
          <button class="primary" :disabled="busy" @click="start(activeAgent)"><Play :size="17" />启动</button>
          <button class="secondary" :disabled="busy" @click="stop(activeAgent)"><Square :size="17" />停止</button>
        </div>
      </header>

      <section class="status-grid">
        <div class="status-card">
          <span>状态</span>
          <strong :class="activeStatus?.state">{{ activeStatus?.state || "loading" }}</strong>
        </div>
        <div class="status-card">
          <span>PID</span>
          <strong>{{ activeStatus?.pid || "--" }}</strong>
        </div>
        <div class="status-card">
          <span>数据目录</span>
          <strong>{{ activeStatus?.dataRoot || "--" }}</strong>
        </div>
        <div class="status-card">
          <span>就绪</span>
          <strong>{{ activeStatus?.ready ? "ready" : "not ready" }}</strong>
        </div>
      </section>

      <section v-if="activeAgent === 'openclaw'" class="config-board">
        <div class="panel">
          <div class="panel-title"><KeyRound :size="18" />模型与服务</div>
          <div v-if="openClawConfig" class="form-grid">
            <label>Provider<input v-model="openClawConfig.provider" /></label>
            <label>Model<input v-model="openClawConfig.model" /></label>
            <label>Base URL<input v-model="openClawConfig.baseUrl" /></label>
            <label>API Key<input v-model="openClawConfig.apiKey" type="password" /></label>
          </div>
          <div class="button-row">
            <button class="primary compact" @click="saveOpenClawConfig"><CheckCircle2 :size="16" />保存</button>
            <button class="secondary compact" @click="loadOpenClawConfig"><RefreshCw :size="16" />重载</button>
          </div>
          <div v-if="statusMessage" class="notice" :class="{ bad: !statusOk }">
            <strong>{{ statusOk ? "完成" : "需要处理" }}</strong>
            <span>{{ statusMessage }}</span>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title"><TerminalSquare :size="18" />Gateway 状态</div>
          <div class="diagnostics">
            <span v-for="item in statuses.openclaw?.diagnostics || []" :key="item">{{ item }}</span>
          </div>
          <div class="capabilities">
            <span v-for="(enabled, name) in statuses.openclaw?.capabilities" :key="name" :class="{ ok: enabled }">{{ name }}</span>
          </div>
        </div>
      </section>

      <section v-if="activeAgent === 'hermes'" class="config-board">
        <div class="panel">
          <div class="panel-title"><KeyRound :size="18" />模型与服务</div>
          <div v-if="hermesConfig" class="form-grid">
            <label>Provider<input v-model="hermesConfig.model.provider" /></label>
            <label>Model<input v-model="hermesConfig.model.model" /></label>
            <label>Base URL<input v-model="hermesConfig.model.baseUrl" /></label>
            <label>API Key<input v-model="hermesConfig.model.apiKey" type="password" /></label>
          </div>
          <div class="button-row">
            <button class="primary compact" @click="saveConfig"><CheckCircle2 :size="16" />保存</button>
            <button class="secondary compact" @click="exportConfig"><Download :size="16" />导出</button>
          </div>
          <div class="import-row">
            <input v-model="importPath" placeholder="粘贴要导入的 Hermes 配置 JSON 路径" />
            <button class="secondary compact" @click="pickImportFile"><Upload :size="16" />选择</button>
            <button class="secondary compact" @click="importConfig"><Upload :size="16" />导入</button>
          </div>
          <div class="button-row service-row">
            <button class="secondary" @click="openHermes('config')">配置中心</button>
            <button class="secondary" @click="openHermes('dashboard')">Dashboard</button>
            <button class="secondary" @click="openHermes('api')">Agent API</button>
          </div>
          <div v-if="statusMessage" class="notice" :class="{ bad: !statusOk }">
            <strong>{{ statusOk ? "完成" : "需要处理" }}</strong>
            <span>{{ statusMessage }}</span>
            <small v-if="lastTestResult?.path">报告: {{ lastTestResult.path }}</small>
            <small v-for="detail in lastTestResult?.details || []" :key="detail">{{ detail }}</small>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title"><Bot :size="18" />连接器</div>
          <div v-if="hermesConfig" class="connector-list">
            <div v-for="connector in hermesConfig.connectors" :key="connector.id" class="config-item">
              <div class="config-item-head">
                <label class="inline-toggle">
                  <input v-model="connector.enabled" type="checkbox" />
                  <span>{{ connector.label }}</span>
                </label>
                <button class="secondary compact" @click="testConnector(connector.id)">测试</button>
              </div>
              <div class="mini-grid">
                <label v-for="field in connectorFields[connector.id]" :key="field">
                  {{ field }}
                  <input v-model="connector.fields[field]" :type="/token|key|secret/i.test(field) ? 'password' : 'text'" />
                </label>
              </div>
              <small :class="connector.status">{{ connector.status }}</small>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title"><CalendarClock :size="18" />定时自动化</div>
          <div v-if="hermesConfig" class="toggle-row">
            <label class="inline-toggle">
              <input v-model="hermesConfig.memoryEnabled" type="checkbox" />
              <span>持久记忆</span>
            </label>
            <label class="inline-toggle">
              <input v-model="hermesConfig.autoSkillEnabled" type="checkbox" />
              <span>自动生成技能</span>
            </label>
          </div>
          <div class="schedule-editor">
            <input v-model="scheduleDraft.title" placeholder="任务名称" />
            <input v-model="scheduleDraft.naturalLanguage" placeholder="自然语言，例如：每天早上九点生成项目简报" />
            <input v-model="scheduleDraft.cron" placeholder="cron，可留空自动推断" />
            <button class="primary compact" @click="addSchedule">添加任务</button>
          </div>
          <div v-if="hermesConfig" class="schedule-list">
            <div v-for="schedule in hermesConfig.schedules" :key="schedule.id" class="config-item slim">
              <div>
                <strong>{{ schedule.title }}</strong>
                <small>{{ schedule.cron }} · {{ schedule.naturalLanguage }}</small>
              </div>
              <button class="secondary compact" @click="removeSchedule(schedule.id)">删除</button>
            </div>
            <div v-if="!hermesConfig.schedules.length" class="empty small">还没有自动化任务。</div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title"><TerminalSquare :size="18" />沙箱后端</div>
          <div v-if="hermesConfig" class="connector-list">
            <div v-for="sandbox in hermesConfig.sandboxes" :key="sandbox.id" class="config-item">
              <div class="config-item-head">
                <label class="inline-toggle">
                  <input v-model="sandbox.enabled" type="checkbox" />
                  <span>{{ sandbox.id }}</span>
                </label>
                <button class="secondary compact" @click="testSandbox(sandbox.id)">测试</button>
              </div>
              <div class="mini-grid">
                <label v-for="field in sandboxFields[sandbox.id]" :key="field">
                  {{ field }}
                  <input v-model="sandbox.fields[field]" :type="/token|key|secret/i.test(field) ? 'password' : 'text'" />
                </label>
              </div>
            </div>
          </div>
          <div class="capabilities">
            <span v-for="(enabled, name) in statuses.hermes?.capabilities" :key="name" :class="{ ok: enabled }">{{ name }}</span>
          </div>
        </div>
      </section>

      <section class="split">
        <div class="panel chat-panel">
          <div class="panel-title chat-title">
            <span>会话</span>
            <div class="mode-tabs" role="tablist" aria-label="会话模式">
              <button :class="{ active: activeChatMode === 'openclaw' }" @click="activeChatMode = 'openclaw'">OpenClaw</button>
              <button :class="{ active: activeChatMode === 'hermes' }" @click="activeChatMode = 'hermes'">Hermes</button>
              <button :class="{ active: activeChatMode === 'collab' }" @click="activeChatMode = 'collab'">协同</button>
            </div>
          </div>
          <div class="messages">
            <div v-for="(message, index) in chatMessages" :key="index" class="message" :class="message.role">
              <strong>{{ message.role === "user" ? "你" : (message.speaker || chatModeLabel(activeChatMode)) }}</strong>
              <p>{{ message.content }}</p>
            </div>
            <div v-if="!chatMessages.length" class="empty">选择一个会话模式，启动对应 Agent 后即可测试。</div>
          </div>
          <div class="chat-input">
            <textarea v-model="chatInput" placeholder="输入消息，Enter 发送" @keydown.enter.prevent="sendChat"></textarea>
            <button class="primary" :disabled="chatBusy" @click="sendChat"><Send :size="17" />{{ chatBusy ? "发送中" : "发送" }}</button>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">诊断</div>
          <div class="diagnostics">
            <span v-for="item in activeStatus?.diagnostics || []" :key="item">{{ item }}</span>
          </div>
          <div class="logs">
            <div v-for="line in logs.slice(-80)" :key="line.at + line.message" :class="line.level">
              [{{ line.agent }}:{{ line.level }}] {{ line.message }}
            </div>
          </div>
        </div>
      </section>

      <section v-if="embeddedUrl" class="embedded">
        <div class="embedded-head">
          <strong>{{ embeddedTitle }}</strong>
          <button class="secondary compact" @click="embeddedUrl = ''">关闭</button>
        </div>
        <iframe :src="embeddedUrl"></iframe>
      </section>
    </section>
  </main>
</template>
