"use client"

import { useMemo, useState } from "react"

import { commandRegistry } from "@/core/registry/command-registry"
import { useCommandActions } from "@/core/registry/command-actions"

type Props = {
  open: boolean
}

export function CommandPalette({
  open,
}: Props) {
  const [query, setQuery] =
    useState("")

  const [
    selectedCommandIndex,
    setSelectedCommandIndex,
  ] = useState(0)

  const { executeCommand } =
    useCommandActions()

  const filteredCommands =
    useMemo(() => {
      return commandRegistry.filter(
        (command) =>
          command.label
            .toLowerCase()
            .includes(
              query.toLowerCase(),
            ),
      )
    }, [query])

  if (!open) {
    return null
  }

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm">
      <div className="mt-32 w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#11131A] shadow-2xl">
        <input
          value={query}
          onChange={(event) => {
            setQuery(
              event.target.value,
            )

            setSelectedCommandIndex(
              0,
            )
          }}
          placeholder="Search commands..."
          className="w-full border-b border-white/10 bg-transparent px-6 py-5 text-sm text-white outline-none"
        />

        <div className="max-h-[420px] overflow-y-auto">
          {filteredCommands.map(
            (command, index) => (
              <button
                key={command.id}
                onMouseEnter={() =>
                  setSelectedCommandIndex(
                    index,
                  )
                }
                onClick={() =>
                  executeCommand(
                    command,
                  )
                }
                className={`flex w-full items-center justify-between border-b border-white/5 px-6 py-4 text-left transition ${
                  selectedCommandIndex ===
                  index
                    ? "bg-white/10"
                    : "hover:bg-white/5"
                }`}
              >
                <div className="text-sm font-medium text-white">
                  {
                    command.label
                  }
                </div>

                <div className="text-xs text-zinc-500">
                  {command.shortcut.join(
                    " + ",
                  )}
                </div>
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
