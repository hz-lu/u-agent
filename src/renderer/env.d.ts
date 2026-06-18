import type { AgentHubApi } from "../preload/index";

declare global {
  interface Window {
    agentHub: AgentHubApi;
  }
}

export {};
