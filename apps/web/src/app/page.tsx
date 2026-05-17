"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { CommandPalette } from "@/components/command/CommandPalette"
import { OperationalChat } from "@/components/system/OperationalChat"
import { ContextPanel } from "@/components/system/ContextPanel"
import { StatusRail } from "@/components/system/StatusRail"
import { useCommandRuntime } from "@/core/registry/use-command-runtime"
import { InteractionProvider, useInteraction } from "@/core/state/interaction-store"
import { useCommandPaletteKeyboard } from "@/hooks/useCommandPaletteKeyboard"
import { useCommandActions } from "@/core/registry/command-actions"
import type { CommandId } from "@/core/registry/command-types"
import { commandRegistry } from "@/core/registry/command-registry"

/* ── Nav items ── */
const NAV_ITEMS: { label: string; id: string; active: boolean }[] = [
  { label: "Operational Chat", id: "chat",        active: true  },
  { label: "Runtime Context",  id: "context",     active: false },
  { label: "Checkpoints",      id: "checkpoints", active: false },
  { label: "Handoff Notes",    id: "handoff",     active: false },
]

/* ── Sidebar action commands ── */
const SIDEBAR_ACTIONS: { label: string; id: CommandId; symbol: string }[] = [
  { label: "Save Checkpoint",   id: "save-checkpoint",  symbol: "↓" },
  { label: "Push Updates",      id: "push-updates",     symbol: "↗" },
  { label: "Health Check",      id: "health-check",     symbol: "◎" },
  { label: "Export Continuity", id: "export-continuity",symbol: "⤴" },
  { label: "Compact Runtime",   id: "compact-runtime",  symbol: "⊡" },
  { label: "Generate Handoff",  id: "generate-handoff", symbol: "≡" },
  { label: "Restart Runtime",   id: "restart-runtime",  symbol: "↺" },
]

/* ── Sidebar ── */
function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const { latestCheckpoint } = useInteraction()
  const { executeCommand }   = useCommandActions()

  return (
    <aside
      className="sidebar-glass flex shrink-0 flex-col"
      style={{
        width: collapsed ? "52px" : "200px",
        transition: "width 220ms cubic-bezier(0.4, 0, 0.2, 1)",
        borderRight: "1px solid var(--sep)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        className="flex h-[38px] shrink-0 items-center justify-between px-3"
        style={{ borderBottom: "1px solid var(--sep)" }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
              style={{
                background: "linear-gradient(135deg, #0A84FF 0%, #34AADC 100%)",
                color: "#fff",
              }}
            >
              F
            </div>
            <div className="min-w-0">
              <div
                className="truncate font-semibold"
                style={{ fontSize: "12px", color: "var(--label-1)" }}
              >
                Foundry
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onToggle}
          className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition"
          style={{
            color: "var(--label-3)",
            fontSize: "13px",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--bg-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">

        {/* Nav section */}
        {!collapsed && (
          <div
            className="mb-1 px-3 pt-1 text-label"
          >
            Workspace
          </div>
        )}

        <div className="space-y-px px-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-none"
              style={{
                background: item.active ? "var(--bg-selected)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!item.active)
                  e.currentTarget.style.background = "var(--bg-hover)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = item.active
                  ? "var(--bg-selected)"
                  : "transparent"
              }}
            >
              {/* Indicator dot */}
              <div
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{
                  background: item.active ? "var(--blue)" : "var(--label-4)",
                  transition: "background 150ms",
                }}
              />
              {!collapsed && (
                <span
                  style={{
                    fontSize: "13px",
                    color: item.active ? "var(--label-1)" : "var(--label-3)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Actions section */}
        {!collapsed && (
          <div
            className="mb-1 mt-4 px-3 text-label"
          >
            Actions
          </div>
        )}

        <div className="space-y-px px-2">
          {SIDEBAR_ACTIONS.map(({ label, id, symbol }) => {
            const cmd = commandRegistry.find((c) => c.id === id)
            if (!cmd) return null

            return (
              <button
                key={id}
                onClick={() => executeCommand(cmd)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left"
                style={{ background: "transparent" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <span
                  className="shrink-0 w-4 text-center"
                  style={{
                    fontSize: "12px",
                    color: "var(--label-3)",
                    fontFamily: "var(--font-ui)",
                  }}
                >
                  {symbol}
                </span>
                {!collapsed && (
                  <span
                    className="flex-1 truncate"
                    style={{ fontSize: "12px", color: "var(--label-3)" }}
                  >
                    {label}
                  </span>
                )}
                {!collapsed && cmd.shortcut.length > 0 && (
                  <span
                    className="shrink-0 text-mono"
                    style={{ fontSize: "10px", color: "var(--label-4)" }}
                  >
                    {cmd.shortcut.join("")}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Checkpoint footer */}
      {!collapsed && (
        <div
          className="shrink-0 p-2"
          style={{ borderTop: "1px solid var(--sep-subtle)" }}
        >
          <div
            className="rounded-lg p-2.5"
            style={{
              background: "rgba(48,209,88,0.06)",
              border: "1px solid rgba(48,209,88,0.14)",
            }}
          >
            <div
              className="mb-0.5 flex items-center gap-1.5"
            >
              <div
                className="h-1.5 w-1.5 rounded-full dot-live"
                style={{ background: "var(--green)" }}
              />
              <span
                className="text-label"
                style={{ color: "rgba(48,209,88,0.65)" }}
              >
                Checkpoint
              </span>
            </div>
            <div
              className="truncate text-mono"
              style={{ fontSize: "10px", color: "rgba(48,209,88,0.85)" }}
            >
              {latestCheckpoint}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

/* ── Inner page (needs context) ── */
function FoundryPage() {
  useCommandRuntime()
  useCommandPaletteKeyboard()

  const { commandPaletteOpen, openCommandPalette } = useInteraction()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <AppShell>
      <div className="flex h-screen flex-col overflow-hidden" style={{ background: "var(--bg-app)" }}>

        {/* Menu bar */}
        <StatusRail />

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar */}
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((v) => !v)}
          />

          {/* Main content */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

            {/* Section toolbar */}
            <div
              className="flex h-[38px] shrink-0 items-center justify-between px-4"
              style={{
                borderBottom: "1px solid var(--sep)",
                background: "rgba(255,255,255,0.016)",
              }}
            >
              <div>
                <span
                  className="font-semibold"
                  style={{ fontSize: "13px", color: "var(--label-1)" }}
                >
                  Operational Chat
                </span>
                <span
                  className="ml-2"
                  style={{ fontSize: "11px", color: "var(--label-4)" }}
                >
                  AI-native development runtime
                </span>
              </div>

              {/* ⌘K button */}
              <button
                onClick={openCommandPalette}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--sep-subtle)",
                  fontSize: "12px",
                  color: "var(--label-2)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "var(--bg-elevated)")
                }
              >
                <span>Commands</span>
                <kbd
                  className="text-mono"
                  style={{ fontSize: "11px", color: "var(--label-3)" }}
                >
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Content panels */}
            <div className="flex min-h-0 flex-1 overflow-hidden">
              {/* Chat — primary */}
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <OperationalChat />
              </div>

              {/* Context — inspector */}
              <div
                className="w-[230px] shrink-0 overflow-hidden"
                style={{ borderLeft: "1px solid var(--sep)" }}
              >
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

/* ── Root export ── */
export default function Page() {
  return (
    <InteractionProvider>
      <FoundryPage />
    </InteractionProvider>
  )
}
