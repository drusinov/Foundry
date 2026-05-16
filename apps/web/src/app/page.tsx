"use client"

import { AppShell } from "@/components/layout/AppShell"

import { CommandPalette } from "@/components/command/CommandPalette"

import { ThreadSurface } from "@/components/thread/ThreadSurface"

import { useCommandRuntime } from "@/core/registry/use-command-runtime"

import {
  InteractionProvider,
  useInteraction,
} from "@/core/state/interaction-store"

function FoundryPage() {
  useCommandRuntime()

  const {
    commandPaletteOpen,
    openCommandPalette,
  } = useInteraction()

  return (
    <AppShell>
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 p-4">
          <button
            onClick={openCommandPalette}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
          >
            Open Command Palette
          </button>
        </div>

        <div className="flex-1 overflow-hidden p-6">
          <ThreadSurface />
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
