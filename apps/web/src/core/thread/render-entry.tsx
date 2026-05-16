import { ArtifactEntryCard } from "@/components/thread/entries/ArtifactEntryCard"
import { BriefEntryCard } from "@/components/thread/entries/BriefEntryCard"
import { ConvergenceEntryCard } from "@/components/thread/entries/ConvergenceEntryCard"
import { MemoryEntryCard } from "@/components/thread/entries/MemoryEntryCard"
import { RunEntryCard } from "@/components/thread/entries/RunEntryCard"
import { SystemEntryCard } from "@/components/thread/entries/SystemEntryCard"

import type { AnyThreadEntry } from "./types"

export function renderThreadEntry(
  entry: AnyThreadEntry,
) {
  switch (entry.type) {
    case "brief":
      return (
        <BriefEntryCard
          title={entry.title}
          prompt={entry.prompt}
        />
      )

    case "artifact":
      return (
        <ArtifactEntryCard
          title={entry.title}
          content={entry.content}
          status={entry.status}
        />
      )

    case "memory":
      return (
        <MemoryEntryCard
          content={entry.content}
          persistence={entry.persistence}
        />
      )

    case "run":
      return (
        <RunEntryCard
          agent={entry.agent}
          status={entry.status}
        />
      )

    case "system":
      return (
        <SystemEntryCard
          message={entry.message}
        />
      )

    case "convergence":
      return (
        <ConvergenceEntryCard
          summary={entry.summary}
        />
      )

    default:
      return null
  }
}
