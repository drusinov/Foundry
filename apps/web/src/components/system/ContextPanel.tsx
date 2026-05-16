"use client"

import { useMemo } from "react"

import { useInteraction } from "@/core/state/interaction-store"

import { generateContextSummary } from "@/core/context/generate-context-summary"

import { downloadContextFile } from "@/core/context/download-context-file"

import { generateRuntimeImpacts } from "@/core/runtime/runtime-impact-engine"

import { mockContextDocument } from "@/core/types/mock-context-document"

import { useGitRuntime } from "@/hooks/useGitRuntime"

import { useFileRuntime } from "@/hooks/useFileRuntime"

export function ContextPanel() {
  const {
    latestCheckpoint,

    activeCheckpointId,

    setActiveCheckpointId,

    checkpointHistory,

    entries,

    appendEntry,
  } = useInteraction()

  const gitRuntime =
    useGitRuntime()

  const fileRuntime =
    useFileRuntime()

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

  const runtimeImpacts =
    useMemo(() => {
      if (!gitRuntime) {
        return []
      }

      return generateRuntimeImpacts(
        gitRuntime.diffEntries,
      )
    }, [gitRuntime])

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

      <div className="space-y-5 text-sm text-zinc-300">
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
          <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
            Git Runtime
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            {gitRuntime ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">
                    Branch
                  </span>

                  <span className="font-mono text-cyan-300">
                    {gitRuntime.branch}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">
                    Latest Commit
                  </span>

                  <span className="font-mono text-white">
                    {
                      gitRuntime.latestCommit
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">
                    Working Tree
                  </span>

                  <span
                    className={
                      gitRuntime.workingTreeClean
                        ? "text-emerald-400"
                        : "text-yellow-400"
                    }
                  >
                    {gitRuntime
                      .workingTreeClean
                      ? "Clean"
                      : "Modified"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">
                    Changed Files
                  </span>

                  <span className="text-white">
                    {
                      gitRuntime.changedFiles
                    }
                  </span>
                </div>

                {gitRuntime.diffEntries
                  .length > 0 && (
                  <div>
                    <div className="mb-2 text-[10px] uppercase tracking-wide text-zinc-500">
                      Runtime Diff
                    </div>

                    <div className="space-y-1">
                      {gitRuntime.diffEntries.map(
                        (entry) => (
                          <div
                            key={entry.file}
                            className="flex items-center justify-between gap-2 rounded-md border border-white/5 bg-white/5 px-2 py-1"
                          >
                            <span className="text-yellow-400">
                              {
                                entry.status
                              }
                            </span>

                            <span className="truncate font-mono text-[11px] text-zinc-300">
                              {entry.file}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-zinc-500">
                Loading git runtime...
              </div>
            )}
          </div>
        </div>

        {runtimeImpacts.length > 0 && (
          <div>
            <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
              Runtime Impact Analysis
            </div>

            <div className="space-y-2">
              {runtimeImpacts.map(
                (impact) => (
                  <div
                    key={impact.title}
                    className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-3"
                  >
                    <div className="truncate font-mono text-[11px] text-cyan-300">
                      {impact.title}
                    </div>

                    <div className="mt-2 space-y-1">
                      {impact.impacts.map(
                        (
                          runtimeImpact,
                        ) => (
                          <div
                            key={
                              runtimeImpact
                            }
                            className="text-[11px] text-zinc-300"
                          >
                            •{" "}
                            {
                              runtimeImpact
                            }
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
            File Runtime
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            {fileRuntime ? (
              <div>
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">
                    Total Files
                  </span>

                  <span className="text-white">
                    {
                      fileRuntime.totalFiles
                    }
                  </span>
                </div>

                <div className="space-y-1">
                  {fileRuntime.recentFiles.map(
                    (file) => (
                      <div
                        key={file}
                        className="truncate font-mono text-[11px] text-zinc-400"
                      >
                        {file}
                      </div>
                    ),
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500">
                Loading filesystem runtime...
              </div>
            )}
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