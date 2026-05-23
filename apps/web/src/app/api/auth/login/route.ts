import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { userDb } from "@/lib/db"
import { signToken, cookieOpts } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}))

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 })
  }

  const user = await userDb.findByEmail(email)
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const token = await signToken(user.id, user.role)
  const res   = NextResponse.json({
    ok:   true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
  res.cookies.set(cookieOpts(token))
  return res
}
