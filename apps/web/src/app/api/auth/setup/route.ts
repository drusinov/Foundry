import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { userDb } from "@/lib/db"
import { signToken, cookieOpts } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({ needsSetup: await userDb.count() === 0 })
}

export async function POST(req: Request) {
  if (await userDb.count() > 0) {
    return NextResponse.json({ error: "Setup already complete" }, { status: 403 })
  }

  const { name, email, password } = await req.json()
  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email and password required" }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 12)
  const user = await userDb.create({ email, name, passwordHash: hash, role: "admin" })
  const token = await signToken(user.id, user.role)

  const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } })
  res.cookies.set(cookieOpts(token))
  return res
}
