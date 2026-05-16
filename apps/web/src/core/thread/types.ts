export type ThreadEntryType =
  | "brief"
  | "artifact"
  | "memory"
  | "system"
  | "convergence"
  | "run"

export interface BaseThreadEntry {
  id: string
  createdAt: string
  type: ThreadEntryType
}

export interface BriefEntry extends BaseThreadEntry {
  type: "brief"
  title: string
  prompt: string
}

export interface ArtifactEntry extends BaseThreadEntry {
  type: "artifact"
  title: string
  content: string
  status: "draft" | "approved" | "promoted"
}

export interface MemoryEntry extends BaseThreadEntry {
  type: "memory"
  content: string
  persistence: "ephemeral" | "persistent"
}

export interface SystemEntry extends BaseThreadEntry {
  type: "system"
  message: string
}

export interface ConvergenceEntry extends BaseThreadEntry {
  type: "convergence"
  summary: string
}

export interface RunEntry extends BaseThreadEntry {
  type: "run"
  agent: string
  status: "running" | "complete" | "failed"
}

export type AnyThreadEntry =
  | BriefEntry
  | ArtifactEntry
  | MemoryEntry
  | SystemEntry
  | ConvergenceEntry
  | RunEntry
