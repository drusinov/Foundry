"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell }               from "@/components/layout/AppShell"
import { CommandPalette }         from "@/components/command/CommandPalette"
import { OperationalChat }        from "@/components/system/OperationalChat"
import { StatusRail }             from "@/components/system/StatusRail"
import { useCommandRuntime }      from "@/core/registry/use-command-runtime"
import { InteractionProvider, useInteraction } from "@/core/state/interaction-store"
import { useCommandPaletteKeyboard } from "@/hooks/useCommandPaletteKeyboard"

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = "runtime" | "forge" | "apps"

type ForgeStatus = "idle" | "generating" | "generated" | "deploying" | "live" | "error"

type ForgedApp = {
  id: string; name: string; slug: string; description: string
  status: "deploying" | "running" | "stopped" | "error"
  port: number; url: string; pm2Name: string; createdAt: string
  mode?: "dev" | "production"; icon?: string; cost?: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const FORGE_PRICING = { input: 15, output: 75, systemTokens: 900, outputTokens: 4500 }

function estimateForgeCost(prompt: string): number {
  const inputTokens = FORGE_PRICING.systemTokens + Math.ceil(prompt.length / 4)
  return (inputTokens * FORGE_PRICING.input + FORGE_PRICING.outputTokens * FORGE_PRICING.output) / 1_000_000
}

function fmtCost(usd: number): string {
  if (usd < 0.001) return "<$0.001"
  if (usd < 0.01)  return `$${usd.toFixed(3)}`
  return `$${usd.toFixed(2)}`
}

function slugGradient(slug: string) {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0
  const a = h % 360, b = (a + 130) % 360
  return `linear-gradient(135deg, hsl(${a},55%,22%), hsl(${b},60%,32%))`
}

// ── Forge Tab ─────────────────────────────────────────────────────────────────

function ForgeTab({ onOpenApps }: { onOpenApps: () => void }) {
  const [appName, setAppName]   = useState("")
  const [idea, setIdea]         = useState("")
  const [status, setStatus]     = useState<ForgeStatus>("idle")
  const [slug, setSlug]         = useState("")
  const [files, setFiles]       = useState<Record<string, string>>({})
  const [liveUrl, setLiveUrl]   = useState("")
  const [error, setError]       = useState("")
  const [deployLogs, setDeployLogs] = useState<string[]>([])
  const [anthropicKey, setAnthropicKey] = useState("")
  const [balance, setBalance]   = useState<number | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [queue, setQueue]       = useState<{ id: string; appName: string; description: string }[]>([])
  const activeJobRef             = useRef(false)

  const templates = [
    "Dashboard with charts", "Markdown notes app", "Pomodoro timer",
    "URL shortener", "Personal kanban board", "JSON formatter tool",
  ]

  useEffect(() => {
    const k = localStorage.getItem("foundry-anthropic-key")
    if (k) setAnthropicKey(k)
  }, [])

  useEffect(() => {
    if (anthropicKey) fetchBalance()
  }, [anthropicKey]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchBalance() {
    if (!anthropicKey.trim()) return
    setBalanceLoading(true)
    try {
      const res  = await fetch("/api/balance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openaiKey: "" }),
      })
      const data = await res.json()
      if (data.openai?.available != null) setBalance(data.openai.available)
    } catch { /* non-fatal */ }
    setBalanceLoading(false)
  }

  function enqueue() {
    if (!idea.trim()) return
    if (!anthropicKey) { setError("Anthropic key not set — add it in the Runtime tab."); setStatus("error"); return }
    const job = { id: crypto.randomUUID(), appName: appName.trim(), description: idea.trim() }
    const next = [...queue, job]
    setQueue(next)
    setAppName(""); setIdea("")
    if (!activeJobRef.current) processQueue(next)
  }

  async function processQueue(q: typeof queue) {
    const job = q[0]
    if (!job) { activeJobRef.current = false; return }
    activeJobRef.current = true
    setStatus("generating"); setError("")

    const res  = await fetch("/api/forge", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: job.description, name: job.appName || undefined, anthropicKey }),
    })
    const data = await res.json()

    if (!res.ok || data.error) {
      setError(data.error ?? "Generation failed"); setStatus("error")
      setQueue(prev => { const rest = prev.slice(1); setTimeout(() => processQueue(rest), 0); return rest })
      return
    }

    setSlug(data.slug); setFiles(data.files)
    if (data.description) setIdea(data.description)
    setStatus("generated")
    setQueue(prev => prev.slice(1))
    activeJobRef.current = false
  }

  async function deploy() {
    setStatus("deploying"); setDeployLogs([])
    const res = await fetch("/api/forge/deploy", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, description: idea, files }),
    })
    if (!res.ok || !res.body) { setError("Deploy request failed"); setStatus("error"); return }

    const reader  = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split("\n")
      buf = lines.pop() ?? ""
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue
        try {
          const ev = JSON.parse(line.slice(6))
          if (ev.log)   setDeployLogs(prev => [...prev, ev.log])
          if (ev.done)  { setLiveUrl(ev.url); setStatus("live") }
          if (ev.error) { setError(ev.error); setStatus("error") }
        } catch { /* skip malformed */ }
      }
    }
  }

  function reset() {
    setStatus("idle"); setAppName(""); setIdea(""); setSlug("")
    setFiles({}); setLiveUrl(""); setError(""); setDeployLogs([])
  }

  // ── Render states ─────────────────────────────────────────────────────────

  if (status === "generating") return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="flex gap-1.5">
        {[0,1,2].map(i => <div key={i} className="h-2 w-2 rounded-full" style={{ background: "var(--forge)", animation: `pulse-dot 1.2s ease ${i*0.2}s infinite` }} />)}
      </div>
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
            <button onClick={reset} className="rounded-lg px-3 py-1.5 text-[12px]"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-3)" }}>Start over</button>
            <button onClick={deploy} className="rounded-lg px-4 py-1.5 text-[13px] font-medium"
              style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", color: "var(--green)" }}>Deploy →</button>
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
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex gap-1">
            {[0,1,2].map(i => <div key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--green)", animation: `pulse-dot 1.2s ease ${i*0.2}s infinite` }} />)}
          </div>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-1)" }}>Deploying to VPS</span>
        </div>
        <div className="overflow-hidden rounded-xl" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.02)" }}>
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--red)" }} />
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--orange)" }} />
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--green)" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-4)", marginLeft: "8px" }}>forge deploy</span>
          </div>
          <div className="min-h-48 max-h-80 overflow-y-auto p-4">
            {deployLogs.length === 0
              ? <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-4)" }}>Initialising…</span>
              : deployLogs.map((line, i) => (
                <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "12px", lineHeight: "1.7",
                  color: line.startsWith("✓") ? "var(--green)" : line.startsWith("✗") ? "var(--red)" : line.startsWith("⚠") ? "var(--orange)" : "var(--text-2)" }}>
                  {line}
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )

  if (status === "live") return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="h-10 w-10 flex items-center justify-center rounded-2xl text-lg"
        style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.25)" }}>✓</div>
      <div className="text-center">
        <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--green)" }}>App is live</p>
        <p style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "6px" }}>{slug}</p>
      </div>
      <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl px-6 py-2.5 font-medium"
        style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", fontSize: "13px", color: "var(--green)" }}>
        Open app →
      </a>
      <div className="flex gap-2">
        <button onClick={reset} className="rounded-lg px-3 py-1.5 text-[12px]"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-3)" }}>Build another</button>
        <button onClick={onOpenApps} className="rounded-lg px-3 py-1.5 text-[12px]"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-3)" }}>View all apps</button>
      </div>
    </div>
  )

  if (status === "error") return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6">
      <div className="h-10 w-10 flex items-center justify-center rounded-2xl"
        style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)", fontSize: "18px" }}>✗</div>
      <div className="text-center max-w-md">
        <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--red)" }}>Something went wrong</p>
        <p style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "6px", lineHeight: "1.6" }}>{error}</p>
      </div>
      <button onClick={reset} className="rounded-lg px-4 py-1.5 text-[13px]"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-2)" }}>Try again</button>
    </div>
  )

  // Idle state
  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-1)" }}>New App</h2>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-4)" }}>git-tracked · vps-deployed</span>
        </div>
        <div>

          <div className="overflow-hidden rounded-2xl" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border)" }}>
            {/* App name */}
            <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: "var(--border-subtle)" }}>
              <span style={{ fontSize: "11px", color: "var(--text-4)", whiteSpace: "nowrap" }}>App name</span>
              <input value={appName} onChange={e => setAppName(e.target.value)}
                placeholder="e.g. Pomodoro Timer" className="flex-1 bg-transparent outline-none"
                style={{ fontSize: "13px", fontFamily: "var(--font-ui)", color: "var(--text-1)" }} />
            </div>

            {/* Prompt */}
            <textarea value={idea} onChange={e => setIdea(e.target.value)}
              placeholder="Describe what the app should do…" rows={4}
              className="w-full resize-none bg-transparent px-4 pt-3 pb-2 outline-none"
              style={{ fontSize: "14px", lineHeight: "1.6", fontFamily: "var(--font-ui)" }} />

            {/* Footer row: cost estimate + forge button */}
            <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: "var(--border-subtle)" }}>
              {idea.trim() ? (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-4)" }}>
                  est. {fmtCost(estimateForgeCost(idea))} <span style={{ opacity: 0.6 }}>(Opus)</span>
                </span>
              ) : (
                <span style={{ fontSize: "11px", color: "var(--text-4)" }}>Git-versioned · VPS-deployed</span>
              )}
              <button onClick={enqueue} disabled={!idea.trim()} className="rounded-lg px-4 py-1.5 text-[13px] font-medium"
                style={{ background: idea.trim() ? "rgba(167,139,250,0.15)" : "transparent",
                  border: `1px solid ${idea.trim() ? "rgba(167,139,250,0.3)" : "var(--border-subtle)"}`,
                  color: idea.trim() ? "var(--forge)" : "var(--text-4)", cursor: idea.trim() ? "pointer" : "not-allowed" }}>
                {queue.length > 0 ? `Queue (${queue.length + 1})` : "Forge App →"}
              </button>
            </div>

            {/* Balance strip */}
            {anthropicKey && (
              <div className="flex items-center gap-4 border-t px-4 py-2"
                style={{ borderColor: "var(--border-subtle)", background: "rgba(255,255,255,0.01)" }}>
                <span style={{ fontSize: "10px", color: "var(--text-4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Balance</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: balance !== null ? "var(--text-2)" : "var(--text-4)" }}>
                  OpenAI: {balanceLoading ? "…" : balance !== null ? `$${balance.toFixed(2)}` : "—"}
                </span>
                <a href="https://console.anthropic.com/settings/billing" target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-4)" }}>
                  Anthropic ↗
                </a>
                <button onClick={fetchBalance} style={{ fontSize: "10px", color: "var(--text-4)", marginLeft: "auto" }}>refresh</button>
              </div>
            )}
          </div>

          {/* Quickstart templates */}
          <div className="mt-5">
            <p style={{ fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "10px" }}>Quickstart</p>
            <div className="flex flex-wrap gap-2">
              {templates.map(t => (
                <button key={t} onClick={() => setIdea(t)} className="rounded-lg px-3 py-1.5 text-[12px]"
                  style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-2)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--forge)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(167,139,250,0.3)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Queue */}
          {queue.length > 0 && (
            <div className="mt-4 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
              <div className="px-4 py-2.5" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-4)" }}>
                  Queue — {queue.length} pending
                </span>
              </div>
              {queue.map((job, i) => (
                <div key={job.id} className="flex items-center justify-between px-4 py-2.5"
                  style={{ background: "var(--bg-raised)", borderBottom: i < queue.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: "var(--text-2)" }}>{job.appName || job.description.slice(0, 40)}</span>
                    {i === 0 && <span className="ml-2 rounded px-1.5 py-0.5" style={{ fontSize: "9px", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", color: "var(--forge)" }}>next up</span>}
                  </div>
                  <button onClick={() => setQueue(prev => prev.filter(j => j.id !== job.id))}
                    style={{ fontSize: "11px", color: "var(--text-4)" }}>✕</button>
                </div>
              ))}
            </div>
          )}

          <button onClick={onOpenApps} className="mt-4 flex w-full items-center justify-between rounded-xl px-4 py-3"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "13px", color: "var(--text-3)" }}>View forged apps</span>
            <span style={{ fontSize: "12px", color: "var(--text-4)" }}>Apps →</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Apps Tab ──────────────────────────────────────────────────────────────────

function AppsTab({ onOpenForge }: { onOpenForge: () => void }) {
  const [apps, setApps]         = useState<ForgedApp[]>([])
  const [loading, setLoading]   = useState(true)
  const [anthropicKey, setAnthropicKey] = useState("")
  const [editSlug, setEditSlug] = useState<string | null>(null)
  const [editIdea, setEditIdea] = useState("")
  const [reforging, setReforging]         = useState(false)
  const [reforgeProgress, setReforgeProgress] = useState(0)
  const [reforgeStep, setReforgeStep]     = useState("")
  const [reforgeError, setReforgeError]   = useState("")
  const [logsSlug, setLogsSlug] = useState<string | null>(null)
  const [logsText, setLogsText] = useState<Record<string, string>>({})
  const [historySlug, setHistorySlug] = useState<string | null>(null)
  const [commits, setCommits]   = useState<Record<string, { hash: string; short: string; message: string; date: string }[]>>({})
  const [rollingBack, setRollingBack] = useState<string | null>(null)
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null)

  useEffect(() => {
    const k = localStorage.getItem("foundry-anthropic-key")
    if (k) setAnthropicKey(k)
    fetch("/api/apps")
      .then(r => r.json())
      .then(d => { setApps(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Auto-generate icons for apps missing them
  useEffect(() => {
    if (!anthropicKey || apps.length === 0) return
    const missing = apps.filter(a => !a.icon)
    if (missing.length === 0) return
    const generateNext = async (q: typeof missing) => {
      if (q.length === 0) return
      const [app, ...rest] = q
      try {
        const res  = await fetch(`/api/apps/${app.slug}/icon`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ anthropicKey }),
        })
        const data = await res.json()
        if (data.icon) setApps(prev => prev.map(a => a.slug === app.slug ? { ...a, icon: data.icon } : a))
      } catch { /* non-fatal */ }
      generateNext(rest)
    }
    generateNext(missing)
  }, [apps.length, anthropicKey])

  async function startApp(slug: string) {
    setTogglingSlug(slug)
    const res  = await fetch(`/api/apps/${slug}/start`, { method: "POST" })
    const data = await res.json()
    if (data.success) setApps(prev => prev.map(a => a.slug === slug ? { ...a, status: "running" as const } : a))
    setTogglingSlug(null)
  }

  async function stopApp(slug: string) {
    setTogglingSlug(slug)
    const res  = await fetch(`/api/apps/${slug}/stop`, { method: "POST" })
    const data = await res.json()
    if (data.success) setApps(prev => prev.map(a => a.slug === slug ? { ...a, status: "stopped" as const } : a))
    setTogglingSlug(null)
  }

  async function deleteApp(slug: string) {
    await fetch("/api/apps", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) })
    setApps(prev => prev.filter(a => a.slug !== slug))
  }

  async function fetchLogs(slug: string) {
    if (logsSlug === slug) { setLogsSlug(null); return }
    setLogsSlug(slug)
    setLogsText(prev => ({ ...prev, [slug]: "Loading…" }))
    const res  = await fetch(`/api/apps/${slug}/logs`)
    const data = await res.json()
    setLogsText(prev => ({ ...prev, [slug]: data.logs ?? "No logs available." }))
  }

  async function fetchCommits(slug: string) {
    if (historySlug === slug) { setHistorySlug(null); return }
    setHistorySlug(slug)
    if (commits[slug]) return
    const res  = await fetch(`/api/apps/${slug}/commits`)
    const data = await res.json()
    setCommits(prev => ({ ...prev, [slug]: data.commits ?? [] }))
  }

  async function rollbackTo(slug: string, commit: string) {
    setRollingBack(commit)
    await fetch(`/api/apps/${slug}/rollback`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commit }),
    })
    setRollingBack(null)
    setCommits(prev => ({ ...prev, [slug]: [] }))
  }

  async function reforgeApp() {
    if (!editIdea.trim() || !editSlug) return
    setReforging(true); setReforgeError(""); setReforgeProgress(0)

    const steps = [
      { label: "Reading existing code…",  progress: 8,  delay: 0 },
      { label: "Claude is rewriting…",    progress: 25, delay: 1200 },
      { label: "Generating changes…",     progress: 55, delay: 6000 },
      { label: "Finalising output…",      progress: 78, delay: 14000 },
      { label: "Writing files to VPS…",   progress: 88, delay: 20000 },
      { label: "Restarting app…",         progress: 95, delay: 24000 },
    ]
    const timers = steps.map(({ label, progress, delay }) =>
      setTimeout(() => { setReforgeStep(label); setReforgeProgress(progress) }, delay)
    )

    try {
      const genRes  = await fetch("/api/forge/edit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: editSlug, description: editIdea }),
      })
      const genData = await genRes.json()
      if (!genRes.ok || genData.error) {
        timers.forEach(clearTimeout); setReforgeError(genData.error ?? "Edit failed"); setReforging(false); return
      }

      setReforgeStep("Applying changes…"); setReforgeProgress(88)

      const updateRes  = await fetch("/api/forge/apply-edit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: editSlug, files: genData.files }),
      })
      const updateData = await updateRes.json()
      timers.forEach(clearTimeout)
      if (!updateRes.ok || updateData.error) {
        setReforgeError(updateData.error ?? "Update failed"); setReforging(false); return
      }

      setReforgeStep("Done"); setReforgeProgress(100)
      setTimeout(() => { setReforging(false); setEditSlug(null); setEditIdea(""); setReforgeProgress(0); setReforgeStep("") }, 800)
    } catch (err) {
      timers.forEach(clearTimeout); setReforgeError(String(err)); setReforging(false)
    }
  }

  if (loading) return (
    <div className="flex h-full items-center justify-center" style={{ fontSize: "13px", color: "var(--text-3)" }}>Loading apps…</div>
  )

  if (apps.length === 0) return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <div className="w-full max-w-xl text-center">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-lg"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>□</div>
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-1)" }}>No apps forged yet</h2>
        <p className="mt-2" style={{ fontSize: "13px", color: "var(--text-3)", lineHeight: "1.6" }}>Use Forge to describe and deploy your first app.</p>
        <button onClick={onOpenForge} className="mt-6 rounded-xl px-6 py-2.5 text-[13px] font-medium"
          style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", color: "var(--forge)" }}>
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
          <button onClick={onOpenForge} className="rounded-lg px-3 py-1.5 text-[12px]"
            style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", color: "var(--forge)" }}>
            ⚡ New App
          </button>
        </div>

        <div className="space-y-3">
          {apps.map(app => {
            const statusColor  = app.status === "running" ? "var(--green)" : app.status === "deploying" ? "var(--orange)" : app.status === "error" ? "var(--red)" : "var(--text-4)"
            const isEditing    = editSlug === app.slug
            const isProduction = app.mode === "production"

            return (
              <div key={app.id} className="overflow-hidden rounded-2xl"
                style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}>

                {/* Card header */}
                <div className="flex gap-3 p-4">
                  {/* Icon */}
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border-subtle)" }}>
                    {app.icon ? (
                      <div dangerouslySetInnerHTML={{ __html: app.icon }} style={{ width: "100%", height: "100%", display: "block" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: slugGradient(app.slug),
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px" }}>⚡</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: statusColor }} />
                          <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.01em" }}>
                            {app.name || app.slug}
                          </span>
                          {isProduction && (
                            <span className="rounded px-1.5 py-0.5"
                              style={{ fontSize: "9px", fontFamily: "var(--font-mono)", background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", color: "var(--green)", letterSpacing: "0.06em" }}>
                              PROD
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-2)", lineHeight: "1.45" }}>
                          {app.description.length > 90 ? app.description.slice(0, 90) + "…" : app.description}
                        </p>
                        <p style={{ fontSize: "10px", color: "var(--text-4)", fontFamily: "var(--font-mono)", marginTop: "4px" }}>
                          Released {new Date(app.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          {" · "}:{app.port}
                          {app.cost ? ` · ${fmtCost(app.cost)} forged` : ""}
                        </p>
                      </div>
                      {app.status === "running" ? (
                        <a href={app.url} target="_blank" rel="noopener noreferrer"
                          className="shrink-0 rounded-xl px-3 py-1.5 text-[12px] font-medium"
                          style={{ background: "rgba(99,153,255,0.12)", border: "1px solid rgba(99,153,255,0.25)", color: "var(--blue)" }}>
                          Open ↗
                        </a>
                      ) : (
                        <span className="shrink-0 rounded-xl px-3 py-1.5 text-[12px]"
                          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-4)" }}>
                          Stopped
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action bar */}
                <div className="flex items-center justify-between border-t px-4 py-2"
                  style={{ borderColor: "var(--border-subtle)", background: "rgba(255,255,255,0.015)" }}>
                  <div className="flex items-center gap-1">
                    {app.status === "running" ? (
                      <button onClick={() => stopApp(app.slug)} disabled={togglingSlug === app.slug}
                        className="rounded-lg px-3 py-1.5 text-[12px] font-medium"
                        style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)",
                          color: togglingSlug === app.slug ? "var(--text-4)" : "var(--orange)",
                          cursor: togglingSlug === app.slug ? "not-allowed" : "pointer" }}>
                        {togglingSlug === app.slug ? "Stopping…" : "■ Stop"}
                      </button>
                    ) : (
                      <button onClick={() => startApp(app.slug)} disabled={togglingSlug === app.slug}
                        className="rounded-lg px-3 py-1.5 text-[12px] font-medium"
                        style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)",
                          color: togglingSlug === app.slug ? "var(--text-4)" : "var(--green)",
                          cursor: togglingSlug === app.slug ? "not-allowed" : "pointer" }}>
                        {togglingSlug === app.slug ? "Starting…" : "▶ Start"}
                      </button>
                    )}
                    <button
                      onClick={() => { setEditSlug(isEditing ? null : app.slug); setEditIdea(""); setReforgeError(""); setLogsSlug(null); setHistorySlug(null) }}
                      className="rounded-lg px-3 py-1.5 text-[12px]"
                      style={{ background: isEditing ? "rgba(99,153,255,0.1)" : "transparent",
                        border: `1px solid ${isEditing ? "rgba(99,153,255,0.25)" : "transparent"}`,
                        color: isEditing ? "var(--blue)" : "var(--text-3)", cursor: "pointer" }}>
                      {isEditing ? "Close ✕" : "Edit"}
                    </button>
                  </div>
                  <button onClick={() => deleteApp(app.slug)} className="rounded-lg px-3 py-1.5 text-[12px]"
                    style={{ background: "transparent", color: "var(--red)", cursor: "pointer", border: "1px solid transparent" }}>
                    Remove
                  </button>
                </div>

                {/* Edit panel */}
                {isEditing && (
                  <div className="border-t" style={{ borderColor: "var(--border-subtle)" }}>
                    {reforging ? (
                      <div className="px-4 py-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--forge)" }}>
                            {reforgeProgress === 100 ? "✓ Done" : "⚡ Re-forging…"}
                          </span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-4)" }}>{reforgeProgress}%</span>
                        </div>
                        <div className="relative h-1 w-full overflow-hidden rounded-full" style={{ background: "var(--bg-overlay)" }}>
                          <div className="h-full rounded-full" style={{
                            width: `${reforgeProgress}%`,
                            background: reforgeProgress === 100 ? "var(--green)" : "linear-gradient(90deg, var(--forge), #60a5fa)",
                            transition: "width 600ms cubic-bezier(0.4,0,0.2,1)",
                            boxShadow: "0 0 8px rgba(167,139,250,0.5)",
                          }} />
                        </div>
                        <p style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "10px" }}>{reforgeStep}</p>
                      </div>
                    ) : (
                      <div className="px-4 py-4" style={{ background: "rgba(99,153,255,0.02)" }}>
                        <p style={{ fontSize: "11px", color: "var(--text-3)", marginBottom: "10px" }}>
                          Describe what you want to change — Claude reads the existing code and only modifies what's needed.
                        </p>
                        <textarea value={editIdea} onChange={e => setEditIdea(e.target.value)} rows={2}
                          placeholder="What should change…" className="w-full resize-none rounded-xl bg-transparent px-3 py-2.5 outline-none"
                          style={{ fontSize: "13px", fontFamily: "var(--font-ui)", color: "var(--text-1)", background: "var(--bg-overlay)", border: "1px solid var(--border)", lineHeight: "1.5" }} />
                        {reforgeError && <p style={{ fontSize: "11px", color: "var(--red)", marginTop: "6px" }}>{reforgeError}</p>}
                        <div className="mt-3 flex justify-end gap-2">
                          <button onClick={() => setEditSlug(null)} className="rounded-lg px-3 py-1.5 text-[12px]"
                            style={{ border: "1px solid var(--border-subtle)", color: "var(--text-3)" }}>Cancel</button>
                          <button onClick={reforgeApp} disabled={!editIdea.trim()} className="rounded-lg px-4 py-1.5 text-[12px] font-medium"
                            style={{ background: "rgba(167,139,250,0.14)", border: "1px solid rgba(167,139,250,0.28)",
                              color: "var(--forge)", cursor: editIdea.trim() ? "pointer" : "not-allowed" }}>
                            ⚡ Re-forge
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Runtime logs */}
                    <div className="border-t" style={{ borderColor: "var(--border-subtle)" }}>
                      <button onClick={() => fetchLogs(app.slug)}
                        className="flex w-full items-center justify-between px-4 py-2.5"
                        style={{ background: logsSlug === app.slug ? "rgba(0,0,0,0.2)" : "transparent", cursor: "pointer" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-3)" }}>Runtime logs</span>
                        <span style={{ fontSize: "10px", color: "var(--text-4)" }}>{logsSlug === app.slug ? "▲" : "▼"}</span>
                      </button>
                      {logsSlug === app.slug && (
                        <pre className="max-h-48 overflow-y-auto px-4 py-3"
                          style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "11px", lineHeight: "1.6",
                            color: "var(--text-2)", background: "rgba(0,0,0,0.3)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                          {logsText[app.slug] ?? "Loading…"}
                        </pre>
                      )}
                    </div>

                    {/* Version history */}
                    <div className="border-t" style={{ borderColor: "var(--border-subtle)" }}>
                      <button onClick={() => fetchCommits(app.slug)}
                        className="flex w-full items-center justify-between px-4 py-2.5"
                        style={{ background: historySlug === app.slug ? "rgba(0,0,0,0.2)" : "transparent", cursor: "pointer" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-3)" }}>Version history</span>
                        <span style={{ fontSize: "10px", color: "var(--text-4)" }}>{historySlug === app.slug ? "▲" : "▼"}</span>
                      </button>
                      {historySlug === app.slug && (
                        <div className="max-h-48 overflow-y-auto" style={{ background: "rgba(0,0,0,0.2)" }}>
                          {(commits[app.slug] ?? []).length === 0
                            ? <p className="px-4 py-3" style={{ fontSize: "11px", color: "var(--text-4)" }}>No commits found.</p>
                            : (commits[app.slug] ?? []).map(commit => (
                              <div key={commit.hash} className="flex items-center justify-between gap-2 px-4 py-2.5"
                                style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                                <div className="min-w-0">
                                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--cyan)" }}>{commit.short}</span>
                                  <span style={{ fontSize: "11px", color: "var(--text-2)", marginLeft: "8px" }}>{commit.message}</span>
                                  <span style={{ fontSize: "10px", color: "var(--text-4)", marginLeft: "8px" }}>{commit.date}</span>
                                </div>
                                <button onClick={() => rollbackTo(app.slug, commit.hash)} disabled={rollingBack === commit.hash}
                                  className="shrink-0 rounded-md px-2.5 py-1 text-[10px]"
                                  style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)",
                                    color: rollingBack === commit.hash ? "var(--text-4)" : "var(--orange)",
                                    cursor: rollingBack === commit.hash ? "not-allowed" : "pointer" }}>
                                  {rollingBack === commit.hash ? "Restoring…" : "Restore"}
                                </button>
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Page shell ────────────────────────────────────────────────────────────────

type UserInfo = {
  id: string; name: string; email: string; role: string
  hasOpenaiKey: boolean; hasAnthropicKey: boolean
}
type UserRecord = { id: string; name: string; email: string; role: string; hasOpenaiKey: boolean; hasAnthropicKey: boolean; createdAt: string }

function FoundryPage() {
  useCommandRuntime()
  useCommandPaletteKeyboard()
  const router = useRouter()
  const { commandPaletteOpen } = useInteraction()
  const [activeTab, setActiveTab]     = useState<Tab>(() => (typeof window !== "undefined" ? (localStorage.getItem("foundry-tab") as Tab) ?? "forge" : "forge"))
  const [user, setUser]               = useState<UserInfo | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [users, setUsers]             = useState<UserRecord[]>([])
  const [newUser, setNewUser]         = useState({ name: "", email: "", password: "", role: "user" })
  const [addUserError, setAddUserError] = useState("")
  const [keyPanel, setKeyPanel]       = useState(false)
  const [openaiInput, setOpenaiInput] = useState("")
  const [anthropicInput, setAnthropicInput] = useState("")
  const [keySaving, setKeySaving]     = useState(false)

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { router.push("/login"); return }
        setUser(d)
        const saved = typeof window !== "undefined" ? localStorage.getItem("foundry-tab") as Tab : null
        const valid = d.role === "admin" ? ["runtime","forge","apps"] : ["forge","apps"]
        if (saved && valid.includes(saved)) {
          setActiveTab(saved)
        } else {
          setActiveTab(d.role === "admin" ? "runtime" : "forge")
        }
      })
  }, [router])

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  async function loadUsers() {
    const res = await fetch("/api/users")
    if (res.ok) setUsers(await res.json())
  }

  async function addUser() {
    setAddUserError("")
    const res  = await fetch("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    })
    const data = await res.json()
    if (!res.ok) { setAddUserError(data.error ?? "Failed"); return }
    setNewUser({ name: "", email: "", password: "", role: "user" })
    setShowAddUser(false)
    loadUsers()
  }

  async function deleteUser(id: string) {
    await fetch("/api/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    loadUsers()
  }

  async function saveKeys() {
    setKeySaving(true)
    const res  = await fetch("/api/auth/keys", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openaiKey: openaiInput || undefined, anthropicKey: anthropicInput || undefined }),
    })
    const data = await res.json()
    if (data.ok) setUser(prev => prev ? { ...prev, hasOpenaiKey: data.hasOpenaiKey, hasAnthropicKey: data.hasAnthropicKey } : prev)
    setOpenaiInput(""); setAnthropicInput(""); setKeySaving(false); setKeyPanel(false)
  }

  const allTabs: { id: Tab; label: string; symbol: string }[] = [
    { id: "runtime", label: "Foundry Runtime", symbol: "🔥" },
    { id: "forge",   label: "Forge",           symbol: "⚒️" },
    { id: "apps",    label: "Apps",            symbol: "⚔️" },
  ]
  const tabs = allTabs.filter(t => t.id !== "runtime" || user?.role === "admin")

  const initials = user?.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() ?? "?"

  return (
    <AppShell>
      <div className="flex flex-col overflow-hidden" style={{ height: "100dvh" }}>
        {/* Tab bar */}
        <div className="flex h-10 shrink-0 items-center px-4 gap-1"
          style={{ background: "var(--bg-raised)", borderBottom: "1px solid var(--border-subtle)" }}>
          {tabs.map(({ id, label, symbol }) => {
            const active = activeTab === id
            return (
              <button key={id} onClick={() => { setActiveTab(id); localStorage.setItem("foundry-tab", id) }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium"
                style={{ fontSize: "13px", background: active ? "var(--bg-overlay)" : "transparent",
                  border: active ? "1px solid var(--border)" : "1px solid transparent",
                  color: active ? "var(--text-1)" : "var(--text-3)" }}>
                <span style={{ fontSize: "15px" }}>{symbol}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            )
          })}

          {/* User avatar */}
          <div className="relative ml-auto">
            <button onClick={() => { setShowUserMenu(v => !v); if (!users.length && user?.role === "admin") loadUsers() }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold"
              style={{ background: "rgba(99,153,255,0.15)", border: "1px solid rgba(99,153,255,0.3)", color: "var(--blue)" }}>
              {initials}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-9 z-50 w-72 overflow-hidden rounded-2xl shadow-2xl"
                style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                {/* User info */}
                <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-1)" }}>{user?.name}</p>
                  <p style={{ fontSize: "11px", color: "var(--text-4)" }}>{user?.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: user?.hasOpenaiKey ? "var(--green)" : "rgba(74,222,128,0.2)", border: user?.hasOpenaiKey ? "none" : "1px solid rgba(74,222,128,0.4)" }} />
                    <span style={{ fontSize: "10px", color: "var(--text-4)" }}>OpenAI</span>
                    <span className="h-2 w-2 rounded-full ml-2" style={{ background: user?.hasAnthropicKey ? "var(--forge)" : "rgba(167,139,250,0.2)", border: user?.hasAnthropicKey ? "none" : "1px solid rgba(167,139,250,0.4)" }} />
                    <span style={{ fontSize: "10px", color: "var(--text-4)" }}>Anthropic</span>
                  </div>
                </div>

                {/* Key update */}
                <div className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <button onClick={() => setKeyPanel(v => !v)}
                    className="flex w-full items-center justify-between px-4 py-2.5"
                    style={{ fontSize: "12px", color: "var(--text-2)", cursor: "pointer" }}>
                    <span>API Keys</span>
                    <span style={{ color: "var(--text-4)", fontSize: "10px" }}>{keyPanel ? "▲" : "▼"}</span>
                  </button>
                  {keyPanel && (
                    <div className="px-4 pb-3">
                      <input value={openaiInput} onChange={e => setOpenaiInput(e.target.value)}
                        placeholder={user?.hasOpenaiKey ? "Replace OpenAI key…" : "Add OpenAI key…"}
                        type="password" className="w-full rounded-lg bg-transparent px-3 py-2 mb-2 outline-none"
                        style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-2)", border: "1px solid var(--border-subtle)" }} />
                      <input value={anthropicInput} onChange={e => setAnthropicInput(e.target.value)}
                        placeholder={user?.hasAnthropicKey ? "Replace Anthropic key…" : "Add Anthropic key…"}
                        type="password" className="w-full rounded-lg bg-transparent px-3 py-2 mb-2 outline-none"
                        style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-2)", border: "1px solid var(--border-subtle)" }} />
                      <button onClick={saveKeys} disabled={keySaving || (!openaiInput && !anthropicInput)}
                        className="w-full rounded-lg py-1.5 text-[12px] font-medium"
                        style={{ background: "rgba(99,153,255,0.12)", border: "1px solid rgba(99,153,255,0.25)", color: "var(--blue)", cursor: "pointer" }}>
                        {keySaving ? "Saving…" : "Save keys"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Admin: Users panel */}
                {user?.role === "admin" && (
                  <div className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                    <button onClick={() => setShowAddUser(v => !v)}
                      className="flex w-full items-center justify-between px-4 py-2.5"
                      style={{ fontSize: "12px", color: "var(--text-2)", cursor: "pointer" }}>
                      <span>Users ({users.length})</span>
                      <span style={{ color: "var(--forge)", fontSize: "11px" }}>+ Add</span>
                    </button>
                    {/* User list */}
                    <div className="max-h-40 overflow-y-auto">
                      {users.map(u => (
                        <div key={u.id} className="flex items-center justify-between px-4 py-2"
                          style={{ borderTop: "1px solid var(--border-subtle)" }}>
                          <div>
                            <p style={{ fontSize: "12px", color: "var(--text-1)" }}>{u.name}</p>
                            <p style={{ fontSize: "10px", color: "var(--text-4)" }}>{u.email} · {u.role}</p>
                          </div>
                          {u.id !== user.id && (
                            <button onClick={() => deleteUser(u.id)}
                              style={{ fontSize: "11px", color: "var(--red)", cursor: "pointer" }}>✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Add user form */}
                    {showAddUser && (
                      <div className="px-4 pb-3 pt-2" style={{ borderTop: "1px solid var(--border-subtle)", background: "rgba(167,139,250,0.03)" }}>
                        {["name", "email", "password"].map(field => (
                          <input key={field} value={newUser[field as keyof typeof newUser]} type={field === "password" ? "password" : "text"}
                            onChange={e => setNewUser(p => ({ ...p, [field]: e.target.value }))}
                            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                            className="w-full rounded-lg bg-transparent px-3 py-2 mb-2 outline-none"
                            style={{ fontSize: "12px", color: "var(--text-1)", border: "1px solid var(--border-subtle)" }} />
                        ))}
                        <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}
                          className="w-full rounded-lg px-3 py-2 mb-2 outline-none"
                          style={{ fontSize: "12px", color: "var(--text-1)", background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        {addUserError && <p style={{ fontSize: "11px", color: "var(--red)", marginBottom: "6px" }}>{addUserError}</p>}
                        <button onClick={addUser} className="w-full rounded-lg py-1.5 text-[12px] font-medium"
                          style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", color: "var(--forge)", cursor: "pointer" }}>
                          Create account
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Logout */}
                <button onClick={logout} className="flex w-full items-center px-4 py-2.5"
                  style={{ fontSize: "12px", color: "var(--red)", cursor: "pointer" }}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {activeTab === "runtime" && <div className="flex min-w-0 flex-1 flex-col overflow-hidden"><OperationalChat keyStatus={{ openai: !!user?.hasOpenaiKey, anthropic: !!user?.hasAnthropicKey }} /></div>}
          {activeTab === "forge"   && <div className="flex-1 overflow-hidden"><ForgeTab onOpenApps={() => { setActiveTab("apps"); localStorage.setItem("foundry-tab", "apps") }} /></div>}
          {activeTab === "apps"    && <div className="flex-1 overflow-hidden"><AppsTab onOpenForge={() => { setActiveTab("forge"); localStorage.setItem("foundry-tab", "forge") }} /></div>}
        </div>
      </div>
      <CommandPalette open={commandPaletteOpen} />
      <StatusRail />
    </AppShell>
  )
}

export default function Page() {
  return <InteractionProvider><FoundryPage /></InteractionProvider>
}
