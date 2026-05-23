import { SignJWT, jwtVerify, type JWTPayload } from "jose"
import { cookies } from "next/headers"

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "foundry-dev-secret-change-on-vps"
)

export const SESSION_COOKIE = "foundry-session"

export type SessionPayload = JWTPayload & {
  userId: string
  role:   string
}

export async function signToken(userId: string, role: string): Promise<string> {
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as SessionPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  const token  = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export function cookieOpts(token: string) {
  return {
    name:     SESSION_COOKIE,
    value:    token,
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path:     "/",
    maxAge:   60 * 60 * 24 * 30,
  }
}
