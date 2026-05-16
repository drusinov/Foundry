interface RunEntryCardProps {
  agent: string
  status: string
}

export function RunEntryCard({
  agent,
  status,
}: RunEntryCardProps) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-[#F57FAA]">
        Run
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-[#3DD9C5]" />

        <div className="text-white/80">
          {agent} — {status}
        </div>
      </div>
    </div>
  )
}
