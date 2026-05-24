import { NextResponse } from "next/server"
import { execSync } from "node:child_process"
import { getSession } from "@/lib/auth"
import { userDb } from "@/lib/db"

export const dynamic = "force-dynamic"

// ── System prompts ────────────────────────────────────────────────────────────

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

You have access to a bash tool for read-only inspection of the codebase. Use it when you need to:
- Read specific files
- Search for patterns across the codebase
- Check git history or status
- List directory contents
- Verify what actually exists before making claims

Always use the tool before asserting facts about the codebase. Do not hallucinate file paths or contents.

Response style:
- Use markdown: headers, **bold**, bullet lists, \`inline code\`, fenced code blocks with language
- Be direct. No bureaucratic headers.
- Respond in the same language the user writes in.
`.trim()

// ── Bash tool definition ──────────────────────────────────────────────────────

const BASH_TOOL = {
  name: "bash",
  description:
    "Execute a read-only bash command on the Foundry VPS at /opt/foundry. " +
    "Allowed: grep, find, cat, ls, wc, head, tail, git log/diff/status/show, ps, pm2 list. " +
    "Write operations are blocked at the server level.",
  input_schema: {
    type: "object" as const,
    properties: {
      command: {
        type: "string",
        description: "The read-only bash command to run (max 500 chars).",
      },
    },
    required: ["command"],
  },
}

// ── Bash whitelist executor ───────────────────────────────────────────────────

const ALLOWED_BASE  = new Set(["grep","find","cat","ls","wc","head","tail","stat","du","df","ps","echo","pwd","file"])
const ALLOWED_GIT   = new Set(["log","diff","status","show","branch","ls-files","shortlog"])
const ALLOWED_PM2   = new Set(["list","status","show","info"])
const BLOCKED_RE    = [/\brm\b/,/\bmv\b/,/\bcp\b/,/[^<]>[^>]/,/>>/,/\|\s*tee\b/,/\bsed\s+-i/,
                        /\beval\b/,/\bsudo\b/,/\bcurl\b/,/\bwget\b/,/\bnode\b/,/\bpython\b/,
                        /git\s+(reset|checkout|push|pull|commit|rebase|clean|merge)/]

function allowedCmd(cmd: string): { ok: boolean; reason?: string } {
  for (const re of BLOCKED_RE) if (re.test(cmd)) return { ok: false, reason: re.source }
  const parts = cmd.trim().split(/\s+/)
  const base  = parts[0]
  if (base === "git") return ALLOWED_GIT.has(parts[1]) ? { ok: true } : { ok: false, reason: `git ${parts[1]} blocked` }
  if (base === "pm2") return ALLOWED_PM2.has(parts[1]) ? { ok: true } : { ok: false, reason: `pm2 ${parts[1]} blocked` }
  return ALLOWED_BASE.has(base) ? { ok: true } : { ok: false, reason: `${base} not in allowlist` }
}

function executeBash(command: string): { output: string; error: boolean } {
  const { ok, reason } = allowedCmd(command)
  if (!ok) return { output: `[BLOCKED] ${reason}`, error: true }
  try {
    const out = execSync(command, {
      cwd: "/opt/foundry", timeout: 10_000, maxBuffer: 512 * 1024,
      env: { ...process.env, PATH: "/usr/bin:/bin:/usr/local/bin" },
    }).toString("utf8")
    return { output: out.slice(0, 20_000), error: false }
  } catch (e: unknown) {
    const err = e as { stderr?: Buffer; message?: string }
    return { output: err?.stderr?.toString?.() ?? String(err?.message ?? e), error: true }
  }
}

// ── SSE helpers ───────────────────────────────────────────────────────────────

