"use client"

import { renderThreadEntry } from "@/core/thread/render-entry"

import { useInteraction } from "@/core/state/interaction-store"

export function ThreadSurface() {
  const { entries } = useInteraction()

  return (
    <div className="flex h-full flex-col gap-4">
      {entries.map((entry) => (
        <div key={entry.id}>
          {renderThreadEntry(entry)}
        </div>
      ))}
    </div>
  )
}
