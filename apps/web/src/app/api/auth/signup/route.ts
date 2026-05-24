import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { userDb } from "@/lib/db"
import { signToken, cookieOpts } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const { name, email, password } = await req.json().catch(() => ({}))

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password required" }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  const existing = await userDb.findByEmail(email)
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 })
  }

  const hash = await bcrypt.hash(password, 12)
  const user = await userDb.create({ email, name, passwordHash: hash, role: "user" })
  const token = await signToken(user.id, user.role)

  const res = NextResponse.json({
    ok:   true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
  res.cookies.set(cookieOpts(token))
  return res
}
