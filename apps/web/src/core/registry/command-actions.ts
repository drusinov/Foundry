import type { CommandDefinition } from "./command-types"

import { generateContextSummary } from "@/core/context/generate-context-summary"

import { useInteraction } from "@/core/state/interaction-store"

export function useCommandActions() {
  const {
    appendEntry,
    closeCommandPalette,

    latestCheckpoint,

    entries,

    setLatestCheckpoint,

    setActiveCheckpointId,

    appendCheckpoint,
  } = useInteraction()

  function executeCommand(
    command: CommandDefinition,
  ) {
    let message =
      `COMMAND EXECUTED · ${command.label}`

    if (command.id === "save-checkpoint") {
      const checkpoint =
        `checkpoint-${Date.now()}`

      setLatestCheckpoint(checkpoint)

      setActiveCheckpointId(
        checkpoint,
      )

      const summary =
        generateContextSummary({
          latestCheckpoint:
            checkpoint,

          entries,
        })

      appendCheckpoint({
        id: checkpoint,

        createdAt:
          new Date().toISOString(),

        summary,
      })

      message =
        `CHECKPOINT SAVED · ${checkpoint}`
    }

    if (
      command.id === "restore-checkpoint"
    ) {
      message =
        `CHECKPOINT RESTORE REQUESTED`
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