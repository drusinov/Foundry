import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "foundry-dev-secret-change-on-vps"
)

const SESSION_COOKIE = "foundry-session"

const PUBLIC = [
  "/login",
  "/setup",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/setup",
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next()

  const token = req.cookies.get(SESSION_COOKIE)?.value

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", req.url))
  }

  try {
    const { payload } = await jwtVerify(token, secret)
    const res = NextResponse.next()
    res.headers.set("x-user-id",   payload.userId as string)
    res.headers.set("x-user-role", payload.role   as string)
    return res
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }
    const url = new URL("/login", req.url)
    const res = NextResponse.redirect(url)
    res.cookies.delete(SESSION_COOKIE)
    return res
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
}
