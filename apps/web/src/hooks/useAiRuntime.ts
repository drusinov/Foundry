import { useState } from "react"

export function useAiRuntime() {
  const [loading, setLoading] = useState(false)

  async function executePrompt(
    apiKey: string,
    prompt: string,
  ): Promise<string | null> {
    setLoading(true)

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, prompt }),
      })

      // Read as text first — if nginx times out or returns an HTML error
      // page, response.json() will throw. This handles it gracefully.
      const text = await response.text()

      let data: Record<string, unknown>
      try {
        data = JSON.parse(text)
      } catch {
        console.error("[useAiRuntime] Non-JSON response:", text.slice(0, 200))
        return "The server returned an unexpected response. This usually means the request took too long and nginx timed out. Try again or check your VPS nginx proxy_read_timeout setting."
      }

      if (!response.ok) {
        const msg = typeof data.error === "string"
          ? data.error
          : "AI request failed"
        return `Error: ${msg}`
      }

      return typeof data.content === "string" ? data.content : null
    } catch (err) {
      console.error("[useAiRuntime]", err)
      return "Network error — could not reach the AI runtime."
    } finally {
      setLoading(false)
    }
  }

  return { loading, executePrompt }
}
