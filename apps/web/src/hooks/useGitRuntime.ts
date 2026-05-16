"use client"

import {
  useEffect,
  useState,
} from "react"

import type { GitRuntimeState } from "@/core/types/git-runtime"

export function useGitRuntime() {
  const [
    gitRuntime,
    setGitRuntime,
  ] = useState<GitRuntimeState | null>(
    null,
  )

  useEffect(() => {
    async function loadGitRuntime() {
      try {
        const response =
          await fetch(
            "/api/git-state",
          )

        const data =
          await response.json()

        setGitRuntime(data)
      } catch (error) {
        console.error(error)
      }
    }

    loadGitRuntime()
  }, [])

  return gitRuntime
}