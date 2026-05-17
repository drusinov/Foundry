import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"
import { NextResponse } from "next/server"

// Files whose full content is included in the runtime snapshot.
// These are the most important files for understanding what Foundry does.
const KEY_FILES = [
  "apps/web/src/app/page.tsx",
  "apps/web/src/app/api/ai/route.ts",
  "apps/web/src/core/context/generate-ai-prompt.ts",
  "apps/web/src/core/context/generate-compressed-context.ts",
  "apps/web/src/core/state/interaction-store.tsx",
  "apps/web/src/hooks/useAiRuntime.ts",
]

const MAX_FILE_CHARS = 3000  // truncate large files

function walkSrc(dir: string, base: string): string[] {
  const results: string[] = []
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return results
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue
    const full = path.join(dir, entry.name)
    const rel  = path.relative(base, full)
    if (entry.isDirectory()) {
      results.push(...walkSrc(full, base))
    } else if (/\.(ts|tsx|css|json)$/.test(entry.name)) {
      results.push(rel)
    }
  }
  return results.sort()
}

export async function GET() {
  try {
    const repoRoot = path.resolve(process.cwd(), "../../..")
    const srcDir   = path.join(repoRoot, "apps/web/src")

    // Full file tree of apps/web/src
    const fileTree = walkSrc(srcDir, repoRoot)

    // Contents of key files (truncated)
    const keyFileContents: Record<string, string> = {}
    for (const rel of KEY_FILES) {
      const abs = path.join(repoRoot, rel)
      try {
        const content = fs.readFileSync(abs, "utf8")
        keyFileContents[rel] = content.length > MAX_FILE_CHARS
          ? content.slice(0, MAX_FILE_CHARS) + "\n… (truncated)"
          : content
      } catch {
        keyFileContents[rel] = "(not found)"
      }
    }

    // Recent git log
    let recentCommits: string[] = []
    try {
      recentCommits = execSync("git log --oneline -10", { cwd: repoRoot })
        .toString().trim().split("\n")
    } catch {
      recentCommits = []
    }

    // Package versions
    let packageJson: Record<string, unknown> = {}
    try {
      const pkgPath = path.join(repoRoot, "apps/web/package.json")
      packageJson = JSON.parse(fs.readFileSync(pkgPath, "utf8"))
    } catch {
      packageJson = {}
    }

    return NextResponse.json({
      fileTree,
      keyFileContents,
      recentCommits,
      dependencies: packageJson.dependencies ?? {},
      devDependencies: packageJson.devDependencies ?? {},
    })
  } catch (error) {
    console.error("[file-runtime]", error)
    return NextResponse.json(
      { fileTree: [], keyFileContents: {}, recentCommits: [], error: "Failed to read file runtime" },
      { status: 500 },
    )
  }
}
