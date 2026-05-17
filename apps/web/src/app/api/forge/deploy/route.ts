import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

export const dynamic = "force-dynamic"

const APPS_DIR      = "/opt/forged-apps"
const REGISTRY_PATH = "/opt/foundry/forged-apps.json"
const NGINX_CONFIG  = "/etc/nginx/sites-available/dashboard"
const BASE_PORT     = 4000

// ── Registry helpers ────────────────────────────────────────────────────────

type ForgedApp = {
  id: string
  name: string
  slug: string
  description: string
  status: "deploying" | "running" | "stopped" | "error"
  port: number
  url: string
  pm2Name: string
  appDir: string
  createdAt: string
}

function readRegistry(): ForgedApp[] {
  try {
    if (!fs.existsSync(REGISTRY_PATH)) return []
    return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"))
  } catch {
    return []
  }
}

function writeRegistry(apps: ForgedApp[]) {
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(apps, null, 2))
}

function nextPort(apps: ForgedApp[]): number {
  if (apps.length === 0) return BASE_PORT
  const ports = apps.map((a) => a.port).filter(Boolean)
  return Math.max(...ports) + 1
}

// ── Nginx helpers ───────────────────────────────────────────────────────────

function addNginxLocation(slug: string, port: number) {
  const config = fs.readFileSync(NGINX_CONFIG, "utf8")

  // Don't double-add
  if (config.includes(`/apps/${slug}/`)) return

  const block = `
    location /apps/${slug}/ {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
`
  // Insert before the SSL listen line
  const updated = config.replace("    listen 443 ssl;", `${block}\n    listen 443 ssl;`)
  fs.writeFileSync(NGINX_CONFIG, updated)
  execSync("nginx -t && systemctl reload nginx", { timeout: 10000 })
}

// ── File writer ─────────────────────────────────────────────────────────────

function writeFiles(appDir: string, files: Record<string, string>) {
  for (const [relPath, content] of Object.entries(files)) {
    const abs = path.join(appDir, relPath)
    fs.mkdirSync(path.dirname(abs), { recursive: true })
    fs.writeFileSync(abs, content, "utf8")
  }
}

// ── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 })

  const { slug, description, files } = body as {
    slug: string
    description: string
    files: Record<string, string>
  }

  if (!slug || !files || Object.keys(files).length === 0) {
    return NextResponse.json({ error: "slug and files are required" }, { status: 400 })
  }

  const apps   = readRegistry()
  const port   = nextPort(apps)
  const appDir = path.join(APPS_DIR, slug)
  const pm2Name = `forge-${slug}`

  // Register as deploying immediately
  const newApp: ForgedApp = {
    id:          `app_${Date.now().toString(36)}`,
    name:        slug.replace(/-[a-z0-9]+$/, "").replace(/-/g, " "),
    slug,
    description: description ?? "",
    status:      "deploying",
    port,
    url:         `https://drusinov.eu/apps/${slug}/`,
    pm2Name,
    appDir,
    createdAt:   new Date().toISOString(),
  }
  apps.push(newApp)
  writeRegistry(apps)

  try {
    // 1 — Create app directory and write all generated files
    fs.mkdirSync(appDir, { recursive: true })
    writeFiles(appDir, files)

    // 2 — Install dependencies (timeout 90s)
    execSync("npm install --prefer-offline", {
      cwd: appDir,
      timeout: 90_000,
      stdio: "pipe",
    })

    // 3 — Start app in dev mode via PM2
    //     Uses local next binary for reliability
    execSync(
      `pm2 start ./node_modules/.bin/next --name ${pm2Name} -- dev --port ${port}`,
      { cwd: appDir, timeout: 15_000, stdio: "pipe" },
    )
    execSync("pm2 save", { timeout: 5_000, stdio: "pipe" })

    // 4 — Add nginx location block and reload
    addNginxLocation(slug, port)

    // 5 — Mark as running in registry
    const updated = readRegistry().map((a) =>
      a.slug === slug ? { ...a, status: "running" as const } : a,
    )
    writeRegistry(updated)

    return NextResponse.json({
      success: true,
      slug,
      port,
      url: newApp.url,
      pm2Name,
    })
  } catch (error) {
    // Mark as error in registry
    const updated = readRegistry().map((a) =>
      a.slug === slug ? { ...a, status: "error" as const } : a,
    )
    writeRegistry(updated)

    const msg = error instanceof Error ? error.message : String(error)
    console.error("[forge/deploy]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
