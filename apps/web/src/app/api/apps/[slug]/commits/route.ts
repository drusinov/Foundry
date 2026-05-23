import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

export const dynamic = "force-dynamic"

const APPS_DIR = "/opt/forged-apps"

type RouteContext = { params: Promise<{ slug: string }> }

export async function GET(_: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    const appDir   = path.join(APPS_DIR, slug)

    if (!fs.existsSync(path.join(appDir, ".git"))) {
      return NextResponse.json({ commits: [], error: "No git history — app was forged before git tracking was added." })
    }

    const raw = execSync(
      `git log --format="%H|%h|%s|%as" -20`,
      { cwd: appDir, timeout: 5000 },
    ).toString().trim()

    const commits = raw.split("\n").filter(Boolean).map((line) => {
      const parts   = line.split("|")
      const hash    = parts[0]
      const short   = parts[1]
      const date    = parts[parts.length - 1]
      const message = parts.slice(2, -1).join("|")
      return { hash, short, message, date }
    })

    return NextResponse.json({ commits })
  } catch (error) {
    return NextResponse.json({ commits: [], error: String(error) }, { status: 500 })
  }
}
