import type { AnyThreadEntry } from "./types"

export const mockThread: AnyThreadEntry[] = [
  {
    id: "brief-1",
    createdAt: new Date().toISOString(),
    type: "brief",
    title: "Design orchestration engine",
    prompt:
      "We need a multi-agent orchestration layer with streaming execution.",
  },

  {
    id: "artifact-1",
    createdAt: new Date().toISOString(),
    type: "artifact",
    title: "Streaming architecture proposal",
    content:
      "Direct DOM mutation boundary introduced for high-frequency token streaming.",
    status: "approved",
  },

  {
    id: "memory-1",
    createdAt: new Date().toISOString(),
    type: "memory",
    content: "Thread execution model persisted.",
    persistence: "persistent",
  },

  {
    id: "run-1",
    createdAt: new Date().toISOString(),
    type: "run",
    agent: "Architect",
    status: "running",
  },
]
