"use client"

import { createRuntimeId } from "@/core/utils/create-runtime-id"
import { useEffect, useMemo, useRef, useState } from "react"
import { useInteraction } from "@/core/state/interaction-store"
import { useGitRuntime } from "@/hooks/useGitRuntime"
import { useFileRuntime } from "@/hooks/useFileRuntime"
import { useAiRuntime } from "@/hooks/useAiRuntime"
import { generateRuntimeImpacts } from "@/core/runtime/runtime-impact-engine"
import { generateCompressedContext } from "@/core/context/generate-compressed-context"
import { generateAiPrompt } from "@/core/context/generate-ai-prompt"
import type { OperationalEventType } from "@/core/types/operational-event"

function eventColors(type: OperationalEventType) {
  switch (type) {
    case "command":   return { bar: "var(--blue)",   label: "rgba(99,153,255,0.7)",  bg: "rgba(99,153,255,0.06)",  border: "rgba(99,153,255,0.14)" }
    case "result":    return { bar: null,             label: "var(--text-3)",         bg: "var(--bg-raised)",       border: "var(--border-subtle)" }
    case "error":     return { bar: "var(--red)",    label: "rgba(248,113,113,0.7)", bg: "rgba(248,113,113,0.06)", border: "rgba(248,113,113,0.14)" }
    case "checkpoint":return { bar: "var(--green)",  label: "rgba(74,222,128,0.7)",  bg: "rgba(74,222,128,0.06)",  border: "rgba(74,222,128,0.14)" }
    case "recovery":  return { bar: "var(--orange)", label: "rgba(251,146,60,0.7)",  bg: "rgba(251,146,60,0.06)",  border: "rgba(251,146,60,0.14)" }
    default:          return { bar: null,             label: "var(--text-4)",         bg: "transparent",            border: "transparent" }
  }
}

// Pipeline badge shown on result events
function PipelineBadge({ pipeline }: { pipeline?: string }) {
  if (!pipeline || pipeline === "error") return null
  const label = pipeline === "openai→claude" ? "GPT → Claude"
    : pipeline === "claude"  ? "Claude"
    : pipeline === "openai"  ? "GPT-4.1-mini"
    : null
  if (!label) return null
  return (
    <span
      className="ml-2 rounded px-1.5 py-0.5"
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "9px",
        letterSpacing: "0.06em",
        background: "rgba(167,139,250,0.1)",
        border: "1px solid rgba(167,139,250,0.2)",
        color: "var(--forge)",
      }}
    >
      {label}
    </span>
  )
}

