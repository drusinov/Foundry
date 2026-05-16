interface BriefEntryCardProps {
  title: string
  prompt: string
}

export function BriefEntryCard({
  title,
  prompt,
}: BriefEntryCardProps) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-[#4F8CFF]">
        Brief
      </div>

      <h2 className="mt-3 text-2xl font-semibold">
        {title}
      </h2>

      <p className="mt-4 leading-7 text-white/70">
        {prompt}
      </p>
    </div>
  )
}
