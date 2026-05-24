import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

const APPS_DIR      = "/opt/forged-apps"
const REGISTRY_PATH = "/opt/foundry/forged-apps.json"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

    const { slug, files } = await request.json()
    if (!slug || !files || typeof files !== "object") {
      return NextResponse.json({ error: "slug and files required" }, { status: 400 })
    }

    const appDir = path.join(APPS_DIR, slug)
    if (!fs.existsSync(appDir)) {
      return NextResponse.json({ error: `App directory not found: ${slug}` }, { status: 404 })
    }

    // Write ONLY the changed files — don't touch anything else
    for (const [rel, content] of Object.entries(files as Record<string, string>)) {
      const abs = path.join(appDir, rel)
      fs.mkdirSync(path.dirname(abs), { recursive: true })
      fs.writeFileSync(abs, content, "utf8")
    }

    // Only reinstall if package.json changed
    if ("package.json" in files) {
      execSync("npm install --prefer-offline", { cwd: appDir, timeout: 60_000, stdio: "pipe" })
    }

    // Commit the edit to git
    try {
      execSync(`git add -A && git commit -m "edit: ${new Date().toISOString()}"`, {
        cwd: appDir, timeout: 10_000, stdio: "pipe",
        env: { ...process.env, GIT_AUTHOR_NAME: "Foundry", GIT_AUTHOR_EMAIL: "foundry@local",
               GIT_COMMITTER_NAME: "Foundry", GIT_COMMITTER_EMAIL: "foundry@local" },
      })
    } catch { /* ok if nothing to commit */ }

    // Restart the PM2 process
    const pm2Name = `forge-${slug}`
    try {
      execSync(`pm2 restart ${pm2Name} && pm2 save`, { timeout: 15_000, stdio: "pipe" })
    } catch {
      // If not running, try to start it
      try {
        const registry: { slug: string; port: number; appDir: string }[] =
          JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"))
        const app = registry.find(a => a.slug === slug)
        if (app) {
          execSync(
            `pm2 start npm --name ${pm2Name} -- run dev -- --port ${app.port} && pm2 save`,
            { cwd: appDir, timeout: 15_000, stdio: "pipe" }
          )
        }
      } catch { /* best effort */ }
    }

    return NextResponse.json({
      ok:           true,
      slug,
      changedFiles: Object.keys(files).length,
    })
  } catch (error) {
    console.error("[forge/apply-edit]", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