export function OperationalChat() {
  const { latestCheckpoint, operationalEvents, appendOperationalEvent } = useInteraction()
  const gitRuntime    = useGitRuntime()
  const { loading, executePrompt } = useAiRuntime()
  const fileRuntime = useFileRuntime()
  const bottomRef     = useRef<HTMLDivElement | null>(null)

  const [openaiKey,    setOpenaiKey]    = useState("")
  const [anthropicKey, setAnthropicKey] = useState("")
  const [showKeys,     setShowKeys]     = useState(false)
  const [input,        setInput]        = useState("")
  const [builtPrompt,  setBuiltPrompt]  = useState("")

  // Load saved keys after mount — prevents SSR/client hydration mismatch
  useEffect(() => {
    const oa = localStorage.getItem("foundry-openai-key")
    const an = localStorage.getItem("foundry-anthropic-key")
    if (oa) setOpenaiKey(oa)
    if (an) setAnthropicKey(an)
  }, [])

  function saveOpenaiKey(v: string) {
    setOpenaiKey(v)
    localStorage.setItem("foundry-openai-key", v)
  }

  function saveAnthropicKey(v: string) {
    setAnthropicKey(v)
    localStorage.setItem("foundry-anthropic-key", v)
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
      fileRuntime,
      operationalMessages: operationalEvents.map((e) => ({
        id: e.id, role: e.type === "command" ? "user" : "system",
        content: e.content, createdAt: e.createdAt,
      })),
    }),
    [gitRuntime, impacts, latestCheckpoint, operationalEvents]
  )

  async function send() {
    if (!input.trim()) return

    appendOperationalEvent({
      id: createRuntimeId(), type: "command",
      content: input, createdAt: new Date().toISOString(),
    })

    const built = generateAiPrompt({ continuity: context, userMessage: input })
    setBuiltPrompt(built)
    setInput("")

    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }))

    if (!openaiKey.trim() && !anthropicKey.trim()) {
      appendOperationalEvent({
        id: createRuntimeId(), type: "error",
        content: "No API key set. Add an OpenAI key, an Anthropic key, or both.",
        createdAt: new Date().toISOString(),
      })
      return
    }

    const result = await executePrompt(
      { openaiKey: openaiKey.trim(), anthropicKey: anthropicKey.trim() },
      built,
    )

    // Store pipeline info in event metadata via content prefix for display
    appendOperationalEvent({
      id: createRuntimeId(),
      type: result?.pipeline === "error" ? "error" : "result",
      content: result?.content ?? "Request failed.",
      createdAt: new Date().toISOString(),
      // @ts-expect-error — extend event with pipeline for display
      pipeline: result?.pipeline,
    })

    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }))
  }

  async function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); await send() }
  }

  // Determine active pipeline label for the hint
  const pipelineHint = openaiKey && anthropicKey ? "GPT-4.1-mini → Claude"
    : anthropicKey ? "Claude"
    : openaiKey    ? "GPT-4.1-mini"
    : "no key set"

  return (
    <div className="flex h-full flex-col">

      {/* ── Stream ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-2">

          {operationalEvents.map((ev) => {
            const c = eventColors(ev.type)
            if (ev.type === "system_event") return (
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
                    <div className="flex items-center">
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: c.label }}>
                        {ev.type.replace(/_/g, " ")}
                      </span>
                      {/* @ts-expect-error pipeline is injected at runtime */}
                      {ev.type === "result" && <PipelineBadge pipeline={ev.pipeline} />}
                    </div>
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
            <div className="fade-up flex items-center gap-2.5 rounded-xl px-4 py-3" style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.12)" }}>
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--forge)", animation: `pulse-dot 1.2s ease ${i*0.2}s infinite` }} />
                ))}
              </div>
              <span style={{ fontSize: "12px", color: "var(--forge)" }}>
                {openaiKey && anthropicKey ? "GPT-4.1-mini structuring → Claude responding…" : "Processing…"}
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input zone ── */}
      <div className="shrink-0 px-4 pb-4">
        <div className="mx-auto max-w-2xl">

          {/* Main input card */}
          <div className="rounded-2xl" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border)" }}>
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
            <div className="border-t px-3 py-2.5" style={{ borderColor: "var(--border-subtle)" }}>

              {/* Keys row */}
              <div className="mb-2.5 flex items-center gap-3">
                {/* OpenAI key */}
                <div className="flex flex-1 items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: openaiKey ? "var(--green)" : "var(--border-strong)" }} />
                  <input
                    value={showKeys ? openaiKey : openaiKey ? "·".repeat(Math.min(openaiKey.length, 24)) : ""}
                    onChange={(e) => saveOpenaiKey(e.target.value)}
                    onFocus={(e) => { if (!showKeys) e.target.value = openaiKey }}
                    placeholder="OpenAI key"
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)" }}
                  />
                </div>

                <div className="h-3 w-px shrink-0" style={{ background: "var(--border)" }} />

                {/* Anthropic key */}
                <div className="flex flex-1 items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: anthropicKey ? "var(--forge)" : "var(--border-strong)" }} />
                  <input
                    value={showKeys ? anthropicKey : anthropicKey ? "·".repeat(Math.min(anthropicKey.length, 24)) : ""}
                    onChange={(e) => saveAnthropicKey(e.target.value)}
                    onFocus={(e) => { if (!showKeys) e.target.value = anthropicKey }}
                    placeholder="Anthropic key"
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)" }}
                  />
                </div>

                <button
                  onClick={() => setShowKeys(v => !v)}
                  style={{ fontSize: "10px", color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}
                >
                  {showKeys ? "hide" : "show"}
                </button>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between">
                {/* Pipeline indicator */}
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: "10px", color: "var(--text-4)" }}>pipeline:</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: openaiKey && anthropicKey ? "var(--forge)" : "var(--text-3)" }}>
                    {pipelineHint}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {builtPrompt && (
                    <button
                      onClick={() => navigator.clipboard.writeText(builtPrompt)}
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
          </div>

          <div className="mt-1.5 px-1 text-right" style={{ fontSize: "10px", color: "var(--text-4)" }}>
            ⌘↵ to execute
          </div>
        </div>
      </div>
    </div>
  )
}
