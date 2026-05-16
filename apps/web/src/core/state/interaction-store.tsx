"use client"

import { createContext, useContext, useState } from "react"

type InteractionState = {
  commandPaletteOpen: boolean

  openCommandPalette: () => void
  closeCommandPalette: () => void
  toggleCommandPalette: () => void
}

const InteractionContext =
  createContext<InteractionState | null>(null)

export function InteractionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [
    commandPaletteOpen,
    setCommandPaletteOpen,
  ] = useState(false)

  function openCommandPalette() {
    setCommandPaletteOpen(true)
  }

  function closeCommandPalette() {
    setCommandPaletteOpen(false)
  }

  function toggleCommandPalette() {
    setCommandPaletteOpen((previous) => !previous)
  }

  return (
    <InteractionContext.Provider
      value={{
        commandPaletteOpen,

        openCommandPalette,
        closeCommandPalette,
        toggleCommandPalette,
      }}
    >
      {children}
    </InteractionContext.Provider>
  )
}

export function useInteractionStore() {
  const context = useContext(
    InteractionContext,
  )

  if (!context) {
    throw new Error(
      "useInteractionStore must be used within InteractionProvider",
    )
  }

  return context
}
