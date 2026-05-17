import { NextResponse } from "next/server"

const OPENAI_MODEL    = "gpt-4.1-mini"
const CLAUDE_MODEL    = "claude-opus-4-5"

const OPENAI_STRUCTURER_PROMPT = `
You are a prompt structuring assistant inside Foundry, an AI-native development workspace.
Extract only what's relevant to the user's request and produce a clear, concise, structured prompt for Claude.
Do not answer the question yourself. Just structure it.
`.trim()

const CLAUDE_SYSTEM_PROMPT = `
You are the operational AI assistant embedded in Foundry — Deyan Rusinov's AI-native development workspace.
Foundry is NOT the Ethereum/Solidity tool. It is a personal command center for managing software development,
deployment, and AI-assisted workflows built with Next.js 16, Turborepo, pnpm, Ubuntu VPS, PM2, nginx.

Architecture:
- Foundry Core — the operational runtime (this app). Only editable via git.
- Forge — AI app builder within Foundry. Builds and deploys isolated apps.
- Forged Apps — apps created by Forge, each with their own git repo + VPS deployment.

Response style:
- Use markdown formatting: headers, **bold**, bullet lists, \`inline code\`, and fenced code blocks
- Be direct and concise. No bureaucratic headers like "Safest Implementation Direction".
- When writing code, use proper fenced code blocks with the language specified.
- Respond in the same language the user writes in (English or Bulgarian).
`.trim()

const SINGLE_PROVIDER_SYSTEM = `
You are the operational AI assistant for Foundry. Be direct, use markdown formatting, and respond in the user's language.
`.trim()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { openaiKey, anthropicKey, prompt } = body

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const hasOpenAI    = typeof openaiKey    === "string" && openaiKey.trim().length > 0
    const hasAnthropic = typeof anthropicKey === "string" && anthropicKey.trim().length > 0

    if (!hasOpenAI && !hasAnthropic) {
      return NextResponse.json({ error: "At least one API key is required." }, { status: 400 })
    }

    // ── Two-stage: OpenAI → Claude ──────────────────────────────────────────
    if (hasOpenAI && hasAnthropic) {
      const stage1 = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: "system", content: OPENAI_STRUCTURER_PROMPT },
            { role: "user",   content: prompt },
          ],
          temperature: 0.2,
        }),
      })

      const stage1Data = await stage1.json()
      if (!stage1.ok) {
        return NextResponse.json({ error: `OpenAI error: ${stage1Data.error?.message ?? "unknown"}` }, { status: 502 })
      }

      const structuredPrompt = stage1Data.choices?.[0]?.message?.content ?? prompt
      const openaiUsage = stage1Data.usage ?? {}

      const stage2 = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model:      CLAUDE_MODEL,
          max_tokens: 2048,
          system:     CLAUDE_SYSTEM_PROMPT,
          messages:   [{ role: "user", content: structuredPrompt }],
        }),
      })

      const stage2Data = await stage2.json()
      if (!stage2.ok) {
        return NextResponse.json({ error: `Claude error: ${stage2Data.error?.message ?? "unknown"}` }, { status: 502 })
      }

      const claudeUsage = stage2Data.usage ?? {}

      return NextResponse.json({
        content:  stage2Data.content?.[0]?.text ?? "Empty response from Claude.",
        pipeline: "openai→claude",
        usage: {
          inputTokens:  (openaiUsage.prompt_tokens ?? 0) + (claudeUsage.input_tokens ?? 0),
          outputTokens: (openaiUsage.completion_tokens ?? 0) + (claudeUsage.output_tokens ?? 0),
        },
      })
    }

    // ── Claude only ─────────────────────────────────────────────────────────
    if (hasAnthropic) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model:      CLAUDE_MODEL,
          max_tokens: 2048,
          system:     CLAUDE_SYSTEM_PROMPT,
          messages:   [{ role: "user", content: prompt }],
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        return NextResponse.json({ error: `Claude error: ${data.error?.message ?? "unknown"}` }, { status: 502 })
      }
      return NextResponse.json({
        content:  data.content?.[0]?.text ?? "Empty response.",
        pipeline: "claude",
        usage: { inputTokens: data.usage?.input_tokens ?? 0, outputTokens: data.usage?.output_tokens ?? 0 },
      })
    }

    // ── OpenAI only ──────────────────────────────────────────────────────────
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model:    OPENAI_MODEL,
        messages: [{ role: "system", content: SINGLE_PROVIDER_SYSTEM }, { role: "user", content: prompt }],
        temperature: 0.4,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: `OpenAI error: ${data.error?.message ?? "unknown"}` }, { status: 502 })
    }
    return NextResponse.json({
      content:  data.choices?.[0]?.message?.content ?? "Empty response.",
      pipeline: "openai",
      usage: { inputTokens: data.usage?.prompt_tokens ?? 0, outputTokens: data.usage?.completion_tokens ?? 0 },
    })
  } catch (error) {
    console.error("[ai/route]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "AI runtime failure" }, { status: 500 })
  }
}
