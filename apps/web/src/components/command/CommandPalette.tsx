"use client"

import { useMemo, useState } from "react"

import { commandRegistry } from "@/core/registry/command-registry"

import { CommandInput } from "./CommandInput"
import { CommandList } from "./CommandList"

type Props = {
  open: boolean
}

export function CommandPalette({
  open,
}: Props) {
  const [query, setQuery] = useState("")

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
      <div className="mt-32 w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#0F1117] shadow-2xl">
        <CommandInput
          value={query}
          onChange={setQuery}
        />

        <CommandList
          commands={filteredCommands}
        />
      </div>
    </div>
  )
}
