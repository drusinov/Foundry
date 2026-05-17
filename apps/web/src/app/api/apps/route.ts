import { NextResponse } from "next/server"
import fs from "node:fs"
import { execSync } from "node:child_process"

export const dynamic = "force-dynamic"

const REGISTRY_PATH = "/opt/foundry/forged-apps.json"

function readRegistry() {
  try {
    if (!fs.existsSync(REGISTRY_PATH)) return []
    return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"))
  } catch {
    return []
  }
}

// GET — list all forged apps with live PM2 status
export async function GET() {
  try {
    const apps = readRegistry()

    // Enrich with live PM2 status
    let pm2List: { name: string; pm2_env: { status: string } }[] = []
    try {
      const raw = execSync("pm2 jlist", { timeout: 5000, stdio: "pipe" }).toString()
      pm2List = JSON.parse(raw)
    } catch {
      // PM2 not available or error — use registry status
    }

    const enriched = apps.map((app: { pm2Name: string; status: string }) => {
      const pm2Process = pm2List.find((p) => p.name === app.pm2Name)
      return {
        ...app,
        status: pm2Process
          ? pm2Process.pm2_env.status === "online" ? "running" : "stopped"
          : app.status,
      }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    console.error("[apps]", error)
    return NextResponse.json([], { status: 200 })
  }
}

// DELETE — stop and remove a forged app
export async function DELETE(request: Request) {
  try {
    const { slug } = await request.json()
    if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 })

    const apps = readRegistry()
    const app = apps.find((a: { slug: string }) => a.slug === slug)
    if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 })

    // Stop PM2 process
    try {
      execSync(`pm2 stop ${app.pm2Name} && pm2 delete ${app.pm2Name} && pm2 save`, { timeout: 10000, stdio: "pipe" })
    } catch { /* already stopped */ }

    // Remove from registry
    const updated = apps.filter((a: { slug: string }) => a.slug !== slug)
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(updated, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
