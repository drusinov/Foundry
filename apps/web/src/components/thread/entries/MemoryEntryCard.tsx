interface MemoryEntryCardProps {
  content: string
  persistence: string
}

export function MemoryEntryCard({
  content,
  persistence,
}: MemoryEntryCardProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.2em] text-[#F5B942]">
          Memory
        </div>

        <div className="text-xs uppercase tracking-[0.15em] text-white/40">
          {persistence}
        </div>
      </div>

      <p className="mt-4 leading-7 text-white/70">
        {content}
      </p>
    </div>
  )
}
