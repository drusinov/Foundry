# Foundry — Project Handoff

> STATUS: CURRENT IMPLEMENTATION
>
> This document reflects the actual current operational state of Foundry.
>
> It intentionally separates:
> - current reality
> - target architecture
> - long-term vision
> - archived history
>
> See:
> - docs/current/CURRENT_ARCHITECTURE.md
> - docs/target/
> - docs/vision/
> - docs/rfc/
>
> for broader architectural context.

---

# Foundry Overview

Foundry is evolving toward:

AI-native operational runtime orchestration.

Foundry is NOT:
- generic AI workspace software
- autonomous coding toy
- chatbot wrapper

Core philosophy:

Foundry Core remains highly protected and operationally stable.

Constructs/workspaces become isolated mutable runtimes managed by Foundry.

---

# Current Runtime Status

Current operational state:

- VPS runtime operational
- PM2 runtime operational
- GitHub synchronization operational
- OpenAI integration operational
- Foundry UI operational

Current platform state:
FOUNDATIONAL RUNTIME STABLE.

---

# Runtime Stack

## Frontend
- Next.js 16
- App Router
- React
- TypeScript
- Tailwind
- Turbopack

## Monorepo
- Turborepo
- pnpm workspaces

## Hosting
- Ubuntu VPS
- PM2-managed runtime

---

# Current Runtime Flow

Current deployment model:

Local Development
→ Git Commit
→ GitHub Push
→ VPS Pull
→ PM2 Restart

Deployment is currently:
- manual
- human-controlled
- GitHub-synchronized

---

# Current File Tree

```txt
apps/
  web/
    src/
      app/
        api/
          ai/
          git-state/
          file-runtime/

      components/
        command/
        layout/
        system/
        thread/

      core/
        registry/
        state/
        types/
        utils/

      hooks/

packages/
  tokens/

docs/
  current/
  target/
  vision/
  archive/
  rfc/