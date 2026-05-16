"use client"

import {
  useEffect,
  useState,
} from "react"

import type { FileRuntimeState } from "@/core/types/file-runtime"

export function useFileRuntime() {
  const [
    fileRuntime,
    setFileRuntime,
  ] = useState<FileRuntimeState | null>(
    null,
  )

  useEffect(() => {
    async function loadFileRuntime() {
      try {
        const response =
          await fetch(
            "/api/file-runtime",
          )

        const data =
          await response.json()

        setFileRuntime(data)
      } catch (error) {
        console.error(error)
      }
    }

    loadFileRuntime()
  }, [])

  return fileRuntime
}