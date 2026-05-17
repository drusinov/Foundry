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

// Apple-system-color tinting per event type
function eventStyle(type: OperationalEventType): {
  bg: string; border: string; labelColor: string; barColor?: string
} {
  switch (type) {
    case "command":
      return {
        bg: "rgba(10,132,255,0.07)",
        border: "rgba(10,132,255,0.2)",
        labelColor: "rgba(10,132,255,0.8)",
        barColor: "#0A84FF",
      }
    case "result":
      return {
        bg: "rgba(255,255,255,0.034)",
        border: "rgba(255,255,255,0.08)",
        labelColor: "rgba(235,235,245,0.35)",
      }
    case "error":
      return {
        bg: "rgba(255,69,58,0.08)",
        border: "rgba(255,69,58,0.22)",
        labelColor: "rgba(255,69,58,0.75)",
        barColor: "#FF453A",
      }
    case "checkpoint":
      return {
        bg: "rgba(48,209,88,0.07)",
        border: "rgba(48,209,88,0.2)",
        labelColor: "rgba(48,209,88,0.75)",
        barColor: "#30D158",
      }
    case "recovery":
      return {
        bg: "rgba(255,159,10,0.07)",
        border: "rgba(255,159,10,0.2)",
        labelColor: "rgba(255,159,10,0.75)",
        barColor: "#FF9F0A",
      }
    case "system_event":
    default:
      return {
        bg: "transparent",
        border: "transparent",
        labelColor: "rgba(235,235,245,0.2)",
      }
  }
}

