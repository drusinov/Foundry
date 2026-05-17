"use client"

import { useEffect } from "react"

import { useInteraction } from "@/core/state/interaction-store"

/**
 * Global keyboard handler for command palette lifecycle.
 *
 * Scope: ⌘K (toggle) and Escape (close) only.
 *
 * Arrow key navigation and Enter execution are handled
 * inside CommandPalette where the filtered list is known.
 * Keeping navigation here would index the wrong array.
 */
export function useCommandPaletteKeyboard() {
  const {
    commandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,
  } = useInteraction()

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      // ⌘K / Ctrl+K — toggle
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault()

        if (commandPaletteOpen) {
          closeCommandPalette()
        } else {
          openCommandPalette()
        }

        return
      }

      // Escape — close when open
      if (
        commandPaletteOpen &&
        event.key === "Escape"
      ) {
        event.preventDefault()
        closeCommandPalette()
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
    openCommandPalette,
    closeCommandPalette,
  ])
}
