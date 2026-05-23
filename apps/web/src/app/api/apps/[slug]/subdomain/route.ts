import { NextResponse } from "next/server"
import fs from "node:fs"
import { execSync } from "node:child_process"

export const dynamic = "force-dynamic"

const REGISTRY_PATH   = "/opt/foundry/forged-apps.json"
const NGINX_APPS_FILE = "/etc/nginx/sites-available/forged-apps"
const NGINX_APPS_LINK = "/etc/nginx/sites-enabled/forged-apps"
const CERTBOT_EMAIL   = "admin@drusinov.eu"
const SERVER_IP       = "93.94.140.136"

type RouteContext = { params: Promise<{ slug: string }> }

export async function POST(_: Request, context: RouteContext) {
  try {
    const { slug } = await context.params

    let apps: { slug: string; port: number; subdomainUrl?: string }[] = []
    try { apps = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8")) } catch {
      return NextResponse.json({ error: "Registry not found" }, { status: 500 })
    }

    const app = apps.find(a => a.slug === slug)
    if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 })

    const subdomain = `${slug}.drusinov.eu`
    const port      = app.port

    // 1 — DNS check: verify subdomain resolves to this server
    try {
      const resolved = execSync(`dig +short ${subdomain} @8.8.8.8`, { timeout: 8000 })
        .toString().trim().split("\n").find(l => l.match(/^\d+\.\d+\.\d+\.\d+$/))

      if (!resolved) {
        return NextResponse.json({
          error: `DNS not configured yet. Add this record at your registrar:\n\n  *.drusinov.eu   A   ${SERVER_IP}\n\nThen wait a few minutes for DNS to propagate and try again.`,
          dnsRequired: true,
        }, { status: 400 })
      }

      if (resolved !== SERVER_IP) {
        return NextResponse.json({
          error: `${subdomain} resolves to ${resolved} instead of ${SERVER_IP}. Check your DNS wildcard record.`,
          dnsRequired: true,
        }, { status: 400 })
      }
    } catch {
      // dig not available — continue and let certbot fail with a clear message
    }

    // 2 — Add nginx HTTP server block
    let existing = ""
    try { existing = fs.readFileSync(NGINX_APPS_FILE, "utf8") } catch { /* new file */ }

    if (!existing.includes(subdomain)) {
      const block = `
server {
    server_name ${subdomain};

    location / {
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
}
`
      fs.writeFileSync(NGINX_APPS_FILE, existing + block)
      try { execSync(`ln -sf ${NGINX_APPS_FILE} ${NGINX_APPS_LINK}`, { stdio: "pipe" }) } catch {}
      execSync("nginx -t && systemctl reload nginx", { timeout: 10000 })
    }

    // 3 — Certbot SSL
    execSync(
      `certbot --nginx -d ${subdomain} --non-interactive --agree-tos -m ${CERTBOT_EMAIL} --redirect`,
      { timeout: 90000, stdio: "pipe" },
    )

    // 4 — Update registry
    const updated = apps.map(a =>
      a.slug === slug ? { ...a, subdomainUrl: `https://${subdomain}/` } : a
    )
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(updated, null, 2))

    return NextResponse.json({ success: true, subdomain, url: `https://${subdomain}/` })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
