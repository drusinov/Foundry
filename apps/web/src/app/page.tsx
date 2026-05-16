"use client"

import { AppShell } from "@/components/layout/AppShell"

import { CommandPalette } from "@/components/command/CommandPalette"

import { ThreadSurface } from "@/components/thread/ThreadSurface"

import { ContextPanel } from "@/components/system/ContextPanel"

import { OperationalChat } from "@/components/system/OperationalChat"

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

  return (
    <AppShell>
      <div className="flex h-screen flex-col overflow-hidden bg-[#070B14]">
        <div className="flex h-10 items-center justify-between border-b border-white/10 bg-black/30 px-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-white">
              Foundry
            </div>

            <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-[2px] text-[10px] uppercase tracking-wide text-cyan-300">
              Operational Runtime
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <div>
              Phase 2A
            </div>

            <div className="h-1 w-1 rounded-full bg-zinc-600" />

            <div>
              Deterministic Runtime
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="grid h-full grid-cols-[minmax(0,1fr)_280px] gap-4 p-4">
            <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="border-b border-white/10 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">
                      Operational Workspace
                    </div>

                    <div className="mt-1 text-xs text-zinc-500">
                      Runtime-aware interaction surface
                    </div>
                  </div>

                  <button
                    onClick={
                      openCommandPalette
                    }
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white transition hover:bg-white/10"
                  >
                    ⌘K
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <div className="grid h-full grid-rows-[minmax(0,1fr)_minmax(520px,auto)]">
                  <div className="overflow-y-auto p-4">
                    <ThreadSurface />
                  </div>

                  <div className="border-t border-white/10 bg-black/20 p-4">
                    <OperationalChat />
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-0 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="mb-3 px-2">
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Runtime Context
                </div>
              </div>

              <div className="space-y-4">
                <ContextPanel />
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