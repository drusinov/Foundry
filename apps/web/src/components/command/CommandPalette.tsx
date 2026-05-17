"use client"

import { useEffect, useMemo, useState } from "react"
import { commandRegistry } from "@/core/registry/command-registry"
import { useCommandActions } from "@/core/registry/command-actions"

// Symbol map — Apple-style icons for each command
const COMMAND_SYMBOLS: Record<string, string> = {
  "open-command-palette":  "⌘",
  "save-checkpoint":       "↓",
  "restore-checkpoint":    "↑",
  "push-updates":          "↗",
  "health-check":          "◎",
  "export-continuity":     "⤴",
  "compact-runtime":       "⊡",
  "generate-handoff":      "≡",
  "restart-runtime":       "↺",
}

type Props = { open: boolean }

export function CommandPalette({ open }: Props) {
  const [query, setQuery]           = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { executeCommand }          = useCommandActions()

  const filteredCommands = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return commandRegistry
    return commandRegistry.filter((cmd) =>
      cmd.label.toLowerCase().includes(q),
    )
  }, [query])

  // Reset selection on filter change
  useEffect(() => { setSelectedIndex(0) }, [query])

  // Reset on close
  useEffect(() => {
    if (!open) { setQuery(""); setSelectedIndex(0) }
  }, [open])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        const cmd = filteredCommands[selectedIndex]
        if (cmd) { executeCommand(cmd); setQuery("") }
      }
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, filteredCommands, selectedIndex, executeCommand])

  if (!open) return null

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]"
      style={{ background: "rgba(0,0,0,0.52)", backdropFilter: "blur(8px)" }}
    >
      {/* Palette */}
      <div
        className="palette-glass palette-open w-full max-w-[620px] overflow-hidden rounded-2xl shadow-2xl"
        style={{
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.06)",
        }}
      >
        {/* Search field */}
        <div
          className="flex items-center gap-3 px-4"
          style={{ borderBottom: "1px solid var(--sep-subtle)" }}
        >
          {/* Spotlight magnifier */}
          <svg
            width="15" height="15" viewBox="0 0 15 15" fill="none"
            style={{ color: "var(--label-3)", flexShrink: 0 }}
          >
            <path
              d="M10 6.5C10 8.43 8.43 10 6.5 10C4.57 10 3 8.43 3 6.5C3 4.57 4.57 3 6.5 3C8.43 3 10 4.57 10 6.5ZM9.43 10.14L12.15 12.86"
              stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
            />
          </svg>

          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search runtime commands…"
            className="flex-1 bg-transparent py-4 outline-none"
            style={{
              fontSize: "15px",
              color: "var(--label-1)",
              fontFamily: "var(--font-ui)",
            }}
          />

          {/* ESC badge */}
          <kbd
            className="rounded px-1.5 py-0.5 text-[10px] select-none"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--sep-subtle)",
              color: "var(--label-3)",
              fontFamily: "var(--font-ui)",
            }}
          >
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[340px] overflow-y-auto py-1.5">
          {filteredCommands.length === 0 ? (
            <div
              className="px-4 py-8 text-center text-[13px]"
              style={{ color: "var(--label-3)" }}
            >
              No commands match &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const active = selectedIndex === idx
              return (
                <button
                  key={cmd.id}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => { executeCommand(cmd); setQuery("") }}
                  className="flex w-full items-center gap-3 px-3 py-2 mx-1.5 transition-none"
                  style={{
                    width: "calc(100% - 12px)",
                    borderRadius: "8px",
                    background: active ? "var(--bg-selected)" : "transparent",
                  }}
                >
                  {/* Symbol */}
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[14px]"
                    style={{
                      background: active
                        ? "rgba(10,132,255,0.18)"
                        : "var(--bg-elevated)",
                      color: active ? "var(--blue)" : "var(--label-3)",
                      fontFamily: "var(--font-ui)",
                    }}
                  >
                    {COMMAND_SYMBOLS[cmd.id] ?? "·"}
                  </div>

                  {/* Label */}
                  <span
                    className="flex-1 text-left text-[13px] font-medium"
                    style={{ color: active ? "var(--label-1)" : "var(--label-2)" }}
                  >
                    {cmd.label}
                  </span>

                  {/* Shortcut */}
                  {cmd.shortcut.length > 0 && (
                    <div className="flex items-center gap-0.5">
                      {cmd.shortcut.map((key, i) => (
                        <kbd
                          key={i}
                          className="rounded px-1.5 py-0.5 text-[10px]"
                          style={{
                            background: active ? "rgba(10,132,255,0.15)" : "var(--bg-elevated)",
                            border: `1px solid ${active ? "rgba(10,132,255,0.3)" : "var(--sep-subtle)"}`,
                            color: active ? "var(--blue)" : "var(--label-3)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer hints — Apple HIG style */}
        <div
          className="flex items-center gap-4 px-4 py-2.5"
          style={{
            borderTop: "1px solid var(--sep-subtle)",
          }}
        >
          {[
            ["↑↓", "navigate"],
            ["↵", "execute"],
            ["⌘K", "close"],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <kbd
                className="rounded px-1.5 py-0.5 text-[10px]"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--sep-subtle)",
                  color: "var(--label-3)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {key}
              </kbd>
              <span style={{ fontSize: "11px", color: "var(--label-4)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
