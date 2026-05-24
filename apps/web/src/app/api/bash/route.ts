import { NextResponse } from "next/server"
import { execSync } from "node:child_process"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

const WORK_DIR = "/opt/foundry"

// Commands allowed as the base executable
const ALLOWED_BASE = new Set([
  "grep", "find", "cat", "ls", "wc", "head", "tail",
  "stat", "file", "du", "df", "ps", "echo", "pwd",
])

// git subcommands allowed
const ALLOWED_GIT = new Set([
  "log", "diff", "status", "show", "branch",
  "ls-files", "shortlog", "describe",
])

// pm2 subcommands allowed
const ALLOWED_PM2 = new Set(["list", "status", "show", "info"])

// Patterns that are ALWAYS blocked regardless of base command
const BLOCKED_PATTERNS = [
  /\brm\b/,
  /\bmv\b/,
  /\bcp\b/,
  /\bchmod\b/,
  /\bchown\b/,
  /\bmkdir\b/,
  /\btouch\b/,
  /\bkill\b/,
  /\bpkill\b/,
  /[^<]>[^>]/, // single redirect (write)
  />>/,         // append redirect
  /\|\s*tee\b/,
  /\bsed\s+-i/,
  /\bawk\s.*>/, // awk with redirect
  /\beval\b/,
  /\bexec\b/,
  /\bsource\b/,
  /\bsudo\b/,
  /\bcurl\b/,
  /\bwget\b/,
  /\bnpm\b/,
  /\bpnpm\b/,
  /\bnode\b/,
  /\bpython\b/,
  // Dangerous git subcommands
  /\bgit\s+(reset|checkout|push|pull|commit|rebase|clean|merge|stash\s+pop|am|apply|cherry)/,
]

function check(cmd: string): { ok: boolean; reason?: string } {
  const trimmed = cmd.trim()

  // Block patterns first (highest priority)
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { ok: false, reason: `Blocked pattern: ${pattern.source}` }
    }
  }

  const parts = trimmed.split(/\s+/)
  const base  = parts[0]

  if (base === "git") {
    const sub = parts[1] === "-C" ? parts[3] : parts[1]
    if (!sub || !ALLOWED_GIT.has(sub)) {
      return { ok: false, reason: `git ${sub ?? "?"} not in allowlist` }
    }
    return { ok: true }
  }

  if (base === "pm2") {
    const sub = parts[1]
    if (!sub || !ALLOWED_PM2.has(sub)) {
      return { ok: false, reason: `pm2 ${sub ?? "?"} not in allowlist` }
    }
    return { ok: true }
  }

  if (!ALLOWED_BASE.has(base)) {
    return { ok: false, reason: `'${base}' not in allowlist` }
  }

  return { ok: true }
}

export async function POST(req: Request) {
  // Admin only
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 })
  }

  const { command } = await req.json().catch(() => ({}))
  if (!command || typeof command !== "string" || command.length > 500) {
    return NextResponse.json({ error: "command required (max 500 chars)" }, { status: 400 })
  }

  const { ok, reason } = check(command)
  if (!ok) {
    return NextResponse.json({ error: `Blocked: ${reason}`, blocked: true }, { status: 403 })
  }

  try {
    const output = execSync(command, {
      cwd:       WORK_DIR,
      timeout:   10_000,
      maxBuffer: 512 * 1024, // 512KB max
      env:       { ...process.env, PATH: "/usr/bin:/bin:/usr/local/bin" },
    }).toString("utf8")

    return NextResponse.json({
      command,
      output: output.slice(0, 20_000), // cap response at 20KB
      truncated: output.length > 20_000,
    })
  } catch (err: unknown) {
    const e = err as { stderr?: Buffer; message?: string }
    const stderr = e?.stderr?.toString?.() ?? ""
    return NextResponse.json({
      command,
      output:  stderr || String(e?.message ?? err),
      error:   true,
    })
  }
}
