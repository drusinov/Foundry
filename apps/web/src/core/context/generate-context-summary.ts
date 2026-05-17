import type {
  AnyThreadEntry,
} from "@/core/thread/types"

type GenerateContextSummaryInput = {
  latestCheckpoint: string

  entries: AnyThreadEntry[]
}

function formatEntry(
  entry: AnyThreadEntry,
) {
  if (entry.type === "system") {
    return `- ${entry.message}`
  }

  if (entry.type === "brief") {
    return `- BRIEF · ${entry.title}`
  }

  if (entry.type === "artifact") {
    return `- ARTIFACT · ${entry.title}`
  }

  if (entry.type === "memory") {
    return `- MEMORY UPDATED`
  }

  if (entry.type === "run") {
    return `- RUN · ${entry.agent} · ${entry.status}`
  }

  if (entry.type === "convergence") {
    return `- CONVERGENCE GENERATED`
  }

  return ""
}

export function generateContextSummary({
  latestCheckpoint,
  entries,
}: GenerateContextSummaryInput) {
  const recentEvents = entries
    .slice(-8)
    .reverse()
    .map(formatEntry)

  return `
# FOUNDRY CONTEXT DOCUMENT

## PROJECT

Foundry

Persistent AI-assisted development cockpit.

---

## CURRENT RUNTIME STATE

- Runtime-first architecture
- Deterministic command execution
- Operational event thread active
- Context continuity generation active
- Local development runtime

---

## LATEST CHECKPOINT

${latestCheckpoint}

---

## RECENT OPERATIONAL EVENTS

${recentEvents.join("\n")}

---

## ACTIVE ARCHITECTURAL PRINCIPLES

- UI is projection layer only
- Runtime owns interaction state
- Commands are deterministic
- Thread represents operational history
- Context continuity is primary product primitive

---

## CURRENT PRODUCT DIRECTION

Foundry is evolving toward a persistent AI-assisted software development runtime with:

- operational continuity
- AI session restoration
- checkpoint workflows
- Git/VPS orchestration
- context persistence
- deterministic developer operations

---
  `.trim()
}