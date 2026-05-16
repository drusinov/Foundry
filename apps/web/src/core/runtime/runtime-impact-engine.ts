import type { GitDiffEntry } from "@/core/types/git-diff"

export type RuntimeImpact = {
  title: string

  impacts: string[]
}

function resolveImpacts(
  file: string,
) {
  const impacts: string[] = []

  if (
    file.includes("core/state")
  ) {
    impacts.push(
      "Runtime state ownership",
    )

    impacts.push(
      "Interaction lifecycle",
    )

    impacts.push(
      "Continuity runtime",
    )
  }

  if (
    file.includes("core/registry")
  ) {
    impacts.push(
      "Command orchestration",
    )

    impacts.push(
      "Execution runtime",
    )
  }

  if (
    file.includes("components/system")
  ) {
    impacts.push(
      "Operational cockpit UI",
    )

    impacts.push(
      "Runtime observability",
    )
  }

  if (
    file.includes("hooks")
  ) {
    impacts.push(
      "Runtime integration layer",
    )

    impacts.push(
      "Client runtime synchronization",
    )
  }

  if (
    file.includes("app/api")
  ) {
    impacts.push(
      "Local runtime adapters",
    )

    impacts.push(
      "Operational infrastructure",
    )
  }

  if (
    impacts.length === 0
  ) {
    impacts.push(
      "General runtime evolution",
    )
  }

  return impacts
}

export function generateRuntimeImpacts(
  entries: GitDiffEntry[],
): RuntimeImpact[] {
  return entries.map((entry) => ({
    title: entry.file,

    impacts: resolveImpacts(
      entry.file,
    ),
  }))
}