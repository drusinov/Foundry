import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { execSync, spawn } from "node:child_process"

export const dynamic = "force-dynamic"

const APPS_DIR      = "/opt/forged-apps"
const REGISTRY_PATH = "/opt/foundry/forged-apps.json"
const NGINX_CONFIG  = "/etc/nginx/sites-available/dashboard"
const BASE_PORT     = 4000

const enc = new TextEncoder()

function sse(data: Record<string, unknown>) {
  return enc.encode(`data: ${JSON.stringify(data)}\n\n`)
}

type ForgedApp = {
  id: string; name: string; slug: string; description: string
  status: "deploying" | "running" | "stopped" | "error"
  port: number; url: string; pm2Name: string; appDir: string
  mode: "dev" | "production"; createdAt: string
}

function readRegistry(): ForgedApp[] {
  try { return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8")) } catch { return [] }
}
function writeRegistry(apps: ForgedApp[]) { fs.writeFileSync(REGISTRY_PATH, JSON.stringify(apps, null, 2)) }

function nextPort(apps: ForgedApp[]) {
  return apps.length === 0 ? BASE_PORT : Math.max(...apps.map(a => a.port).filter(Boolean)) + 1
}

function addNginxLocation(slug: string, port: number) {
  const config = fs.readFileSync(NGINX_CONFIG, "utf8")
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
  fs.writeFileSync(NGINX_CONFIG, config.replace("    listen 443 ssl;", `${block}\n    listen 443 ssl;`))
  execSync("nginx -t && systemctl reload nginx", { timeout: 10000 })
}

function writeFiles(appDir: string, files: Record<string, string>) {
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(appDir, rel)
    fs.mkdirSync(path.dirname(abs), { recursive: true })
    fs.writeFileSync(abs, content, "utf8")
  }
}

async function runWithLog(
  cmd: string, args: string[], cwd: string, timeout: number,
  onLog: (line: string) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, timeout })
    proc.stdout.on("data", (d) => d.toString().split("\n").filter(Boolean).forEach(onLog))
    proc.stderr.on("data", (d) => d.toString().split("\n").filter(Boolean).forEach(onLog))
    proc.on("close", (code) => code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`)))
    proc.on("error", reject)
  })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const { slug, description, files } = body as {
    slug: string; description: string; files: Record<string, string>
  }

  if (!slug || !files || Object.keys(files).length === 0) {
    return NextResponse.json({ error: "slug and files are required" }, { status: 400 })
  }

  const apps    = readRegistry()
  const port    = nextPort(apps)
  const appDir  = path.join(APPS_DIR, slug)
  const pm2Name = `forge-${slug}`
  const url     = `https://drusinov.eu/apps/${slug}/`

  const newApp: ForgedApp = {
    id:          `app_${Date.now().toString(36)}`,
    name:        slug.replace(/-[a-z0-9]{4,}$/, "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    slug, description: description ?? "",
    status: "deploying", port, url, pm2Name, appDir,
    mode: "dev", createdAt: new Date().toISOString(),
  }
  apps.push(newApp)
  writeRegistry(apps)

  const stream = new ReadableStream({
    async start(controller) {
      const log = (line: string) => controller.enqueue(sse({ log: line }))

      try {
        // 1 — Write files
        log(`📁 Writing ${Object.keys(files).length} files…`)
        fs.mkdirSync(appDir, { recursive: true })
        writeFiles(appDir, files)
        log("✓ Files written")

        // 2 — Git init
        log("🔧 Initialising git repository…")
        try {
          execSync("git init", { cwd: appDir, stdio: "pipe" })
          execSync("git config user.email 'forge@foundry.local'", { cwd: appDir, stdio: "pipe" })
          execSync("git config user.name 'Foundry Forge'", { cwd: appDir, stdio: "pipe" })
          execSync(`git add . && git commit -m "Initial forge: ${slug}"`, { cwd: appDir, stdio: "pipe" })
          log("✓ Git repo initialised")
        } catch { log("⚠ Git init skipped") }

        // 3 — npm install (streamed)
        log("📦 Installing packages…")
        await runWithLog("npm", ["install", "--prefer-offline"], appDir, 90000, log)
        log("✓ Packages installed")

        // 4 — Start with PM2
        log("🚀 Starting app with PM2…")
        execSync(
          `pm2 start ./node_modules/.bin/next --name ${pm2Name} -- dev --port ${port}`,
          { cwd: appDir, timeout: 15000, stdio: "pipe" },
        )
        execSync("pm2 save", { timeout: 5000, stdio: "pipe" })
        log(`✓ App started on port ${port}`)

        // 5 — nginx
        log("🌐 Updating nginx routing…")
        addNginxLocation(slug, port)
        log("✓ nginx updated and reloaded")

        // 6 — Mark running
        const updated = readRegistry().map(a =>
          a.slug === slug ? { ...a, status: "running" as const } : a
        )
        writeRegistry(updated)

        log(`✓ Live at ${url}`)
        controller.enqueue(sse({ done: true, url, slug, port, pm2Name }))
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        const updated = readRegistry().map(a =>
          a.slug === slug ? { ...a, status: "error" as const } : a
        )
        writeRegistry(updated)
        log(`✗ Deploy failed: ${msg}`)
        controller.enqueue(sse({ error: msg }))
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache",
      "X-Accel-Buffering": "no",
    },
  })
}