const enc = new TextEncoder()
const sseChunk    = (text: string)                    => enc.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`)
const sseToolCall = (tc: { command: string; output: string; error: boolean }) =>
                                                         enc.encode(`data: ${JSON.stringify({ tool_call: tc })}\n\n`)
const sseMeta     = (data: Record<string, unknown>)   => enc.encode(`data: ${JSON.stringify({ meta: data })}\n\n`)
const sseError    = (msg: string)                     => enc.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)

// ── Streaming + agentic tool loop ─────────────────────────────────────────────

type Msg = { role: "user" | "assistant"; content: unknown }

async function streamClaude(
  messages:      Msg[],
  anthropicKey:  string,
  model:         string,
  isAdmin:       boolean,
  controller:    ReadableStreamDefaultController,
  inputRef:      { tokens: number },
  outputRef:     { tokens: number },
) {
  const MAX_ITER = 5
  let iter = 0

  while (iter < MAX_ITER) {
    iter++

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
        messages,
        // Only expose tools to admin users
        ...(isAdmin ? { tools: [BASH_TOOL] } : {}),
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      controller.enqueue(sseError(`Claude error: ${err.error?.message ?? "unknown"}`))
      return
    }

    // Streaming parse
    const reader = res.body!.getReader()
    const dec    = new TextDecoder()
    let buf = ""

    // Track current content blocks
    type ContentBlock =
      | { type: "text"; text: string }
      | { type: "tool_use"; id: string; name: string; input: string; parsed?: Record<string, unknown> }

    const contentBlocks: ContentBlock[] = []
    let currentBlockIdx = -1
    let stopReason = "end_turn"

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

          if (ev.type === "message_start") {
            inputRef.tokens  += ev.message?.usage?.input_tokens  ?? 0
            outputRef.tokens += ev.message?.usage?.output_tokens ?? 0
          }
          if (ev.type === "message_delta") {
            outputRef.tokens = ev.usage?.output_tokens ?? outputRef.tokens
            stopReason = ev.delta?.stop_reason ?? stopReason
          }

          if (ev.type === "content_block_start") {
            currentBlockIdx++
            if (ev.content_block.type === "text") {
              contentBlocks.push({ type: "text", text: "" })
            } else if (ev.content_block.type === "tool_use") {
              contentBlocks.push({ type: "tool_use", id: ev.content_block.id, name: ev.content_block.name, input: "" })
            }
          }

          if (ev.type === "content_block_delta") {
            const block = contentBlocks[currentBlockIdx]
            if (!block) continue
            if (ev.delta.type === "text_delta" && block.type === "text") {
              block.text += ev.delta.text
              controller.enqueue(sseChunk(ev.delta.text)) // stream to client immediately
            }
            if (ev.delta.type === "input_json_delta" && block.type === "tool_use") {
              block.input += ev.delta.partial_json
            }
          }

          if (ev.type === "content_block_stop") {
            const block = contentBlocks[currentBlockIdx]
            if (block?.type === "tool_use") {
              try { block.parsed = JSON.parse(block.input) } catch { block.parsed = {} }
            }
          }
        } catch { /* skip malformed */ }
      }
    }

    // If no tool calls or not admin, we're done
    const toolUseBlocks = contentBlocks.filter((b): b is Extract<ContentBlock, { type: "tool_use" }> => b.type === "tool_use")
    if (stopReason !== "tool_use" || toolUseBlocks.length === 0 || !isAdmin) break

    // Execute tool calls and continue the loop
    messages.push({ role: "assistant", content: contentBlocks.map(b => {
      if (b.type === "text")     return { type: "text", text: b.text }
      if (b.type === "tool_use") return { type: "tool_use", id: b.id, name: b.name, input: b.parsed ?? {} }
      return b
    })})

    const toolResults: unknown[] = []
    for (const block of toolUseBlocks) {
      const command = (block.parsed?.command as string) ?? ""
      const result  = executeBash(command)
      controller.enqueue(sseToolCall({ command, ...result }))
      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result.output || "(no output)" })
    }
    messages.push({ role: "user", content: toolResults })
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const { prompt, model = "claude-sonnet-4-6" } = body
  if (!prompt) return NextResponse.json({ error: "Prompt required" }, { status: 400 })

  // Keys from DB
  const session      = await getSession()
  const dbUser       = session ? await userDb.findById(session.userId) : null
  const openaiKey    = dbUser?.openai_key    ?? ""
  const anthropicKey = dbUser?.anthropic_key ?? ""
  const isAdmin      = session?.role === "admin"

  const hasOpenAI    = openaiKey.trim().length    > 0
  const hasAnthropic = anthropicKey.trim().length > 0

  if (!hasOpenAI && !hasAnthropic) {
    return NextResponse.json({ error: "No API keys configured. Add them in account settings." }, { status: 400 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const inputRef  = { tokens: 0 }
        const outputRef = { tokens: 0 }

        // ── Two-stage: OpenAI structures → Claude responds ──────────────────
        if (hasOpenAI && hasAnthropic) {
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
          inputRef.tokens  += s1Data.usage?.prompt_tokens     ?? 0
          outputRef.tokens += s1Data.usage?.completion_tokens ?? 0

          await streamClaude(
            [{ role: "user", content: structured }],
            anthropicKey, model, isAdmin, controller, inputRef, outputRef,
          )

          controller.enqueue(sseMeta({ pipeline: "openai→claude", inputTokens: inputRef.tokens, outputTokens: outputRef.tokens }))
          controller.close()
          return
        }

        // ── Claude only ─────────────────────────────────────────────────────
        if (hasAnthropic) {
          await streamClaude(
            [{ role: "user", content: prompt }],
            anthropicKey, model, isAdmin, controller, inputRef, outputRef,
          )
          controller.enqueue(sseMeta({ pipeline: "claude", inputTokens: inputRef.tokens, outputTokens: outputRef.tokens }))
          controller.close()
          return
        }

        // ── OpenAI only (fallback, no tools) ────────────────────────────────
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
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          controller.enqueue(sseError(`OpenAI error: ${err.error?.message ?? "unknown"}`))
          controller.close(); return
        }

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
              const text = ev.choices?.[0]?.delta?.content
              if (text) controller.enqueue(sseChunk(text))
            } catch { /* skip */ }
          }
        }

        controller.enqueue(sseMeta({ pipeline: "openai", inputTokens: 0, outputTokens: 0 }))
        controller.close()
      } catch (err) {
        controller.enqueue(sseError(String(err)))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection":    "keep-alive",
    },
  })
}

// Needed by next.config for OpenAI system prompt reference
const OPENAI_SYSTEM = `You are the operational AI for Foundry. Be direct, use markdown, respond in the user's language.`
