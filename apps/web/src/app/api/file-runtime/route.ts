import fs from "node:fs"

import path from "node:path"

import { NextResponse } from "next/server"

function walkDirectory(
  directory: string,
  files: string[] = [],
) {
  const entries =
    fs.readdirSync(directory, {
      withFileTypes: true,
    })

  for (const entry of entries) {
    const fullPath = path.join(
      directory,
      entry.name,
    )

    if (
      fullPath.includes("node_modules") ||
      fullPath.includes(".next") ||
      fullPath.includes(".git")
    ) {
      continue
    }

    if (entry.isDirectory()) {
      walkDirectory(
        fullPath,
        files,
      )
    } else {
      files.push(fullPath)
    }
  }

  return files
}

export async function GET() {
  try {
    const projectRoot =
      process.cwd()

    const files =
      walkDirectory(projectRoot).map(
        (file) =>
          path.relative(
            projectRoot,
            file,
          ),
      )

    return NextResponse.json({
      files,

      totalFiles:
        files.length,

      recentFiles:
        files
          .slice(-10)
          .reverse(),
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