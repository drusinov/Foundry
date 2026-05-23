"use client"

import { createRuntimeId } from "@/core/utils/create-runtime-id"
import { useEffect, useMemo, useRef, useState } from "react"
import { useInteraction } from "@/core/state/interaction-store"
import { useGitRuntime } from "@/hooks/useGitRuntime"
import { useAiRuntime } from "@/hooks/useAiRuntime"
import { useFileRuntime } from "@/hooks/useFileRuntime"
import { generateRuntimeImpacts } from "@/core/runtime/runtime-impact-engine"
import { generateCompressedContext } from "@/core/context/generate-compressed-context"
import { generateAiPrompt } from "@/core/context/generate-ai-prompt"
import type { OperationalEventType } from "@/core/types/operational-event"
import type { AiUsage } from "@/hooks/useAiRuntime"

// ── Markdown renderer ─────────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(`[^`\n]+`|\*\*[^*]+\*\*|\*[^*\n]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "var(--text-1)", fontWeight: 600 }}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} style={{
          fontFamily: "var(--font-mono)", fontSize: "12px",
          background: "rgba(255,255,255,0.08)", borderRadius: "4px",
          padding: "1px 5px", color: "var(--cyan)",
        }}>
          {part.slice(1, -1)}
        </code>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="relative my-3 overflow-hidden rounded-xl" style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-4)", letterSpacing: "0.05em" }}>
          {lang || "code"}
        </span>
        <button onClick={copy} style={{ fontSize: "11px", color: copied ? "var(--green)" : "var(--text-4)", cursor: "pointer" }}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3" style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "12px", lineHeight: "1.6", color: "var(--text-1)" }}>
        <code>{code.trimEnd()}</code>
      </pre>
    </div>
  )
}

function MarkdownContent({ text }: { text: string }) {
  // Split on fenced code blocks first
  const segments = text.split(/(```[\w]*\n[\s\S]*?```)/g)

  return (
    <div className="space-y-1">
      {segments.map((seg, si) => {
        // Code block
        const codeMatch = seg.match(/^```([\w]*)\n([\s\S]*?)```$/)
        if (codeMatch) {
          return <CodeBlock key={si} lang={codeMatch[1]} code={codeMatch[2]} />
        }

        // Text block — process line by line
        const lines = seg.split("\n")
        const nodes: React.ReactNode[] = []
        let listItems: { text: string; ordered: boolean }[] = []
        let listOrdered = false

        function flushList() {
          if (!listItems.length) return
          const Tag = listOrdered ? "ol" : "ul"
          nodes.push(
            <Tag key={`list-${nodes.length}`} style={{ paddingLeft: "1.2em", margin: "6px 0", color: "var(--text-2)" }}>
              {listItems.map((item, i) => (
                <li key={i} style={{ fontSize: "13px", lineHeight: "1.7", marginBottom: "2px" }}>
                  {renderInline(item.text)}
                </li>
              ))}
            </Tag>
          )
          listItems = []
        }

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]

          // Heading
          const h = line.match(/^(#{1,3})\s+(.+)/)
          if (h) {
            flushList()
            const sizes = { 1: "15px", 2: "14px", 3: "13px" }
            const size = sizes[h[1].length as 1 | 2 | 3] ?? "13px"
            nodes.push(
              <div key={`h-${i}`} style={{ fontSize: size, fontWeight: 600, color: "var(--text-1)", marginTop: "12px", marginBottom: "4px" }}>
                {renderInline(h[2])}
              </div>
            )
            continue
          }

          // Horizontal rule
          if (line.match(/^---+$/)) {
            flushList()
            nodes.push(<div key={`hr-${i}`} style={{ height: "1px", background: "var(--border-subtle)", margin: "10px 0" }} />)
            continue
          }

          // Unordered list
          const ul = line.match(/^[-*•]\s+(.+)/)
          if (ul) {
            if (listItems.length && listOrdered) flushList()
            listOrdered = false
            listItems.push({ text: ul[1], ordered: false })
            continue
          }

          // Ordered list
          const ol = line.match(/^\d+\.\s+(.+)/)
          if (ol) {
            if (listItems.length && !listOrdered) flushList()
            listOrdered = true
            listItems.push({ text: ol[1], ordered: true })
            continue
          }

          // Empty line — paragraph break
          if (!line.trim()) {
            flushList()
            continue
          }

          // Regular paragraph line
          flushList()
          nodes.push(
            <div key={`p-${i}`} style={{ fontSize: "13px", lineHeight: "1.7", color: "var(--text-1)" }}>
              {renderInline(line)}
            </div>
          )
        }
        flushList()

        return <div key={si}>{nodes}</div>
      })}
    </div>
  )
}

