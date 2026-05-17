"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

import type {
  OperationalEvent,
} from "@/core/types/operational-event"

// Import canonical SessionRuntime from types — activeRisks is string[]
import type { SessionRuntime } from "@/core/types/session-runtime"

type InteractionContextValue = {
  commandPaletteOpen: boolean
  openCommandPalette: () => void
  closeCommandPalette: () => void
  latestCheckpoint: string
  setLatestCheckpoint: (checkpoint: string) => void
  operationalEvents: OperationalEvent[]
  appendOperationalEvent: (event: OperationalEvent) => void
  sessionRuntime: SessionRuntime
  setSessionRuntime: (runtime: SessionRuntime) => void
}

const InteractionContext =
  createContext<InteractionContextValue | undefined>(
    undefined,
  )

const INITIAL_EVENT: OperationalEvent = {
  id: "runtime-init",
  type: "system_event",
  content: "Foundry operational runtime initialized.",
  createdAt: new Date().toISOString(),
}

export function InteractionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [
    commandPaletteOpen,
    setCommandPaletteOpen,
  ] = useState(false)

  const [
    operationalEvents,
    setOperationalEvents,
  ] = useState<OperationalEvent[]>([INITIAL_EVENT])

  const [
    latestCheckpoint,
    setLatestCheckpoint,
  ] = useState("checkpoint-runtime-v1")

  // activeRisks is now string[] to match SessionRuntime type
  const [
    sessionRuntime,
    setSessionRuntime,
  ] = useState<SessionRuntime>({
    currentObjective:
      "Implement runtime cognition architecture",
    activeWorkstream:
      "Workspace Runtime Evolution",
    nextAction:
      "Define workspace isolation architecture",
    activeRisks: [
      "Core runtime instability during mutation",
    ],
  })

  const openCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true)
  }, [])

  const closeCommandPalette = useCallback(() => {
    setCommandPaletteOpen(false)
  }, [])

  const appendOperationalEvent = useCallback(
    (event: OperationalEvent) => {
      setOperationalEvents((current) => [
        ...current,
        event,
      ])
    },
    [],
  )

  const value = useMemo(
    () => ({
      commandPaletteOpen,
      openCommandPalette,
      closeCommandPalette,
      latestCheckpoint,
      setLatestCheckpoint,
      operationalEvents,
      appendOperationalEvent,
      sessionRuntime,
      setSessionRuntime,
    }),
    [
      commandPaletteOpen,
      openCommandPalette,
      closeCommandPalette,
      latestCheckpoint,
      operationalEvents,
      appendOperationalEvent,
      sessionRuntime,
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
