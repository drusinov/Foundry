"use client"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import { commandRegistry } from "@/core/registry/command-registry"
import { useCommandActions } from "@/core/registry/command-actions"

type Props = {
  open: boolean
}

export function CommandPalette({ open }: Props) {
  const [query, setQuery] = useState("")

  const [selectedIndex, setSelectedIndex] =
    useState(0)

  const { executeCommand } = useCommandActions()

  const filteredCommands = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return commandRegistry
    return commandRegistry.filter((cmd) =>
      cmd.label.toLowerCase().includes(q),
    )
  }, [query])

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Reset state when palette closes
  useEffect(() => {
    if (!open) {
      setQuery("")
      setSelectedIndex(0)
    }
  }, [open])

  // Keyboard navigation — scoped to open state
  // Uses filteredCommands so Enter always executes
  // the visually selected item, not a registry index.
  useEffect(() => {
    if (!open) return

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "ArrowDown") {
        event.preventDefault()
        setSelectedIndex((i) =>
          Math.min(
            i + 1,
            filteredCommands.length - 1,
          ),
        )
        return
      }

      if (event.key === "ArrowUp") {
        event.preventDefault()
        setSelectedIndex((i) =>
          Math.max(i - 1, 0),
        )
        return
      }

      if (event.key === "Enter") {
        event.preventDefault()
        const command =
          filteredCommands[selectedIndex]
        if (command) {
          executeCommand(command)
          setQuery("")
        }
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      )
    }
  }, [
    open,
    filteredCommands,
    selectedIndex,
    executeCommand,
  ])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm">
      <div className="mt-20 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0C0E14] shadow-2xl">
        {/* Search */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5">
          <span className="shrink-0 text-sm text-zinc-600">
            ⌘
          </span>

          <input
            autoFocus
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search runtime commands..."
            className="flex-1 bg-transparent py-4 text-sm text-white outline-none placeholder:text-zinc-600"
          />

          <span className="shrink-0 text-[11px] text-zinc-700">
            ESC to close
          </span>
        </div>

        {/* Command list */}
        <div className="max-h-[360px] overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-zinc-700">
              No commands found
            </div>
          ) : (
            filteredCommands.map(
              (command, index) => (
                <button
                  key={command.id}
                  onMouseEnter={() =>
                    setSelectedIndex(index)
                  }
                  onClick={() => {
                    executeCommand(command)
                    setQuery("")
                  }}
                  className={`flex w-full items-center justify-between px-5 py-3 text-left transition ${
                    selectedIndex === index
                      ? "bg-white/[0.08] text-white"
                      : "text-zinc-400 hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="text-sm font-medium">
                    {command.label}
                  </span>

                  {command.shortcut.length >
                    0 && (
                    <span className="font-mono text-[11px] text-zinc-700">
                      {command.shortcut.join(
                        " ",
                      )}
                    </span>
                  )}
                </button>
              ),
            )
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-5 py-2">
          <div className="flex items-center gap-5 text-[11px] text-zinc-700">
            <span>↑↓ navigate</span>
            <span>↵ execute</span>
            <span>⌘K toggle</span>
          </div>
        </div>
      </div>
    </div>
  )
}
