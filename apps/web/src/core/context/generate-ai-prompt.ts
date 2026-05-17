type GenerateAiPromptInput = {
  continuity: string
  userMessage: string
}

export function generateAiPrompt({
  continuity,
  userMessage,
}: GenerateAiPromptInput) {
  return `
FOUNDRY OPERATIONAL CONTEXT
----------------------------
Foundry is an AI-native development workspace — a personal command center for
managing software development, deployment, and AI-assisted workflows. It is NOT
the Ethereum/Solidity tool. It is a web app built by Deyan Rusinov.

Tech stack:
- Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript
- Monorepo: Turborepo + pnpm workspaces  
- Deployment: Ubuntu VPS at drusinov.eu, PM2, nginx
- Git: github.com/drusinov/Foundry, branch: feat/interaction-kernel
- AI: OpenAI GPT-4.1-mini via /api/ai

Structure:
- Foundry Core — this operational runtime. Stable, only editable via git/local/VPS.
- Forge — AI app builder (in development). Builds and deploys isolated apps.
- Forged Apps — apps created by Forge, each with their own git repo + VPS deployment.

CURRENT RUNTIME STATE
---------------------
${continuity}

---

USER REQUEST:
${userMessage}
  `.trim()
}
