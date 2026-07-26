"use strict";

const fs = require("node:fs");
const path = require("node:path");

const EXCLUDED_DIRECTORIES = new Set([
  ".git",
  ".github",
  ".hub",
  ".archive",
  "node_modules",
  "__pycache__",
  ".venv",
  "venv",
  "dist",
  "build",
  ".next",
  ".cache"
]);

function unquoteYamlScalar(value) {
  const text = String(value || "").trim();
  if (text.length < 2) return text;
  if (text.startsWith('"') && text.endsWith('"')) {
    try {
      return JSON.parse(text);
    } catch {
      return text.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, "\n");
    }
  }
  if (text.startsWith("'") && text.endsWith("'")) {
    return text.slice(1, -1).replace(/''/g, "'");
  }
  return text.replace(/\s+#.*$/, "").trim();
}

function normalizeBlockLines(lines) {
  const nonEmpty = lines.filter((line) => line.trim());
  const indent = nonEmpty.length
    ? Math.min(...nonEmpty.map((line) => line.match(/^\s*/)?.[0].length || 0))
    : 0;
  return lines.map((line) => line.slice(Math.min(indent, line.length)).replace(/\s+$/, ""));
}

function foldYamlBlock(lines) {
  const paragraphs = [];
  let current = [];
  for (const line of lines) {
    if (!line.trim()) {
      if (current.length) paragraphs.push(current.join(" ").trim());
      current = [];
    } else {
      current.push(line.trim());
    }
  }
  if (current.length) paragraphs.push(current.join(" ").trim());
  return paragraphs.join("\n");
}

function parseTopLevelFrontmatter(frontmatter) {
  const lines = frontmatter.split(/\r?\n/);
  const result = {};
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    const rawValue = match[2].trim();
    if (/^[|>][+-]?(?:\d+)?(?:\s+#.*)?$/.test(rawValue)) {
      const blockLines = [];
      while (index + 1 < lines.length) {
        const next = lines[index + 1];
        if (next && !/^\s/.test(next)) break;
        blockLines.push(next);
        index += 1;
      }
      const normalized = normalizeBlockLines(blockLines);
      result[key] = rawValue.startsWith(">")
        ? foldYamlBlock(normalized)
        : normalized.join("\n").trim();
      continue;
    }
    result[key] = unquoteYamlScalar(rawValue);
  }
  return result;
}

function extractBodyDescription(body) {
  const lines = String(body || "").split(/\r?\n/);
  let inFence = false;
  const paragraph = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (/^```|^~~~/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence || !line) {
      if (paragraph.length) break;
      continue;
    }
    if (/^(#|<!--|<img\b|!\[|\[!\[)/i.test(line)) continue;
    paragraph.push(line.replace(/^[-*+]\s+/, ""));
    if (paragraph.join(" ").length >= 320) break;
  }
  const text = paragraph.join(" ").replace(/\s+/g, " ").trim();
  return text.length > 500 ? `${text.slice(0, 497)}...` : text;
}

function parseSkillMeta(skillFilePath) {
  try {
    const content = fs.readFileSync(skillFilePath, "utf8").replace(/^\uFEFF/, "");
    const match = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\s*\r?\n|$)/);
    const frontmatter = match?.[1] || "";
    const body = match ? content.slice(match[0].length) : content;
    const raw = parseTopLevelFrontmatter(frontmatter);
    let emoji = raw.emoji || null;
    if (!emoji && raw.metadata) {
      try {
        const metadata = JSON.parse(raw.metadata);
        emoji = metadata.clawdbot?.emoji || metadata.openclaw?.emoji || metadata.hermes?.emoji || null;
      } catch {
      }
    }
    if (!emoji) {
      emoji = frontmatter.match(/(?:^|\n)\s*emoji:\s*["']?([^"'\r\n#]+)["']?/i)?.[1]?.trim() || null;
    }
    const description = String(raw.description || "").trim() || extractBodyDescription(body) || null;
    return {
      name: String(raw.name || "").trim() || null,
      description,
      emoji,
      raw
    };
  } catch {
    return null;
  }
}

function discoverSkillPackages(rootDir, maxDepth = 6) {
  if (!fs.existsSync(rootDir)) return { packages: [], invalidDirectories: [] };
  const rootEntries = fs.readdirSync(rootDir, { withFileTypes: true });
  const topLevelDirectories = rootEntries.filter(
    (entry) => entry.isDirectory() && !entry.name.startsWith(".")
  );
  const packages = [];
  const topLevelWithSkills = new Set();
  const queue = topLevelDirectories.map((entry) => ({
    directory: path.join(rootDir, entry.name),
    depth: 1,
    topLevel: entry.name
  }));

  while (queue.length) {
    const current = queue.shift();
    if (!current || current.depth > maxDepth) continue;
    const skillFile = path.join(current.directory, "SKILL.md");
    if (fs.existsSync(skillFile)) {
      const relativeName = path.relative(rootDir, current.directory).replace(/\\/g, "/");
      packages.push({
        entryPath: current.directory,
        skillFile,
        packageName: path.basename(current.directory),
        relativeName,
        meta: parseSkillMeta(skillFile)
      });
      topLevelWithSkills.add(current.topLevel);
      continue;
    }
    let entries = [];
    try {
      entries = fs.readdirSync(current.directory, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (
        !entry.isDirectory()
        || entry.name.startsWith(".")
        || EXCLUDED_DIRECTORIES.has(entry.name)
      ) {
        continue;
      }
      queue.push({
        directory: path.join(current.directory, entry.name),
        depth: current.depth + 1,
        topLevel: current.topLevel
      });
    }
  }

  for (const entry of rootEntries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".md") || entry.name.startsWith(".")) {
      continue;
    }
    const skillFile = path.join(rootDir, entry.name);
    packages.push({
      entryPath: skillFile,
      skillFile,
      packageName: entry.name.replace(/\.md$/i, ""),
      relativeName: entry.name,
      meta: parseSkillMeta(skillFile)
    });
  }

  const invalidDirectories = topLevelDirectories
    .filter((entry) => !topLevelWithSkills.has(entry.name))
    .map((entry) => ({
      name: entry.name,
      path: path.join(rootDir, entry.name),
      reason: "missing-skill-md"
    }));
  packages.sort((a, b) => a.relativeName.localeCompare(b.relativeName, "en"));
  return { packages, invalidDirectories };
}

function stripSessionSkillSnapshots(sessions) {
  let invalidated = 0;
  for (const entry of Object.values(sessions || {})) {
    if (!entry || typeof entry !== "object" || !entry.skillsSnapshot) continue;
    delete entry.skillsSnapshot;
    invalidated += 1;
  }
  return invalidated;
}

module.exports = { discoverSkillPackages, parseSkillMeta, stripSessionSkillSnapshots };

if (require.main === module) {
  const rootDir = path.resolve(process.argv[2] || process.cwd());
  const discovery = discoverSkillPackages(rootDir);
  const packages = discovery.packages.map((item) => ({
    entryPath: item.entryPath,
    skillFile: item.skillFile,
    packageName: item.packageName,
    relativeName: item.relativeName,
    name: item.meta?.name || null,
    description: item.meta?.description || null,
    emoji: item.meta?.emoji || null
  }));
  process.stdout.write(`${JSON.stringify({
    ok: true,
    packages,
    invalidDirectories: discovery.invalidDirectories
  })}\n`);
}
