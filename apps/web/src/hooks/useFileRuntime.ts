"use client"

import { useCallback, useEffect, useState } from "react"

export type FileRuntime = {
  fileTree:        string[]
  keyFileContents: Record<string, string>
  recentCommits:   string[]
  recentDiff:      string
  dependencies:    Record<string, string>
  readAt?:         string
}

const EMPTY: FileRuntime = {
  fileTree: [], keyFileContents: {}, recentCommits: [], recentDiff: "", dependencies: {},
}

const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes passive refresh

export function useFileRuntime() {
  const [data, setData]             = useState<FileRuntime>(EMPTY)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [loading, setLoading]       = useState(false)

  const refresh = useCallback(async (): Promise<FileRuntime> => {
    setLoading(true)
    try {
      const res  = await fetch("/api/file-runtime")
      const json = await res.json()
      const fresh: FileRuntime = {
        fileTree:        json.fileTree        ?? [],
        keyFileContents: json.keyFileContents ?? {},
        recentCommits:   json.recentCommits   ?? [],
        recentDiff:      json.recentDiff      ?? "",
        dependencies:    json.dependencies    ?? {},
        readAt:          json.readAt,
      }
      setData(fresh)
      setLastFetched(new Date())
      return fresh
    } catch (err) {
      console.error("[useFileRuntime]", err)
      return data
    } finally {
      setLoading(false)
    }
  }, [data])

  // Fetch on mount
  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Passive refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(refresh, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [refresh])

  return { ...data, refresh, lastFetched, loading }
}
