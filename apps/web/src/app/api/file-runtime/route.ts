import fs from "node:fs"

import path from "node:path"

import { NextResponse } from "next/server"

export async function GET() {
  try {
    const repoRoot = path.resolve(
      process.cwd(),
      "../../..",
    )

    const topLevelEntries =
      fs.readdirSync(repoRoot, {
        withFileTypes: true,
      })

    const files =
      topLevelEntries.map(
        (entry) => ({
          name: entry.name,

          type:
            entry.isDirectory()
              ? "directory"
              : "file",
        }),
      )

    return NextResponse.json({
      files,

      totalFiles:
        files.length,

      recentFiles: files
        .slice(0, 10)
        .map(
          (file) => file.name,
        ),
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        files: [],

        totalFiles: 0,

        recentFiles: [],

        error:
          "Failed to read filesystem runtime",
      },
      {
        status: 500,
      },
    )
  }
}