"use client"

import { useInteraction } from "@/core/state/interaction-store"

export function ThreadSurface() {
  const { operationalEvents } =
    useInteraction()

  return (
    <div className="space-y-3">
      {operationalEvents.map(
        (event) => (
          <div
            key={event.id}
            className="rounded-xl border border-white/5 bg-black/20 p-4"
          >
            <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
              {event.type}
            </div>

            <div className="text-sm text-white">
              {event.content}
            </div>
          </div>
        ),
      )}
    </div>
  )
}
