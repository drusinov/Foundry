export function InspectorPanel() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 p-5">
        <div className="text-sm uppercase tracking-[0.2em] text-white/40">
          Context
        </div>

        <div className="mt-3 text-2xl font-semibold">
          Inspector
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-amber-300">
            Ephemeral
          </div>

          <p className="mt-2 text-sm text-white/70">
            Active divergence session in progress.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-white/40">
            Memory
          </div>

          <p className="mt-2 text-sm text-white/70">
            Streaming architecture decisions persisted.
          </p>
        </div>
      </div>
    </div>
  )
}
