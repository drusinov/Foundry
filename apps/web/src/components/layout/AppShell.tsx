import { ReactNode } from "react"

type AppShellProps = {
  children: ReactNode
}

export function AppShell({
  children,
}: AppShellProps) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#070B14] text-white">
      {children}
    </div>
  )
}