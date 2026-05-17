import { NextResponse } from "next/server"

// ── Model config ──────────────────────────────────────────────────────────
const OPENAI_MODEL    = "gpt-4.1-mini"
const CLAUDE_MODEL    = "claude-opus-4-5"   // update if needed

// ── System prompts ────────────────────────────────────────────────────────

// Stage 1 — OpenAI structures the raw context into a focused Claude prompt
const OPENAI_STRUCTURER_PROMPT = `
You are a prompt structuring assistant inside Foundry, an AI-native development workspace.

Your job is NOT to answer the user's request. Your job is to:
1. Read the full operational context and user request below
2. Extract only what's relevant to the request
3. Produce a clear, concise, structured prompt for Claude to act on

Rules:
- Be brief. Strip everything irrelevant from the context.
- Preserve all technical details that matter for the request.
- State the user's goal clearly at the top.
- Do not answer the question yourself. Just structure it.
`.trim()

// Stage 2 — Claude's system prompt
const CLAUDE_SYSTEM_PROMPT = `
You are the operational AI assistant embedded in Foundry — Deyan Rusinov's
AI-native development workspace. Foundry is NOT the Ethereum/Solidity tool.
It is a personal command center for managing software development, deployment,
and AI-assisted workflows.

Tech stack:
- Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript
- Monorepo: Turborepo + pnpm workspaces
- Deployment: Ubuntu VPS at drusinov.eu, PM2, nginx
- Git: github.com/drusinov/Foundry, branch: feat/interaction-kernel

Architecture:
- Foundry Core — the operational runtime (this app). Only editable via git.
- Forge — AI app builder within Foundry. Builds and deploys isolated apps.
- Forged Apps — apps created by Forge, each with their own git repo + VPS.

Response style:
- Direct and concise. No bureaucratic headers.
- When writing code, provide complete working solutions.
- Respond in the same language the user writes in (English or Bulgarian).
`.trim()

// ── Single-provider system prompt (fallback) ──────────────────────────────
const SINGLE_PROVIDER_SYSTEM = `
You are the operational AI assistant embedded in Foundry — Deyan Rusinov's
AI-native development workspace. Be direct, concise, and practical.
Respond in the same language the user writes in.
`.trim()

// ── Handler ───────────────────────────────────────────────────────────────
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
      return NextResponse.json(
        { error: "At least one API key (OpenAI or Anthropic) is required." },
        { status: 400 },
      )
    }

    // ── Two-stage pipeline: OpenAI → Claude ──────────────────────────────
    if (hasOpenAI && hasAnthropic) {
      // Stage 1: OpenAI structures the context
      const stage1 = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
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
        return NextResponse.json(
          { error: `OpenAI error: ${stage1Data.error?.message ?? "unknown"}` },
          { status: 502 },
        )
      }

      const structuredPrompt =
        stage1Data.choices?.[0]?.message?.content ?? prompt

      // Stage 2: Claude generates the final response
      const stage2 = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type":      "application/json",
          "x-api-key":         anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model:      CLAUDE_MODEL,
          max_tokens: 2048,
          system:     CLAUDE_SYSTEM_PROMPT,
          messages: [
            { role: "user", content: structuredPrompt },
          ],
        }),
      })

      const stage2Data = await stage2.json()

      if (!stage2.ok) {
        return NextResponse.json(
          { error: `Claude error: ${stage2Data.error?.message ?? "unknown"}` },
          { status: 502 },
        )
      }

      const content = stage2Data.content?.[0]?.text

      return NextResponse.json({
        content: content ?? "Empty response from Claude.",
        pipeline: "openai→claude",
      })
    }

    // ── Single provider: Claude only ──────────────────────────────────────
    if (hasAnthropic) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type":      "application/json",
          "x-api-key":         anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model:      CLAUDE_MODEL,
          max_tokens: 2048,
          system:     CLAUDE_SYSTEM_PROMPT,
          messages: [{ role: "user", content: prompt }],
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        return NextResponse.json(
          { error: `Claude error: ${data.error?.message ?? "unknown"}` },
          { status: 502 },
        )
      }

      return NextResponse.json({
        content: data.content?.[0]?.text ?? "Empty response.",
        pipeline: "claude",
      })
    }

    // ── Single provider: OpenAI only ──────────────────────────────────────
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: SINGLE_PROVIDER_SYSTEM },
          { role: "user",   content: prompt },
        ],
        temperature: 0.4,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { error: `OpenAI error: ${data.error?.message ?? "unknown"}` },
        { status: 502 },
      )
    }

    return NextResponse.json({
      content: data.choices?.[0]?.message?.content ?? "Empty response.",
      pipeline: "openai",
    })
  } catch (error) {
    console.error("[ai/route]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "AI runtime failure" }, { status: 500 })
  }
}
