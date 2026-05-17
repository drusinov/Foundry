"use client"

export type GitDiffEntry = {
  status: string
  file: string
}

export type GitRuntime = {
  branch: string
  latestCommit: string
  workingTreeClean: boolean
  changedFiles: number
  diffEntries: GitDiffEntry[]
}

export function useGitRuntime(): GitRuntime {
  return {
    branch: "feat/interaction-kernel",
    latestCommit: "runtime-dev",
    workingTreeClean: true,
    changedFiles: 0,
    diffEntries: [],
  }
}
