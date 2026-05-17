import type { GitRuntimeState } from "./git-runtime"

export const mockGitRuntime: GitRuntimeState =
  {
    branch:
      "feat/interaction-kernel",

    latestCommit:
      "f1cdb4d",

    workingTreeClean: true,
    diffEntries: [],

    changedFiles: 0,
  }