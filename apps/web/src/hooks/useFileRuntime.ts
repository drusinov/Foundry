"use client"

import { useEffect, useState } from "react"

export type FileRuntime = {
  fileTree: string[]
  keyFileContents: Record<string, string>
  recentCommits: string[]
  dependencies: Record<string, string>
}

const EMPTY: FileRuntime = {
  fileTree: [],
  keyFileContents: {},
  recentCommits: [],
  dependencies: {},
}

export function useFileRuntime(): FileRuntime {
  const [data, setData] = useState<FileRuntime>(EMPTY)

  useEffect(() => {
    fetch("/api/file-runtime")
      .then((r) => r.json())
      .then((json) => {
        setData({
          fileTree:        json.fileTree        ?? [],
          keyFileContents: json.keyFileContents ?? {},
          recentCommits:   json.recentCommits   ?? [],
          dependencies:    json.dependencies    ?? {},
        })
      })
      .catch((err) => console.error("[useFileRuntime]", err))
  }, [])

  return data
}
