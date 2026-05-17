"use client"

import {
  useEffect,
  useState,
} from "react"

import type {
  GitRuntime,
} from "@/core/types/git-runtime"

export function useGitRuntime() {
  const [
    runtime,
    setRuntime,
  ] = useState<GitRuntime | null>(
    null,
  )

  useEffect(() => {
    async function load() {
      try {
        const response =
          await fetch(
            "/api/git-state",
          )

        if (!response.ok) {
          throw new Error(
            "Failed to fetch git runtime",
          )
        }

        const text =
          await response.text()

        const data =
          JSON.parse(text)

        setRuntime(data)
      } catch (error) {
        console.error(error)

        setRuntime(null)
      }
    }

    load()
  }, [])

  return runtime
}