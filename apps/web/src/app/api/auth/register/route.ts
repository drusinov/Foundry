import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getSession } from "@/lib/auth"
import { userDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 })
  }

  const { name, email, password, role = "user" } = await req.json().catch(() => ({}))

  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email and password required" }, { status: 400 })
  }

  if (await userDb.findByEmail(email)) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 })
  }

  const hash = await bcrypt.hash(password, 12)
  const user = await userDb.create({ email, name, passwordHash: hash, role })

  return NextResponse.json({
    ok:   true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
}
