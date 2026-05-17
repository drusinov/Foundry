# Foundry — Project Handoff / Operational Context

## Current Architecture State

Frontend runtime architecture is now based on:

* React Context interaction kernel
* centralized interaction state
* command-driven runtime flow
* thread entry renderer abstraction
* modular command registry/actions architecture

Core runtime loop:

Command Palette
→ Command Action
→ Interaction Store
→ Thread Mutation
→ Reactive Render

This loop is now operational.

---

# Stable Runtime State

System currently boots successfully with:

* Next.js 16.2.6
* Turbopack
* React 19
* clean hydration
* clean compile
* no runtime crashes

Known non-blocking warning:

DEP0205:
module.register() deprecated
Safe to ignore for now.

---

# Architectural Decisions

## Interaction State

Old:

* local scattered state
* prop drilling
* store-like naming

New:

* React Context provider
* useInteraction hook
* centralized interaction runtime

File:
apps/web/src/core/state/interaction-store.tsx

---

## Thread Rendering

Thread entries were split into modular cards:

* BriefEntryCard
* ArtifactEntryCard
* MemoryEntryCard
* RunEntryCard
* SystemEntryCard
* ConvergenceEntryCard

Renderer:
apps/web/src/core/thread/render-entry.tsx

Current export:
renderThreadEntry

NOT renderEntry.

---

## Command Runtime

Command runtime moved away from:

* static execution helpers
* direct exports

Now uses:

* useCommandActions hook
* interaction store mutation

Obsolete:
use-command-runtime.ts currently stubbed intentionally.

---

# Important Naming Conventions

Migrated:

* useInteractionStore
  → useInteraction

* renderEntry
  → renderThreadEntry

* interaction-store.ts
  → interaction-store.tsx

Reason:
JSX inside provider component.

---

# UI / Styling Rules

* classNames should stay on ONE line
* prefer full-file replacements instead of snippets
* avoid partial nano editing when possible
* preserve deterministic safe-state workflow

---

# Workflow Rules

Critical operational rule:

Always stabilize before expanding architecture.

Flow:

1. modify
2. compile
3. stabilize
4. commit
5. continue

Never stack multiple unstable refactors simultaneously.

---

# Current Stable Milestones

Committed milestones include:

* Implement interaction kernel and command runtime
* Wire interaction runtime loop
* Stabilize interaction runtime loop

---

# Current Operational Features

Working:

* command palette UI
* command filtering
* command execution
* interaction store mutation
* reactive thread updates
* modular thread rendering

---

# Immediate Next Target

Phase 2 — Keyboard Runtime

Implement:

* CMD+K
* ESC
* Arrow navigation
* Enter execution
* selected command state

Goal:
make interaction kernel feel native and deterministic.

---

# Explicit NON-Goals Right Now

DO NOT focus on:

* backend
* auth
* database
* websocket infra
* AI orchestration
* persistence
* animations polish

Priority is:
deterministic interaction kernel.

---

# Operational Philosophy

Project should evolve as:

structured operating shell

NOT:
random React prototype.

Every change should preserve:

* rollback safety
* runtime determinism
* architectural clarity
* modular extensibility

