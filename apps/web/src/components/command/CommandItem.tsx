type Props = {
  label: string
  active?: boolean
  onClick?: () => void
}

export function CommandItem({
  label,
  active,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full rounded-xl px-4 py-3 text-left transition-all
        ${
          active
            ? "bg-white/10 text-white"
            : "text-white/70 hover:bg-white/[0.05]"
        }
      `}
    >
      {label}
    </button>
  )
}
