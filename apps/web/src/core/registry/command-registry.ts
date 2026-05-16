import type {
  CommandDefinition,
} from "./command-types"

export const commandRegistry: CommandDefinition[] =
  [
    {
      id: "open-command-palette",
      label: "Open Command Palette",
      shortcut: ["meta", "k"],
    },

    {
      id: "save-checkpoint",
      label: "Save Checkpoint",
      shortcut: ["meta", "s"],
    },

    {
      id: "restore-checkpoint",
      label: "Restore Checkpoint",
      shortcut: ["meta", "r"],
    },

    {
      id: "push-updates",
      label: "Push Updates",
      shortcut: ["meta", "p"],
    },

    {
      id: "health-check",
      label: "Run Health Check",
      shortcut: ["meta", "h"],
    },
  ]
