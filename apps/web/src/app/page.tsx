"use client"

import { useState } from "react"

import { AppShell } from "@/components/layout/AppShell"

import { CommandPalette } from "@/components/command/CommandPalette"

import { OperationalChat } from "@/components/system/OperationalChat"

import { ContextPanel } from "@/components/system/ContextPanel"

import { StatusRail } from "@/components/system/StatusRail"

import { useCommandRuntime } from "@/core/registry/use-command-runtime"

import {
  InteractionProvider,
  useInteraction,
} from "@/core/state/interaction-store"

import { useCommandPaletteKeyboard } from "@/hooks/useCommandPaletteKeyboard"

import { useCommandActions } from "@/core/registry/command-actions"

import type { CommandId } from "@/core/registry/command-types"

import { commandRegistry } from "@/core/registry/command-registry"

// Workspace nav items — navigation only, no commands yet
const WORKSPACE_ITEMS: {
  label: string
  active: boolean
}[] = [
  { label: "Operational Chat", active: true },
  { label: "Runtime Context", active: false },
  { label: "Checkpoints", active: false },
  { label: "Handoff Notes", active: false },
]

// Sidebar action buttons mapped to registry CommandIds
const SIDEBAR_ACTIONS: {
  label: string
  id: CommandId
}[] = [
  { label: "Save Checkpoint", id: "save-checkpoint" },
  { label: "Export Continuity", id: "export-continuity" },
  { label: "Push Updates", id: "push-updates" },
  { label: "Health Check", id: "health-check" },
  { label: "Compact Runtime", id: "compact-runtime" },
  { label: "Generate Handoff", id: "generate-handoff" },
  { label: "Restart Runtime", id: "restart-runtime" },
]

function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const { latestCheckpoint } = useInteraction()
  const { executeCommand } = useCommandActions()

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-white/10 bg-black/20 transition-all duration-200 ${
        collapsed ? "w-14" : "w-[200px]"
      }`}
    >
      {/* Brand header */}
      <div className="flex h-11 items-center justify-between border-b border-white/10 px-3">
        {!collapsed && (
          <div>
            <div className="text-xs font-semibold text-white">
              Foundry
            </div>

            <div className="text-[9px] uppercase tracking-wide text-cyan-400">
              Operational Runtime
            </div>
          </div>
        )}

        <button
          onClick={onToggle}
          className="ml-auto rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-500 transition hover:bg-white/10"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Nav + actions */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Workspace navigation */}
        {!collapsed && (
          <div className="mb-1 px-2 pt-2 text-[10px] uppercase tracking-[0.15em] text-zinc-600">
            Workspace
          </div>
        )}

        <div className="space-y-0.5">
          {WORKSPACE_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition ${
                item.active
                  ? "bg-white/5 text-white"
                  : "text-zinc-600 hover:bg-white/5 hover:text-zinc-300"
              }`}
            >
              <div
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  item.active
                    ? "bg-cyan-400"
                    : "bg-zinc-700"
                }`}
              />

              {!collapsed && item.label}
            </button>
          ))}
        </div>

        {/* Action commands */}
        {!collapsed && (
          <div className="mb-1 mt-4 px-2 text-[10px] uppercase tracking-[0.15em] text-zinc-600">
            Actions
          </div>
        )}

        <div className="space-y-0.5">
          {SIDEBAR_ACTIONS.map(({ label, id }) => {
            const cmd = commandRegistry.find(
              (c) => c.id === id,
            )

            if (!cmd) return null

            return (
              <button
                key={id}
                onClick={() =>
                  executeCommand(cmd)
                }
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
              >
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/20" />

                {!collapsed && label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Active checkpoint — expanded only */}
      {!collapsed && (
        <div className="border-t border-white/10 p-3">
          <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-2.5">
            <div className="mb-1 text-[9px] uppercase tracking-[0.15em] text-cyan-600">
              Active Checkpoint
            </div>

            <div className="font-mono text-[11px] text-cyan-300">
              {latestCheckpoint}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

function FoundryPage() {
  useCommandRuntime()
  useCommandPaletteKeyboard()

  const {
    commandPaletteOpen,
    openCommandPalette,
  } = useInteraction()

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false)

  return (
    <AppShell>
      <div className="h-screen overflow-hidden bg-[#070B14] text-white">
        {/* Status rail — full width, always visible */}
        <StatusRail />

        <div className="flex h-[calc(100vh-40px)]">
          {/* Sidebar */}
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() =>
              setSidebarCollapsed(
                (prev) => !prev,
              )
            }
          />

          {/* Main content */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Header — title + ⌘K only */}
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 bg-black/20 px-4">
              <div>
                <div className="text-sm font-medium text-white">
                  Operational Chat
                </div>

                <div className="text-[10px] text-zinc-600">
                  AI-native development runtime
                </div>
              </div>

              <button
                onClick={openCommandPalette}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-zinc-400 transition hover:bg-white/10"
              >
                <span>Commands</span>
                <span className="font-mono">
                  ⌘K
                </span>
              </button>
            </div>

            {/* Content area */}
            <div className="flex min-h-0 flex-1">
              {/* Operational chat — primary surface */}
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden p-3">
                <OperationalChat />
              </div>

              {/* Context panel — secondary */}
              <div className="w-[260px] shrink-0 overflow-y-auto border-l border-white/10 bg-black/20 p-3">
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
