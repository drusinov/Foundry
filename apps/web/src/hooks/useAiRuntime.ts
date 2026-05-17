import { useState } from "react"

export function useAiRuntime() {
  const [loading, setLoading] = useState(false)

  async function executePrompt(
    keys: { openaiKey: string; anthropicKey: string },
    prompt: string,
  ): Promise<{ content: string; pipeline: string } | null> {
    setLoading(true)

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openaiKey:    keys.openaiKey,
          anthropicKey: keys.anthropicKey,
          prompt,
        }),
      })

      const text = await response.text()

      let data: Record<string, unknown>
      try {
        data = JSON.parse(text)
      } catch {
        console.error("[useAiRuntime] Non-JSON response:", text.slice(0, 200))
        return {
          content:  "Server returned an unexpected response. This usually means a timeout. Try again.",
          pipeline: "error",
        }
      }

      if (!response.ok) {
        return {
          content:  typeof data.error === "string" ? `Error: ${data.error}` : "Request failed.",
          pipeline: "error",
        }
      }

      return {
        content:  typeof data.content  === "string" ? data.content  : "Empty response.",
        pipeline: typeof data.pipeline === "string" ? data.pipeline : "unknown",
      }
    } catch (err) {
      console.error("[useAiRuntime]", err)
      return {
        content:  "Network error — could not reach the AI runtime.",
        pipeline: "error",
      }
    } finally {
      setLoading(false)
    }
  }

  return { loading, executePrompt }
}
