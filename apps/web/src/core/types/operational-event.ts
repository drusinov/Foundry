export type OperationalEventType =
  | "command"
  | "result"
  | "checkpoint"
  | "error"
  | "system_event"
  | "recovery"

export type OperationalEvent =
  {
    id: string

    type: OperationalEventType

    content: string

    createdAt: string
  }