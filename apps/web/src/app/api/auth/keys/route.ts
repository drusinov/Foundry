import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { userDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function PUT(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const { openaiKey, anthropicKey } = await req.json().catch(() => ({}))

  await userDb.updateKeys(session.userId, { openaiKey, anthropicKey })

  const user = await userDb.findById(session.userId)!
  return NextResponse.json({
    ok:              true,
    hasOpenaiKey:    !!user?.openai_key,
    hasAnthropicKey: !!user?.anthropic_key,
  })
}
