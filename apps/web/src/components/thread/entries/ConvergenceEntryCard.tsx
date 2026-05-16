interface ConvergenceEntryCardProps {
  summary: string
}

export function ConvergenceEntryCard({
  summary,
}: ConvergenceEntryCardProps) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-[#F5B942]">
        Convergence
      </div>

      <p className="mt-4 leading-7 text-white/70">
        {summary}
      </p>
    </div>
  )
}
