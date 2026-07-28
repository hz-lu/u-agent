import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { scanPythonSourcesForNullBytes } from "./verify-macos-hermes-runtime.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const mainPath = path.join(projectRoot, "src", "openclaw-shell-app", "dist", "main", "index.js");
const runtimeVerifierPath = path.join(projectRoot, "scripts", "verify-macos-hermes-runtime.mjs");
const runtimeBuilderPath = path.join(projectRoot, "scripts", "build-macos-runtime.mjs");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const main = fs.readFileSync(mainPath, "utf8");
const hermesClass = main.split("class HermesManager")[1]?.split("const APP_NAME")[0] || "";
assert(hermesClass.includes("this._startPromise = null"), "HermesManager must retain one in-flight start promise");
assert(hermesClass.includes("this._stopPromise = null"), "HermesManager must retain one in-flight stop promise");
assert(hermesClass.includes("this._lifecycleGeneration = 0"), "HermesManager must invalidate an interrupted start generation");
assert(hermesClass.includes("if (this._startPromise && this._startGeneration === this._lifecycleGeneration) return this._startPromise"), "concurrent Hermes starts must reuse the same generation promise");
assert(hermesClass.includes("async _startInternal(options, generation)"), "Hermes start implementation must be isolated behind the single-flight wrapper");
assert(hermesClass.includes("if (this.proc === configProc) this.proc = null"), "config process exit must not clear a newer child");
assert(hermesClass.includes('this.status = "starting"'), "Hermes child spawn must remain starting until ports are ready");
assert(hermesClass.includes("if (configReady && apiServerReady || dashboardReady) this.status = \"running\""), "Hermes must not report running when only the config server is ready");

const runtimeVerifier = fs.readFileSync(runtimeVerifierPath, "utf8");
for (const moduleName of ["typing_extensions", "pydantic", "fastapi", "uvicorn", "aiohttp"]) {
  assert(runtimeVerifier.includes(`"${moduleName}"`), `macOS Hermes verifier must import ${moduleName}`);
}
assert(runtimeVerifier.includes("importProbe"), "macOS Hermes verifier must execute an import probe");
assert(runtimeVerifier.includes('PYTHONDONTWRITEBYTECODE: "1"'), "macOS Hermes verifier must not create bytecode caches in the staged release");

const corruptPythonRoot = fs.mkdtempSync(path.join(os.tmpdir(), "uclaw-hermes-nul-"));
try {
  fs.writeFileSync(path.join(corruptPythonRoot, "healthy.py"), "print('ok')\n");
  fs.writeFileSync(path.join(corruptPythonRoot, "corrupt.py"), Buffer.from("print('bad')\0\n"));
  const scan = scanPythonSourcesForNullBytes(corruptPythonRoot);
  assert(scan.checkedFiles === 2, "Hermes verifier must scan every Python source file");
  assert(
    JSON.stringify(scan.corruptFiles.map((file) => path.basename(file))) === JSON.stringify(["corrupt.py"]),
    "Hermes verifier must report only the corrupt Python source"
  );
} finally {
  fs.rmSync(corruptPythonRoot, { recursive: true, force: true });
}

assert(main.includes('build("runtime_corrupt"'), "Hermes null-byte failures must be classified as runtime corruption");
assert(main.includes("source code string cannot contain null bytes"), "Hermes error classifier must recognize Python null-byte failures");

const runtimeBuilder = fs.readFileSync(runtimeBuilderPath, "utf8");
assert(runtimeBuilder.includes("verifyHermesImports"), "macOS runtime build must reject broken Hermes site-packages");

console.log("Hermes lifecycle single-flight and runtime import checks passed");
