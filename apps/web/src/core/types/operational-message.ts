export type OperationalMessage = {
  id: string

  role:
    | "user"
    | "system"

  content: string

  createdAt: string
}