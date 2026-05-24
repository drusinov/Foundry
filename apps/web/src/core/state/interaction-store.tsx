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

type SessionRuntime = {
  currentObjective: string
  activeWorkstream: string
  nextAction: string
  activeRisks: string
  runtimeState: string
}

type InteractionContextValue = {
  commandPaletteOpen: boolean
  openCommandPalette: () => void
  closeCommandPalette: () => void
  latestCheckpoint: string
  setLatestCheckpoint: (checkpoint: string) => void
  operationalEvents: OperationalEvent[]
  appendOperationalEvent: (event: OperationalEvent) => void
  clearOperationalEvents:  () => void
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

  const clearOperationalEvents = () => setOperationalEvents([INITIAL_EVENT])

  const [
    latestCheckpoint,
    setLatestCheckpoint,
  ] = useState("checkpoint-runtime-v1")

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
    activeRisks:
      "Core runtime instability during mutation",
    runtimeState: "Operational",
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
      clearOperationalEvents,
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
      clearOperationalEvents,
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
