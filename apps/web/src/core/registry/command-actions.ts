import type {
  CommandId,
} from "./command-types"

export function executeCommand(
  commandId: CommandId,
) {
  switch (commandId) {
    case "open-command-palette":
      console.log("OPEN COMMAND PALETTE")
      return

    case "focus-orbit":
      console.log("FOCUS ORBIT")
      return

    case "focus-thread":
      console.log("FOCUS THREAD")
      return

    case "focus-inspector":
      console.log("FOCUS INSPECTOR")
      return

    case "create-brief":
      console.log("CREATE BRIEF")
      return

    case "dispatch-run":
      console.log("DISPATCH RUN")
      return
  }
}
