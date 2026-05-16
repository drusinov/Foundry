"use client"

import {
  useMemo,
  useState,
  type KeyboardEvent,
} from "react"

import { useInteraction } from "@/core/state/interaction-store"

import { useGitRuntime } from "@/hooks/useGitRuntime"

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

  const [
    generatedPrompt,
    setGeneratedPrompt,
  ] = useState("")

  function sendMessage() {
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
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(
      generatedPrompt,
    )
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Enter") {
      sendMessage()
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 text-sm font-medium text-white">
        Operational Chat
      </div>

      <div className="space-y-4">
        <div className="max-h-[320px] space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3">
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

                <div>
                  {message.content}
                </div>
              </div>
            ),
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(event) =>
              setInput(
                event.target.value,
              )
            }
            onKeyDown={handleKeyDown}
            placeholder="Send operational message..."
            className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
          />

          <button
            onClick={sendMessage}
            className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
          >
            Generate
          </button>
        </div>

        {generatedPrompt && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                AI Continuation Prompt
              </div>

              <button
                onClick={copyPrompt}
                className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-300 transition hover:bg-cyan-500/20"
              >
                Copy Prompt
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-3 font-mono text-[11px] leading-6 text-zinc-300 whitespace-pre-wrap">
              {generatedPrompt}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}