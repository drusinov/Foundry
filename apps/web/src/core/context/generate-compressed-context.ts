import type { GitRuntimeState } from "@/core/types/git-runtime"

import type { RuntimeImpact } from "@/core/runtime/runtime-impact-engine"

import type { OperationalMessage } from "@/core/types/operational-message"

type GenerateCompressedContextInput =
  {
    gitRuntime:
      | GitRuntimeState
      | null

    runtimeImpacts:
      RuntimeImpact[]

    latestCheckpoint: string

    operationalMessages: OperationalMessage[]
  }

export function generateCompressedContext({
  gitRuntime,

  runtimeImpacts,

  latestCheckpoint,

  operationalMessages,
}: GenerateCompressedContextInput) {
  const recentMessages =
    operationalMessages
      .slice(-5)
      .map(
        (message) =>
          `- ${message.role.toUpperCase()}: ${message.content}`,
      )

  const uniqueImpacts =
    Array.from(
      new Set(
        runtimeImpacts.flatMap(
          (impact) =>
            impact.impacts,
        ),
      ),
    )

  return `
# FOUNDRY OPERATIONAL CONTINUITY

## CURRENT RUNTIME

- Active checkpoint: ${latestCheckpoint}
- Git branch: ${
    gitRuntime?.branch ??
    "unknown"
  }
- Latest commit: ${
    gitRuntime?.latestCommit ??
    "unknown"
  }
- Working tree: ${
    gitRuntime
      ?.workingTreeClean
      ? "clean"
      : "modified"
  }

---

## ACTIVE RUNTIME IMPACTS

${uniqueImpacts
  .map(
    (impact) =>
      `- ${impact}`,
  )
  .join("\n")}

---

## RECENT OPERATIONAL INTERACTION

${recentMessages.join("\n")}

---

## RECENT MODIFIED FILES

${
  gitRuntime?.diffEntries
    .map(
      (entry) =>
        `- ${entry.file}`,
    )
    .join("\n") ??
  "No modified files"
}

---

## CURRENT PRODUCT STATE

Foundry currently supports:

- deterministic interaction runtime
- operational continuity checkpoints
- git runtime awareness
- filesystem runtime awareness
- runtime impact interpretation
- embedded operational interaction

---

## KNOWN LIMITATIONS

- no persistence layer
- no AI orchestration runtime
- no autonomous file mutation
- no VPS runtime integration
- operational chat not persisted yet

---
  `.trim()
}