import { useState } from "react"

export type AiUsage = { inputTokens: number; outputTokens: number }

export type AiResult = {
  content:  string
  pipeline: string
  usage:    AiUsage
}

export function useAiRuntime() {
  const [loading, setLoading] = useState(false)

  async function executePrompt(
    keys: { openaiKey: string; anthropicKey: string },
    prompt: string,
  ): Promise<AiResult> {
    setLoading(true)

    try {
      const response = await fetch("/api/ai", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openaiKey: keys.openaiKey, anthropicKey: keys.anthropicKey, prompt }),
      })

      const text = await response.text()

      let data: Record<string, unknown>
      try {
        data = JSON.parse(text)
      } catch {
        return {
          content:  "Server returned an unexpected response. This usually means a timeout. Try again.",
          pipeline: "error",
          usage:    { inputTokens: 0, outputTokens: 0 },
        }
      }

      if (!response.ok) {
        return {
          content:  typeof data.error === "string" ? `Error: ${data.error}` : "Request failed.",
          pipeline: "error",
          usage:    { inputTokens: 0, outputTokens: 0 },
        }
      }

      return {
        content:  typeof data.content  === "string" ? data.content  : "Empty response.",
        pipeline: typeof data.pipeline === "string" ? data.pipeline : "unknown",
        usage: {
          inputTokens:  typeof (data.usage as AiUsage)?.inputTokens  === "number" ? (data.usage as AiUsage).inputTokens  : 0,
          outputTokens: typeof (data.usage as AiUsage)?.outputTokens === "number" ? (data.usage as AiUsage).outputTokens : 0,
        },
      }
    } catch (err) {
      console.error("[useAiRuntime]", err)
      return {
        content:  "Network error — could not reach the AI runtime.",
        pipeline: "error",
        usage:    { inputTokens: 0, outputTokens: 0 },
      }
    } finally {
      setLoading(false)
    }
  }

  return { loading, executePrompt }
}
