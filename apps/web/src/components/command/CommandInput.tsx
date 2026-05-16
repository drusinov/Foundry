type Props = {
  value: string
  onChange: (value: string) => void
}

export function CommandInput({
  value,
  onChange,
}: Props) {
  return (
    <div className="border-b border-white/10">
      <input
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Brief an agent, inspect memory, converge runs..."
        className="w-full bg-transparent px-5 py-4 text-lg outline-none placeholder:text-white/30"
      />
    </div>
  )
}
