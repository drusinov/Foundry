import { NextResponse } from "next/server"
import { healNginx } from "@/lib/nginx-heal"
import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

export const dynamic = "force-dynamic"

const APPS_DIR      = "/opt/forged-apps"
const REGISTRY_PATH = "/opt/foundry/forged-apps.json"

type RouteContext = { params: Promise<{ slug: string }> }

export async function POST(_: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    const appDir   = path.join(APPS_DIR, slug)
    const pm2Name  = `forge-${slug}`

    let apps: { slug: string; port: number; mode?: string; status?: string }[] = []
    try { apps = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8")) } catch {
      return NextResponse.json({ error: "Registry not found" }, { status: 500 })
    }

    const app = apps.find(a => a.slug === slug)
    if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 })

    const port      = app.port
    const isDevMode = app.mode !== "production"
    const cmd       = isDevMode
      ? `pm2 start ./node_modules/.bin/next --name ${pm2Name} -- dev --port ${port}`
      : `pm2 start ./node_modules/.bin/next --name ${pm2Name} -- start --port ${port}`

    // Try restart first (process already registered in PM2), fall back to fresh start
    try {
      execSync(`pm2 restart ${pm2Name}`, { timeout: 15000, stdio: "pipe" })
    } catch {
      execSync(cmd, { cwd: appDir, timeout: 15000, stdio: "pipe" })
    }

    execSync("pm2 save", { timeout: 5000, stdio: "pipe" })

    // Update registry
    const updated = apps.map(a =>
      a.slug === slug ? { ...a, status: "running" } : a
    )
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(updated, null, 2))

    // Auto-heal nginx in case port mapping is wrong
    healNginx()

    return NextResponse.json({ success: true, slug, status: "running" })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("[start]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
