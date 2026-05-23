"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function SetupPage() {
  const router  = useRouter()
  const [name, setName]         = useState("")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch("/api/auth/setup")
      .then(r => r.json())
      .then(d => {
        if (!d.needsSetup) router.replace("/")
        else setChecking(false)
      })
  }, [router])

  async function setup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")

    const res  = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json()

    if (!res.ok) { setError(data.error ?? "Setup failed"); setLoading(false); return }

    router.push("/")
    router.refresh()
  }

  if (checking) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg-base)" }}>
      <div style={{ color: "var(--text-4)", fontSize: "13px" }}>Checking…</div>
    </div>
  )

  return (
    <div className="flex min-h-screen items-center justify-center px-6"
      style={{ background: "var(--bg-base)", fontFamily: "var(--font-ui)" }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl text-xl"
            style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)" }}>
            ⚙️
          </div>
          <h1 className="mt-3 text-lg font-semibold" style={{ color: "var(--text-1)" }}>Welcome to Foundry</h1>
          <p style={{ fontSize: "13px", color: "var(--text-4)", marginTop: "4px" }}>Create your admin account to get started</p>
        </div>

        <form onSubmit={setup}>
          <div className="overflow-hidden rounded-2xl" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
            {[
              { label: "Name",     value: name,     set: setName,     type: "text",     placeholder: "Deyan Rusinov" },
              { label: "Email",    value: email,    set: setEmail,    type: "email",    placeholder: "you@example.com" },
              { label: "Password", value: password, set: setPassword, type: "password", placeholder: "••••••••" },
            ].map(({ label, value, set, type, placeholder }, i, arr) => (
              <div key={label} className={i < arr.length - 1 ? "border-b px-4 py-3" : "px-4 py-3"} style={{ borderColor: "var(--border-subtle)" }}>
                <label style={{ fontSize: "10px", color: "var(--text-4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</label>
                <input type={type} value={value} onChange={e => set(e.target.value)}
                  placeholder={placeholder} required autoFocus={i === 0}
                  className="mt-1 w-full bg-transparent outline-none"
                  style={{ fontSize: "14px", color: "var(--text-1)" }} />
              </div>
            ))}
          </div>

          {error && (
            <p className="mt-3 rounded-xl px-4 py-2.5 text-[12px]"
              style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "var(--red)" }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="mt-4 w-full rounded-xl py-2.5 text-[14px] font-medium"
            style={{
              background: loading ? "rgba(167,139,250,0.06)" : "rgba(167,139,250,0.15)",
              border: "1px solid rgba(167,139,250,0.3)",
              color: loading ? "var(--text-4)" : "var(--forge)",
              cursor: loading ? "not-allowed" : "pointer",
            }}>
            {loading ? "Creating account…" : "Create admin account →"}
          </button>
        </form>
      </div>
    </div>
  )
}
