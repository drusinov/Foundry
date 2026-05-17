"use client"

export function ContextPanel() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
          Runtime Status
        </div>

        <div className="space-y-2 text-sm text-zinc-300">
          <div className="flex items-center justify-between">
            <span>Foundry Core</span>

            <span className="text-emerald-400">
              Operational
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span>Environment</span>

            <span className="text-cyan-300">
              VPS Runtime
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span>Process Manager</span>

            <span className="text-cyan-300">
              PM2
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
          Operational Notes
        </div>

        <div className="space-y-3 text-sm text-zinc-400">
          <div>
            Workspace isolation architecture pending.
          </div>

          <div>
            Runtime checkpointing not yet enabled.
          </div>

          <div>
            Telemetry runtime temporarily disabled for stabilization.
          </div>
        </div>
      </div>
    </div>
  )
}