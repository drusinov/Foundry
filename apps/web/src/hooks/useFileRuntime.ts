"use client"

import {
  useEffect,
  useState,
} from "react"

import type {
  FileRuntime,
} from "@/core/types/file-runtime"

export function useFileRuntime() {
  const [
    runtime,
    setRuntime,
  ] = useState<FileRuntime | null>(
    null,
  )

  useEffect(() => {
    async function load() {
      try {
        const response =
          await fetch(
            "/api/file-runtime",
          )

        if (!response.ok) {
          throw new Error(
            "Failed to fetch file runtime",
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