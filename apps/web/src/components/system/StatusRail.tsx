"use client"

import { useInteraction } from "@/core/state/interaction-store"

export function StatusRail() {
  const { latestCheckpoint, operationalEvents } = useInteraction()

  const eventCount = operationalEvents.length

  return (
    <div
      className="menubar-glass flex h-[38px] shrink-0 items-center justify-between border-b px-4"
      style={{ borderColor: "var(--sep)" }}
    >
      {/* Left — App identity */}
      <div className="flex items-center gap-3">
        {/* App name */}
        <div className="flex items-center gap-1.5">
          <div
            className="h-2.5 w-2.5 rounded-full dot-live"
            style={{ background: "var(--green)" }}
          />
          <span
            className="text-[13px] font-semibold tracking-tight"
            style={{ color: "var(--label-1)" }}
          >
            Foundry
          </span>
        </div>

        {/* Separator */}
        <div className="h-3.5 w-px" style={{ background: "var(--sep)" }} />

        {/* Branch */}
        <span
          className="text-mono"
          style={{ color: "var(--label-3)", fontSize: "11px" }}
        >
          feat/interaction-kernel
        </span>

        {/* Separator */}
        <div className="hidden h-3.5 w-px md:block" style={{ background: "var(--sep)" }} />

        {/* Checkpoint */}
        <div className="hidden items-center gap-1.5 md:flex">
          <span style={{ color: "var(--label-4)", fontSize: "11px" }}>
            checkpoint
          </span>
          <span
            className="text-mono"
            style={{ color: "var(--label-2)", fontSize: "11px" }}
          >
            {latestCheckpoint}
          </span>
        </div>
      </div>

      {/* Right — Status + ⌘K */}
      <div className="flex items-center gap-3">
        {/* Event count */}
        <div className="hidden items-center gap-1.5 lg:flex">
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--label-4)" }}
          />
          <span style={{ color: "var(--label-3)", fontSize: "11px" }}>
            {eventCount} events
          </span>
        </div>

        {/* Status */}
        <div className="hidden items-center gap-1.5 md:flex">
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--green)" }}
          />
          <span style={{ color: "var(--label-2)", fontSize: "11px" }}>
            Operational
          </span>
        </div>

        {/* Separator */}
        <div className="h-3.5 w-px" style={{ background: "var(--sep)" }} />

        {/* ⌘K hint */}
        <span
          className="text-mono select-none"
          style={{ color: "var(--label-3)", fontSize: "11px" }}
        >
          ⌘K
        </span>
      </div>
    </div>
  )
}
