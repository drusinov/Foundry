interface SystemEntryCardProps {
  message: string
}

export function SystemEntryCard({
  message,
}: SystemEntryCardProps) {
  return (
    <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 px-4 py-3">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
        Operational Event
      </div>

      <div className="font-mono text-sm text-zinc-200">
        {message}
      </div>
    </div>
  )
}
