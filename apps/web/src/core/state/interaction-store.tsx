"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { mockThread } from "@/core/thread/mock-thread"
import type { ThreadEntry } from "@/core/thread/types"

type InteractionContextValue = {
  commandPaletteOpen: boolean

  entries: ThreadEntry[]

  openCommandPalette: () => void
  closeCommandPalette: () => void

  appendEntry: (entry: ThreadEntry) => void
}

const InteractionContext =
  createContext<InteractionContextValue | null>(null)

type Props = {
  children: ReactNode
}

export function InteractionProvider({ children }: Props) {
  const [commandPaletteOpen, setCommandPaletteOpen] =
    useState(false)

  const [entries, setEntries] =
    useState<ThreadEntry[]>(mockThread)

  const openCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true)
  }, [])

  const closeCommandPalette = useCallback(() => {
    setCommandPaletteOpen(false)
  }, [])

  const appendEntry = useCallback((entry: ThreadEntry) => {
    setEntries((current) => [...current, entry])
  }, [])

  const value = useMemo(
    () => ({
      commandPaletteOpen,

      entries,

      openCommandPalette,
      closeCommandPalette,

      appendEntry,
    }),
    [
      commandPaletteOpen,

      entries,

      openCommandPalette,
      closeCommandPalette,

      appendEntry,
    ],
  )

  return (
    <InteractionContext.Provider value={value}>
      {children}
    </InteractionContext.Provider>
  )
}

export function useInteraction() {
  const context = useContext(InteractionContext)

  if (!context) {
    throw new Error(
      "useInteraction must be used within InteractionProvider",
    )
  }

  return context
}
