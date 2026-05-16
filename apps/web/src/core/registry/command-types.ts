export type CommandId =
  | "open-command-palette"
  | "focus-orbit"
  | "focus-thread"
  | "focus-inspector"
  | "create-brief"
  | "dispatch-run"

export interface CommandDefinition {
  id: CommandId
  title: string
  shortcut: string[]
}
