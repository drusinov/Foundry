import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

export const dynamic = "force-dynamic"

// process.cwd() = apps/web → ../../ = repo root
const REPO_ROOT = path.resolve(process.cwd(), "../..")
const SRC_ROOT  = path.join(REPO_ROOT, "apps/web/src")

const MAX_FILE_CHARS  = 3_000   // chars per file before truncation
const MAX_TOTAL_CHARS = 80_000  // total budget across all files

const SOURCE_EXTS  = /\.(ts|tsx|css|json)$/
const IGNORE_DIRS  = new Set(["node_modules", ".next", ".git", "dist", "build", "__pycache__"])

function readDir(dir: string): Record<string, string> {
  const result: Record<string, string> = {}
  let entries: fs.Dirent[] = []
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return result }

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      Object.assign(result, readDir(full))
    } else if (SOURCE_EXTS.test(entry.name)) {
      try {
        const raw = fs.readFileSync(full, "utf8")
        const rel = path.relative(REPO_ROOT, full)
        result[rel] = raw.length > MAX_FILE_CHARS
          ? raw.slice(0, MAX_FILE_CHARS) + "\n…[truncated]"
          : raw
      } catch { /* skip unreadable */ }
    }
  }
  return result
}

export async function GET() {
  try {
    // Read all source files
    const raw = readDir(SRC_ROOT)

    // Also include key top-level files
    for (const rel of [
      "apps/web/middleware.ts",
      "apps/web/next.config.ts",
      "apps/web/package.json",
    ]) {
      const full = path.join(REPO_ROOT, rel)
      if (fs.existsSync(full)) {
        try { raw[rel] = fs.readFileSync(full, "utf8").slice(0, MAX_FILE_CHARS) } catch { /* skip */ }
      }
    }

    // Apply total char budget — prioritise API routes and components
    const PRIORITY = ["api/", "components/", "lib/", "hooks/", "app/page"]
    const sorted = Object.entries(raw).sort(([a], [b]) => {
      const pa = PRIORITY.findIndex(p => a.includes(p))
      const pb = PRIORITY.findIndex(p => b.includes(p))
      return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb)
    })

    let total = 0
    const fileTree:        string[]                 = []
    const keyFileContents: Record<string, string>   = {}

    for (const [rel, content] of sorted) {
      fileTree.push(rel)
      if (total < MAX_TOTAL_CHARS) {
        keyFileContents[rel] = content
        total += content.length
      }
    }

    // Git log (last 15 commits)
    let recentCommits: string[] = []
    try {
      recentCommits = execSync("git log --oneline -15", { cwd: REPO_ROOT, timeout: 3000 })
        .toString().trim().split("\n").filter(Boolean)
    } catch { /* skip */ }

    // Recent git diff summary
    let recentDiff = ""
    try {
      recentDiff = execSync("git diff HEAD~1 HEAD --stat 2>/dev/null || git diff --stat", { cwd: REPO_ROOT, timeout: 3000 })
        .toString().slice(0, 1500)
    } catch { /* skip */ }

    // Package dependencies snapshot
    let dependencies: Record<string, string> = {}
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "apps/web/package.json"), "utf8"))
      dependencies = { ...pkg.dependencies, ...pkg.devDependencies }
    } catch { /* skip */ }

    return NextResponse.json({
      fileTree,
      keyFileContents,
      recentCommits,
      recentDiff,
      dependencies,
      totalFiles:  fileTree.length,
      totalChars:  total,
      readAt:      new Date().toISOString(),
    })
  } catch (error) {
    console.error("[file-runtime]", error)
    return NextResponse.json(
      { fileTree: [], keyFileContents: {}, recentCommits: [], dependencies: {}, error: String(error) },
      { status: 500 },
    )
  }
}
