interface SystemEntryCardProps {
  message: string
}

export function SystemEntryCard({
  message,
}: SystemEntryCardProps) {
  return (
    <div className="text-white/60">
      {message}
    </div>
  )
}
