import type {
  CommandId,
} from "./command-types"

type CommandRuntime = {
  toggleCommandPalette: () => void
}

let runtime: CommandRuntime | null = null

export function registerCommandRuntime(
  nextRuntime: CommandRuntime,
) {
  runtime = nextRuntime
}

export function executeCommand(
  commandId: CommandId,
) {
  switch (commandId) {
    case "open-command-palette":
      runtime?.toggleCommandPalette()
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
