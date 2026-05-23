import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

export const dynamic = "force-dynamic"

const APPS_DIR      = "/opt/forged-apps"
const REGISTRY_PATH = "/opt/foundry/forged-apps.json"

type RouteContext = { params: Promise<{ slug: string }> }

export async function POST(request: Request, context: RouteContext) {
  try {
    const { slug }   = await context.params
    const { commit } = await request.json()

    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    try {
      const registry = JSON.parse(fs.readFileSync('/opt/foundry/forged-apps.json', 'utf8'))
      const app = registry.find((a: { slug: string; userId?: string }) => a.slug === slug)
      if (app && app.userId && app.userId !== session.userId && session.role !== 'admin') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } catch { /* allow */ }

    if (!commit) return NextResponse.json({ error: "commit hash required" }, { status: 400 })

    const appDir  = path.join(APPS_DIR, slug)
    const pm2Name = `forge-${slug}`

    if (!fs.existsSync(path.join(appDir, ".git"))) {
      return NextResponse.json({ error: "No git history for this app" }, { status: 400 })
    }

    // Restore files from that commit without detaching HEAD
    execSync(`git checkout ${commit} -- .`, { cwd: appDir, stdio: "pipe", timeout: 10000 })
    execSync(`git add -A`, { cwd: appDir, stdio: "pipe" })
    execSync(
      `git commit -m "Rollback to ${commit}" --allow-empty`,
      { cwd: appDir, stdio: "pipe" },
    )

    // Restart PM2 process
    try {
      execSync(`pm2 restart ${pm2Name}`, { timeout: 10000, stdio: "pipe" })
    } catch {
      // Try starting if not running
      const apps = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"))
      const app  = apps.find((a: { slug: string; port: number }) => a.slug === slug)
      if (app) {
        execSync(
          `pm2 start ./node_modules/.bin/next --name ${pm2Name} -- dev --port ${app.port}`,
          { cwd: appDir, timeout: 15000, stdio: "pipe" },
        )
      }
    }

    return NextResponse.json({ success: true, slug, commit })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("[rollback]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
