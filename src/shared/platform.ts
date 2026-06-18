import os from "node:os";

export type RuntimePlatform =
  | "windows-x64"
  | "macos-arm64"
  | "macos-x64"
  | "linux-x64"
  | "linux-arm64";

export function detectRuntimePlatform(): RuntimePlatform {
  const platform = process.platform;
  const arch = os.arch();

  if (platform === "win32" && arch === "x64") return "windows-x64";
  if (platform === "darwin" && arch === "arm64") return "macos-arm64";
  if (platform === "darwin" && arch === "x64") return "macos-x64";
  if (platform === "linux" && arch === "x64") return "linux-x64";
  if (platform === "linux" && arch === "arm64") return "linux-arm64";

  throw new Error(`Unsupported platform: ${platform}-${arch}`);
}
