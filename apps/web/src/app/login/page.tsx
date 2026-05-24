"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")

    const res  = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? "Login failed")
      setLoading(false)
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6"
      style={{ background: "var(--bg-base)", fontFamily: "var(--font-ui)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl text-xl"
            style={{ background: "rgba(99,153,255,0.12)", border: "1px solid rgba(99,153,255,0.25)" }}>
            ⚙️
          </div>
          <h1 className="mt-3 text-lg font-semibold" style={{ color: "var(--text-1)" }}>Foundry</h1>
          <p style={{ fontSize: "13px", color: "var(--text-4)", marginTop: "4px" }}>Sign in to your workspace</p>
        </div>

        {/* Form */}
        <form onSubmit={login}>
          <div className="overflow-hidden rounded-2xl" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
            {/* Email */}
            <div className="border-b px-4 py-3" style={{ borderColor: "var(--border-subtle)" }}>
              <label style={{ fontSize: "10px", color: "var(--text-4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required autoFocus
                className="mt-1 w-full bg-transparent outline-none"
                style={{ fontSize: "14px", color: "var(--text-1)" }}
              />
            </div>
            {/* Password */}
            <div className="px-4 py-3">
              <label style={{ fontSize: "10px", color: "var(--text-4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="mt-1 w-full bg-transparent outline-none"
                style={{ fontSize: "14px", color: "var(--text-1)" }}
              />
            </div>
          </div>

          {error && (
            <p className="mt-3 rounded-xl px-4 py-2.5 text-[12px]"
              style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "var(--red)" }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="mt-4 w-full rounded-xl py-2.5 text-[14px] font-medium"
            style={{
              background: loading ? "rgba(99,153,255,0.06)" : "rgba(99,153,255,0.15)",
              border: "1px solid rgba(99,153,255,0.3)",
              color: loading ? "var(--text-4)" : "var(--blue)",
              cursor: loading ? "not-allowed" : "pointer",
            }}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center" style={{ fontSize: "12px", color: "var(--text-4)" }}>
          No account?{" "}
          <Link href="/signup" style={{ color: "var(--blue)", textDecoration: "none" }}>Create one →</Link>
        </p>
      </div>
    </div>
  )
}
