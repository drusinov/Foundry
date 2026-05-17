"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { CommandPalette } from "@/components/command/CommandPalette"
import { OperationalChat } from "@/components/system/OperationalChat"
import { ContextPanel } from "@/components/system/ContextPanel"
import { StatusRail } from "@/components/system/StatusRail"
import { useCommandRuntime } from "@/core/registry/use-command-runtime"
import { InteractionProvider, useInteraction } from "@/core/state/interaction-store"
import { useCommandPaletteKeyboard } from "@/hooks/useCommandPaletteKeyboard"
import { useCommandActions } from "@/core/registry/command-actions"
import { commandRegistry } from "@/core/registry/command-registry"

type Tab = "runtime" | "forge" | "apps"

/* ── Forge tab ── */
function ForgeTab({ onOpenApps }: { onOpenApps: () => void }) {
  const [idea, setIdea] = useState("")

  const templates = [
    "Dashboard", "Data Explorer", "API Wrapper",
    "Form Builder", "Doc Generator", "Analytics View",
  ]

  return (
    // overflow-y-auto + no justify-center = scrollable when content overflows
    <div className="h-full overflow-y-auto">
      <div className="forge-canvas min-h-full flex flex-col items-center justify-start px-6 py-12">
        <div className="w-full max-w-xl">

          {/* Header */}
          <div className="mb-8 text-center">
            <div
              className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-lg"
              style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.25)" }}
            >
              ⚡
            </div>
            <h1 className="mt-3 text-xl font-semibold" style={{ color: "var(--text-1)" }}>
              Forge
            </h1>
            <p className="mt-1.5" style={{ fontSize: "13px", color: "var(--text-3)", lineHeight: "1.6" }}>
              Describe an app. Foundry builds it, deploys it to your VPS,<br />
              git-versions it, and manages it — automatically.
            </p>
          </div>

          {/* Build input */}
          <div
            className="overflow-hidden rounded-2xl"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border)" }}
          >
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe the app you want to build…"
              rows={4}
              className="w-full resize-none bg-transparent px-4 pt-4 pb-2 outline-none"
              style={{ fontSize: "14px", lineHeight: "1.6", fontFamily: "var(--font-ui)" }}
            />
            <div
              className="flex items-center justify-between border-t px-4 py-3"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <span style={{ fontSize: "12px", color: "var(--text-4)" }}>
                Output: git repo + VPS deployment + entry in Apps
              </span>
              <button
                disabled={!idea.trim()}
                className="rounded-lg px-4 py-1.5 text-[13px] font-medium"
                style={{
                  background: idea.trim() ? "rgba(167,139,250,0.15)" : "transparent",
                  border: `1px solid ${idea.trim() ? "rgba(167,139,250,0.3)" : "var(--border-subtle)"}`,
                  color: idea.trim() ? "var(--forge)" : "var(--text-4)",
                  cursor: idea.trim() ? "pointer" : "not-allowed",
                }}
              >
                Forge App →
              </button>
            </div>
          </div>

          {/* Templates */}
          <div className="mt-6">
            <p style={{ fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "10px" }}>
              Quickstart
            </p>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <button
                  key={t}
                  onClick={() => setIdea(`Build a ${t.toLowerCase()} app`)}
                  className="rounded-lg px-3 py-1.5 text-[12px]"
                  style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-2)" }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = "rgba(167,139,250,0.3)"
                    el.style.color = "var(--forge)"
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = "var(--border)"
                    el.style.color = "var(--text-2)"
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div
            className="mt-8 rounded-2xl p-4"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}
          >
            <p style={{ fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "10px" }}>
              How Forge works
            </p>
            {[
              ["⚡", "Describe", "Tell Forge what you want. It generates the full codebase."],
              ["↗", "Deploy",   "Foundry pushes to a new git repo and deploys to your VPS automatically."],
              ["□", "Manage",   "The app appears in your Apps tab. Update or retire it from there."],
              ["◉", "Isolate",  "Each forged app is sandboxed — separate from Foundry Core."],
            ].map(([sym, label, desc]) => (
              <div key={label} className="flex items-start gap-3 py-2">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--forge)", marginTop: "1px", width: "20px", flexShrink: 0 }}>{sym}</span>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-2)" }}>{label} — </span>
                  <span style={{ fontSize: "12px", color: "var(--text-3)" }}>{desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Forged apps link */}
          <button
            onClick={onOpenApps}
            className="mt-4 flex w-full items-center justify-between rounded-xl px-4 py-3"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}
          >
            <span style={{ fontSize: "13px", color: "var(--text-3)" }}>No apps forged yet</span>
            <span style={{ fontSize: "12px", color: "var(--text-4)" }}>View Apps →</span>
          </button>

        </div>
      </div>
    </div>
  )
}

