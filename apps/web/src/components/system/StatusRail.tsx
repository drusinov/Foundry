"use client"

import { useInteraction } from "@/core/state/interaction-store"

export function StatusRail() {
  const {
    latestCheckpoint,

    sessionRuntime,
  } = useInteraction()

  const connected =
    true

  return (
    <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 bg-black/40 px-4 backdrop-blur">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold tracking-wide text-white">
            Foundry
          </div>

          <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-[2px] text-[9px] uppercase tracking-[0.15em] text-cyan-300">
            Runtime
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <div className="h-1.5 w-1.5 rounded-full bg-zinc-600" />

          <div className="font-mono text-[11px] text-zinc-400">
            {
              latestCheckpoint
            }
          </div>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <div
            className={`h-2 w-2 rounded-full ${
              connected
                ? "bg-emerald-400"
                : "bg-zinc-500"
            }`}
          />

          <div className="text-[11px] text-zinc-400">
            OpenAI Runtime Connected
          </div>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-4">
        <div className="hidden max-w-[420px] truncate text-[11px] text-zinc-500 xl:block">
          {
            sessionRuntime
              .currentObjective
          }
        </div>

        <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-zinc-300 transition hover:bg-white/10">
          ⌘K
        </button>
      </div>
    </div>
  )
}