import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const projectRoot = path.resolve(import.meta.dirname, "..");
const metadataModule = path.join(
  projectRoot,
  "src",
  "openclaw-shell-app",
  "dist",
  "main",
  "skill-metadata.cjs"
);
const require = createRequire(import.meta.url);
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "uclaw-skill-metadata-"));

function write(relativePath, content) {
  const target = path.join(tempRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
  return target;
}

try {
  const literalFile = write(
    "literal/SKILL.md",
    '---\nname: "quoted-skill"\ndescription: |\n  line one\n  line two\n---\nBody ignored.\n'
  );
  const foldedFile = write(
    "folded/SKILL.md",
    "---\nname: folded-skill\ndescription: >\n  line one\n  line two\n---\n"
  );
  const bodyFile = write(
    "body.md",
    "# Body Skill\n\n<!-- ignored -->\n\nUseful body description.\n\nSecond paragraph.\n"
  );
  write(
    "bundle/a/b/c/d/e/SKILL.md",
    "---\nname: depth-six\ndescription: Nested package.\n---\n"
  );
  fs.mkdirSync(path.join(tempRoot, "invalid"), { recursive: true });
  write("invalid/README.md", "No skill manifest.\n");

  const api = require(metadataModule);
  assert.equal(api.parseSkillMeta(literalFile).name, "quoted-skill");
  assert.equal(api.parseSkillMeta(literalFile).description, "line one\nline two");
  assert.equal(api.parseSkillMeta(foldedFile).description, "line one line two");
  assert.equal(api.parseSkillMeta(bodyFile).description, "Useful body description.");

  const discovery = api.discoverSkillPackages(tempRoot, 6);
  assert.equal(discovery.packages.length, 4);
  assert.deepEqual(
    discovery.packages.map((item) => item.relativeName),
    ["body.md", "bundle/a/b/c/d/e", "folded", "literal"]
  );
  assert.deepEqual(
    discovery.invalidDirectories.map((item) => item.name),
    ["invalid"]
  );

  const sessions = {
    main: {
      sessionId: "keep-session",
      messages: [{ role: "user", content: "keep-history" }],
      skillsSnapshot: { prompt: "remove-only-this" }
    },
    untouched: { sessionId: "untouched" }
  };
  assert.equal(api.stripSessionSkillSnapshots(sessions), 1);
  assert.deepEqual(sessions.main, {
    sessionId: "keep-session",
    messages: [{ role: "user", content: "keep-history" }]
  });
  assert.deepEqual(sessions.untouched, { sessionId: "untouched" });

  console.log("Skill metadata checks passed");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
