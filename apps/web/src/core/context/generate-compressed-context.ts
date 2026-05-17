import type { GitRuntime } from "@/core/types/git-runtime"
import type { RuntimeImpact } from "@/core/runtime/runtime-impact-engine"
import type { FileRuntime } from "@/hooks/useFileRuntime"

type LegacyOperationalMessage = {
  id: string
  role: "user" | "system"
  content: string
  createdAt: string
}

type GenerateCompressedContextInput = {
  gitRuntime: GitRuntime | null
  runtimeImpacts: RuntimeImpact[]
  latestCheckpoint: string
  operationalMessages: LegacyOperationalMessage[]
  fileRuntime?: FileRuntime | null
}

export function generateCompressedContext({
  gitRuntime,
  runtimeImpacts,
  latestCheckpoint,
  operationalMessages,
  fileRuntime,
}: GenerateCompressedContextInput) {

  const recentMessages = operationalMessages
    .slice(-8)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n")

  const runtimeSummary = runtimeImpacts
    .map((impact) => `• ${impact.title}: ${impact.impacts.join(", ")}`)
    .join("\n")

  const changedFiles = gitRuntime?.diffEntries
    ?.map((entry) => `${entry.status} ${entry.file}`)
    .join("\n") ?? "No modified files."

  // File tree — gives the AI a map of the entire codebase
  const fileTreeSection = fileRuntime?.fileTree?.length
    ? fileRuntime.fileTree.join("\n")
    : "Not available."

  // Recent git commits
  const commitsSection = fileRuntime?.recentCommits?.length
    ? fileRuntime.recentCommits.join("\n")
    : "Not available."

  // Key file contents — the AI can read the actual source
  const keyFilesSection = fileRuntime?.keyFileContents
    ? Object.entries(fileRuntime.keyFileContents)
        .map(([file, content]) => `### ${file}\n\`\`\`\n${content}\n\`\`\``)
        .join("\n\n")
    : "Not available."

  return `
CHECKPOINT: ${latestCheckpoint}

GIT STATE:
Branch: ${gitRuntime?.branch ?? "unknown"}
Commit: ${gitRuntime?.latestCommit ?? "unknown"}
Clean: ${gitRuntime?.workingTreeClean ? "yes" : "no"}

MODIFIED FILES:
${changedFiles}

RECENT COMMITS:
${commitsSection}

RUNTIME IMPACTS:
${runtimeSummary || "None."}

CODEBASE FILE TREE (apps/web/src):
${fileTreeSection}

KEY SOURCE FILES:
${keyFilesSection}

RECENT OPERATIONAL EVENTS:
${recentMessages}
`.trim()
}
