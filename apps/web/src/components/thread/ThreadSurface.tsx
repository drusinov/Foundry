import { useInteraction } from "@/core/state/interaction-store"

import { renderEntry } from "@/core/thread/render-entry"

export function ThreadSurface() {
  const { entries } =
    useInteraction()

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="rounded-xl border border-white/5 bg-black/20 p-4"
        >
          {renderEntry(entry)}
        </div>
      ))}
    </div>
  )
}