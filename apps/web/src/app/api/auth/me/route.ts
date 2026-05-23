import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { userDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const user = await userDb.findById(session.userId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  return NextResponse.json({
    id:              user.id,
    name:            user.name,
    email:           user.email,
    role:            user.role,
    hasOpenaiKey:    !!user.openai_key,
    hasAnthropicKey: !!user.anthropic_key,
  })
}
