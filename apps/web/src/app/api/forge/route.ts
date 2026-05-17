import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const CLAUDE_MODEL = "claude-opus-4-5"

// Claude acts as a pure code generator — returns only JSON, no prose
const GENERATOR_SYSTEM = `
You are a Next.js app code generator. You generate complete, deployable Next.js apps.

Your ENTIRE response must be a single valid JSON object mapping file paths to file contents.
No markdown. No backticks. No explanation. No preamble. Just the raw JSON object.

Example response format:
{"package.json":"...","next.config.mjs":"...","src/app/page.tsx":"..."}
`.trim()

function slugify(description: string): string {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 32)
    .replace(/-+$/, "") || "app"
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { description, anthropicKey } = body

    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Description is required" }, { status: 400 })
    }
    if (!anthropicKey || typeof anthropicKey !== "string") {
      return NextResponse.json({ error: "Anthropic API key is required" }, { status: 400 })
    }

    const slug = `${slugify(description)}-${Date.now().toString(36)}`

    const userPrompt = `
Generate a complete Next.js 14 app.

App description: "${description}"
App slug: "${slug}"
Deployment path: "/apps/${slug}"

Required files (include all of these):
- package.json
- next.config.js
- tailwind.config.ts
- postcss.config.mjs
- src/app/layout.tsx
- src/app/page.tsx
- src/app/globals.css

Rules:
1. next.config.mjs MUST set: basePath: '/apps/${slug}'
2. package.json: name="${slug}", deps=(next@14, react, react-dom, typescript, @types/node, @types/react, @types/react-dom, tailwindcss, postcss, autoprefixer), scripts=(dev, build, start, lint)
3. Use Tailwind CSS properly with dark theme
4. Implement the described functionality fully and polishedly
5. Keep files concise but complete
6. No external API calls unless the description specifically requires them

Remember: respond with ONLY the JSON object. Nothing else.
    `.trim()

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 8000,
        system: GENERATOR_SYSTEM,
        messages: [{ role: "user", content: userPrompt }],
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

    // Parse the generated JSON — strip any accidental markdown fences
    const cleaned = rawContent
      .replace(/^```(?:json)?\n?/m, "")
      .replace(/\n?```$/m, "")
      .trim()

    let files: Record<string, string>
    try {
      files = JSON.parse(cleaned)
    } catch {
      console.error("[forge] JSON parse failed. Raw:", rawContent.slice(0, 500))
      return NextResponse.json(
        { error: "Claude returned malformed JSON. Try again." },
        { status: 502 },
      )
    }

    // Validate we got at least the essential files
    if (!files["package.json"] || !files["src/app/page.tsx"]) {
      return NextResponse.json(
        { error: "Generated app is missing required files. Try again." },
        { status: 502 },
      )
    }

    return NextResponse.json({ slug, files })
  } catch (error) {
    console.error("[forge]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Forge generation failed" }, { status: 500 })
  }
}
