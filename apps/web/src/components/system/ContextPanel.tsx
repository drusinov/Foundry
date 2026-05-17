"use client"

import { useInteraction } from "@/core/state/interaction-store"

export function ContextPanel() {
  const { sessionRuntime, latestCheckpoint, operationalEvents } = useInteraction()

  const eventCount     = operationalEvents.length
  const lastEvent      = operationalEvents[operationalEvents.length - 1]

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-px p-3">

        {/* ── Runtime Status ── */}
        <Section label="Runtime">
          <PropRow label="Status"      value="Operational"      accent="green" />
          <PropRow label="Environment" value="VPS · PM2"        accent="blue" />
          <PropRow label="Events"      value={String(eventCount)} />
          {lastEvent && (
            <PropRow
              label="Last event"
              value={`${lastEvent.createdAt.slice(11, 19)} · ${lastEvent.type.replace(/_/g, " ")}`}
              mono
            />
          )}
        </Section>

        {/* ── Session ── */}
        <Section label="Session">
          <BlockField label="Objective"   value={sessionRuntime.currentObjective} />
          <BlockField label="Workstream"  value={sessionRuntime.activeWorkstream} />
          <BlockField label="Next Action" value={sessionRuntime.nextAction} />
        </Section>

        {/* ── Checkpoint ── */}
        <Section label="Checkpoint">
          <div
            className="rounded-lg p-2.5"
            style={{
              background: "rgba(48,209,88,0.07)",
              border: "1px solid rgba(48,209,88,0.16)",
            }}
          >
            <div
              className="mb-1 flex items-center gap-1.5"
            >
              <div
                className="h-1.5 w-1.5 rounded-full dot-live"
                style={{ background: "var(--green)" }}
              />
              <span style={{ fontSize: "10px", letterSpacing: "0.08em", color: "rgba(48,209,88,0.7)", textTransform: "uppercase" }}>
                Active
              </span>
            </div>
            <div
              className="text-mono"
              style={{ fontSize: "11px", color: "rgba(48,209,88,0.9)" }}
            >
              {latestCheckpoint}
            </div>
          </div>
        </Section>

        {/* ── Risks ── */}
        <Section label="Active Risks">
          {sessionRuntime.activeRisks.map((risk, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg px-2.5 py-2"
              style={{
                background: "rgba(255,159,10,0.06)",
                border: "1px solid rgba(255,159,10,0.14)",
                marginBottom: "2px",
              }}
            >
              <div
                className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: "var(--orange)" }}
              />
              <span style={{ fontSize: "12px", color: "rgba(255,159,10,0.85)", lineHeight: "1.4" }}>
                {risk}
              </span>
            </div>
          ))}
        </Section>

        {/* ── Notes ── */}
        <Section label="Notes">
          {[
            "Workspace isolation pending",
            "Checkpoint persistence not enabled",
            "Telemetry disabled for stabilization",
          ].map((note, i) => (
            <div
              key={i}
              className="flex items-center gap-2 py-0.5"
            >
              <div
                className="h-px w-3 shrink-0"
                style={{ background: "var(--label-4)" }}
              />
              <span style={{ fontSize: "11px", color: "var(--label-3)", lineHeight: "1.6" }}>
                {note}
              </span>
            </div>
          ))}
        </Section>

      </div>
    </div>
  )
}

/* ── Sub-components ── */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1 overflow-hidden rounded-xl" style={{ border: "1px solid var(--sep-subtle)" }}>
      {/* Section header */}
      <div
        className="px-3 py-2"
        style={{
          background: "rgba(255,255,255,0.025)",
          borderBottom: "1px solid var(--sep-subtle)",
        }}
      >
        <span className="text-label">{label}</span>
      </div>

      {/* Content */}
      <div className="space-y-0 p-2.5" style={{ background: "var(--bg-panel)" }}>
        {children}
      </div>
    </div>
  )
}

function PropRow({
  label,
  value,
  accent,
  mono,
}: {
  label: string
  value: string
  accent?: "green" | "blue" | "orange" | "red"
  mono?: boolean
}) {
  const accentColor = accent
    ? { green: "var(--green)", blue: "var(--cyan)", orange: "var(--orange)", red: "var(--red)" }[accent]
    : "var(--label-2)"

  return (
    <div className="flex items-center justify-between py-0.5">
      <span style={{ fontSize: "11px", color: "var(--label-3)" }}>
        {label}
      </span>
      <span
        style={{
          fontSize: "11px",
          color: accentColor,
          fontFamily: mono ? "var(--font-mono)" : "var(--font-ui)",
        }}
      >
        {value}
      </span>
    </div>
  )
}

function BlockField({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1">
      <div style={{ fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--label-4)", marginBottom: "2px" }}>
        {label}
      </div>
      <div style={{ fontSize: "12px", color: "var(--label-2)", lineHeight: "1.4" }}>
        {value}
      </div>
    </div>
  )
}
