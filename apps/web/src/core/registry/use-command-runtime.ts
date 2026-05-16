"use client"

import { useEffect } from "react"

import {
  executeCommand,
  registerCommandRuntime,
} from "./command-actions"

import { commandRegistry } from "./command-registry"

import { useInteractionStore } from "../state/interaction-store"

export function useCommandRuntime() {
  const { toggleCommandPalette } =
    useInteractionStore()

  useEffect(() => {
    registerCommandRuntime({
      toggleCommandPalette,
    })
  }, [toggleCommandPalette])

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      for (const command of commandRegistry) {
        const shortcut =
          command.shortcut.join("+")

        if (
          shortcut === "meta+k" &&
          event.metaKey &&
          event.key.toLowerCase() === "k"
        ) {
          event.preventDefault()

          executeCommand(command.id)
        }

        if (
          shortcut === "meta+enter" &&
          event.metaKey &&
          event.key === "Enter"
        ) {
          event.preventDefault()

          executeCommand(command.id)
        }
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
  }, [])
}
