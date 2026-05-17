"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { CommandPalette } from "@/components/command/CommandPalette"
import { OperationalChat } from "@/components/system/OperationalChat"
import { StatusRail } from "@/components/system/StatusRail"
import { useCommandRuntime } from "@/core/registry/use-command-runtime"
import { InteractionProvider, useInteraction } from "@/core/state/interaction-store"
import { useCommandPaletteKeyboard } from "@/hooks/useCommandPaletteKeyboard"

type Tab = "runtime" | "forge" | "apps"

type ForgedApp = {
  id: string; name: string; slug: string; description: string
  status: "deploying" | "running" | "stopped" | "error"
  port: number; url: string; pm2Name: string; createdAt: string
}

type ForgeStatus = "idle" | "generating" | "generated" | "deploying" | "live" | "error"

// ── Forge Tab ────────────────────────────────────────────────────────────────

function ForgeTab({ onOpenApps }: { onOpenApps: () => void }) {
  const [idea, setIdea]               = useState("")
  const [status, setStatus]           = useState<ForgeStatus>("idle")
  const [slug, setSlug]               = useState("")
  const [files, setFiles]             = useState<Record<string, string>>({})
  const [liveUrl, setLiveUrl]         = useState("")
  const [error, setError]             = useState("")
  const [anthropicKey, setAnthropicKey] = useState("")

  useEffect(() => {
    const k = localStorage.getItem("foundry-anthropic-key")
    if (k) setAnthropicKey(k)
  }, [])

  const templates = ["Dashboard with charts", "Markdown notes app", "Pomodoro timer", "URL shortener", "Personal kanban board", "JSON formatter tool"]

  async function forge() {
    if (!idea.trim() || !anthropicKey) {
      setError(!anthropicKey ? "Anthropic key not set — add it in the Runtime tab." : "")
      setStatus("error")
      return
    }
    setStatus("generating"); setError("")
    const res = await fetch("/api/forge", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: idea, anthropicKey }),
    })
    const data = await res.json()
    if (!res.ok || data.error) { setError(data.error ?? "Generation failed"); setStatus("error"); return }
    setSlug(data.slug); setFiles(data.files); setStatus("generated")
  }

  async function deploy() {
    setStatus("deploying")
    const res = await fetch("/api/forge/deploy", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, description: idea, files }),
    })
    const data = await res.json()
    if (!res.ok || data.error) { setError(data.error ?? "Deploy failed"); setStatus("error"); return }
    setLiveUrl(data.url); setStatus("live")
  }

  function reset() { setStatus("idle"); setIdea(""); setSlug(""); setFiles({}); setLiveUrl(""); setError("") }

  if (status === "idle") return (
    <div className="h-full overflow-y-auto">
      <div className="forge-canvas min-h-full flex flex-col items-center justify-start px-6 py-12">
        <div className="w-full max-w-xl">
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-lg" style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.25)" }}>⚡</div>
            <h1 className="mt-3 text-xl font-semibold" style={{ color: "var(--text-1)" }}>Forge</h1>
            <p className="mt-1.5" style={{ fontSize: "13px", color: "var(--text-3)", lineHeight: "1.6" }}>Describe an app. Foundry builds it, deploys it to your VPS, and manages it.</p>
          </div>
          <div className="overflow-hidden rounded-2xl" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border)" }}>
            <textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Describe the app you want to build…" rows={4}
              className="w-full resize-none bg-transparent px-4 pt-4 pb-2 outline-none" style={{ fontSize: "14px", lineHeight: "1.6", fontFamily: "var(--font-ui)" }} />
            <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: "var(--border-subtle)" }}>
              <span style={{ fontSize: "12px", color: "var(--text-4)" }}>Git-versioned · VPS-deployed · managed by Foundry</span>
              <button onClick={forge} disabled={!idea.trim()} className="rounded-lg px-4 py-1.5 text-[13px] font-medium"
                style={{ background: idea.trim() ? "rgba(167,139,250,0.15)" : "transparent", border: `1px solid ${idea.trim() ? "rgba(167,139,250,0.3)" : "var(--border-subtle)"}`, color: idea.trim() ? "var(--forge)" : "var(--text-4)", cursor: idea.trim() ? "pointer" : "not-allowed" }}>
                Forge App →
              </button>
            </div>
          </div>
          <div className="mt-5">
            <p style={{ fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "10px" }}>Quickstart</p>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <button key={t} onClick={() => setIdea(t)} className="rounded-lg px-3 py-1.5 text-[12px]"
                  style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-2)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--forge)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(167,139,250,0.3)" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onOpenApps} className="mt-8 flex w-full items-center justify-between rounded-xl px-4 py-3"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "13px", color: "var(--text-3)" }}>View forged apps</span>
            <span style={{ fontSize: "12px", color: "var(--text-4)" }}>Apps →</span>
          </button>
        </div>
      </div>
    </div>
  )

  if (status === "generating") return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} className="h-2 w-2 rounded-full" style={{ background: "var(--forge)", animation: `pulse-dot 1.2s ease ${i*0.2}s infinite` }} />)}</div>
      <div className="text-center">
        <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-1)" }}>Claude is building your app</p>
        <p style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "6px" }}>Generating complete codebase…</p>
      </div>
    </div>
  )

  if (status === "generated") return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-1)" }}>App generated</h2>
            <p style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "2px" }}>{Object.keys(files).length} files · ready to deploy</p>
          </div>
          <div className="flex gap-2">
            <button onClick={reset} className="rounded-lg px-3 py-1.5 text-[12px]" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-3)" }}>Start over</button>
            <button onClick={deploy} className="rounded-lg px-4 py-1.5 text-[13px] font-medium" style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", color: "var(--green)" }}>Deploy →</button>
          </div>
        </div>
        <div className="mb-4 rounded-xl px-4 py-3" style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "4px" }}>Deployment URL</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--cyan)" }}>https://drusinov.eu/apps/{slug}/</div>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
          <div className="px-4 py-2.5" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-4)" }}>Generated files</span>
          </div>
          <div className="p-2" style={{ background: "var(--bg-raised)" }}>
            {Object.keys(files).sort().map((f) => (
              <div key={f} className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-4)" }}>{f.includes("/") ? "├─" : "•"}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-2)" }}>{f}</span>
                <span style={{ fontSize: "10px", color: "var(--text-4)", marginLeft: "auto" }}>{(files[f].length / 1000).toFixed(1)}k</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  if (status === "deploying") return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} className="h-2 w-2 rounded-full" style={{ background: "var(--green)", animation: `pulse-dot 1.2s ease ${i*0.2}s infinite` }} />)}</div>
      <div className="text-center">
        <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-1)" }}>Deploying to VPS</p>
        <p style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "6px" }}>Installing packages · Starting PM2 · Updating nginx</p>
        <p style={{ fontSize: "11px", color: "var(--text-4)", marginTop: "4px" }}>~30–60 seconds</p>
      </div>
    </div>
  )

  if (status === "live") return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="h-10 w-10 flex items-center justify-center rounded-2xl text-lg" style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.25)" }}>✓</div>
      <div className="text-center">
        <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--green)" }}>App is live</p>
        <p style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "6px" }}>{slug}</p>
      </div>
      <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl px-6 py-2.5 font-medium"
        style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", fontSize: "13px", color: "var(--green)" }}>
        Open app →
      </a>
      <div className="flex gap-2">
        <button onClick={reset} className="rounded-lg px-3 py-1.5 text-[12px]" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-3)" }}>Build another</button>
        <button onClick={onOpenApps} className="rounded-lg px-3 py-1.5 text-[12px]" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-3)" }}>View all apps</button>
      </div>
    </div>
  )

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6">
      <div className="h-10 w-10 flex items-center justify-center rounded-2xl" style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)", fontSize: "18px" }}>✗</div>
      <div className="text-center max-w-md">
        <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--red)" }}>Something went wrong</p>
        <p style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "6px", lineHeight: "1.6" }}>{error}</p>
      </div>
      <button onClick={reset} className="rounded-lg px-4 py-1.5 text-[13px]" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-2)" }}>Try again</button>
    </div>
  )
}

