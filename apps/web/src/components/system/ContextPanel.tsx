"use client"

import { useMemo } from "react"

import { useInteraction } from "@/core/state/interaction-store"

import { useGitRuntime } from "@/hooks/useGitRuntime"

import { useFileRuntime } from "@/hooks/useFileRuntime"

import { generateCompressedContext } from "@/core/context/generate-compressed-context"

import { generateRuntimeImpacts } from "@/core/runtime/runtime-impact-engine"

import { downloadContextFile } from "@/core/context/download-context-file"

export function ContextPanel() {
  const {
    latestCheckpoint,

    operationalMessages,

    checkpointHistory,

    sessionRuntime,

    setSessionRuntime,
  } = useInteraction()

  const gitRuntime =
    useGitRuntime()

  const fileRuntime =
    useFileRuntime()

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

  async function copyContinuity() {
    await navigator.clipboard.writeText(
      compressedContext,
    )
  }

  function exportContinuity() {
    downloadContextFile(
      compressedContext,
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-white">
              Context Document
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={
                copyContinuity
              }
              className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-300 transition hover:bg-cyan-500/20"
            >
              Copy Continuity
            </button>

            <button
              onClick={
                exportContinuity
              }
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white transition hover:bg-white/10"
            >
              Export
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-lg text-white">
            Foundry
          </div>

          <div className="mt-2 text-sm text-zinc-400">
            Persistent AI-assisted development cockpit
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-3 text-xs uppercase tracking-wide text-zinc-500">
            Session Runtime
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-2 text-[11px] uppercase tracking-wide text-zinc-500">
                Current Objective
              </div>

              <textarea
                value={
                  sessionRuntime.currentObjective
                }
                onChange={(event) =>
                  setSessionRuntime({
                    ...sessionRuntime,

                    currentObjective:
                      event.target.value,
                  })
                }
                className="min-h-[70px] w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <div className="mb-2 text-[11px] uppercase tracking-wide text-zinc-500">
                Active Workstream
              </div>

              <input
                value={
                  sessionRuntime.activeWorkstream
                }
                onChange={(event) =>
                  setSessionRuntime({
                    ...sessionRuntime,

                    activeWorkstream:
                      event.target.value,
                  })
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <div className="mb-2 text-[11px] uppercase tracking-wide text-zinc-500">
                Next Action
              </div>

              <input
                value={
                  sessionRuntime.nextAction
                }
                onChange={(event) =>
                  setSessionRuntime({
                    ...sessionRuntime,

                    nextAction:
                      event.target.value,
                  })
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <div className="mb-2 text-[11px] uppercase tracking-wide text-zinc-500">
                Active Risks
              </div>

              <textarea
                value={sessionRuntime.activeRisks.join(
                  "\n",
                )}
                onChange={(event) =>
                  setSessionRuntime({
                    ...sessionRuntime,

                    activeRisks:
                      event.target.value
                        .split("\n")
                        .filter(Boolean),
                  })
                }
                className="min-h-[120px] w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-3 text-xs uppercase tracking-wide text-zinc-500">
            Runtime State
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="text-zinc-500">
                Active Checkpoint
              </div>

              <div className="font-mono text-cyan-300">
                {latestCheckpoint}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-zinc-500">
                Stored Checkpoints
              </div>

              <div className="text-white">
                {
                  checkpointHistory.length
                }
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-zinc-500">
                Runtime Messages
              </div>

              <div className="text-white">
                {
                  operationalMessages.length
                }
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-zinc-500">
                Runtime Files
              </div>

              <div className="text-white">
                {
                  fileRuntime?.files
                    ?.length ?? 0
                }
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 text-xs uppercase tracking-wide text-zinc-500">
            Compressed Continuity Payload
          </div>

          <div className="max-h-[420px] overflow-y-auto rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-3 font-mono text-[11px] leading-6 text-zinc-300 whitespace-pre-wrap">
            {compressedContext}
          </div>
        </div>
      </div>
    </div>
  )
}