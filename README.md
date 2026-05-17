# Foundry

**AI-native operational workspace.** A personal command center for managing software development, deployment, and AI-assisted workflows — built on Next.js, running on a VPS, controlled entirely through git.

---

## What it is

Foundry is three things in one:

**Runtime** — An operational cockpit where you talk to Claude about your codebase. It reads your live git state, file tree, and source files, then gives context-aware responses. Ask it to debug, explain, or plan — it knows what's actually deployed.

**Forge** — An AI app builder. Describe an app in plain language, and Forge generates a complete Next.js codebase, deploys it to your VPS, registers it with PM2, and adds an nginx route. The app is live within ~60 seconds.

**Apps** — A directory of everything Forge has built. Open, edit, or remove forged apps from one place. Editing re-generates the codebase with Claude and restarts the app automatically.

---

## Architecture

```
Foundry Core (this repo)
├── Runtime tab      — AI operational chat with live codebase context
├── Forge tab        — AI app generator
└── Apps tab         — Forged app registry and management

Forged Apps (separate)
└── /opt/forged-apps/{slug}/   — each app is isolated, git-tracked, PM2-managed
```

Foundry Core itself is **only editable via git** — you push from your local machine, the VPS pulls and rebuilds. Forged apps are fully managed from within Foundry.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript |
| Monorepo | Turborepo, pnpm workspaces |
| AI | OpenAI GPT-4.1-mini (context structuring) → Claude (response generation) |
| Deployment | Ubuntu VPS, PM2, nginx, Let's Encrypt SSL |
| Version control | GitHub |

---

## AI Pipeline

Every chat message in the Runtime tab goes through a two-stage pipeline:

1. **GPT-4.1-mini** — compresses the full operational context (git state, file tree, recent events, source files) into a focused prompt
2. **Claude** — generates the actual response using that structured context

Each response shows which pipeline ran and how many tokens were used.

---

## Forge Pipeline

1. User describes an app in plain language
2. Claude generates a complete Next.js codebase as structured JSON
3. Foundry writes the files to `/opt/forged-apps/{slug}/`
4. Runs `npm install`, starts with PM2 on a new port
5. Adds an nginx location block → app live at `yourdomain.com/apps/{slug}/`
6. Registers the app in the local registry

---

## Local development

```bash
git clone https://github.com/drusinov/Foundry
cd Foundry
pnpm install
pnpm turbo dev --filter=web
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

```bash
# Build
pnpm turbo build --filter=web

# Deploy to VPS
git push origin main
ssh root@your-vps "cd /opt/foundry && git pull origin main && pnpm turbo build --filter=web && pm2 restart foundry"
```

---

## Environment

No `.env` file — API keys are entered directly in the UI and stored in `localStorage`. The VPS runs the app at `/opt/foundry`, with forged apps at `/opt/forged-apps/`.

---

## Project structure

```
apps/
  web/
    src/
      app/
        api/
          ai/           — Two-stage AI pipeline (OpenAI → Claude)
          apps/         — Forged app registry (read, delete)
          file-runtime/ — Live codebase snapshot for AI context
          forge/        — App generation (Claude) + deployment + update
          git-state/    — Live git state (branch, commit, diff)
        page.tsx        — Runtime / Forge / Apps tab layout
        globals.css     — Design system (dark theme, CSS variables)
      components/
        command/        — Spotlight-style command palette (⌘K)
        system/         — OperationalChat, StatusRail
      core/
        context/        — AI prompt construction, context compression
        registry/       — Command registry and actions
        state/          — Interaction store (React context)
        types/          — Shared TypeScript types
      hooks/            — useAiRuntime, useGitRuntime, useFileRuntime
docs/
  current/              — Architecture and handoff docs
  vision/               — Product direction and specs
legacy/                 — Old Django backend and frontend (archived)
```

---

*Built by [Deyan Rusinov](https://github.com/drusinov)*
