import { NextResponse } from "next/server"
import fs from "node:fs"
import { execSync } from "node:child_process"

export const dynamic = "force-dynamic"

const REGISTRY_PATH = "/opt/foundry/forged-apps.json"

type RouteContext = { params: Promise<{ slug: string }> }

export async function POST(_: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    const pm2Name  = `forge-${slug}`

    let apps: { slug: string; status?: string }[] = []
    try { apps = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8")) } catch {
      return NextResponse.json({ error: "Registry not found" }, { status: 500 })
    }

    if (!apps.find(a => a.slug === slug)) {
      return NextResponse.json({ error: "App not found" }, { status: 404 })
    }

    try {
      execSync(`pm2 stop ${pm2Name}`, { timeout: 10000, stdio: "pipe" })
    } catch {
      // Already stopped or not found — still update registry
    }

    execSync("pm2 save", { timeout: 5000, stdio: "pipe" })

    // Update registry
    const updated = apps.map(a =>
      a.slug === slug ? { ...a, status: "stopped" } : a
    )
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(updated, null, 2))

    return NextResponse.json({ success: true, slug, status: "stopped" })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("[stop]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
