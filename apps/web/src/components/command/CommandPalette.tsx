"use client"

import { useEffect, useMemo, useState } from "react"
import { commandRegistry } from "@/core/registry/command-registry"
import { useCommandActions } from "@/core/registry/command-actions"

const SYMBOLS: Record<string, string> = {
  "save-checkpoint":    "↓",
  "restore-checkpoint": "↑",
  "push-updates":       "↗",
  "health-check":       "◎",
  "export-continuity":  "⤴",
  "compact-runtime":    "⊡",
  "generate-handoff":   "≡",
  "restart-runtime":    "↺",
}

export function CommandPalette({ open }: { open: boolean }) {
  const [query, setQuery]         = useState("")
  const [selected, setSelected]   = useState(0)
  const { executeCommand }        = useCommandActions()

  const results = useMemo(() => {
    const q = query.toLowerCase().trim()
    return q ? commandRegistry.filter(c => c.label.toLowerCase().includes(q)) : commandRegistry
  }, [query])

  useEffect(() => { setSelected(0) }, [query])
  useEffect(() => { if (!open) { setQuery(""); setSelected(0) } }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(i => Math.min(i+1, results.length-1)) }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(i => Math.max(i-1, 0)) }
      if (e.key === "Enter") {
        e.preventDefault()
        const cmd = results[selected]
        if (cmd) { executeCommand(cmd); setQuery("") }
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, results, selected, executeCommand])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ paddingTop: "16vh", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="palette-in w-full max-w-[580px] overflow-hidden rounded-2xl shadow-2xl"
        style={{
          background: "rgba(28,28,36,0.96)",
          border: "1px solid var(--border-strong)",
          backdropFilter: "blur(40px)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Search */}
        <div className="flex items-center gap-3 px-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--text-3)", flexShrink: 0 }}>
            <path d="M9 5.5C9 7.43 7.43 9 5.5 9C3.57 9 2 7.43 2 5.5C2 3.57 3.57 2 5.5 2C7.43 2 9 3.57 9 5.5ZM8.5 9.5L12 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search commands…"
            className="flex-1 bg-transparent py-4 outline-none"
            style={{ fontSize: "15px", fontFamily: "var(--font-ui)", color: "var(--text-1)" }}
          />
          <kbd style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-4)", background: "var(--bg-hover)", border: "1px solid var(--border-subtle)", borderRadius: "5px", padding: "2px 6px" }}>esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-1.5">
          {results.length === 0
            ? <div className="px-4 py-8 text-center" style={{ fontSize: "13px", color: "var(--text-3)" }}>No results for &ldquo;{query}&rdquo;</div>
            : results.map((cmd, i) => {
              const active = selected === i
              return (
                <button
                  key={cmd.id}
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => { executeCommand(cmd); setQuery("") }}
                  className="flex w-full items-center gap-3 px-2 mx-1.5"
                  style={{ width: "calc(100% - 12px)", borderRadius: "9px", background: active ? "var(--bg-selected)" : "transparent", padding: "8px 10px" }}
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[13px]"
                    style={{ background: active ? "rgba(99,153,255,0.2)" : "var(--bg-overlay)", color: active ? "var(--blue)" : "var(--text-3)" }}
                  >
                    {SYMBOLS[cmd.id] ?? "·"}
                  </div>
                  <span className="flex-1 text-left" style={{ fontSize: "13px", fontWeight: 500, color: active ? "var(--text-1)" : "var(--text-2)" }}>
                    {cmd.label}
                  </span>
                  {cmd.shortcut.length > 0 && (
                    <div className="flex gap-0.5">
                      {cmd.shortcut.map((k, j) => (
                        <kbd key={j} style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: active ? "var(--blue)" : "var(--text-3)", background: active ? "rgba(99,153,255,0.12)" : "var(--bg-hover)", border: `1px solid ${active ? "rgba(99,153,255,0.25)" : "var(--border-subtle)"}`, borderRadius: "5px", padding: "2px 6px" }}>
                          {k}
                        </kbd>
                      ))}
                    </div>
                  )}
                </button>
              )
            })
          }
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          {[["↑↓","navigate"],["↵","execute"],["esc","close"]].map(([k,l]) => (
            <div key={k} className="flex items-center gap-1.5">
              <kbd style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", background: "var(--bg-hover)", border: "1px solid var(--border-subtle)", borderRadius: "5px", padding: "2px 6px" }}>{k}</kbd>
              <span style={{ fontSize: "11px", color: "var(--text-4)" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
