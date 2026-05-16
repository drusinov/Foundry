"use client"

import { useCommandRuntime } from "@/core/registry/use-command-runtime"
import { AppShell } from "@/components/layout/AppShell"
import { OrbitSidebar } from "@/components/system/OrbitSidebar"
import { InspectorPanel } from "@/components/system/InspectorPanel"
import { ThreadSurface } from "@/components/thread/ThreadSurface"
import { CommandPalette } from "@/components/command/CommandPalette"
import { useCommandPalette } from "@/hooks/useCommandPalette"

export default function HomePage() {
  useCommandRuntime()
  const { open } = useCommandPalette()

  return (
    <>
      <AppShell
        sidebar={<OrbitSidebar />}
        inspector={<InspectorPanel />}
      >
        <ThreadSurface />
      </AppShell>

      <CommandPalette open={open} />
    </>
  )
}
