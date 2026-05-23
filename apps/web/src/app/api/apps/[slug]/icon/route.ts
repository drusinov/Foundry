import { NextResponse } from "next/server"
import fs from "node:fs"

export const dynamic = "force-dynamic"

const REGISTRY_PATH = "/opt/foundry/forged-apps.json"

type RouteContext = { params: Promise<{ slug: string }> }

const ICON_PROMPT = (name: string, description: string) => `
Create a 100x100 SVG app icon for an app called "${name}".
App: ${description}

Requirements:
- viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
- Bold colorful gradient background using <linearGradient> (use vivid colors matching the app theme)
- rect width="100" height="100" rx="18" as background shape
- One clear, recognizable symbol or icon shape in the center (white or light colored)
- The symbol should reflect what the app does (e.g. calculator = grid of dots, snake = curved line, piano = keys, timer = clock)
- No text whatsoever
- Return ONLY the SVG code starting with <svg, nothing else before or after
`.trim()

export async function POST(request: Request, context: RouteContext) {
  try {
    const { slug }        = await context.params
    const { anthropicKey } = await request.json()

    if (!anthropicKey) {
      return NextResponse.json({ error: "anthropicKey required" }, { status: 400 })
    }

    let apps: { slug: string; name?: string; description?: string; icon?: string }[] = []
    try { apps = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8")) } catch {
      return NextResponse.json({ error: "Registry not found" }, { status: 500 })
    }

    const app = apps.find(a => a.slug === slug)
    if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 })

    const name        = app.name || slug
    const description = app.description || slug

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        messages:   [{ role: "user", content: ICON_PROMPT(name, description) }],
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.error?.message ?? "Claude error" }, { status: 502 })
    }

    const data = await res.json()
    const raw  = (data.content?.[0]?.text ?? "").trim()

    // Find <svg anywhere in the response — Claude sometimes adds a preamble line
    const svgStart = raw.indexOf("<svg")
    if (svgStart === -1) {
      return NextResponse.json({ error: "Claude did not return a valid SVG" }, { status: 502 })
    }

    const icon = raw.slice(svgStart)

    // Save to registry
    const updated = apps.map(a => a.slug === slug ? { ...a, icon } : a)
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(updated, null, 2))

    return NextResponse.json({ success: true, slug, icon })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
