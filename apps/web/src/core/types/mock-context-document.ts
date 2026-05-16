import type { ContextDocument } from "./context-document"

export const mockContextDocument: ContextDocument =
  {
    project: {
      name: "Foundry",
      description:
        "Persistent AI-assisted development cockpit",
      stack: [
        "Next.js",
        "TypeScript",
        "PostgreSQL",
        "Docker",
      ],
    },

    architecture: {
      summary:
        "Runtime-first operational cockpit for AI-assisted software development continuity.",

      decisions: [
        "Thread is operational history",
        "Commands are deterministic actions",
        "UI is projection layer only",
      ],
    },

    operationalState: {
      currentBranch: "main",

      lastStableCheckpoint:
        "phase-2a-runtime-stable",

      deploymentStatus: "local-development",
    },

    activeTasks: [
      "Context document system",
      "Keyboard runtime",
      "Operational event model",
    ],

    recentEvents: [
      "Added deterministic keyboard navigation",
      "Stabilized semantic system entries",
    ],

    sessionSummary:
      "Foundry is evolving into a persistent AI-assisted development continuity runtime.",
  }
