"use client"

import { useInteraction } from "@/core/state/interaction-store"

export function ContextPanel() {
  const {
    sessionRuntime,
    latestCheckpoint,
    operationalEvents,
  } = useInteraction()

  const eventCount = operationalEvents.length

  const lastEvent =
    operationalEvents[operationalEvents.length - 1]

  return (
    <div className="space-y-3">
      {/* Runtime status */}
      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="mb-2.5 text-[10px] uppercase tracking-[0.18em] text-zinc-600">
          Runtime Status
        </div>

        <div className="space-y-2">
          <StatusRow
            label="Foundry Core"
            value="Operational"
            valueClass="text-emerald-400"
          />

          <StatusRow
            label="Environment"
            value="VPS · PM2"
            valueClass="text-cyan-300"
          />

          <StatusRow
            label="Events"
            value={String(eventCount)}
            valueClass="text-zinc-300"
          />
        </div>
      </div>

      {/* Session runtime */}
      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="mb-2.5 text-[10px] uppercase tracking-[0.18em] text-zinc-600">
          Session Runtime
        </div>

        <div className="space-y-3">
          <RuntimeField
            label="Objective"
            value={sessionRuntime.currentObjective}
            valueClass="text-zinc-200"
          />

          <RuntimeField
            label="Workstream"
            value={sessionRuntime.activeWorkstream}
            valueClass="text-zinc-300"
          />

          <RuntimeField
            label="Next Action"
            value={sessionRuntime.nextAction}
            valueClass="text-zinc-300"
          />

          {/* Fix: activeRisks is string[] — join for display */}
          <RuntimeField
            label="Active Risks"
            value={sessionRuntime.activeRisks.join(" · ")}
            valueClass="text-amber-300/80"
          />
        </div>
      </div>

      {/* Checkpoint */}
      <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-3">
        <div className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-cyan-600">
          Active Checkpoint
        </div>

        <div className="font-mono text-xs text-cyan-300">
          {latestCheckpoint}
        </div>

        {lastEvent && (
          <div className="mt-2 text-[10px] text-zinc-700">
            Last:{" "}
            {lastEvent.createdAt.slice(11, 19)}{" "}
            · {lastEvent.type.replace(/_/g, " ")}
          </div>
        )}
      </div>

      {/* Operational notes */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-zinc-700">
          Operational Notes
        </div>

        <div className="space-y-1.5 text-[11px] leading-relaxed text-zinc-700">
          <div>Workspace isolation pending</div>
          <div>Checkpoint persistence not enabled</div>
          <div>Telemetry disabled for stabilization</div>
        </div>
      </div>
    </div>
  )
}

function StatusRow({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-500">
        {label}
      </span>
      <span className={`text-xs ${valueClass}`}>
        {value}
      </span>
    </div>
  )
}

function RuntimeField({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass: string
}) {
  return (
    <div>
      <div className="text-[10px] uppercase text-zinc-700">
        {label}
      </div>
      <div
        className={`mt-0.5 text-xs leading-relaxed ${valueClass}`}
      >
        {value}
      </div>
    </div>
  )
}
