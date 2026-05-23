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
    keys:      { openaiKey: string; anthropicKey: string },
    prompt:    string,
    model:     string,
    onChunk:   (partial: string) => void,
  ): Promise<AiResult> {
    setLoading(true)

    try {
      const response = await fetch("/api/ai", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openaiKey:    keys.openaiKey,
          anthropicKey: keys.anthropicKey,
          prompt,
          model,
        }),
      })

      if (!response.ok || !response.body) {
        return {
          content:  "Server error — could not connect to AI runtime.",
          pipeline: "error",
          usage:    { inputTokens: 0, outputTokens: 0 },
        }
      }

      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let buf  = ""
      let text = ""
      let meta: AiUsage & { pipeline?: string } = { inputTokens: 0, outputTokens: 0 }
      let pipeline = "unknown"
      let errorMsg = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buf += decoder.decode(value, { stream: true })
        const lines = buf.split("\n")
        buf = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const raw = line.slice(6).trim()
          try {
            const ev = JSON.parse(raw)
            if (ev.chunk !== undefined) {
              text += ev.chunk
              onChunk(text)
            }
            if (ev.meta) {
              meta     = ev.meta
              pipeline = ev.meta.pipeline ?? "unknown"
            }
            if (ev.error) {
              errorMsg = ev.error
            }
          } catch { /* skip malformed */ }
        }
      }

      if (errorMsg) {
        return {
          content:  `Error: ${errorMsg}`,
          pipeline: "error",
          usage:    { inputTokens: 0, outputTokens: 0 },
        }
      }

      return {
        content:  text || "Empty response.",
        pipeline,
        usage:    { inputTokens: meta.inputTokens ?? 0, outputTokens: meta.outputTokens ?? 0 },
      }
    } catch (err) {
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
