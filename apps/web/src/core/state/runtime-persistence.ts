import type { OperationalMessage } from "@/core/types/operational-message"

import type { SessionRuntime } from "@/core/types/session-runtime"

// Note: CheckpointSnapshot was removed — interaction-store never exported it.
// Persistence is keyed on checkpoints as plain strings.
export type PersistedRuntimeState =
  {
    operationalMessages: OperationalMessage[]

    checkpointHistory: string[]

    activeCheckpointId: string | null

    latestCheckpoint: string

    sessionRuntime: SessionRuntime
  }

const STORAGE_KEY =
  "foundry-runtime-state"

export function loadRuntimeState(): PersistedRuntimeState | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null
  }

  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY,
      )

    if (!raw) {
      return null
    }

    return JSON.parse(raw)
  } catch (error) {
    console.error(error)

    return null
  }
}

export function persistRuntimeState(
  state: PersistedRuntimeState,
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state),
    )
  } catch (error) {
    console.error(error)
  }
}
