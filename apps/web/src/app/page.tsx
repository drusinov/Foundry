"use client"

import { StatusRail } from "@/components/system/StatusRail"

import { useState } from "react"

import { AppShell } from "@/components/layout/AppShell"

import { CommandPalette } from "@/components/command/CommandPalette"

import { OperationalChat } from "@/components/system/OperationalChat"

import { ContextPanel } from "@/components/system/ContextPanel"

import { useCommandRuntime } from "@/core/registry/use-command-runtime"

import {
  InteractionProvider,
  useInteraction,
} from "@/core/state/interaction-store"

import { useCommandPaletteKeyboard } from "@/hooks/useCommandPaletteKeyboard"

function FoundryPage() {
  useCommandRuntime()

  useCommandPaletteKeyboard()

  const {
    commandPaletteOpen,
    openCommandPalette,
  } = useInteraction()

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false)

  return (
    <AppShell>
      <div className="h-screen overflow-hidden bg-[#070B14] text-white">
        <StatusRail />
        <div className="flex h-[calc(100vh-40px)]">
          <aside
            className={`border-r border-white/10 bg-black/20 transition-all duration-300 ${
              sidebarCollapsed
                ? "w-[72px]"
                : "w-[260px]"
            }`}
          >
            <div className="flex h-full flex-col">
              <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
                {!sidebarCollapsed && (
                  <div>
                    <div className="text-sm font-semibold">
                      Foundry
                    </div>

                    <div className="text-[10px] uppercase tracking-wide text-cyan-400">
                      Operational Runtime
                    </div>
                  </div>
                )}

                <button
                  onClick={() =>
                    setSidebarCollapsed(
                      !sidebarCollapsed,
                    )
                  }
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300"
                >
                  {sidebarCollapsed
                    ? "→"
                    : "←"}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                <div className="space-y-6">
                  <div>
                    {!sidebarCollapsed && (
                      <div className="mb-2 px-2 text-[11px] uppercase tracking-wide text-zinc-500">
                        Workspace
                      </div>
                    )}

                    <div className="space-y-1">
                      {[
                        "Operational Chat",
                        "Runtime Context",
                        "Checkpoints",
                        "Handoff Notes",
                      ].map((item) => (
                        <button
                          key={item}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-white/5"
                        >
                          <div className="h-2 w-2 rounded-full bg-cyan-400" />

                          {!sidebarCollapsed &&
                            item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    {!sidebarCollapsed && (
                      <div className="mb-2 px-2 text-[11px] uppercase tracking-wide text-zinc-500">
                        Actions
                      </div>
                    )}

                    <div className="space-y-1">
                      {[
                        "Save Snapshot",
                        "Export Continuity",
                        "Push Git Checkpoint",
                        "Compact Runtime",
                        "Generate Handoff",
                        "Restart Runtime",
                      ].map((item) => (
                        <button
                          key={item}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-white/5"
                        >
                          <div className="h-2 w-2 rounded-full bg-white/30" />

                          {!sidebarCollapsed &&
                            item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {!sidebarCollapsed && (
                <div className="border-t border-white/10 p-4">
                  <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-3">
                    <div className="mb-2 text-[11px] uppercase tracking-wide text-cyan-400">
                      Active Checkpoint
                    </div>

                    <div className="font-mono text-sm text-white">
                      checkpoint-1778953300648
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-14 items-center justify-between border-b border-white/10 bg-black/20 px-5">
              <div>
                <div className="text-sm font-medium text-white">
                  Operational Chat
                </div>

                <div className="text-xs text-zinc-500">
                  AI-native development workspace
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10">
                  Save Snapshot
                </button>

                <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10">
                  Export Continuity
                </button>

                <button className="rounded-xl border border-white/10 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-500/20">
                  Push Git
                </button>

                <button
                  onClick={
                    openCommandPalette
                  }
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                >
                  ⌘K
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1">
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <div className="min-h-0 flex-1 overflow-hidden p-4">
                  <OperationalChat />
                </div>
              </div>

              <div className="w-[360px] border-l border-white/10 bg-black/20">
                <div className="h-full overflow-y-auto p-4">
                  <ContextPanel />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CommandPalette open={commandPaletteOpen} />
    </AppShell>
  )
}

export default function Page() {
  return (
    <InteractionProvider>
      <FoundryPage />
    </InteractionProvider>
  )
}