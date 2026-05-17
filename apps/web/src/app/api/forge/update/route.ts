import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

export const dynamic = "force-dynamic"

const APPS_DIR      = "/opt/forged-apps"
const REGISTRY_PATH = "/opt/foundry/forged-apps.json"

export async function POST(request: Request) {
  try {
    const { slug, files } = await request.json()

    if (!slug || !files) {
      return NextResponse.json({ error: "slug and files are required" }, { status: 400 })
    }

    const appDir = path.join(APPS_DIR, slug)

    if (!fs.existsSync(appDir)) {
      return NextResponse.json({ error: `App directory not found: ${appDir}` }, { status: 404 })
    }

    // Write all generated files into the existing app directory
    for (const [relPath, content] of Object.entries(files as Record<string, string>)) {
      const abs = path.join(appDir, relPath)
      fs.mkdirSync(path.dirname(abs), { recursive: true })
      fs.writeFileSync(abs, content, "utf8")
    }

    // Restart the PM2 process so changes take effect
    const pm2Name = `forge-${slug}`
    try {
      execSync(`pm2 restart ${pm2Name}`, { timeout: 10000, stdio: "pipe" })
    } catch {
      // Process might not exist — try starting it
      const port = (() => {
        try {
          const apps = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"))
          return apps.find((a: { slug: string; port: number }) => a.slug === slug)?.port ?? 4000
        } catch { return 4000 }
      })()
      execSync(
        `pm2 start ./node_modules/.bin/next --name ${pm2Name} -- dev --port ${port}`,
        { cwd: appDir, timeout: 15000, stdio: "pipe" },
      )
    }

    return NextResponse.json({ success: true, slug })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("[forge/update]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