export function OperationalChat() {
  const { latestCheckpoint, operationalEvents, appendOperationalEvent } = useInteraction()
  const gitRuntime = useGitRuntime()
  const { loading, executePrompt } = useAiRuntime()
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window === "undefined") return ""
    return localStorage.getItem("foundry-openai-key") ?? ""
  })

  const [input, setInput] = useState("")
  const [generatedPrompt, setGeneratedPrompt] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)

  function handleApiKeyChange(value: string) {
    setApiKey(value)
    if (typeof window !== "undefined") {
      localStorage.setItem("foundry-openai-key", value)
    }
  }

  const runtimeImpacts = useMemo(() => {
    if (!gitRuntime) return []
    return generateRuntimeImpacts(gitRuntime.diffEntries)
  }, [gitRuntime])

  const compressedContext = useMemo(() => {
    return generateCompressedContext({
      gitRuntime,
      runtimeImpacts,
      latestCheckpoint,
      operationalMessages: operationalEvents.map((e) => ({
        id: e.id,
        role: e.type === "command" ? "user" : "system",
        content: e.content,
        createdAt: e.createdAt,
      })),
    })
  }, [gitRuntime, runtimeImpacts, latestCheckpoint, operationalEvents])

  async function sendMessage() {
    if (!input.trim()) return

    appendOperationalEvent({
      id: createRuntimeId(),
      type: "command",
      content: input,
      createdAt: new Date().toISOString(),
    })

    const prompt = generateAiPrompt({ continuity: compressedContext, userMessage: input })
    setGeneratedPrompt(prompt)
    setInput("")

    requestAnimationFrame(() =>
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
    )

    if (!apiKey.trim()) {
      appendOperationalEvent({
        id: createRuntimeId(),
        type: "error",
        content: "OpenAI API key not set. Add it in the input area below.",
        createdAt: new Date().toISOString(),
      })
      return
    }

    const aiResponse = await executePrompt(apiKey, prompt)

    appendOperationalEvent({
      id: createRuntimeId(),
      type: aiResponse ? "result" : "error",
      content: aiResponse ?? "AI runtime request failed.",
      createdAt: new Date().toISOString(),
    })

    requestAnimationFrame(() =>
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
    )
  }

  async function copyPrompt() {
    if (generatedPrompt) await navigator.clipboard.writeText(generatedPrompt)
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      await sendMessage()
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Event stream */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-1">
          {operationalEvents.map((event) => {
            const style = eventStyle(event.type)
            const isSystem = event.type === "system_event"

            if (isSystem) {
              return (
                <div key={event.id} className="event-in flex items-center gap-2 px-1 py-1">
                  <div
                    className="h-px flex-1"
                    style={{ background: "var(--sep-subtle)" }}
                  />
                  <span
                    className="text-mono shrink-0"
                    style={{ color: "var(--label-4)", fontSize: "10px", letterSpacing: "0.05em" }}
                  >
                    {event.content} · {event.createdAt.slice(11, 19)}
                  </span>
                  <div
                    className="h-px flex-1"
                    style={{ background: "var(--sep-subtle)" }}
                  />
                </div>
              )
            }

            return (
              <div
                key={event.id}
                className="event-in flex gap-2.5 rounded-xl p-3"
                style={{
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                }}
              >
                {/* Color bar for command/error/checkpoint */}
                {style.barColor && (
                  <div
                    className="mt-0.5 w-0.5 shrink-0 self-stretch rounded-full"
                    style={{ background: style.barColor }}
                  />
                )}

                <div className="min-w-0 flex-1">
                  {/* Meta row */}
                  <div className="mb-1.5 flex items-center justify-between">
                    <span
                      className="text-mono uppercase"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.08em",
                        color: style.labelColor,
                      }}
                    >
                      {event.type.replace(/_/g, " ")}
                    </span>
                    <span
                      className="text-mono"
                      style={{ fontSize: "10px", color: "var(--label-4)" }}
                    >
                      {event.createdAt.slice(11, 19)}
                    </span>
                  </div>

                  {/* Content */}
                  <div
                    className="whitespace-pre-wrap leading-relaxed"
                    style={{
                      fontSize: "13px",
                      color: "var(--label-1)",
                      fontFamily:
                        event.type === "command" ? "var(--font-ui)" : "var(--font-ui)",
                    }}
                  >
                    {event.content}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Loading indicator */}
          {loading && (
            <div
              className="event-in flex items-center gap-2.5 rounded-xl p-3"
              style={{
                background: "rgba(10,132,255,0.06)",
                border: "1px solid rgba(10,132,255,0.15)",
              }}
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: "var(--blue)",
                      animation: `pulse-live 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: "12px", color: "var(--blue)" }}>
                Processing operational request…
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div
        className="shrink-0 p-3"
        style={{ borderTop: "1px solid var(--sep-subtle)" }}
      >
        {/* API key row */}
        <div className="mb-2 flex items-center gap-2">
          <div
            className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2"
            style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--sep-subtle)",
            }}
          >
            <div
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ background: apiKey ? "var(--green)" : "var(--label-4)" }}
            />
            <input
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="OpenAI API key"
              type={showApiKey ? "text" : "password"}
              className="flex-1 bg-transparent outline-none"
              style={{
                fontSize: "12px",
                color: apiKey ? "var(--label-2)" : "var(--label-4)",
                fontFamily: "var(--font-mono)",
              }}
            />
            <button
              onClick={() => setShowApiKey((v) => !v)}
              style={{ fontSize: "10px", color: "var(--label-4)" }}
              className="shrink-0 uppercase tracking-wide"
            >
              {showApiKey ? "hide" : "show"}
            </button>
          </div>
        </div>

        {/* Message input */}
        <div
          className="rounded-xl p-3"
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--sep)",
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send operational request… ⌘↵ to execute"
            rows={3}
            className="w-full resize-none bg-transparent outline-none"
            style={{
              fontSize: "13px",
              color: "var(--label-1)",
              fontFamily: "var(--font-ui)",
              lineHeight: "1.5",
            }}
          />

          {/* Controls */}
          <div className="mt-2 flex items-center justify-between">
            <button
              onClick={copyPrompt}
              disabled={!generatedPrompt}
              className="rounded-md px-2.5 py-1.5 text-[12px] transition"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--sep-subtle)",
                color: generatedPrompt ? "var(--label-2)" : "var(--label-4)",
                opacity: generatedPrompt ? 1 : 0.5,
                cursor: generatedPrompt ? "pointer" : "not-allowed",
              }}
            >
              Copy Prompt
            </button>

            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="rounded-lg px-4 py-1.5 text-[13px] font-medium transition"
              style={{
                background: loading || !input.trim()
                  ? "rgba(10,132,255,0.1)"
                  : "rgba(10,132,255,0.18)",
                border: "1px solid rgba(10,132,255,0.3)",
                color: loading || !input.trim()
                  ? "rgba(10,132,255,0.45)"
                  : "var(--blue)",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Running…" : "Execute"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
