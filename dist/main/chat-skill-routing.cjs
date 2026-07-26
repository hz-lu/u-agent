"use strict";

function normalizeIdentity(value) {
  return String(value || "")
    .trim()
    .replace(/^\/skill\s+/i, "")
    .replace(/^\//, "")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function normalizeSelectedSkills(skills) {
  const result = [];
  const seen = new Set();
  for (const entry of Array.isArray(skills) ? skills : []) {
    const name = String(entry?.name || entry?.skillName || "").trim();
    const command = String(entry?.command || "").trim();
    const identity = normalizeIdentity(name || command);
    if (!identity || seen.has(identity)) continue;
    seen.add(identity);
    result.push({
      id: String(entry?.id || entry?.packageId || identity),
      name: name || identity,
      command,
      description: String(entry?.description || ""),
      identity
    });
  }
  return result;
}

function createCatalogIndex(catalog) {
  const index = new Map();
  for (const entry of Array.isArray(catalog) ? catalog : []) {
    if (entry?.invocable === false) continue;
    const identities = [
      normalizeIdentity(entry?.name),
      normalizeIdentity(entry?.skillName),
      normalizeIdentity(entry?.command)
    ].filter(Boolean);
    for (const identity of identities) {
      if (!index.has(identity)) index.set(identity, entry);
    }
  }
  return index;
}

function resolveAvailability(selectedSkills, catalog) {
  const index = createCatalogIndex(catalog);
  const available = [];
  const missing = [];
  const resolved = [];
  for (const skill of selectedSkills) {
    const entry = index.get(skill.identity);
    if (entry) {
      available.push(skill.name);
      resolved.push({
        ...skill,
        command: String(entry.command || skill.command || ""),
        agentName: String(entry.name || entry.skillName || skill.name),
        source: String(entry.source || "official")
      });
    } else {
      missing.push(skill.name);
    }
  }
  return { complete: missing.length === 0, available, missing, resolved };
}

function routeCompleteSkillSet(mode, skills, catalogs = {}) {
  const selectedSkills = normalizeSelectedSkills(skills);
  if (!selectedSkills.length) {
    return {
      ok: false,
      error: "请至少选择一个技能。",
      selectedSkills,
      availability: {
        openclaw: { complete: false, available: [], missing: [] },
        hermes: { complete: false, available: [], missing: [] }
      }
    };
  }
  const availability = {
    openclaw: resolveAvailability(selectedSkills, catalogs.openclaw),
    hermes: resolveAvailability(selectedSkills, catalogs.hermes)
  };
  const gatewayReady = catalogs.gatewayReady === true;
  if (mode === "openclaw") {
    if (!gatewayReady) {
      return { ok: false, error: "OpenClaw Gateway 尚未就绪。", selectedSkills, availability };
    }
    if (!availability.openclaw.complete) {
      return {
        ok: false,
        error: `OpenClaw 无法调用：${availability.openclaw.missing.join("、")}`,
        selectedSkills,
        availability
      };
    }
    return {
      ok: true,
      executionAgent: "openclaw",
      selectedSkills: availability.openclaw.resolved,
      fallbackReason: "",
      availability
    };
  }
  if (mode === "hermes") {
    if (!availability.hermes.complete) {
      return {
        ok: false,
        error: `Hermes 无法调用：${availability.hermes.missing.join("、")}`,
        selectedSkills,
        availability
      };
    }
    return {
      ok: true,
      executionAgent: "hermes",
      selectedSkills: availability.hermes.resolved,
      fallbackReason: "",
      availability
    };
  }
  if (gatewayReady && availability.openclaw.complete) {
    return {
      ok: true,
      executionAgent: "openclaw",
      selectedSkills: availability.openclaw.resolved,
      fallbackReason: "",
      availability
    };
  }
  if (availability.hermes.complete) {
    const fallbackReason = gatewayReady
      ? `OpenClaw 缺少技能：${availability.openclaw.missing.join("、")}`
      : "OpenClaw Gateway 尚未就绪";
    return {
      ok: true,
      executionAgent: "hermes",
      selectedSkills: availability.hermes.resolved,
      fallbackReason,
      availability
    };
  }
  const openClawMissing = availability.openclaw.missing.join("、") || "Gateway 未就绪";
  const hermesMissing = availability.hermes.missing.join("、") || "无";
  return {
    ok: false,
    error: `没有一个 Agent 能完整调用所选技能。OpenClaw 缺少：${openClawMissing}；Hermes 缺少：${hermesMissing}。`,
    selectedSkills,
    availability
  };
}

function buildOpenClawSkillMessage(skills, instruction = "") {
  const selectedSkills = normalizeSelectedSkills(skills);
  const userInstruction = String(instruction || "").trim();
  if (!selectedSkills.length) return userInstruction;
  if (selectedSkills.length === 1) {
    const skill = selectedSkills[0];
    const command = `/skill ${skill.name}`;
    return [command, userInstruction].filter(Boolean).join(" ");
  }
  return [
    "Use all of the following skills together for this request:",
    ...selectedSkills.map((skill) => `- "${skill.name}"`),
    userInstruction ? `\nUser input:\n${userInstruction}` : ""
  ].filter(Boolean).join("\n");
}

function parseOpenClawSkillMessage(content) {
  const text = String(content || "").trim();
  const single = text.match(/^\/skill\s+(\S+)(?:\s+([\s\S]*))?$/i);
  if (single) {
    return {
      displayText: String(single[2] || "").trim(),
      skills: [{ name: single[1], command: `/skill ${single[1]}` }]
    };
  }
  const prefix = "Use all of the following skills together for this request:\n";
  if (!text.startsWith(prefix)) return null;
  const separator = "\n\nUser input:\n";
  const separatorIndex = text.indexOf(separator, prefix.length);
  const listText = separatorIndex >= 0
    ? text.slice(prefix.length, separatorIndex)
    : text.slice(prefix.length);
  const skills = listText.split(/\r?\n/).map((line) => {
    const match = line.match(/^-\s+["'](.+)["']$/);
    return match ? { name: match[1], command: `/skill ${match[1]}` } : null;
  }).filter(Boolean);
  if (!skills.length) return null;
  return {
    displayText: separatorIndex >= 0 ? text.slice(separatorIndex + separator.length).trim() : "",
    skills
  };
}

module.exports = {
  buildOpenClawSkillMessage,
  normalizeSelectedSkills,
  parseOpenClawSkillMessage,
  routeCompleteSkillSet
};
