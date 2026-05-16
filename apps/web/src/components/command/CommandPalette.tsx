"use client"

import { useMemo, useState } from "react"

import { commandRegistry } from "@/core/registry/command-registry"
import { useCommandActions } from "@/core/registry/command-actions"

type Props = {
  open: boolean
}

export function CommandPalette({ open }: Props) {
  const [query, setQuery] = useState("")

  const { executeCommand } = useCommandActions()

  const filteredCommands = useMemo(() => {
    return commandRegistry.filter((command) =>
      command.label
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
  }, [query])

  if (!open) {
    return null
  }

  return (
    <div className="absolute inset-0 flex items-start justify-center bg-black/40 backdrop-blur-sm">
      <div className="mt-32 w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#11131A] shadow-2xl">
        <input
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder="Search commands..."
          className="w-full border-b border-white/10 bg-transparent px-6 py-5 text-sm text-white outline-none"
        />

        <div className="max-h-[420px] overflow-y-auto">
          {filteredCommands.map((command) => (
            <button
              key={command.id}
              onClick={() => executeCommand(command)}
              className="flex w-full items-center justify-between border-b border-white/5 px-6 py-4 text-left transition hover:bg-white/5"
            >
              <div>
                <div className="text-sm font-medium text-white">
                  {command.label}
                </div>

                <div className="mt-1 text-xs text-zinc-400">
                  {command.description}
                </div>
              </div>

              <div className="text-xs text-zinc-500">
                {command.group}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
