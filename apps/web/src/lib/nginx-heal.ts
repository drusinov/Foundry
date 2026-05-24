import fs from "node:fs"
import { execSync } from "node:child_process"

const REGISTRY_PATH = "/opt/foundry/forged-apps.json"
const NGINX_CONFIG  = "/etc/nginx/sites-available/dashboard"

type AppEntry = { slug: string; port: number }

export type HealResult = {
  fixed:   number
  details: string[]
  error?:  string
}

export function healNginx(): HealResult {
  const details: string[] = []

  try {
    let registry: AppEntry[] = []
    try {
      registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"))
    } catch {
      return { fixed: 0, details: [], error: "Registry unreadable" }
    }

    let nginx: string
    try {
      nginx = fs.readFileSync(NGINX_CONFIG, "utf8")
    } catch {
      return { fixed: 0, details: [], error: "Nginx config unreadable" }
    }

    let fixed = 0

    for (const app of registry) {
      // Find the proxy_pass line inside this app's location block
      // Handles both 4-space and 8-space indent variations
      const re = new RegExp(
        `(location\\s+/apps/${app.slug}/[\\s\\S]*?proxy_pass\\s+http://127\\.0\\.0\\.1:)(\\d+)`,
        "m"
      )
      const match = re.exec(nginx)
      if (!match) continue

      const currentPort = parseInt(match[2])
      if (currentPort !== app.port) {
        nginx = nginx.replace(
          new RegExp(
            `(location\\s+/apps/${app.slug}/[\\s\\S]*?proxy_pass\\s+http://127\\.0\\.0\\.1:)${currentPort}`,
            "m"
          ),
          `$1${app.port}`
        )
        details.push(`${app.slug}: port ${currentPort} → ${app.port}`)
        fixed++
      }
    }

    if (fixed > 0) {
      fs.writeFileSync(NGINX_CONFIG, nginx)
      execSync("nginx -t && systemctl reload nginx", {
        timeout: 10_000,
        stdio: "pipe",
      })
    }

    return { fixed, details }
  } catch (err) {
    return { fixed: 0, details, error: String(err) }
  }
}
