import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { userDb } from "@/lib/db"
import fs from "node:fs"
import path from "node:path"

export const dynamic = "force-dynamic"

const APPS_DIR    = "/opt/forged-apps"
const CLAUDE_MODEL = "claude-opus-4-5"

const EDITOR_SYSTEM = `
You are editing an existing Next.js app. You receive the current source files and a description of what the user wants to change.

Your ENTIRE response must be a single valid JSON object mapping file paths to their NEW contents.
Only include files that need to be ADDED or CHANGED. Do not return unchanged files.
No markdown. No backticks. No explanation. Just the JSON.
`.trim()

const MAX_FILE_CHARS = 3000

function readExistingFiles(appDir: string): Record<string, string> {
  const result: Record<string, string> = {}
  const extensions = /\.(tsx?|jsx?|css|json|mjs|cjs)$/

  function walk(dir: string, base: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === ".next") continue
        const full = path.join(dir, entry.name)
        const rel  = path.relative(base, full)
        if (entry.isDirectory()) { walk(full, base); continue }
        if (!extensions.test(entry.name)) continue
        try {
          const content = fs.readFileSync(full, "utf8")
          result[rel] = content.length > MAX_FILE_CHARS
            ? content.slice(0, MAX_FILE_CHARS) + "\n…(truncated)"
            : content
        } catch { /* skip unreadable */ }
      }
    } catch { /* skip unreadable dirs */ }
  }

  walk(appDir, appDir)
  return result
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

    const { slug, description } = await request.json()

    
    const dbUser  = session ? await userDb.findById(session.userId) : null
    const anthropicKey = dbUser?.anthropic_key ?? ""

    if (!slug || !description) {
      return NextResponse.json({ error: "slug and description required" }, { status: 400 })
    }
    if (!anthropicKey) {
      return NextResponse.json({ error: "No Anthropic key configured." }, { status: 400 })
    }

    const appDir = path.join(APPS_DIR, slug)
    if (!fs.existsSync(appDir)) {
      return NextResponse.json({ error: `App not found: ${slug}` }, { status: 404 })
    }

    // Read what's already there
    const existingFiles = readExistingFiles(appDir)
    const filesSummary  = Object.entries(existingFiles)
      .map(([f, c]) => `### ${f}\n\`\`\`\n${c}\n\`\`\``)
      .join("\n\n")

    const userPrompt = `
Current app slug: "${slug}"
Current basePath: "/apps/${slug}"

EXISTING SOURCE FILES:
${filesSummary}

USER WANTS TO CHANGE:
"${description}"

Instructions:
1. Modify the app to implement what the user described
2. Keep everything that works well — only change what's needed
3. next.config.js MUST stay as: { basePath: '/apps/${slug}', trailingSlash: true }, module.exports = nextConfig
4. Return ONLY the files that changed or are new — omit unchanged files
5. Respond with ONLY the JSON object
    `.trim()

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: 8000,
        system:     EDITOR_SYSTEM,
        messages:   [{ role: "user", content: userPrompt }],
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json({ error: `Claude error: ${data.error?.message ?? "failed"}` }, { status: 502 })
    }

    const raw     = data.content?.[0]?.text ?? ""
    const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim()

    let files: Record<string, string>
    try {
      files = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: "Claude returned malformed JSON. Try again." }, { status: 502 })
    }

    // Always keep next.config.js correct
    files["next.config.js"] = `/** @type {import('next').NextConfig} */\nconst nextConfig = {\n  basePath: '/apps/${slug}',\n  trailingSlash: true,\n}\nmodule.exports = nextConfig\n`
    delete files["next.config.ts"]
    delete files["next.config.mjs"]

    return NextResponse.json({ slug, files, changedFiles: Object.keys(files).length })
  } catch (error) {
    console.error("[forge/edit]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Edit generation failed" }, { status: 500 })
  }
}
