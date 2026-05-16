import type {
  CommandDefinition,
} from "./command-types"

export const commandRegistry: CommandDefinition[] = [
  {
    id: "open-command-palette",
    title: "Open Command Palette",
    shortcut: ["meta", "k"],
  },

  {
    id: "focus-orbit",
    title: "Focus Orbit",
    shortcut: ["g", "o"],
  },

  {
    id: "focus-thread",
    title: "Focus Thread",
    shortcut: ["g", "t"],
  },

  {
    id: "focus-inspector",
    title: "Focus Inspector",
    shortcut: ["g", "i"],
  },

  {
    id: "create-brief",
    title: "Create Brief",
    shortcut: ["c", "b"],
  },

  {
    id: "dispatch-run",
    title: "Dispatch Run",
    shortcut: ["meta", "enter"],
  },
]
