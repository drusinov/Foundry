import { execSync } from "node:child_process"

import { NextResponse } from "next/server"

export async function GET() {
  try {
    const branch = execSync(
      "git rev-parse --abbrev-ref HEAD",
    )
      .toString()
      .trim()

    const latestCommit = execSync(
      "git rev-parse --short HEAD",
    )
      .toString()
      .trim()

    const rawStatus = execSync(
      "git status --porcelain",
    )
      .toString()
      .trim()

    const changedFiles =
      rawStatus.length === 0
        ? []
        : rawStatus
            .split("\n")
            .map((line) => ({
              status: line.slice(0, 2).trim(),

              file: line.slice(3),
            }))

    return NextResponse.json({
      branch,

      latestCommit,

      workingTreeClean:
        changedFiles.length === 0,

      changedFiles:
        changedFiles.length,

      diffEntries: changedFiles,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          "Failed to read git runtime state",
      },
      {
        status: 500,
      },
    )
  }
}