import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

type BalanceResult = {
  openai:    { available: number | null; used: number | null; currency: string } | null
  anthropic: null   // no public billing API
  error?:    string
}

export async function POST(request: Request) {
  const { openaiKey } = await request.json().catch(() => ({}))

  const result: BalanceResult = { openai: null, anthropic: null }

  // ── OpenAI ─────────────────────────────────────────────────────────────────
  if (openaiKey) {
    try {
      // Try credit grants endpoint (works for free-tier / prepaid)
      const res = await fetch(
        "https://api.openai.com/v1/dashboard/billing/credit_grants",
        { headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" } },
      )
      if (res.ok) {
        const data = await res.json()
        result.openai = {
          available: data.total_available ?? null,
          used:      data.total_used      ?? null,
          currency:  "USD",
        }
      } else {
        // Fallback: try subscription endpoint
        const res2 = await fetch(
          "https://api.openai.com/v1/dashboard/billing/subscription",
          { headers: { Authorization: `Bearer ${openaiKey}` } },
        )
        if (res2.ok) {
          const data2 = await res2.json()
          result.openai = {
            available: data2.hard_limit_usd ?? null,
            used:      null,
            currency:  "USD",
          }
        }
      }
    } catch (err) {
      result.error = String(err)
    }
  }

  // Anthropic has no public billing API — client shows console link
  result.anthropic = null

  return NextResponse.json(result)
}
