"use client"

import { useCallback, useEffect, useState } from "react"

export type FileRuntime = {
  fileTree:        string[]
  keyFileContents: Record<string, string>
  recentCommits:   string[]
  dependencies:    Record<string, string>
  fetchedAt?:      string
}

const EMPTY: FileRuntime = {
  fileTree: [], keyFileContents: {}, recentCommits: [], dependencies: {},
}

const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes

export function useFileRuntime(): FileRuntime & { refresh: () => void; lastFetched: Date | null } {
  const [data, setData]           = useState<FileRuntime>(EMPTY)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  const refresh = useCallback(() => {
    fetch("/api/file-runtime")
      .then(r => r.json())
      .then(json => {
        setData({
          fileTree:        json.fileTree        ?? [],
          keyFileContents: json.keyFileContents ?? {},
          recentCommits:   json.recentCommits   ?? [],
          dependencies:    json.dependencies    ?? {},
        })
        setLastFetched(new Date())
      })
      .catch(err => console.error("[useFileRuntime]", err))
  }, [])

  // Fetch on mount
  useEffect(() => { refresh() }, [refresh])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(refresh, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [refresh])

  return { ...data, refresh, lastFetched }
}
