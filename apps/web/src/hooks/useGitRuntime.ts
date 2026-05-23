"use client"

import { useEffect, useState } from "react"

export type GitDiffEntry = {
  status: string
  file:   string
}

export type GitRuntime = {
  branch:           string
  latestCommit:     string
  workingTreeClean: boolean
  changedFiles:     number
  diffEntries:      GitDiffEntry[]
}

const EMPTY: GitRuntime = {
  branch: "", latestCommit: "", workingTreeClean: true, changedFiles: 0, diffEntries: [],
}

export function useGitRuntime(): GitRuntime {
  const [data, setData] = useState<GitRuntime>(EMPTY)

  useEffect(() => {
    async function fetch_() {
      try {
        const res  = await fetch("/api/git-state")
        const json = await res.json()
        setData({
          branch:           json.branch           ?? "",
          latestCommit:     json.latestCommit      ?? "",
          workingTreeClean: json.workingTreeClean  ?? true,
          changedFiles:     json.changedFiles       ?? 0,
          diffEntries:      json.diffEntries        ?? [],
        })
      } catch { /* keep empty state */ }
    }
    fetch_()
    const interval = setInterval(fetch_, 2 * 60 * 1000) // refresh every 2 min
    return () => clearInterval(interval)
  }, [])

  return data
}
