"use client"

import { useInteraction } from "@/core/state/interaction-store"

export function ContextPanel() {
  const { sessionRuntime, latestCheckpoint, operationalEvents } = useInteraction()
  const last = operationalEvents[operationalEvents.length - 1]

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 space-y-2">

        <Block label="Runtime">
          <Row label="Status"      value="Operational"              accent="green" />
          <Row label="Environment" value="VPS · PM2"               accent="blue" />
          <Row label="Events"      value={String(operationalEvents.length)} />
          {last && <Row label="Last event" value={last.createdAt.slice(11,19)} mono />}
        </Block>

        <Block label="Session">
          <Field label="Objective"   value={sessionRuntime.currentObjective} />
          <Field label="Workstream"  value={sessionRuntime.activeWorkstream} />
          <Field label="Next action" value={sessionRuntime.nextAction} />
        </Block>

        <Block label="Checkpoint">
          <div
            className="rounded-lg p-2.5"
            style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.16)" }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <div className="pulse h-1.5 w-1.5 rounded-full" style={{ background: "var(--green)" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(74,222,128,0.6)" }}>Active</span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "rgba(74,222,128,0.9)" }}>
              {latestCheckpoint}
            </div>
          </div>
        </Block>

        <Block label="Active Risks">
          {sessionRuntime.activeRisks.map((r, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg px-2.5 py-2 mb-1" style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.13)" }}>
              <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--orange)" }} />
              <span style={{ fontSize: "12px", color: "rgba(251,146,60,0.85)", lineHeight: "1.45" }}>{r}</span>
            </div>
          ))}
        </Block>

      </div>
    </div>
  )
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border-subtle)" }}>
      <div className="px-3 py-2" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--border-subtle)" }}>
        <span style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)" }}>
          {label}
        </span>
      </div>
      <div className="p-2.5 space-y-0.5" style={{ background: "var(--bg-raised)" }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, value, accent, mono }: { label: string; value: string; accent?: "green"|"blue"|"orange"; mono?: boolean }) {
  const color = accent
    ? { green: "var(--green)", blue: "var(--cyan)", orange: "var(--orange)" }[accent]
    : "var(--text-2)"
  return (
    <div className="flex items-center justify-between py-0.5">
      <span style={{ fontSize: "11px", color: "var(--text-3)" }}>{label}</span>
      <span style={{ fontSize: "11px", color, fontFamily: mono ? "var(--font-mono)" : "var(--font-ui)" }}>{value}</span>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1">
      <div style={{ fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: "12px", color: "var(--text-2)", lineHeight: "1.45" }}>{value}</div>
    </div>
  )
}
