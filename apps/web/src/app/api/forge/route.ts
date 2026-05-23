import { NextResponse } from "next/server"
import fs from "node:fs"

export const dynamic = "force-dynamic"

const CLAUDE_MODEL    = "claude-opus-4-5"
const REGISTRY_PATH  = "/opt/foundry/forged-apps.json"

const GENERATOR_SYSTEM = `
You are a Next.js app code generator. You generate complete, deployable Next.js apps.

Your ENTIRE response must be a single valid JSON object mapping file paths to file contents.
No markdown. No backticks. No explanation. No preamble. Just the raw JSON object.

Example response format:
{"package.json":"...","next.config.js":"...","src/app/page.tsx":"..."}
`.trim()

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48)
    .replace(/-+$/, "") || "app"
}

function uniqueSlug(base: string): string {
  let existing: { slug: string }[] = []
  try {
    if (fs.existsSync(REGISTRY_PATH)) {
      existing = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"))
    }
  } catch {
    existing = []
  }
  const taken = new Set(existing.map((a) => a.slug))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { description, name, anthropicKey } = body

    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Description is required" }, { status: 400 })
    }
    if (!anthropicKey || typeof anthropicKey !== "string") {
      return NextResponse.json({ error: "Anthropic API key is required" }, { status: 400 })
    }

    // Use explicit name for slug if provided, otherwise derive from description
    const slugBase = (name && typeof name === "string" && name.trim())
      ? name.trim()
      : description
    const slug = uniqueSlug(slugify(slugBase))

    const userPrompt = `
Generate a complete Next.js 14 app.

App description: "${description}"
App slug: "${slug}"
Deployment path: "/apps/${slug}"

Required files:
- package.json
- next.config.js
- tailwind.config.js
- postcss.config.mjs
- src/app/layout.tsx
- src/app/page.tsx
- src/app/globals.css

STRICT RULES:
1. next.config.js MUST be plain CommonJS: /** @type {import('next').NextConfig} */ const nextConfig = { basePath: '/apps/${slug}', trailingSlash: true } module.exports = nextConfig
2. tailwind.config.js MUST be plain CommonJS (module.exports), NOT .ts
3. package.json deps: next@14, react@^18, react-dom@^18, typescript@^5, @types/node@^20, @types/react@^18, @types/react-dom@^18, tailwindcss@^3, postcss@^8, autoprefixer@^10
4. scripts: "dev": "next dev", "build": "next build", "start": "next start"
5. Dark theme, visually polished, implement the described functionality fully
6. Respond with ONLY the JSON object.
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
        system:     GENERATOR_SYSTEM,
        messages:   [{ role: "user", content: userPrompt }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: `Claude error: ${data.error?.message ?? "generation failed"}` },
        { status: 502 },
      )
    }

    const rawContent: string = data.content?.[0]?.text ?? ""
    const cleaned = rawContent.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim()

    let files: Record<string, string>
    try {
      // Robust extraction: strip fences, find outermost {} object
      let jsonStr = cleaned.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim()
      const jStart = jsonStr.indexOf("{")
      const jEnd   = jsonStr.lastIndexOf("}")
      if (jStart === -1 || jEnd === -1) throw new Error("no JSON object")
      files = JSON.parse(jsonStr.slice(jStart, jEnd + 1))
    } catch {
      console.error("[forge] JSON parse failed. Raw:", cleaned.slice(0, 500))
      return NextResponse.json({ error: "Claude returned malformed JSON. Try again." }, { status: 502 })
    }

    if (!files["package.json"] || !files["src/app/page.tsx"]) {
      return NextResponse.json({ error: "Generated app is missing required files. Try again." }, { status: 502 })
    }

    // Always override next.config — guarantee it's correct regardless of what Claude produced
    files["next.config.js"] = `/** @type {import('next').NextConfig} */\nconst nextConfig = {\n  basePath: '/apps/${slug}',\n  trailingSlash: true,\n}\nmodule.exports = nextConfig\n`
    delete files["next.config.ts"]
    delete files["next.config.mjs"]

    // Generate a polished app description using Haiku (fast + cheap)
    let appDescription = description
    try {
      const descRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type":      "application/json",
          "x-api-key":         anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model:      "claude-haiku-4-5-20251001",
          max_tokens: 60,
          messages:   [{
            role:    "user",
            content: `Write a clear, attractive app store description in 12 words or less for this app. Return only the description, no quotes, no punctuation at the end.\n\nApp: "${description}"`,
          }],
        }),
      })
      if (descRes.ok) {
        const descData = await descRes.json()
        const generated = descData.content?.[0]?.text?.trim()
        if (generated) appDescription = generated
      }
    } catch { /* non-fatal — use original description */ }

    // Generate SVG icon using Haiku
    let appIcon = ""
    try {
      const iconRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type":      "application/json",
          "x-api-key":         anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model:      "claude-haiku-4-5-20251001",
          max_tokens: 800,
          messages:   [{
            role:    "user",
            content: `Create a 100x100 SVG app icon for: "${appDescription}".
Rules:
- viewBox="0 0 100 100"
- rect rx="20" as background with a bold gradient (use linearGradient)
- One simple white/light icon shape or symbol in the center representing the app
- No text
- Return ONLY the SVG tag, nothing else`,
          }],
        }),
      })
      if (iconRes.ok) {
        const iconData = await iconRes.json()
        const svgRaw   = (iconData.content?.[0]?.text ?? "").trim()
        const svgStart = svgRaw.indexOf("<svg")
        if (svgStart !== -1) appIcon = svgRaw.slice(svgStart)
      }
    } catch { /* non-fatal */ }

    return NextResponse.json({ slug, files, description: appDescription, icon: appIcon })
  } catch (error) {
    console.error("[forge]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Forge generation failed" }, { status: 500 })
  }
}
