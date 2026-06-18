import { AgentLogLine, AgentStatus } from "../../shared/types.js";

export interface AgentRuntime {
  onLog(callback: (line: AgentLogLine) => void): void;
  getStatus(): Promise<AgentStatus>;
  start(): Promise<AgentStatus>;
  stop(): Promise<AgentStatus>;
  restart(): Promise<AgentStatus>;
}
