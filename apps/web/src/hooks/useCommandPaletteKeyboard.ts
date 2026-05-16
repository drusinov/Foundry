"use client"

import { useEffect } from "react"

import { commandRegistry } from "@/core/registry/command-registry"

import { useCommandActions } from "@/core/registry/command-actions"

import { useInteraction } from "@/core/state/interaction-store"

export function useCommandPaletteKeyboard() {
  const {
    commandPaletteOpen,

    selectedCommandIndex,

    openCommandPalette,
    closeCommandPalette,

    setSelectedCommandIndex,
  } = useInteraction()

  const { executeCommand } =
    useCommandActions()

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.metaKey &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault()

        openCommandPalette()

        return
      }

      if (!commandPaletteOpen) {
        return
      }

      if (event.key === "Escape") {
        event.preventDefault()

        closeCommandPalette()

        return
      }

      if (event.key === "ArrowDown") {
        event.preventDefault()

        setSelectedCommandIndex(
          Math.min(
            selectedCommandIndex + 1,
            commandRegistry.length - 1,
          ),
        )

        return
      }

      if (event.key === "ArrowUp") {
        event.preventDefault()

        setSelectedCommandIndex(
          Math.max(
            selectedCommandIndex - 1,
            0,
          ),
        )

        return
      }

      if (event.key === "Enter") {
        event.preventDefault()

        const command =
          commandRegistry[
            selectedCommandIndex
          ]

        if (!command) {
          return
        }

        executeCommand(command)
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      )
    }
  }, [
    commandPaletteOpen,

    selectedCommandIndex,

    openCommandPalette,
    closeCommandPalette,

    setSelectedCommandIndex,

    executeCommand,
  ])
}