// ── Event coloring ────────────────────────────────────────────────────────────

function eventColors(type: OperationalEventType) {
  switch (type) {
    case "command":    return { bar: "var(--blue)",   label: "rgba(99,153,255,0.7)",  bg: "rgba(99,153,255,0.06)",  border: "rgba(99,153,255,0.14)" }
    case "result":     return { bar: null,             label: "var(--text-3)",          bg: "var(--bg-raised)",        border: "var(--border-subtle)" }
    case "error":      return { bar: "var(--red)",    label: "rgba(248,113,113,0.7)", bg: "rgba(248,113,113,0.06)", border: "rgba(248,113,113,0.14)" }
    case "checkpoint": return { bar: "var(--green)",  label: "rgba(74,222,128,0.7)",  bg: "rgba(74,222,128,0.06)",  border: "rgba(74,222,128,0.14)" }
    case "recovery":   return { bar: "var(--orange)", label: "rgba(251,146,60,0.7)",  bg: "rgba(251,146,60,0.06)",  border: "rgba(251,146,60,0.14)" }
    default:           return { bar: null,             label: "var(--text-4)",          bg: "transparent",             border: "transparent" }
  }
}

// ── Token badge ───────────────────────────────────────────────────────────────

function TokenBadge({ usage }: { usage?: AiUsage }) {
  if (!usage || (usage.inputTokens === 0 && usage.outputTokens === 0)) return null
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-4)" }}>
      ↑{fmt(usage.inputTokens)} ↓{fmt(usage.outputTokens)}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

type ExtendedEvent = {
  id: string; type: OperationalEventType; content: string; createdAt: string;
  pipeline?: string; usage?: AiUsage
}

