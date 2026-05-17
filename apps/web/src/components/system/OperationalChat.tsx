"use client"

import { createRuntimeId } from "@/core/utils/create-runtime-id"
import { useMemo, useRef, useState } from "react"
import { useInteraction } from "@/core/state/interaction-store"
import { useGitRuntime } from "@/hooks/useGitRuntime"
import { useAiRuntime } from "@/hooks/useAiRuntime"
import { generateRuntimeImpacts } from "@/core/runtime/runtime-impact-engine"
import { generateCompressedContext } from "@/core/context/generate-compressed-context"
import { generateAiPrompt } from "@/core/context/generate-ai-prompt"
import type { OperationalEventType } from "@/core/types/operational-event"

function eventColors(type: OperationalEventType) {
  switch (type) {
    case "command":
      return { bar: "var(--blue)", label: "rgba(99,153,255,0.7)", bg: "rgba(99,153,255,0.06)", border: "rgba(99,153,255,0.14)" }
    case "result":
      return { bar: null, label: "var(--text-3)", bg: "var(--bg-raised)", border: "var(--border-subtle)" }
    case "error":
      return { bar: "var(--red)", label: "rgba(248,113,113,0.7)", bg: "rgba(248,113,113,0.06)", border: "rgba(248,113,113,0.14)" }
    case "checkpoint":
      return { bar: "var(--green)", label: "rgba(74,222,128,0.7)", bg: "rgba(74,222,128,0.06)", border: "rgba(74,222,128,0.14)" }
    case "recovery":
      return { bar: "var(--orange)", label: "rgba(251,146,60,0.7)", bg: "rgba(251,146,60,0.06)", border: "rgba(251,146,60,0.14)" }
    default:
      return { bar: null, label: "var(--text-4)", bg: "transparent", border: "transparent" }
  }
}

export function OperationalChat() {
  const { latestCheckpoint, operationalEvents, appendOperationalEvent } = useInteraction()
  const gitRuntime    = useGitRuntime()
  const { loading, executePrompt } = useAiRuntime()
  const bottomRef     = useRef<HTMLDivElement | null>(null)

  const [apiKey, setApiKey] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("foundry-key") ?? "") : ""
  )
  const [showKey, setShowKey] = useState(false)
  const [input, setInput]     = useState("")
  const [prompt, setPrompt]   = useState("")

  function saveKey(v: string) {
    setApiKey(v)
    if (typeof window !== "undefined") localStorage.setItem("foundry-key", v)
  }

  const impacts = useMemo(() =>
    gitRuntime ? generateRuntimeImpacts(gitRuntime.diffEntries) : [],
    [gitRuntime]
  )

  const context = useMemo(() =>
    generateCompressedContext({
      gitRuntime,
      runtimeImpacts: impacts,
      latestCheckpoint,
      operationalMessages: operationalEvents.map((e) => ({
        id: e.id, role: e.type === "command" ? "user" : "system",
        content: e.content, createdAt: e.createdAt,
      })),
    }),
    [gitRuntime, impacts, latestCheckpoint, operationalEvents]
  )

  async function send() {
    if (!input.trim()) return
    appendOperationalEvent({ id: createRuntimeId(), type: "command", content: input, createdAt: new Date().toISOString() })
    const built = generateAiPrompt({ continuity: context, userMessage: input })
    setPrompt(built)
    setInput("")
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }))

    if (!apiKey.trim()) {
      appendOperationalEvent({ id: createRuntimeId(), type: "error", content: "API key not set. Add your OpenAI key below.", createdAt: new Date().toISOString() })
      return
    }
    const res = await executePrompt(apiKey, built)
    appendOperationalEvent({ id: createRuntimeId(), type: res ? "result" : "error", content: res ?? "Request failed.", createdAt: new Date().toISOString() })
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }))
  }

  async function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); await send() }
  }

  return (
    <div className="flex h-full flex-col">

      {/* ── Stream ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-2">

          {operationalEvents.map((ev) => {
            const c = eventColors(ev.type)
            const isSystem = ev.type === "system_event"

            if (isSystem) return (
              <div key={ev.id} className="fade-up flex items-center gap-3 py-1">
                <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-4)" }}>
                  {ev.content} · {ev.createdAt.slice(11, 19)}
                </span>
                <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
              </div>
            )

            return (
              <div
                key={ev.id}
                className="fade-up flex gap-3 rounded-xl p-3.5"
                style={{ background: c.bg, border: `1px solid ${c.border}` }}
              >
                {c.bar && (
                  <div className="mt-0.5 w-0.5 shrink-0 self-stretch rounded-full" style={{ background: c.bar }} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: c.label }}>
                      {ev.type.replace(/_/g, " ")}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-4)" }}>
                      {ev.createdAt.slice(11, 19)}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", lineHeight: "1.6", color: "var(--text-1)", whiteSpace: "pre-wrap" }}>
                    {ev.content}
                  </div>
                </div>
              </div>
            )
          })}

          {loading && (
            <div className="fade-up flex items-center gap-2.5 rounded-xl px-4 py-3" style={{ background: "rgba(99,153,255,0.06)", border: "1px solid rgba(99,153,255,0.12)" }}>
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--blue)", animation: `pulse-dot 1.2s ease ${i*0.2}s infinite` }} />
                ))}
              </div>
              <span style={{ fontSize: "12px", color: "var(--blue)" }}>Processing…</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input zone ── */}
      <div className="shrink-0 px-4 pb-4">
        <div className="mx-auto max-w-2xl">

          {/* Main input card */}
          <div
            className="rounded-2xl"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border)" }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Send operational request…"
              rows={3}
              className="w-full resize-none bg-transparent px-4 pt-4 pb-2 outline-none"
              style={{ fontSize: "14px", lineHeight: "1.6", fontFamily: "var(--font-ui)" }}
            />

            {/* Bottom bar */}
            <div className="flex items-center justify-between border-t px-3 py-2.5" style={{ borderColor: "var(--border-subtle)" }}>

              {/* API key — compact, low-profile */}
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: apiKey ? "var(--green)" : "var(--border-strong)" }} />
                <input
                  value={apiKey}
                  onChange={(e) => saveKey(e.target.value)}
                  placeholder="API key"
                  type={showKey ? "text" : "password"}
                  className="w-36 bg-transparent outline-none"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)" }}
                />
                <button onClick={() => setShowKey(v => !v)} style={{ fontSize: "10px", color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {showKey ? "hide" : "show"}
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {prompt && (
                  <button
                    onClick={() => navigator.clipboard.writeText(prompt)}
                    className="rounded-lg px-3 py-1.5"
                    style={{ background: "var(--bg-hover)", border: "1px solid var(--border-subtle)", fontSize: "12px", color: "var(--text-3)" }}
                  >
                    Copy prompt
                  </button>
                )}
                <button
                  onClick={send}
                  disabled={loading || !input.trim()}
                  className="rounded-lg px-4 py-1.5 font-medium"
                  style={{
                    background: loading || !input.trim() ? "transparent" : "rgba(99,153,255,0.15)",
                    border: `1px solid ${loading || !input.trim() ? "var(--border-subtle)" : "rgba(99,153,255,0.3)"}`,
                    fontSize: "13px",
                    color: loading || !input.trim() ? "var(--text-4)" : "var(--blue)",
                    cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Running…" : "Execute"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-1.5 px-1 text-right" style={{ fontSize: "10px", color: "var(--text-4)" }}>
            ⌘↵ to execute
          </div>
        </div>
      </div>
    </div>
  )
}
