"use client"

import { useInteraction } from "@/core/state/interaction-store"

export function StatusRail() {
  const { operationalEvents } = useInteraction()

  return (
    <div
      className="flex h-9 shrink-0 items-center justify-between px-4"
      style={{
        background: "rgba(10,10,14,0.9)",
        borderBottom: "1px solid var(--border-subtle)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <div
          className="text-[13px] font-semibold tracking-tight"
          style={{ color: "var(--text-1)" }}
        >
          Foundry
        </div>

        <div
          className="h-3.5 w-px"
          style={{ background: "var(--border)" }}
        />

        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-3)",
          }}
        >
          <span className="hidden sm:inline">feat/interaction-kernel</span>
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div
            className="pulse h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--green)" }}
          />
          <span style={{ fontSize: "11px", color: "var(--text-3)" }}>
            <span className="sm:hidden">● {operationalEvents.length}</span><span className="hidden sm:inline">Operational · {operationalEvents.length} events</span>
          </span>
        </div>

        <div
          className="h-3.5 w-px"
          style={{ background: "var(--border)" }}
        />

        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-3)",
          }}
        >
          ⌘K
        </span>
      </div>
    </div>
  )
}
