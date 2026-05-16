"use client"

import { useMemo } from "react"

import { useInteraction } from "@/core/state/interaction-store"

import { generateContextSummary } from "@/core/context/generate-context-summary"

import { downloadContextFile } from "@/core/context/download-context-file"

import { mockContextDocument } from "@/core/types/mock-context-document"

export function ContextPanel() {
  const {
    latestCheckpoint,

    activeCheckpointId,

    setActiveCheckpointId,

    checkpointHistory,

    entries,

    appendEntry,
  } = useInteraction()

  const generatedSummary =
    useMemo(() => {
      return generateContextSummary({
        latestCheckpoint,
        entries,
      })
    }, [
      latestCheckpoint,
      entries,
    ])

  async function copyContextSummary() {
    await navigator.clipboard.writeText(
      generatedSummary,
    )
  }

  function exportContextFile() {
    downloadContextFile(
      generatedSummary,
    )
  }

  function exportCheckpoint(
    summary: string,
  ) {
    downloadContextFile(summary)
  }

  function restoreCheckpoint(
    checkpointId: string,
  ) {
    setActiveCheckpointId(
      checkpointId,
    )

    appendEntry({
      id: crypto.randomUUID(),

      createdAt: new Date().toISOString(),

      type: "system",

      message:
        `CHECKPOINT RESTORED · ${checkpointId}`,
    })
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-medium text-white">
          Context Document
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyContextSummary}
            className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/20"
          >
            Copy Context
          </button>

          <button
            onClick={exportContextFile}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/10"
          >
            Export
          </button>
        </div>
      </div>

      <div className="space-y-4 text-sm text-zinc-300">
        <div>
          <div className="text-white">
            {
              mockContextDocument.project
                .name
            }
          </div>

          <div className="mt-1 text-zinc-400">
            {
              mockContextDocument.project
                .description
            }
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-zinc-500">
            Active Tasks
          </div>

          <ul className="space-y-1">
            {mockContextDocument.activeTasks.map(
              (task) => (
                <li key={task}>
                  • {task}
                </li>
              ),
            )}
          </ul>
        </div>

        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-zinc-500">
            Active Checkpoint
          </div>

          <div className="font-mono text-xs text-cyan-300">
            {activeCheckpointId ??
              "No active checkpoint"}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
            Checkpoint History
          </div>

          <div className="space-y-2">
            {checkpointHistory.map(
              (checkpoint) => (
                <div
                  key={checkpoint.id}
                  className={`rounded-lg border p-3 ${
                    activeCheckpointId ===
                    checkpoint.id
                      ? "border-cyan-500/40 bg-cyan-500/10"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  <div className="font-mono text-xs text-cyan-300">
                    {checkpoint.id}
                  </div>

                  <div className="mt-1 text-[11px] text-zinc-500">
                    {checkpoint.createdAt}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() =>
                        restoreCheckpoint(
                          checkpoint.id,
                        )
                      }
                      className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-300 transition hover:bg-cyan-500/20"
                    >
                      Restore
                    </button>

                    <button
                      onClick={() =>
                        exportCheckpoint(
                          checkpoint.summary,
                        )
                      }
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white transition hover:bg-white/10"
                    >
                      Export Snapshot
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-zinc-500">
            Generated Context Summary
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-xs leading-6 text-zinc-300 whitespace-pre-wrap">
            {generatedSummary}
          </div>
        </div>
      </div>
    </div>
  )
}