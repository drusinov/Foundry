import { useState } from "react"

export function useAiRuntime() {
  const [loading, setLoading] =
    useState(false)

  async function executePrompt(
    apiKey: string,
    prompt: string,
  ) {
    setLoading(true)

    try {
      const response =
        await fetch("/api/ai", {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            apiKey,
            prompt,
          }),
        })

      const data =
        await response.json()

      return data.content
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,

    executePrompt,
  }
}