export function OperationalChat() {
  const { latestCheckpoint, operationalEvents, appendOperationalEvent } = useInteraction()
  const gitRuntime    = useGitRuntime()
  const fileRuntime   = useFileRuntime()
  const { loading, executePrompt } = useAiRuntime()
  const bottomRef     = useRef<HTMLDivElement | null>(null)

  const [openaiKey,    setOpenaiKey]    = useState("")
  const [anthropicKey, setAnthropicKey] = useState("")
  const [showKeys,     setShowKeys]     = useState(false)
  const [input,        setInput]        = useState("")
  const [builtPrompt,  setBuiltPrompt]  = useState("")

  // Session token totals
  const [sessionTokens, setSessionTokens] = useState({ input: 0, output: 0 })
  // Copy button feedback per event
  const [copiedId, setCopiedId] = useState<string | null>(null)
  // Streaming in-progress content
  const [streamingContent, setStreamingContent] = useState("")
  // Model selector
  const [claudeModel, setClaudeModel] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("foundry-claude-model") ?? "claude-sonnet-4-6") : "claude-sonnet-4-6"
  )

  function copyEvent(id: string, content: string) {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  useEffect(() => {
    const oa = localStorage.getItem("foundry-openai-key")
    const an = localStorage.getItem("foundry-anthropic-key")
    if (oa) setOpenaiKey(oa)
    if (an) setAnthropicKey(an)
  }, [])

  // Health monitor — poll every 60s, post system events on crashes
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("/api/apps/health")
        const { crashed } = await res.json()
        if (Array.isArray(crashed)) {
          crashed.forEach((app: { name: string; pm2Name: string; restarts: number }) => {
            appendOperationalEvent({
              id: createRuntimeId(), type: "error",
              content: `⚠ Forged app "${app.name}" is crashing (${app.restarts} restarts). Check Logs in the Apps tab.`,
              createdAt: new Date().toISOString(),
            })
          })
        }
      } catch { /* non-fatal */ }
    }
    const interval = setInterval(checkHealth, 60_000)
    return () => clearInterval(interval)
  }, [appendOperationalEvent])

  function saveOpenaiKey(v: string)    { setOpenaiKey(v);    localStorage.setItem("foundry-openai-key",    v) }
  function saveAnthropicKey(v: string) { setAnthropicKey(v); localStorage.setItem("foundry-anthropic-key", v) }

  const impacts = useMemo(() =>
    gitRuntime ? generateRuntimeImpacts(gitRuntime.diffEntries) : [], [gitRuntime])

  const context = useMemo(() =>
    generateCompressedContext({
      gitRuntime, runtimeImpacts: impacts, latestCheckpoint, fileRuntime,
      operationalMessages: operationalEvents.map((e) => ({
        id: e.id, role: e.type === "command" ? "user" : "system",
        content: e.content, createdAt: e.createdAt,
      })),
    }),
    [gitRuntime, fileRuntime, impacts, latestCheckpoint, operationalEvents]
  )

  const events = operationalEvents as unknown as ExtendedEvent[]

  async function send() {
    if (!input.trim()) return

    const cmdId = createRuntimeId()
    appendOperationalEvent({ id: cmdId, type: "command", content: input, createdAt: new Date().toISOString() })
    const built = generateAiPrompt({ continuity: context, userMessage: input })
    setBuiltPrompt(built)
    setInput("")
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }))

    if (!openaiKey.trim() && !anthropicKey.trim()) {
      appendOperationalEvent({ id: createRuntimeId(), type: "error", content: "No API key set.", createdAt: new Date().toISOString() })
      return
    }

    // Streaming — update streamingContent as chunks arrive
    const result = await executePrompt(
      { openaiKey: openaiKey.trim(), anthropicKey: anthropicKey.trim() },
      built,
      claudeModel,
      (partial) => {
        setStreamingContent(partial)
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }))
      },
    )

    // Streaming done — clear live content and append final event
    setStreamingContent("")

    setSessionTokens(prev => ({
      input:  prev.input  + result.usage.inputTokens,
      output: prev.output + result.usage.outputTokens,
    }))

    appendOperationalEvent({
      id:        createRuntimeId(),
      type:      result.pipeline === "error" ? "error" : "result",
      content:   result.content,
      createdAt: new Date().toISOString(),
      pipeline:  result.pipeline,
      usage:     result.usage,
    })
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }))
  }

  async function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); await send() }
  }

  const pipelineHint = openaiKey && anthropicKey ? "GPT-4.1-mini → Claude"
    : anthropicKey ? "Claude" : openaiKey ? "GPT-4.1-mini" : "no key set"

  const fmtTokens = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

  return (
    <div className="flex h-full flex-col">

      {/* ── Event stream ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-2">

          {events.map((ev) => {
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
              <div key={ev.id} className="fade-up group relative rounded-xl p-3.5" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                {/* Copy button — appears on hover */}
                <button
                  onClick={() => copyEvent(ev.id, ev.content)}
                  className="absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 rounded-md px-2 py-1 transition-opacity"
                  style={{ fontSize: "10px", color: copiedId === ev.id ? "var(--green)" : "var(--text-4)", background: "var(--bg-overlay)", border: `1px solid ${copiedId === ev.id ? "rgba(74,222,128,0.3)" : "var(--border-subtle)"}`, transition: "color 150ms, border-color 150ms" }}
                >
                  {copiedId === ev.id ? "Copied ✓" : "Copy"}
                </button>

                <div className="flex gap-3">
                  {c.bar && <div className="mt-0.5 w-0.5 shrink-0 self-stretch rounded-full" style={{ background: c.bar }} />}
                  <div className="min-w-0 flex-1">
                    {/* Meta row */}
                    <div className="mb-2 flex items-center gap-2 flex-wrap">
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: c.label }}>
                        {ev.type.replace(/_/g, " ")}
                      </span>
                      {ev.pipeline && ev.pipeline !== "error" && (
                        <span className="rounded px-1.5 py-0.5" style={{ fontFamily: "var(--font-mono)", fontSize: "9px", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.18)", color: "var(--forge)" }}>
                          {ev.pipeline === "openai→claude" ? "GPT → Claude" : ev.pipeline === "claude" ? "Claude" : "GPT"}
                        </span>
                      )}
                      <TokenBadge usage={ev.usage} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-4)", marginLeft: "auto" }}>
                        {ev.createdAt.slice(11, 19)}
                      </span>
                    </div>

                    {/* Content — markdown for result events, plain for others */}
                    {ev.type === "result" ? (
                      <MarkdownContent text={ev.content} />
                    ) : (
                      <div style={{ fontSize: "13px", lineHeight: "1.6", color: "var(--text-1)", whiteSpace: "pre-wrap" }}>
                        {ev.content}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Live streaming event */}
          {streamingContent && (
            <div className="fade-up flex gap-3 rounded-xl p-3.5" style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)" }}>result</span>
                  <span className="rounded px-1.5 py-0.5" style={{ fontFamily: "var(--font-mono)", fontSize: "9px", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.18)", color: "var(--forge)" }}>
                    {openaiKey && anthropicKey ? "GPT → Claude" : anthropicKey ? "Claude" : "GPT"} ·&nbsp;
                    <span className="inline-block w-1.5 h-1.5 rounded-full align-middle" style={{ background: "var(--forge)", animation: "pulse-dot 1s ease infinite" }} />
                  </span>
                </div>
                <MarkdownContent text={streamingContent} />
              </div>
            </div>
          )}

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
          {/* Sticky copy last response */}
          {(() => {
            const lastResult = [...events].reverse().find(e => e.type === "result")
            if (!lastResult) return null
            return (
              <div className="sticky bottom-2 flex justify-center mt-2">
                <button
                  onClick={() => copyEvent(lastResult.id, lastResult.content)}
                  className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-medium shadow-lg"
                  style={{
                    background: copiedId === lastResult.id ? "rgba(74,222,128,0.15)" : "var(--bg-overlay)",
                    border: `1px solid ${copiedId === lastResult.id ? "rgba(74,222,128,0.3)" : "var(--border)"}`,
                    color: copiedId === lastResult.id ? "var(--green)" : "var(--text-3)",
                    backdropFilter: "blur(8px)",
                    transition: "all 150ms",
                  }}
                >
                  {copiedId === lastResult.id ? "✓ Copied" : "Copy last response"}
                </button>
              </div>
            )
          })()}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input zone ── */}
      <div className="shrink-0 px-4 pb-4">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border)" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Send operational request…"
              rows={2}
              className="w-full resize-none bg-transparent px-4 pt-3 pb-1 outline-none"
              style={{ fontSize: "14px", lineHeight: "1.6", fontFamily: "var(--font-ui)" }}
            />

            <div className="border-t px-3 py-2.5" style={{ borderColor: "var(--border-subtle)" }}>
              {/* Keys row */}
              <div className="mb-2.5 flex items-center gap-3">
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
                <button onClick={() => setShowKeys(v => !v)} style={{ fontSize: "10px", color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>
                  {showKeys ? "hide" : "show"}
                </button>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between">
                {/* Pipeline + session tokens */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: "10px", color: "var(--text-4)" }}>pipeline:</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: openaiKey && anthropicKey ? "var(--forge)" : "var(--text-3)" }}>
                      {pipelineHint}
                    </span>
                  </div>
                  {/* Model selector */}
                  <div className="flex items-center gap-1">
                    {[
                      { id: "claude-haiku-4-5-20251001", label: "Haiku" },
                      { id: "claude-sonnet-4-6",         label: "Sonnet" },
                      { id: "claude-opus-4-6",           label: "Opus" },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => { setClaudeModel(id); localStorage.setItem("foundry-claude-model", id) }}
                        className="rounded-md px-2 py-0.5 text-[10px]"
                        style={{
                          background: claudeModel === id ? "rgba(167,139,250,0.14)" : "transparent",
                          border: `1px solid ${claudeModel === id ? "rgba(167,139,250,0.3)" : "var(--border-subtle)"}`,
                          color: claudeModel === id ? "var(--forge)" : "var(--text-4)",
                          cursor: "pointer",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {(sessionTokens.input > 0 || sessionTokens.output > 0) && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-4)" }}>
                      ↑{fmtTokens(sessionTokens.input)} ↓{fmtTokens(sessionTokens.output)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {builtPrompt && (
                    <button onClick={() => navigator.clipboard.writeText(builtPrompt)} className="rounded-lg px-3 py-1.5"
                      style={{ background: "var(--bg-hover)", border: "1px solid var(--border-subtle)", fontSize: "12px", color: "var(--text-3)" }}>
                      Copy prompt
                    </button>
                  )}
                  <button onClick={send} disabled={loading || !input.trim()} className="rounded-lg px-4 py-1.5 font-medium"
                    style={{
                      background: loading || !input.trim() ? "transparent" : "rgba(99,153,255,0.15)",
                      border: `1px solid ${loading || !input.trim() ? "var(--border-subtle)" : "rgba(99,153,255,0.3)"}`,
                      fontSize: "13px",
                      color: loading || !input.trim() ? "var(--text-4)" : "var(--blue)",
                      cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                    }}>
                    {loading ? "Running…" : "Execute"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-1.5 px-1 text-right" style={{ fontSize: "10px", color: "var(--text-4)" }}>⌘↵ to execute</div>
        </div>
      </div>
    </div>
  )
}
