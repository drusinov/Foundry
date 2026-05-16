import { AppShell } from "@/components/layout/AppShell"
import { OrbitSidebar } from "@/components/system/OrbitSidebar"
import { InspectorPanel } from "@/components/system/InspectorPanel"
import { ThreadSurface } from "@/components/thread/ThreadSurface"

export default function HomePage() {
  return (
    <AppShell
      sidebar={<OrbitSidebar />}
      inspector={<InspectorPanel />}
    >
      <ThreadSurface />
    </AppShell>
  )
}
