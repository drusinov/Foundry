import type { GitRuntime } from "@/core/types/git-runtime"

import type { RuntimeImpact } from "@/core/runtime/runtime-impact-engine"

type LegacyOperationalMessage =
  {
    id: string

    role: "user" | "system"

    content: string

    createdAt: string
  }

type GenerateCompressedContextInput =
  {
    gitRuntime: GitRuntime | null

    runtimeImpacts: RuntimeImpact[]

    latestCheckpoint: string

    operationalMessages: LegacyOperationalMessage[]
  }

export function generateCompressedContext({
  gitRuntime,

  runtimeImpacts,

  latestCheckpoint,

  operationalMessages,
}: GenerateCompressedContextInput) {
  const recentMessages =
    operationalMessages
      .slice(-8)
      .map(
        (message) =>
          `${message.role.toUpperCase()}: ${message.content}`,
      )
      .join("\n\n")

  // Fix: impact has `impacts: string[]`, not `description`
  const runtimeSummary =
    runtimeImpacts
      .map(
        (impact) =>
          `• ${impact.title}: ${impact.impacts.join(", ")}`,
      )
      .join("\n")

  // Fix: GitDiffEntry has `status` and `file`, not `changeType`/`filePath`
  const changedFiles =
    gitRuntime?.diffEntries
      ?.map(
        (entry) =>
          `${entry.status} ${entry.file}`,
      )
      .join("\n") ?? "No modified files."

  return `
FOUNDRY OPERATIONAL CONTINUITY

CHECKPOINT:
${latestCheckpoint}

RUNTIME IMPACT SUMMARY:
${runtimeSummary || "No runtime impacts detected."}

MODIFIED FILES:
${changedFiles}

RECENT OPERATIONAL EVENTS:
${recentMessages}
`.trim()
}
