"use client"

import { createRuntimeId } from "@/core/utils/create-runtime-id"

import {
  useMemo,
  useRef,
  useState,
} from "react"

import { useInteraction } from "@/core/state/interaction-store"

import { useGitRuntime } from "@/hooks/useGitRuntime"

import { useAiRuntime } from "@/hooks/useAiRuntime"

import { generateRuntimeImpacts } from "@/core/runtime/runtime-impact-engine"

import { generateCompressedContext } from "@/core/context/generate-compressed-context"

import { generateAiPrompt } from "@/core/context/generate-ai-prompt"

function getEventStyles(type: string): string {
  switch (type) {
    case "command":
      return "border border-cyan-500/15 bg-cyan-500/10 text-cyan-100"

    case "result":
      return "border border-white/10 bg-white/[0.04] text-zinc-200"

    case "checkpoint":
      return "border border-emerald-500/15 bg-emerald-500/10 text-emerald-200"

    case "error":
      return "border border-red-500/15 bg-red-500/10 text-red-300"

    case "recovery":
      return "border border-amber-500/15 bg-amber-500/10 text-amber-200"

    case "system_event":
      return "border border-white/[0.06] bg-white/[0.02] text-zinc-500"

    default:
      return "border border-white/[0.06] bg-white/[0.02] text-zinc-500"
  }
}

export function OperationalChat() {
  const {
    latestCheckpoint,
    operationalEvents,
    appendOperationalEvent,
  } = useInteraction()

  const gitRuntime = useGitRuntime()

  const { loading, executePrompt } =
    useAiRuntime()

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null)

  // Persist API key across page loads
  const [apiKey, setApiKey] = useState<string>(
    () => {
      if (typeof window === "undefined") return ""
      return (
        localStorage.getItem(
          "foundry-openai-key",
        ) ?? ""
      )
    },
  )

  function handleApiKeyChange(value: string) {
    setApiKey(value)
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "foundry-openai-key",
        value,
      )
    }
  }

  const [input, setInput] = useState("")

  const [generatedPrompt, setGeneratedPrompt] =
    useState("")

  const runtimeImpacts = useMemo(() => {
    if (!gitRuntime) return []
    return generateRuntimeImpacts(
      gitRuntime.diffEntries,
    )
  }, [gitRuntime])

  const compressedContext = useMemo(() => {
    return generateCompressedContext({
      gitRuntime,
      runtimeImpacts,
      latestCheckpoint,
      operationalMessages: operationalEvents.map(
        (event) => ({
          id: event.id,
          role:
            event.type === "command"
              ? "user"
              : "system",
          content: event.content,
          createdAt: event.createdAt,
        }),
      ),
    })
  }, [
    gitRuntime,
    runtimeImpacts,
    latestCheckpoint,
    operationalEvents,
  ])

  async function sendMessage() {
    if (!input.trim()) return

    appendOperationalEvent({
      id: createRuntimeId(),
      type: "command",
      content: input,
      createdAt: new Date().toISOString(),
    })

    const prompt = generateAiPrompt({
      continuity: compressedContext,
      userMessage: input,
    })

    setGeneratedPrompt(prompt)
    setInput("")

    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      })
    })

    if (!apiKey.trim()) {
      appendOperationalEvent({
        id: createRuntimeId(),
        type: "error",
        content:
          "OpenAI API key not configured. Enter key in Runtime Config below.",
        createdAt: new Date().toISOString(),
      })
      return
    }

    const aiResponse = await executePrompt(
      apiKey,
      prompt,
    )

    appendOperationalEvent({
      id: createRuntimeId(),
      type: aiResponse ? "result" : "error",
      content:
        aiResponse ?? "AI runtime request failed.",
      createdAt: new Date().toISOString(),
    })

    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      })
    })
  }

  async function copyPrompt() {
    if (generatedPrompt) {
      await navigator.clipboard.writeText(
        generatedPrompt,
      )
    }
  }

  async function handleInputKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === "Enter" &&
      (event.metaKey || event.ctrlKey)
    ) {
      event.preventDefault()
      await sendMessage()
    }
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-white/10 bg-white/[0.02]">
      {/* Event stream */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-2">
          {operationalEvents.map((event) => (
            <div
              key={event.id}
              className={`rounded-xl p-3 ${getEventStyles(event.type)}`}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-600">
                  {event.type.replace(/_/g, " ")}
                </div>

                <div className="font-mono text-[9px] text-zinc-700">
                  {event.createdAt.slice(11, 19)}
                </div>
              </div>

              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {event.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-3 text-sm text-cyan-400">
              Processing operational request...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-white/10 p-3">
        <div className="space-y-2">
          {/* API key — compact, persisted */}
          <input
            value={apiKey}
            onChange={(event) =>
              handleApiKeyChange(
                event.target.value,
              )
            }
            placeholder="OpenAI API key (saved locally)"
            type="password"
            className="w-full rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2 text-xs text-zinc-500 outline-none placeholder:text-zinc-700 focus:border-white/10"
          />

          {/* Operational request */}
          <textarea
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            onKeyDown={handleInputKeyDown}
            placeholder="Send operational request... (⌘↵ to execute)"
            rows={4}
            className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20"
          />

          {/* Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={copyPrompt}
              disabled={!generatedPrompt}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Copy Runtime Prompt
            </button>

            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Running..." : "Execute"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