/* ── Apps tab ── */
function AppsTab({ onOpenForge }: { onOpenForge: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <div className="w-full max-w-xl text-center">
        <div
          className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-lg"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}
        >
          □
        </div>
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-1)" }}>
          Forged Apps
        </h2>
        <p className="mt-2" style={{ fontSize: "13px", color: "var(--text-3)", lineHeight: "1.6" }}>
          Apps you build with Forge live here — each one git-versioned,<br />
          VPS-deployed, and fully managed by Foundry.
        </p>
        <button
          onClick={onOpenForge}
          className="mt-6 rounded-xl px-6 py-2.5 text-[13px] font-medium"
          style={{
            background: "rgba(167,139,250,0.12)",
            border: "1px solid rgba(167,139,250,0.25)",
            color: "var(--forge)",
          }}
        >
          ⚡ Open Forge
        </button>
        <div
          className="mt-8 rounded-2xl p-5 text-left"
          style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}
        >
          <p style={{ fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "10px" }}>
            Each app gets
          </p>
          {[
            "A dedicated git repository",
            "Its own VPS deployment, managed by PM2",
            "A subdomain or path on your server",
            "Full update and rollback control from Foundry",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5 py-1.5">
              <div className="h-1 w-1 rounded-full shrink-0" style={{ background: "var(--text-4)" }} />
              <span style={{ fontSize: "12px", color: "var(--text-2)" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Inner page ── */
function FoundryPage() {
  useCommandRuntime()
  useCommandPaletteKeyboard()

  const { commandPaletteOpen, openCommandPalette } = useInteraction()
  const [activeTab, setActiveTab] = useState<Tab>("runtime")
  const [contextOpen, setContextOpen] = useState(true)

  // Renamed: "Foundry" → "Runtime" (you're always inside Foundry;
  // the tab describes what it IS, not what app you're in)
  const tabs: { id: Tab; label: string; symbol: string }[] = [
    { id: "runtime", label: "Runtime", symbol: "●" },
    { id: "forge",   label: "Forge",   symbol: "⚡" },
    { id: "apps",    label: "Apps",    symbol: "□" },
  ]

  return (
    <AppShell>
      <div className="flex h-screen flex-col overflow-hidden">

        <StatusRail />

        {/* Tab bar */}
        <div
          className="flex h-10 shrink-0 items-center justify-between px-4"
          style={{ background: "var(--bg-raised)", borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-1">
            {tabs.map(({ id, label, symbol }) => {
              const active = activeTab === id
              const accentColor = id === "forge" ? "var(--forge)"
                : id === "runtime" ? "var(--blue)"
                : "var(--text-3)"
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium"
                  style={{
                    fontSize: "13px",
                    background: active ? "var(--bg-overlay)" : "transparent",
                    border: active ? "1px solid var(--border)" : "1px solid transparent",
                    color: active ? "var(--text-1)" : "var(--text-3)",
                  }}
                >
                  <span style={{ fontSize: id === "forge" ? "13px" : "8px", color: active ? accentColor : "var(--text-4)" }}>
                    {symbol}
                  </span>
                  {label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "runtime" && (
              <button
                onClick={() => setContextOpen(v => !v)}
                className="rounded-lg px-2.5 py-1.5 text-[12px]"
                style={{
                  background: contextOpen ? "var(--bg-overlay)" : "transparent",
                  border: `1px solid ${contextOpen ? "var(--border)" : "transparent"}`,
                  color: contextOpen ? "var(--text-2)" : "var(--text-4)",
                }}
              >
                Context
              </button>
            )}
            <button
              onClick={openCommandPalette}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
              style={{
                background: "var(--bg-overlay)",
                border: "1px solid var(--border-subtle)",
                fontSize: "12px",
                color: "var(--text-3)",
              }}
            >
              Commands
              <kbd style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-4)" }}>⌘K</kbd>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {activeTab === "runtime" && (
            <>
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <OperationalChat />
              </div>
              {contextOpen && (
                <div className="w-[220px] shrink-0 overflow-hidden" style={{ borderLeft: "1px solid var(--border-subtle)" }}>
                  <ContextPanel />
                </div>
              )}
            </>
          )}

          {activeTab === "forge" && (
            <div className="flex-1 overflow-hidden">
              <ForgeTab onOpenApps={() => setActiveTab("apps")} />
            </div>
          )}

          {activeTab === "apps" && (
            <div className="flex-1 overflow-hidden">
              <AppsTab onOpenForge={() => setActiveTab("forge")} />
            </div>
          )}
        </div>
      </div>

      <CommandPalette open={commandPaletteOpen} />
    </AppShell>
  )
}

export default function Page() {
  return (
    <InteractionProvider>
      <FoundryPage />
    </InteractionProvider>
  )
}
