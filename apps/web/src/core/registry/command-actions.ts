import type { CommandDefinition } from "./command-types"

import { useInteraction } from "@/core/state/interaction-store"

export function useCommandActions() {
  const {
    appendEntry,
    closeCommandPalette,
  } = useInteraction()

  function executeCommand(command: CommandDefinition) {
    appendEntry({
      id: crypto.randomUUID(),

      type: "system",

      title: "Command Executed",

      content: `Executed: ${command.label}`,
    })

    closeCommandPalette()
  }

  return {
    executeCommand,
  }
}
