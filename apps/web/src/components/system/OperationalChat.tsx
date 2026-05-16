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

    operationalMessages,

    appendOperationalMessage,
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

        operationalMessages,
      })
    }, [
      gitRuntime,

      runtimeImpacts,

      latestCheckpoint,

      operationalMessages,
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

    appendOperationalMessage({
      id: crypto.randomUUID(),

      role: "user",

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
      return
    }

    const aiResponse =
      await executePrompt(
        apiKey,
        prompt,
      )

    appendOperationalMessage({
      id: crypto.randomUUID(),

      role: "system",

      content:
        aiResponse ??
        "No response",

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

  return (
    <div className="flex h-full min-h-[520px] flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-medium text-white">
          Operational Chat
        </div>

        <div className="text-[11px] text-zinc-500">
          Embedded AI Runtime
        </div>
      </div>

      <div className="mb-4">
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
      </div>

      <div className="mb-4 flex-1 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="space-y-3">
          {operationalMessages.map(
            (message) => (
              <div
                key={message.id}
                className={`rounded-xl p-3 text-sm ${
                  message.role ===
                  "user"
                    ? "bg-cyan-500/10 text-cyan-100"
                    : "bg-white/5 text-zinc-300"
                }`}
              >
                <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">
                  {message.role}
                </div>

                <div className="whitespace-pre-wrap leading-7">
                  {message.content}
                </div>
              </div>
            ),
          )}

          {loading && (
            <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-3 text-sm text-cyan-300">
              Foundry runtime thinking...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="space-y-3 border-t border-white/10 pt-4">
        <textarea
          value={input}
          onChange={(event) =>
            setInput(
              event.target.value,
            )
          }
          placeholder="Send operational request..."
          className="min-h-[180px] w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none placeholder:text-zinc-500"
        />

        <div className="flex items-center justify-between">
          <button
            onClick={copyPrompt}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
          >
            Copy Prompt
          </button>

          <button
            onClick={sendMessage}
            className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
          >
            {loading
              ? "Running..."
              : "Run"}
          </button>
        </div>
      </div>
    </div>
  )
}