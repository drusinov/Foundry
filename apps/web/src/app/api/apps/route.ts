import { NextResponse } from "next/server"
import fs from "node:fs"
import { execSync } from "node:child_process"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

const REGISTRY_PATH = "/opt/foundry/forged-apps.json"

type ForgedApp = { slug: string; pm2Name: string; appDir: string; userId?: string }

function readRegistry(): ForgedApp[] {
  try { return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8")) } catch { return [] }
}
function writeRegistry(apps: ForgedApp[]) {
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(apps, null, 2))
}

export async function GET() {
  try {
    const session = await getSession()
    const all     = readRegistry()
    const apps = session?.role === "admin"
      ? all
      : all.filter(a => !a.userId || a.userId === session?.userId)
    return NextResponse.json(apps)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession()
    const { slug } = await request.json()
    if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 })

    const apps = readRegistry()
    const app  = apps.find(a => a.slug === slug)
    if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 })
    if (session?.role !== "admin" && app.userId !== session?.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    try { execSync(`pm2 stop ${app.pm2Name} && pm2 delete ${app.pm2Name} && pm2 save`, { timeout: 10000 }) } catch { /* ok */ }
    writeRegistry(apps.filter(a => a.slug !== slug))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
