"use client"

import { createRuntimeId } from "@/core/utils/create-runtime-id"

import {
  createContext,
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

type InteractionContextValue =
  {
    commandPaletteOpen: boolean

    openCommandPalette: () => void

    closeCommandPalette: () => void

    latestCheckpoint: string

    operationalEvents: OperationalEvent[]

    appendOperationalEvent: (
      event: OperationalEvent,
    ) => void

    sessionRuntime: SessionRuntime

    setSessionRuntime: (
      runtime: SessionRuntime,
    ) => void
  }

const InteractionContext =
  createContext<
    InteractionContextValue | undefined
  >(undefined)

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
  ] = useState<
    OperationalEvent[]
  >([
    {
      id: createRuntimeId(),

      type: "system_event",

      content:
        "Foundry operational runtime initialized.",

      createdAt:
        new Date().toISOString(),
    },
  ])

  const [
    latestCheckpoint,
  ] = useState(
    "checkpoint-runtime-v1",
  )

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

    runtimeState:
      "Operational",
  })

  function openCommandPalette() {
    setCommandPaletteOpen(true)
  }

  function closeCommandPalette() {
    setCommandPaletteOpen(false)
  }

  function appendOperationalEvent(
    event: OperationalEvent,
  ) {
    setOperationalEvents(
      (current) => [
        ...current,
        event,
      ],
    )
  }

  const value = useMemo(
    () => ({
      commandPaletteOpen,

      openCommandPalette,

      closeCommandPalette,

      latestCheckpoint,

      operationalEvents,

      appendOperationalEvent,

      sessionRuntime,

      setSessionRuntime,
    }),
    [
      commandPaletteOpen,

      latestCheckpoint,

      operationalEvents,

      sessionRuntime,
    ],
  )

  return (
    <InteractionContext.Provider
      value={value}
    >
      {children}
    </InteractionContext.Provider>
  )
}

export function useInteraction() {
  const context =
    useContext(
      InteractionContext,
    )

  if (!context) {
    throw new Error(
      "useInteraction must be used within InteractionProvider",
    )
  }

  return context
}