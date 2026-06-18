<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { Bot, BrainCircuit, CalendarClock, CheckCircle2, KeyRound, Play, RefreshCw, Square, TerminalSquare } from "lucide-vue-next";
import type { AgentId, AgentLogLine, AgentStatus, ChatResponse, HermesConfig } from "../shared/types";

const activeAgent = ref<AgentId>("hermes");
const statuses = reactive<Record<AgentId, AgentStatus | null>>({ openclaw: null, hermes: null });
const hermesConfig = ref<HermesConfig | null>(null);
const logs = ref<AgentLogLine[]>([]);
const embeddedUrl = ref("");
const embeddedTitle = ref("");
const chatInput = ref("");
const chatMessages = ref<Array<{ role: "user" | "assistant"; content: string }>>([]);
const busy = ref(false);

const activeStatus = computed(() => statuses[activeAgent.value]);
const hermesReady = computed(() => statuses.hermes?.ready || false);

async function refresh() {
  const next = await window.agentHub.listStatus();
  statuses.openclaw = next.openclaw;
  statuses.hermes = next.hermes;
}

async function loadConfig() {
  hermesConfig.value = await window.agentHub.readHermesConfig();
}

async function saveConfig() {
  if (!hermesConfig.value) return;
  hermesConfig.value = await window.agentHub.writeHermesConfig(hermesConfig.value);
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

async function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";
  chatMessages.value.push({ role: "user", content: text });
  const history = chatMessages.value.map((item) => ({ role: item.role, content: item.content }));
  const result = await window.agentHub.sendChat({ agent: activeAgent.value, message: text, messages: history }) as ChatResponse;
  chatMessages.value.push({ role: "assistant", content: result.ok ? (result.reply || "") : `调用失败: ${result.error || "unknown error"}` });
}

onMounted(async () => {
  await Promise.all([refresh(), loadConfig()]);
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
          <button class="icon-button" @click="refresh"><RefreshCw :size="18" /></button>
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

      <section v-if="activeAgent === 'hermes'" class="panel-grid">
        <div class="panel">
          <div class="panel-title"><KeyRound :size="18" />模型配置</div>
          <div v-if="hermesConfig" class="form-grid">
            <label>Provider<input v-model="hermesConfig.model.provider" /></label>
            <label>Model<input v-model="hermesConfig.model.model" /></label>
            <label>Base URL<input v-model="hermesConfig.model.baseUrl" /></label>
            <label>API Key<input v-model="hermesConfig.model.apiKey" type="password" /></label>
          </div>
          <button class="primary compact" @click="saveConfig"><CheckCircle2 :size="16" />保存配置</button>
        </div>

        <div class="panel">
          <div class="panel-title"><TerminalSquare :size="18" />Hermes 服务</div>
          <div class="button-row">
            <button class="secondary" @click="openHermes('config')">配置中心</button>
            <button class="secondary" @click="openHermes('dashboard')">Dashboard</button>
            <button class="secondary" @click="openHermes('api')">Agent API</button>
          </div>
          <div class="capabilities">
            <span v-for="(enabled, name) in statuses.hermes?.capabilities" :key="name" :class="{ ok: enabled }">{{ name }}</span>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title"><Bot :size="18" />连接器</div>
          <div v-if="hermesConfig" class="toggle-list">
            <label v-for="connector in hermesConfig.connectors" :key="connector.id">
              <input v-model="connector.enabled" type="checkbox" />
              <span>{{ connector.label }}</span>
              <small>{{ connector.status }}</small>
            </label>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title"><CalendarClock :size="18" />自动化与沙箱</div>
          <div v-if="hermesConfig" class="toggle-list">
            <label>
              <input v-model="hermesConfig.memoryEnabled" type="checkbox" />
              <span>持久记忆</span>
            </label>
            <label>
              <input v-model="hermesConfig.autoSkillEnabled" type="checkbox" />
              <span>自动生成技能</span>
            </label>
            <label v-for="sandbox in hermesConfig.sandboxes" :key="sandbox.id">
              <input v-model="sandbox.enabled" type="checkbox" />
              <span>{{ sandbox.id }}</span>
            </label>
          </div>
        </div>
      </section>

      <section class="split">
        <div class="panel chat-panel">
          <div class="panel-title">会话</div>
          <div class="messages">
            <div v-for="(message, index) in chatMessages" :key="index" class="message" :class="message.role">
              <strong>{{ message.role === "user" ? "你" : activeAgent }}</strong>
              <p>{{ message.content }}</p>
            </div>
            <div v-if="!chatMessages.length" class="empty">选择一个引擎，启动后即可在这里测试会话。</div>
          </div>
          <div class="chat-input">
            <textarea v-model="chatInput" placeholder="输入消息，Enter 发送" @keydown.enter.prevent="sendChat"></textarea>
            <button class="primary" @click="sendChat">发送</button>
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
