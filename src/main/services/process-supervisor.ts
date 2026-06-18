import { EventEmitter } from "node:events";
import { ChildProcess, spawn } from "node:child_process";
import { AgentId, AgentLogLine, RuntimeState } from "../../shared/types.js";

export interface SpawnSpec {
  command: string;
  args: string[];
  cwd: string;
  env: NodeJS.ProcessEnv;
}

export class ProcessSupervisor extends EventEmitter {
  private child: ChildProcess | null = null;
  private stopping = false;
  state: RuntimeState = "idle";
  startedAt: string | undefined;
  lastError = "";

  constructor(private readonly agent: AgentId) {
    super();
  }

  get pid(): number | null {
    return this.child?.pid ?? null;
  }

  start(spec: SpawnSpec): void {
    if (this.child) return;
    this.stopping = false;
    this.state = "starting";
    this.log("system", `starting: ${spec.command} ${spec.args.join(" ")}`);

    this.child = spawn(spec.command, spec.args, {
      cwd: spec.cwd,
      env: spec.env,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"]
    });

    this.state = "running";
    this.startedAt = new Date().toISOString();

    this.child.stdout?.on("data", (data) => this.log("stdout", Buffer.from(data).toString("utf8")));
    this.child.stderr?.on("data", (data) => this.log("stderr", Buffer.from(data).toString("utf8")));
    this.child.on("error", (error) => {
      this.lastError = error.message;
      this.state = "error";
      this.log("error", error.message);
    });
    this.child.on("exit", (code, signal) => {
      this.child = null;
      this.state = this.stopping || code === 0 ? "idle" : "error";
      if (this.state === "error") this.lastError = `exited code=${code ?? "null"} signal=${signal ?? ""}`;
      this.log("system", `exited code=${code ?? "null"} signal=${signal ?? ""}`);
    });
  }

  stop(): void {
    if (!this.child) {
      this.state = "idle";
      return;
    }
    this.stopping = true;
    this.state = "stopping";
    if (process.platform === "win32" && this.child.pid) {
      spawn("taskkill", ["/PID", String(this.child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
    } else {
      this.child.kill("SIGTERM");
    }
  }

  private log(level: AgentLogLine["level"], message: string): void {
    this.emit("log", {
      agent: this.agent,
      level,
      message: message.trimEnd(),
      at: new Date().toISOString()
    } satisfies AgentLogLine);
  }
}
