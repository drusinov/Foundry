import { CommandItem } from "./CommandItem"

type Command = {
  id: string
  label: string
}

type Props = {
  commands: Command[]
}

export function CommandList({
  commands,
}: Props) {
  return (
    <div className="space-y-1 p-3">
      {commands.map((command, index) => (
        <CommandItem
          key={command.id}
          label={command.label}
          active={index === 0}
        />
      ))}
    </div>
  )
}
