import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { userDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 })
  }

  const users = (await userDb.all()).map(u => ({
    id:              u.id,
    name:            u.name,
    email:           u.email,
    role:            u.role,
    hasOpenaiKey:    !!u.openai_key,
    hasAnthropicKey: !!u.anthropic_key,
    createdAt:       u.created_at,
  }))

  return NextResponse.json(users)
}

export async function DELETE(req: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 })
  }

  const { id } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  if (id === session.userId) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 })
  }

  await userDb.delete(id)
  return NextResponse.json({ ok: true })
}
