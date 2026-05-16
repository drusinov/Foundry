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

  const runtimeSummary =
    runtimeImpacts
      .map(
        (impact) =>
          `• ${impact.title}: ${impact.description}`,
      )
      .join("\n")

  const changedFiles =
    gitRuntime?.diffEntries
      ?.map(
        (entry) =>
          `${entry.changeType} ${entry.filePath}`,
      )
      .join("\n") ?? "No modified files."

  return `
FOUNDARY OPERATIONAL CONTINUITY

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