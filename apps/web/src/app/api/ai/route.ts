import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const OPENAI_STRUCTURER = `
You are a prompt structuring assistant inside Foundry, an AI-native development workspace.
Extract only what's relevant to the user's request and produce a clear, concise, structured prompt for Claude.
Do not answer the question yourself. Just structure it.
`.trim()

const CLAUDE_SYSTEM = `
You are the operational AI assistant embedded in Foundry — Deyan Rusinov's AI-native development workspace.
Foundry is NOT the Ethereum/Solidity tool. It is a personal command center for managing software development,
deployment, and AI-assisted workflows built with Next.js 16, Turborepo, pnpm, Ubuntu VPS, PM2, nginx.

Architecture:
- Foundry Core — the operational runtime (this app). Only editable via git.
- Forge — AI app builder within Foundry. Builds and deploys isolated apps.
- Forged Apps — apps created by Forge, each with their own git repo + VPS deployment.

Response style:
- Use markdown: headers, **bold**, bullet lists, \`inline code\`, fenced code blocks with language
- Be direct. No bureaucratic headers like "Safest Implementation Direction".
- Respond in the same language the user writes in.
`.trim()

const OPENAI_SYSTEM = `You are the operational AI for Foundry. Be direct, use markdown, respond in the user's language.`.trim()

const encoder = new TextEncoder()

function sseChunk(text: string) {
  return encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`)
}

function sseMeta(data: Record<string, unknown>) {
  return encoder.encode(`data: ${JSON.stringify({ meta: data })}\n\n`)
}

function sseError(msg: string) {
  return encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const { openaiKey, anthropicKey, prompt, model = "claude-sonnet-4-6" } = body

  if (!prompt) return NextResponse.json({ error: "Prompt required" }, { status: 400 })

  const hasOpenAI    = typeof openaiKey    === "string" && openaiKey.trim().length > 0
  const hasAnthropic = typeof anthropicKey === "string" && anthropicKey.trim().length > 0

  if (!hasOpenAI && !hasAnthropic) {
    return NextResponse.json({ error: "At least one API key required" }, { status: 400 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // ── Two-stage: OpenAI → Claude (streaming) ──────────────────────────
        if (hasOpenAI && hasAnthropic) {
          // Stage 1: OpenAI structures the prompt (non-streaming, fast)
          const s1 = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
            body: JSON.stringify({
              model: "gpt-4.1-mini",
              messages: [
                { role: "system", content: OPENAI_STRUCTURER },
                { role: "user",   content: prompt },
              ],
              temperature: 0.2,
            }),
          })
          const s1Data = await s1.json()
          if (!s1.ok) {
            controller.enqueue(sseError(`OpenAI error: ${s1Data.error?.message ?? "unknown"}`))
            controller.close(); return
          }
          const structured = s1Data.choices?.[0]?.message?.content ?? prompt
          const openaiUsage = s1Data.usage ?? {}

          // Stage 2: Claude streams the response
          const s2 = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type":      "application/json",
              "x-api-key":         anthropicKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model,
              max_tokens: 4096,
              stream:     true,
              system:     CLAUDE_SYSTEM,
              messages:   [{ role: "user", content: structured }],
            }),
          })

          if (!s2.ok) {
            const err = await s2.json()
            controller.enqueue(sseError(`Claude error: ${err.error?.message ?? "unknown"}`))
            controller.close(); return
          }

          let claudeInput = 0, claudeOutput = 0
          const reader = s2.body!.getReader()
          const dec    = new TextDecoder()
          let buf = ""

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buf += dec.decode(value, { stream: true })
            const lines = buf.split("\n")
            buf = lines.pop() ?? ""

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue
              const raw = line.slice(6).trim()
              if (raw === "[DONE]") continue
              try {
                const ev = JSON.parse(raw)
                if (ev.type === "message_start")      claudeInput  = ev.message?.usage?.input_tokens ?? 0
                if (ev.type === "message_delta")       claudeOutput = ev.usage?.output_tokens ?? 0
                if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
                  controller.enqueue(sseChunk(ev.delta.text))
                }
              } catch { /* skip malformed */ }
            }
          }

          controller.enqueue(sseMeta({
            pipeline:     "openai→claude",
            inputTokens:  (openaiUsage.prompt_tokens ?? 0) + claudeInput,
            outputTokens: (openaiUsage.completion_tokens ?? 0) + claudeOutput,
          }))
          controller.close()
          return
        }

        // ── Claude only (streaming) ─────────────────────────────────────────
        if (hasAnthropic) {
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type":      "application/json",
              "x-api-key":         anthropicKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model,
              max_tokens: 4096,
              stream:     true,
              system:     CLAUDE_SYSTEM,
              messages:   [{ role: "user", content: prompt }],
            }),
          })

          if (!res.ok) {
            const err = await res.json()
            controller.enqueue(sseError(`Claude error: ${err.error?.message ?? "unknown"}`))
            controller.close(); return
          }

          let inputTokens = 0, outputTokens = 0
          const reader = res.body!.getReader()
          const dec    = new TextDecoder()
          let buf = ""

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buf += dec.decode(value, { stream: true })
            const lines = buf.split("\n")
            buf = lines.pop() ?? ""

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue
              const raw = line.slice(6).trim()
              if (raw === "[DONE]") continue
              try {
                const ev = JSON.parse(raw)
                if (ev.type === "message_start")      inputTokens  = ev.message?.usage?.input_tokens ?? 0
                if (ev.type === "message_delta")       outputTokens = ev.usage?.output_tokens ?? 0
                if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
                  controller.enqueue(sseChunk(ev.delta.text))
                }
              } catch { /* skip */ }
            }
          }

          controller.enqueue(sseMeta({ pipeline: "claude", inputTokens, outputTokens }))
          controller.close()
          return
        }

        // ── OpenAI only (streaming) ─────────────────────────────────────────
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({
            model:    "gpt-4.1-mini",
            stream:   true,
            messages: [
              { role: "system", content: OPENAI_SYSTEM },
              { role: "user",   content: prompt },
            ],
            temperature: 0.4,
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          controller.enqueue(sseError(`OpenAI error: ${err.error?.message ?? "unknown"}`))
          controller.close(); return
        }

        let promptTokens = 0, completionTokens = 0
        const reader = res.body!.getReader()
        const dec    = new TextDecoder()
        let buf = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += dec.decode(value, { stream: true })
          const lines = buf.split("\n")
          buf = lines.pop() ?? ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const raw = line.slice(6).trim()
            if (raw === "[DONE]") continue
            try {
              const ev = JSON.parse(raw)
              const chunk = ev.choices?.[0]?.delta?.content
              if (chunk) controller.enqueue(sseChunk(chunk))
              if (ev.usage) { promptTokens = ev.usage.prompt_tokens; completionTokens = ev.usage.completion_tokens }
            } catch { /* skip */ }
          }
        }

        controller.enqueue(sseMeta({ pipeline: "openai", inputTokens: promptTokens, outputTokens: completionTokens }))
        controller.close()
      } catch (err) {
        controller.enqueue(sseError(err instanceof Error ? err.message : "AI runtime failure"))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type":          "text/event-stream",
      "Cache-Control":         "no-cache",
      "X-Accel-Buffering":     "no",   // tell nginx not to buffer
    },
  })
}
