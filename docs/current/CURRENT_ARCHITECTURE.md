# Foundry — Current Architecture

> STATUS: CURRENT IMPLEMENTATION
>
> This document reflects the actual currently-running Foundry runtime.
> It intentionally excludes future architecture unless explicitly marked.

---

# Runtime

## Frontend
- Next.js 16
- App Router
- Turbopack
- React
- TypeScript
- Tailwind

## Monorepo
- Turborepo
- pnpm workspaces

## Hosting
- Ubuntu VPS
- PM2-managed runtime
- GitHub-connected deployment flow

---

# Operational Runtime

Current runtime model:

Local Development
→ Git Commit
→ GitHub Push
→ VPS Pull
→ PM2 Restart

Current deployment is manual and human-controlled.

---

# State Management

## Current
- React Context
- interaction-store.tsx
- operationalEvents runtime state

## Persistence
Currently memory-only.

No persistent operational database yet.

---

# AI Runtime

## Currently Implemented
- OpenAI API integration
- Next.js API route architecture

## Not Yet Implemented
- Claude integration
- Multi-provider orchestration
- Consensus mode
- Debate mode
- Planner/Auditor runtime

---

# Workspace / Construct Runtime

## Current State
Not implemented yet.

Workspace isolation currently exists only conceptually.

No:
- container isolation
- filesystem isolation
- per-workspace runtime
- construct registry
exists yet.

---

# Checkpointing

## Current
No true checkpoint engine exists yet.

Current recovery model:
- Git history
- Manual rollback
- VPS snapshots

---

# Runtime Telemetry

Telemetry hooks currently disabled for stabilization.

Future telemetry architecture will likely become:
- websocket/event-driven
- operational database-backed
- checkpoint-aware

instead of recursive polling.

---

# Known Limitations

- No database persistence
- No recovery automation
- No deployment health gates
- No diff-based mutation engine
- No workspace isolation
- No construct runtime orchestration
- No operational WAL/event sourcing
- No rollback automation

---

# Architectural Direction

Foundry is evolving toward:

AI-native operational runtime orchestration.

NOT:
- chatbot wrapper
- generic AI workspace
- autonomous coding toy

Core philosophy:

Foundry Core remains highly protected.

Constructs/workspaces become isolated mutable runtimes managed by Foundry.

---

# Canonical Truth Sources

## Local
Primary mutation/development environment.

## GitHub
Canonical synchronization layer.

## VPS
Operational runtime host.

---

# Operational Status

Current status:
- VPS operational
- PM2 operational
- GitHub sync operational
- OpenAI runtime operational
- Foundry UI operational

System currently considered:
FOUNDATIONAL RUNTIME STABLE.