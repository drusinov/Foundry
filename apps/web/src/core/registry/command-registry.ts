import type { CommandDefinition } from "./command-types"

export const commandRegistry: CommandDefinition[] = [
  {
    id: "open-command-palette",
    label: "Open Command Palette",
    shortcut: ["⌘", "K"],
  },
  {
    id: "save-checkpoint",
    label: "Save Checkpoint",
    shortcut: ["⌘", "S"],
  },
  {
    id: "restore-checkpoint",
    label: "Restore Checkpoint",
    shortcut: ["⌘", "R"],
  },
  {
    id: "push-updates",
    label: "Push Updates",
    shortcut: ["⌘", "P"],
  },
  {
    id: "health-check",
    label: "Run Health Check",
    shortcut: ["⌘", "H"],
  },
  {
    id: "export-continuity",
    label: "Export Continuity",
    shortcut: [],
  },
  {
    id: "compact-runtime",
    label: "Compact Runtime",
    shortcut: [],
  },
  {
    id: "generate-handoff",
    label: "Generate Handoff",
    shortcut: [],
  },
  {
    id: "restart-runtime",
    label: "Restart Runtime",
    shortcut: [],
  },
]
