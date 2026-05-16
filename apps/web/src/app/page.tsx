"use client"

import { AppShell } from "@/components/layout/AppShell"

import { CommandPalette } from "@/components/command/CommandPalette"

import { ThreadSurface } from "@/components/thread/ThreadSurface"

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

  return (
    <AppShell>
      <div className="flex h-screen flex-col overflow-hidden">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-[#070B14]/95 p-4 backdrop-blur">
          <button
            onClick={openCommandPalette}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
          >
            Open Command Palette
          </button>
        </div>

        <div className="flex-1 overflow-hidden p-6">
          <div className="grid h-full grid-cols-[1fr_360px] gap-6 overflow-hidden">
            <div className="overflow-y-auto pr-2">
              <ThreadSurface />
            </div>

            <div className="overflow-y-auto pr-2">
              <ContextPanel />
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