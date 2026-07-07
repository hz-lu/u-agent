import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function cssBlock(css, selector) {
  const index = css.indexOf(selector);
  assert(index >= 0, `Missing CSS selector: ${selector}`);
  const start = css.indexOf("{", index);
  const end = css.indexOf("}", start);
  assert(start >= 0 && end > start, `Malformed CSS block: ${selector}`);
  return css.slice(start + 1, end);
}

for (const cssPath of [
  "src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css",
  "dist/assets/main-CAx6YYDG.css"
]) {
  const css = read(cssPath);
  const aiChat = cssBlock(css, ".ai-chat-view[data-v-f16be7f3]");
  assert(!/width:\s*944px\s*;/.test(aiChat), `${cssPath}: AI chat view must not use fixed 944px width`);
  assert(/width:\s*100%\s*;/.test(aiChat), `${cssPath}: AI chat view should fill available width`);
  assert(/min-width:\s*0\s*;/.test(aiChat), `${cssPath}: AI chat view should allow flex shrink`);
  assert(!/::-webkit-scrollbar-track\s*\{\s*background:\s*transparent\s*;?\s*\}/.test(css), `${cssPath}: scrollbar track must not expose transparent window edge`);
  assert(!/::-webkit-scrollbar-corner\s*\{\s*background:\s*transparent\s*;?\s*\}/.test(css), `${cssPath}: scrollbar corner must not expose transparent window edge`);
  assert(!/scrollbar-color:\s*rgba\(128,\s*134,\s*139,\s*0\.4\)\s+transparent\s*;/.test(css), `${cssPath}: Firefox scrollbar track must not be transparent`);
}

for (const mainPath of [
  "src/openclaw-shell-app/dist/main/index.js",
  "dist/main/index.js",
  "dist/main/index.cjs"
]) {
  const source = read(mainPath);
  assert(!source.includes('chatCommand.args.join(" ")'), `${mainPath}: Hermes UI log must not print raw command args`);
  assert(source.includes("--oneshot [message redacted]"), `${mainPath}: Hermes UI log should redact oneshot message`);
  assert(source.includes("messageLength=") && (source.includes("String(message).length") || source.includes("String(effectiveMessage).length")), `${mainPath}: Hermes UI log should keep safe message length metadata`);
}

const restoreScript = read("scripts/restore-openclaw-shell.mjs");
assert(!restoreScript.includes('chatCommand.args.join(" ")'), "scripts/restore-openclaw-shell.mjs: restore script must not reintroduce raw Hermes args logging");
assert(restoreScript.includes("--oneshot [message redacted]"), "scripts/restore-openclaw-shell.mjs: restore script should preserve redacted Hermes logging");

console.log("macOS UI/Hermes regression checks passed");
