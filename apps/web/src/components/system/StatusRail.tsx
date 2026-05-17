"use client"

import { useInteraction } from "@/core/state/interaction-store"

export function StatusRail() {
  const {
    latestCheckpoint,
    sessionRuntime,
  } = useInteraction()

  return (
    <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 bg-black/40 px-4 backdrop-blur">
      <div className="flex min-w-0 items-center gap-4">
        {/* Wordmark */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wide text-white">
            Foundry
          </span>

          <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-[2px] text-[9px] uppercase tracking-[0.15em] text-cyan-300">
            Runtime
          </span>
        </div>

        {/* Checkpoint */}
        <div className="hidden items-center gap-2 md:flex">
          <div className="h-1.5 w-1.5 rounded-full bg-zinc-700" />

          <span className="font-mono text-[11px] text-zinc-400">
            {latestCheckpoint}
          </span>
        </div>

        {/* AI runtime indicator */}
        <div className="hidden items-center gap-1.5 lg:flex">
          <div className="h-1.5 w-1.5 rounded-full bg-zinc-700" />

          <span className="text-[11px] text-zinc-600">
            OpenAI Runtime
          </span>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-4">
        {/* Current objective — ambient, truncated */}
        <div className="hidden max-w-[360px] truncate text-[11px] text-zinc-600 xl:block">
          {sessionRuntime.currentObjective}
        </div>

        {/* ⌘K hint */}
        <span className="font-mono text-[11px] text-zinc-600">
          ⌘K
        </span>
      </div>
    </div>
  )
}
