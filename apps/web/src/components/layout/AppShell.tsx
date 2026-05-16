type AppShellProps = {
  sidebar?: React.ReactNode
  children: React.ReactNode
  inspector?: React.ReactNode
}

export function AppShell({
  sidebar,
  children,
  inspector,
}: AppShellProps) {
  return (
    <div className="h-screen w-screen bg-[#0A0B0F] text-[#F5F7FA] overflow-hidden">
      <div className="grid h-full grid-cols-[280px_1fr_340px]">
        <aside className="border-r border-white/10 bg-[#11131A]">
          {sidebar}
        </aside>

        <main className="overflow-hidden">
          {children}
        </main>

        <aside className="border-l border-white/10 bg-[#11131A]">
          {inspector}
        </aside>
      </div>
    </div>
  )
}
