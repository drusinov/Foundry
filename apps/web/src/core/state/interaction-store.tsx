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

import type {
  AnyThreadEntry,
} from "@/core/thread/types"

export type CheckpointSnapshot = {
  id: string

  createdAt: string

  summary: string
}

type InteractionContextValue = {
  commandPaletteOpen: boolean

  selectedCommandIndex: number

  latestCheckpoint: string

  activeCheckpointId: string | null

  checkpointHistory: CheckpointSnapshot[]

  entries: AnyThreadEntry[]

  openCommandPalette: () => void
  closeCommandPalette: () => void

  setSelectedCommandIndex: (
    index: number,
  ) => void

  resetSelectedCommandIndex: () => void

  setLatestCheckpoint: (
    checkpoint: string,
  ) => void

  setActiveCheckpointId: (
    checkpointId: string,
  ) => void

  appendCheckpoint: (
    checkpoint: CheckpointSnapshot,
  ) => void

  appendEntry: (
    entry: AnyThreadEntry,
  ) => void
}

const InteractionContext =
  createContext<InteractionContextValue | null>(
    null,
  )

type Props = {
  children: ReactNode
}

export function InteractionProvider({
  children,
}: Props) {
  const [
    commandPaletteOpen,
    setCommandPaletteOpen,
  ] = useState(false)

  const [
    selectedCommandIndex,
    setSelectedCommandIndex,
  ] = useState(0)

  const [
    latestCheckpoint,
    setLatestCheckpoint,
  ] = useState(
    "phase-2a-runtime-stable",
  )

  const [
    activeCheckpointId,
    setActiveCheckpointId,
  ] = useState<string | null>(null)

  const [
    checkpointHistory,
    setCheckpointHistory,
  ] = useState<CheckpointSnapshot[]>(
    [],
  )

  const [entries, setEntries] =
    useState<AnyThreadEntry[]>(
      mockThread,
    )

  const openCommandPalette =
    useCallback(() => {
      setCommandPaletteOpen(true)
    }, [])

  const closeCommandPalette =
    useCallback(() => {
      setCommandPaletteOpen(false)
    }, [])

  const resetSelectedCommandIndex =
    useCallback(() => {
      setSelectedCommandIndex(0)
    }, [])

  const appendCheckpoint =
    useCallback(
      (
        checkpoint: CheckpointSnapshot,
      ) => {
        setCheckpointHistory(
          (current) => [
            checkpoint,
            ...current,
          ],
        )
      },
      [],
    )

  const appendEntry = useCallback(
    (entry: AnyThreadEntry) => {
      setEntries((current) => [
        ...current,
        entry,
      ])
    },
    [],
  )

  const value = useMemo(
    () => ({
      commandPaletteOpen,

      selectedCommandIndex,

      latestCheckpoint,

      activeCheckpointId,

      checkpointHistory,

      entries,

      openCommandPalette,
      closeCommandPalette,

      setSelectedCommandIndex,

      resetSelectedCommandIndex,

      setLatestCheckpoint,

      setActiveCheckpointId,

      appendCheckpoint,

      appendEntry,
    }),
    [
      commandPaletteOpen,

      selectedCommandIndex,

      latestCheckpoint,

      activeCheckpointId,

      checkpointHistory,

      entries,

      openCommandPalette,
      closeCommandPalette,

      setSelectedCommandIndex,

      resetSelectedCommandIndex,

      setLatestCheckpoint,

      setActiveCheckpointId,

      appendCheckpoint,

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
  const context =
    useContext(InteractionContext)

  if (!context) {
    throw new Error(
      "useInteraction must be used within InteractionProvider",
    )
  }

  return context
}
