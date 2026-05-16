interface ArtifactEntryCardProps {
  title: string
  content: string
  status: string
}

export function ArtifactEntryCard({
  title,
  content,
  status,
}: ArtifactEntryCardProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.2em] text-[#3DD9C5]">
          Artifact
        </div>

        <div className="rounded-full border border-[#3DD9C5]/20 bg-[#3DD9C5]/10 px-3 py-1 text-xs text-[#3DD9C5]">
          {status}
        </div>
      </div>

      <h2 className="mt-3 text-2xl font-semibold">
        {title}
      </h2>

      <p className="mt-4 leading-7 text-white/70">
        {content}
      </p>
    </div>
  )
}
