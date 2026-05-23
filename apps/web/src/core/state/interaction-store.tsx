"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import type { OperationalEvent } from "@/core/types/operational-event"
import type { SessionRuntime }   from "@/core/types/session-runtime"

const STORAGE_KEY    = "foundry-session-v1"
const MAX_PERSISTED  = 100

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
  createContext<InteractionContextValue | undefined>(undefined)

export function InteractionProvider({ children }: { children: React.ReactNode }) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [latestCheckpoint, setLatestCheckpoint]     = useState("checkpoint-runtime-v1")
  const [operationalEvents, setOperationalEvents]   = useState<OperationalEvent[]>([])
  const [sessionRuntime, setSessionRuntime]         = useState<SessionRuntime>({
    currentObjective: "Implement runtime cognition architecture",
    activeWorkstream: "Workspace Runtime Evolution",
    nextAction:       "Define workspace isolation architecture",
    activeRisks:      ["Core runtime instability during mutation"],
  })

  // ── Load persisted session on mount ────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if (Array.isArray(saved.events) && saved.events.length > 0) {
          setOperationalEvents(saved.events)
        } else {
          // First visit — add init event
          setOperationalEvents([{
            id: "runtime-init",
            type: "system_event",
            content: "Foundry operational runtime initialized.",
            createdAt: new Date().toISOString(),
          }])
        }
        if (saved.checkpoint) setLatestCheckpoint(saved.checkpoint)
        if (saved.sessionRuntime) setSessionRuntime(saved.sessionRuntime)
      } else {
        // No saved session — add init event
        setOperationalEvents([{
          id: "runtime-init",
          type: "system_event",
          content: "Foundry operational runtime initialized.",
          createdAt: new Date().toISOString(),
        }])
      }
    } catch {
      setOperationalEvents([{
        id: "runtime-init",
        type: "system_event",
        content: "Foundry operational runtime initialized.",
        createdAt: new Date().toISOString(),
      }])
    }
  }, [])

  // ── Persist session on every change ───────────────────────────────────────
  useEffect(() => {
    if (operationalEvents.length === 0) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        events:        operationalEvents.slice(-MAX_PERSISTED),
        checkpoint:    latestCheckpoint,
        sessionRuntime,
        savedAt:       new Date().toISOString(),
      }))
    } catch {
      // localStorage full or unavailable — fail silently
    }
  }, [operationalEvents, latestCheckpoint, sessionRuntime])

  const openCommandPalette  = useCallback(() => setCommandPaletteOpen(true),  [])
  const closeCommandPalette = useCallback(() => setCommandPaletteOpen(false), [])

  const appendOperationalEvent = useCallback((event: OperationalEvent) => {
    setOperationalEvents((prev) => [...prev, event])
  }, [])

  const value = useMemo(() => ({
    commandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,
    latestCheckpoint,
    setLatestCheckpoint,
    operationalEvents,
    appendOperationalEvent,
    sessionRuntime,
    setSessionRuntime,
  }), [
    commandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,
    latestCheckpoint,
    operationalEvents,
    appendOperationalEvent,
    sessionRuntime,
  ])

  return (
    <InteractionContext.Provider value={value}>
      {children}
    </InteractionContext.Provider>
  )
}

export function useInteraction() {
  const context = useContext(InteractionContext)
  if (!context) throw new Error("useInteraction must be used within InteractionProvider")
  return context
}
