export type OperationalEventType =
  | "command"
  | "result"
  | "checkpoint"
  | "error"
  | "system_event"
  | "recovery"

export type OperationalEvent = {
  id:        string
  type:      OperationalEventType
  content:   string
  createdAt: string
  // AI metadata — populated on result/error events
  pipeline?: string
  usage?:    { inputTokens: number; outputTokens: number }
}
