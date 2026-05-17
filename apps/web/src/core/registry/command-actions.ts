import type { CommandDefinition } from "./command-types"

import { useInteraction } from "@/core/state/interaction-store"

export function useCommandActions() {
  const {
    appendOperationalEvent,
    closeCommandPalette,
    latestCheckpoint,
    setLatestCheckpoint,
  } = useInteraction()

  function executeCommand(command: CommandDefinition) {
    // Palette is already open when this fires — close and return
    if (command.id === "open-command-palette") {
      closeCommandPalette()
      return
    }

    let content: string

    switch (command.id) {
      case "save-checkpoint": {
        const checkpoint = `checkpoint-${Date.now()}`
        setLatestCheckpoint(checkpoint)
        content = `CHECKPOINT SAVED · ${checkpoint}`
        break
      }

      case "restore-checkpoint": {
        content = `CHECKPOINT RESTORE REQUESTED · ${latestCheckpoint}`
        break
      }

      case "push-updates": {
        content =
          "GIT PUSH REQUESTED · human-controlled deployment"
        break
      }

      case "health-check": {
        content =
          "SYSTEM HEALTH CHECK · Foundry Core operational"
        break
      }

      case "export-continuity": {
        content = "CONTINUITY EXPORT REQUESTED"
        break
      }

      case "compact-runtime": {
        content = "RUNTIME COMPACT REQUESTED"
        break
      }

      case "generate-handoff": {
        content = "HANDOFF GENERATION REQUESTED"
        break
      }

      case "restart-runtime": {
        content =
          "RUNTIME RESTART REQUESTED · manual intervention required"
        break
      }

      default: {
        content = `COMMAND · ${command.label}`
      }
    }

    appendOperationalEvent({
      id: crypto.randomUUID(),
      type: "system_event",
      content,
      createdAt: new Date().toISOString(),
    })

    closeCommandPalette()
  }

  return { executeCommand }
}
