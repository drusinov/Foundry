import { mockThread } from "@/core/thread/mock-thread"
import { renderThreadEntry } from "@/core/thread/render-entry"

export function ThreadSurface() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-8 py-6">
        <div className="text-sm uppercase tracking-[0.2em] text-white/40">
          Project Thread
        </div>

        <h1 className="mt-3 text-5xl font-semibold tracking-tight">
          Foundry Core
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
          {mockThread.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-white/10 bg-[#11131A] p-6"
            >
              {renderThreadEntry(entry)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
