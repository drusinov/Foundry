import { NextResponse } from "next/server"
import fs from "node:fs"
import { execSync } from "node:child_process"

export const dynamic = "force-dynamic"

const REGISTRY_PATH  = "/opt/foundry/forged-apps.json"
const BASELINE_PATH  = "/opt/foundry/health-baseline.json"

type Pm2Process = {
  name:    string
  pm2_env: { status: string; restart_time: number }
}

type AppRecord = { slug: string; name: string; pm2Name: string }
type Baseline  = Record<string, { restarts: number; status: string }>

export async function GET() {
  try {
    let apps: AppRecord[] = []
    try { apps = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8")) } catch { return NextResponse.json({ crashed: [] }) }

    let pm2List: Pm2Process[] = []
    try {
      pm2List = JSON.parse(execSync("pm2 jlist", { timeout: 5000 }).toString())
    } catch { return NextResponse.json({ crashed: [] }) }

    // Load baseline (last-known state)
    let baseline: Baseline = {}
    try { baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8")) } catch { /* first run */ }

    const crashed: { name: string; pm2Name: string; restarts: number; status: string }[] = []
    const newBaseline: Baseline = {}

    for (const app of apps) {
      const proc = pm2List.find(p => p.name === app.pm2Name)
      if (!proc) continue

      const status   = proc.pm2_env.status
      const restarts = proc.pm2_env.restart_time
      const prev     = baseline[app.pm2Name]

      newBaseline[app.pm2Name] = { restarts, status }

      if (!prev) continue // first check — just establish baseline

      const recentlyCrashed  = status === "errored" && prev.status !== "errored"
      const restartSpike     = restarts > prev.restarts + 3 // 3+ restarts since last check

      if (recentlyCrashed || restartSpike) {
        crashed.push({ name: app.name || app.slug, pm2Name: app.pm2Name, restarts, status })
      }
    }

    // Save new baseline
    try { fs.writeFileSync(BASELINE_PATH, JSON.stringify(newBaseline, null, 2)) } catch { /* non-fatal */ }

    return NextResponse.json({ crashed })
  } catch (error) {
    console.error("[apps/health]", error)
    return NextResponse.json({ crashed: [] })
  }
}
