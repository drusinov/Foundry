import { execSync } from "node:child_process"
import path from "node:path"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // process.cwd() in Next.js = apps/web, so ../.. = repo root (/opt/foundry)
    const repoRoot = path.resolve(process.cwd(), "../..")

    const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: repoRoot })
      .toString().trim()

    const latestCommit = execSync("git rev-parse --short HEAD", { cwd: repoRoot })
      .toString().trim()

    const rawStatus = execSync("git status --porcelain", { cwd: repoRoot })
      .toString().trim()

    const changedFiles = rawStatus.length === 0
      ? []
      : rawStatus.split("\n").map((line) => ({
          status: line.slice(0, 2).trim(),
          file:   line.slice(3),
        }))

    return NextResponse.json({
      branch,
      latestCommit,
      workingTreeClean: changedFiles.length === 0,
      changedFiles:     changedFiles.length,
      diffEntries:      changedFiles,
    })
  } catch (error) {
    console.error("[git-state]", error)
    return NextResponse.json(
      { branch: "unknown", latestCommit: "unknown", workingTreeClean: true, changedFiles: 0, diffEntries: [], error: "Failed to read git state" },
      { status: 500 },
    )
  }
}
