import type {
  CommandDefinition,
} from "./command-types"

export const commandRegistry: CommandDefinition[] = [
  {
    id: "open-command-palette",
    label: "Open Command Palette",
    shortcut: ["meta", "k"],
  },

  {
    id: "focus-orbit",
    label: "Focus Orbit",
    shortcut: ["g", "o"],
  },

  {
    id: "focus-thread",
    label: "Focus Thread",
    shortcut: ["g", "t"],
  },

  {
    id: "focus-inspector",
    label: "Focus Inspector",
    shortcut: ["g", "i"],
  },

  {
    id: "create-brief",
    label: "Create Brief",
    shortcut: ["c", "b"],
  },

  {
    id: "dispatch-run",
    label: "Dispatch Run",
    shortcut: ["meta", "enter"],
  },
]
