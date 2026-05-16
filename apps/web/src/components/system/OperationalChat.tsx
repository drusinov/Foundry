"use client"

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

export function OperationalChat() {
  const {
    latestCheckpoint,

    operationalEvents,

    appendOperationalEvent,
  } = useInteraction()

  const gitRuntime =
    useGitRuntime()

  const { loading, executePrompt } =
    useAiRuntime()

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const runtimeImpacts =
    useMemo(() => {
      if (!gitRuntime) {
        return []
      }

      return generateRuntimeImpacts(
        gitRuntime.diffEntries,
      )
    }, [gitRuntime])

  const compressedContext =
    useMemo(() => {
      return generateCompressedContext({
        gitRuntime,

        runtimeImpacts,

        latestCheckpoint,

        operationalMessages:
          operationalEvents.map(
            (event) => ({
              id: event.id,

              role:
                event.type ===
                "command"
                  ? "user"
                  : "system",

              content:
                event.content,

              createdAt:
                event.createdAt,
            }),
          ),
      })
    }, [
      gitRuntime,

      runtimeImpacts,

      latestCheckpoint,

      operationalEvents,
    ])

  const [input, setInput] =
    useState("")

  const [apiKey, setApiKey] =
    useState("")

  const [
    generatedPrompt,
    setGeneratedPrompt,
  ] = useState("")

  async function sendMessage() {
    if (!input.trim()) {
      return
    }

    appendOperationalEvent({
      id: crypto.randomUUID(),

      type: "command",

      content: input,

      createdAt:
        new Date().toISOString(),
    })

    const prompt =
      generateAiPrompt({
        continuity:
          compressedContext,

        userMessage: input,
      })

    setGeneratedPrompt(prompt)

    setInput("")

    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView(
        {
          behavior: "smooth",
        },
      )
    })

    if (!apiKey.trim()) {
      appendOperationalEvent({
        id: crypto.randomUUID(),

        type: "error",

        content:
          "OpenAI API key missing.",

        createdAt:
          new Date().toISOString(),
      })

      return
    }

    const aiResponse =
      await executePrompt(
        apiKey,
        prompt,
      )

    appendOperationalEvent({
      id: crypto.randomUUID(),

      type:
        aiResponse
          ? "result"
          : "error",

      content:
        aiResponse ??
        "AI runtime request failed.",

      createdAt:
        new Date().toISOString(),
    })

    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView(
        {
          behavior: "smooth",
        },
      )
    })
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(
      generatedPrompt,
    )
  }

  function getEventStyles(
    type: string,
  ) {
    if (type === "command") {
      return "border border-cyan-500/10 bg-cyan-500/10 text-cyan-100"
    }

    if (type === "result") {
      return "border border-white/10 bg-white/[0.04] text-zinc-200"
    }

    if (type === "checkpoint") {
      return "border border-emerald-500/10 bg-emerald-500/10 text-emerald-200"
    }

    if (type === "error") {
      return "border border-red-500/10 bg-red-500/10 text-red-200"
    }

    if (type === "recovery") {
      return "border border-amber-500/10 bg-amber-500/10 text-amber-200"
    }

    return "border border-white/5 bg-white/[0.03] text-zinc-400"
  }

  return (
    <div className="flex h-full min-h-[520px] flex-col rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <div className="text-sm font-medium text-white">
            Operational Runtime
          </div>

          <div className="mt-1 text-xs text-zinc-500">
            Runtime-aware operational event stream
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/10">
            Create Checkpoint
          </button>

          <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/10">
            Restore Checkpoint
          </button>

          <button className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200 transition hover:bg-red-500/20">
            Rollback Runtime
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {operationalEvents.map(
            (event) => (
              <div
                key={event.id}
                className={`rounded-2xl p-4 ${getEventStyles(
                  event.type,
                )}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    {event.type.replaceAll(
                      "_",
                      " ",
                    )}
                  </div>

                  <div className="text-[10px] text-zinc-600">
                    {event.createdAt.slice(
                      11,
                      19,
                    )}
                  </div>
                </div>

                <div className="whitespace-pre-wrap text-sm leading-7">
                  {event.content}
                </div>
              </div>
            ),
          )}

          {loading && (
            <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-4 text-sm text-cyan-300">
              Foundry runtime processing operational request...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="space-y-3">
          <input
            value={apiKey}
            onChange={(event) =>
              setApiKey(
                event.target.value,
              )
            }
            placeholder="OpenAI API Key"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
          />

          <textarea
            value={input}
            onChange={(event) =>
              setInput(
                event.target.value,
              )
            }
            placeholder="Send operational request..."
            className="min-h-[140px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none placeholder:text-zinc-500"
          />

          <div className="flex items-center justify-between">
            <button
              onClick={copyPrompt}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
            >
              Copy Runtime Prompt
            </button>

            <button
              onClick={sendMessage}
              className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
            >
              {loading
                ? "Running..."
                : "Execute"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}