// ── Apps Tab ─────────────────────────────────────────────────────────────────

function AppsTab({ onOpenForge }: { onOpenForge: () => void }) {
  const [apps, setApps]         = useState<ForgedApp[]>([])
  const [loading, setLoading]   = useState(true)
  const [editSlug, setEditSlug] = useState<string | null>(null)
  const [editIdea, setEditIdea] = useState("")
  const [reforging, setReforging] = useState(false)
  const [reforgeError, setReforgeError] = useState("")
  const [anthropicKey, setAnthropicKey] = useState("")

  useEffect(() => {
    const k = localStorage.getItem("foundry-anthropic-key")
    if (k) setAnthropicKey(k)
    fetch("/api/apps").then(r => r.json()).then(d => { setApps(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  async function deleteApp(slug: string) {
    await fetch("/api/apps", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) })
    setApps(prev => prev.filter(a => a.slug !== slug))
  }

  async function reforgeApp() {
    if (!editIdea.trim() || !editSlug) return
    setReforging(true); setReforgeError("")

    // Generate new code
    const genRes = await fetch("/api/forge", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: editIdea, anthropicKey }),
    })
    const genData = await genRes.json()
    if (!genRes.ok || genData.error) { setReforgeError(genData.error ?? "Generation failed"); setReforging(false); return }

    // Write to existing app
    const updateRes = await fetch("/api/forge/update", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: editSlug, files: genData.files }),
    })
    const updateData = await updateRes.json()
    if (!updateRes.ok || updateData.error) { setReforgeError(updateData.error ?? "Update failed"); setReforging(false); return }

    setReforging(false); setEditSlug(null); setEditIdea("")
  }

  if (loading) return <div className="flex h-full items-center justify-center" style={{ fontSize: "13px", color: "var(--text-3)" }}>Loading apps…</div>

  if (apps.length === 0) return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <div className="w-full max-w-xl text-center">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-lg" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>□</div>
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-1)" }}>No apps forged yet</h2>
        <p className="mt-2" style={{ fontSize: "13px", color: "var(--text-3)", lineHeight: "1.6" }}>Use Forge to describe and deploy your first app.</p>
        <button onClick={onOpenForge} className="mt-6 rounded-xl px-6 py-2.5 text-[13px] font-medium" style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", color: "var(--forge)" }}>
          ⚡ Open Forge
        </button>
      </div>
    </div>
  )

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-1)" }}>Forged Apps</h2>
          <button onClick={onOpenForge} className="rounded-lg px-3 py-1.5 text-[12px]" style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", color: "var(--forge)" }}>
            ⚡ New App
          </button>
        </div>

        <div className="space-y-3">
          {apps.map((app) => {
            const statusColor = app.status === "running" ? "var(--green)" : app.status === "deploying" ? "var(--orange)" : app.status === "error" ? "var(--red)" : "var(--text-4)"
            const isEditing = editSlug === app.slug

            return (
              <div key={app.id} className="overflow-hidden rounded-2xl" style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex items-start justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor }} />
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-1)" }}>{app.name || app.slug}</span>
                      <span style={{ fontSize: "10px", color: "var(--text-4)", fontFamily: "var(--font-mono)" }}>{app.status}</span>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-3)", lineHeight: "1.4" }}>{app.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <a href={app.url} target="_blank" rel="noopener noreferrer" className="rounded-lg px-2.5 py-1.5 text-[11px]"
                      style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-2)" }}>
                      Open ↗
                    </a>
                    <button onClick={() => { setEditSlug(isEditing ? null : app.slug); setEditIdea(app.description); setReforgeError("") }}
                      className="rounded-lg px-2.5 py-1.5 text-[11px]"
                      style={{ background: isEditing ? "rgba(99,153,255,0.1)" : "var(--bg-overlay)", border: `1px solid ${isEditing ? "rgba(99,153,255,0.25)" : "var(--border-subtle)"}`, color: isEditing ? "var(--blue)" : "var(--text-2)" }}>
                      Edit
                    </button>
                    <button onClick={() => deleteApp(app.slug)} className="rounded-lg px-2.5 py-1.5 text-[11px]"
                      style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.12)", color: "var(--red)" }}>
                      Remove
                    </button>
                  </div>
                </div>

                {/* Edit panel */}
                {isEditing && (
                  <div className="border-t px-4 py-4" style={{ borderColor: "var(--border-subtle)", background: "rgba(99,153,255,0.03)" }}>
                    <p style={{ fontSize: "11px", color: "var(--text-3)", marginBottom: "10px" }}>
                      Describe what you want the app to do — Claude will regenerate the code and restart the app automatically.
                    </p>
                    <textarea value={editIdea} onChange={(e) => setEditIdea(e.target.value)} rows={3}
                      placeholder="New description…" className="w-full resize-none rounded-xl bg-transparent px-3 py-2.5 outline-none"
                      style={{ fontSize: "13px", fontFamily: "var(--font-ui)", color: "var(--text-1)", background: "var(--bg-overlay)", border: "1px solid var(--border)", lineHeight: "1.5" }} />
                    {reforgeError && <p style={{ fontSize: "11px", color: "var(--red)", marginTop: "6px" }}>{reforgeError}</p>}
                    <div className="mt-3 flex justify-end gap-2">
                      <button onClick={() => setEditSlug(null)} className="rounded-lg px-3 py-1.5 text-[12px]"
                        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-3)" }}>
                        Cancel
                      </button>
                      <button onClick={reforgeApp} disabled={reforging || !editIdea.trim()} className="rounded-lg px-4 py-1.5 text-[12px] font-medium"
                        style={{ background: "rgba(167,139,250,0.14)", border: "1px solid rgba(167,139,250,0.28)", color: reforging ? "var(--text-4)" : "var(--forge)", cursor: reforging ? "not-allowed" : "pointer" }}>
                        {reforging ? "Re-forging…" : "⚡ Re-forge"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 border-t px-4 py-2.5" style={{ borderColor: "var(--border-subtle)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-4)" }}>:{app.port}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-4)" }}>{app.pm2Name}</span>
                  <span style={{ fontSize: "10px", color: "var(--text-4)", marginLeft: "auto" }}>{new Date(app.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Inner page ────────────────────────────────────────────────────────────────

function FoundryPage() {
  useCommandRuntime()
  useCommandPaletteKeyboard()

  const { commandPaletteOpen } = useInteraction()
  const [activeTab, setActiveTab] = useState<Tab>("runtime")

  const tabs: { id: Tab; label: string; symbol: string }[] = [
    { id: "runtime", label: "Runtime", symbol: "●" },
    { id: "forge",   label: "Forge",   symbol: "⚡" },
    { id: "apps",    label: "Apps",    symbol: "□" },
  ]

  return (
    <AppShell>
      <div className="flex h-screen flex-col overflow-hidden">
        <StatusRail />

        {/* Tab bar — no ⌘K button, no context toggle */}
        <div className="flex h-10 shrink-0 items-center px-4 gap-1" style={{ background: "var(--bg-raised)", borderBottom: "1px solid var(--border-subtle)" }}>
          {tabs.map(({ id, label, symbol }) => {
            const active = activeTab === id
            const accent = id === "forge" ? "var(--forge)" : id === "runtime" ? "var(--blue)" : "var(--text-3)"
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium"
                style={{ fontSize: "13px", background: active ? "var(--bg-overlay)" : "transparent", border: active ? "1px solid var(--border)" : "1px solid transparent", color: active ? "var(--text-1)" : "var(--text-3)" }}>
                <span style={{ fontSize: id === "forge" ? "13px" : "8px", color: active ? accent : "var(--text-4)" }}>{symbol}</span>
                {label}
              </button>
            )
          })}
        </div>

        {/* Content — full width, no sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {activeTab === "runtime" && <div className="flex min-w-0 flex-1 flex-col overflow-hidden"><OperationalChat /></div>}
          {activeTab === "forge"   && <div className="flex-1 overflow-hidden"><ForgeTab onOpenApps={() => setActiveTab("apps")} /></div>}
          {activeTab === "apps"    && <div className="flex-1 overflow-hidden"><AppsTab onOpenForge={() => setActiveTab("forge")} /></div>}
        </div>
      </div>

      <CommandPalette open={commandPaletteOpen} />
    </AppShell>
  )
}

export default function Page() {
  return <InteractionProvider><FoundryPage /></InteractionProvider>
}
