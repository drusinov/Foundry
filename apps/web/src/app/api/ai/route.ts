import { NextResponse } from "next/server"

const SYSTEM_PROMPT = `
You are the operational AI assistant embedded in Foundry — Deyan Rusinov's
AI-native development workspace. You have full context of the project's git
state, runtime status, and recent activity through the user's message.

Your role:
- Help Deyan maintain, debug, and evolve the Foundry codebase
- Answer questions about the project accurately using the context provided
- Guide implementation decisions with direct, practical advice
- When asked for code, provide working code

Your response style:
- Be direct and concise. No bureaucratic headers or structured templates.
- Never use headers like "Safest Implementation Direction" or "Operational Risks"
- Just answer the question clearly, like a senior developer would
- When writing code, prefer complete working solutions over partial sketches
- Respond in the same language the user writes in (supports English and Bulgarian)
- Keep responses focused — a short accurate answer beats a long vague one
`.trim()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { apiKey, prompt } = body

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 },
      )
    }

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      )
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.4,
        }),
      },
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data.error?.message ?? "OpenAI request failed",
        },
        { status: 502 },
      )
    }

    const content = data.choices?.[0]?.message?.content

    return NextResponse.json({
      content: content ?? "Empty AI response",
    })
  } catch (error) {
    console.error(
      "[ai/route]",
      error instanceof Error ? error.message : error,
    )

    return NextResponse.json(
      { error: "AI runtime failure" },
      { status: 500 },
    )
  }
}
