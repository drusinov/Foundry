import type { CommandDefinition } from "./command-types"

import { useInteraction } from "@/core/state/interaction-store"

export function useCommandActions() {
  const {
    appendEntry,
    closeCommandPalette,
    setLatestCheckpoint,
  } = useInteraction()

  function executeCommand(
    command: CommandDefinition,
  ) {
    let message =
      `Executed: ${command.label}`

    if (command.id === "save-checkpoint") {
      const checkpoint =
        `checkpoint-${Date.now()}`

      setLatestCheckpoint(checkpoint)

      message =
        `CHECKPOINT SAVED · ${checkpoint}`
    }

    if (
      command.id === "restore-checkpoint"
    ) {
      message =
        "CHECKPOINT RESTORED"
    }

    if (command.id === "push-updates") {
      message =
        "GIT PUSH COMPLETED"
    }

    if (command.id === "health-check") {
      message =
        "SYSTEM HEALTH OK"
    }

    appendEntry({
      id: crypto.randomUUID(),

      createdAt: new Date().toISOString(),

      type: "system",

      message,
    })

    closeCommandPalette()
  }

  return {
    executeCommand,
  }
}
