export type CommandId =
  | "open-command-palette"
  | "save-checkpoint"
  | "restore-checkpoint"
  | "push-updates"
  | "health-check"
  | "export-continuity"
  | "compact-runtime"
  | "generate-handoff"
  | "restart-runtime"

export interface CommandDefinition {
  id: CommandId
  label: string
  shortcut: string[]
}
