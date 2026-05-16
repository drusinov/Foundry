import type { GitDiffEntry } from "./git-diff"

export type GitRuntimeState = {
  branch: string

  latestCommit: string

  workingTreeClean: boolean

  changedFiles: number

  diffEntries: GitDiffEntry[]
}