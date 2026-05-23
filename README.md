# Foundry

**AI-native operational workspace.** A personal command center for managing software development, deployment, and AI-assisted workflows — built on Next.js, running on a VPS, controlled entirely through git.

Live at **[drusinov.eu](https://drusinov.eu)**

---

## What it is

Foundry is three things in one:

**🔥 Foundry Runtime** — An operational cockpit where you talk to Claude about your codebase. It reads your live git state, file tree, and source files, then streams context-aware responses word by word. Ask it to debug, explain, or plan — it knows what's actually deployed.

**⚒️ Forge** — An AI app builder. Name an app, describe what it should do, and Forge generates a complete Next.js codebase, deploys it to your VPS with real-time log streaming, registers it with PM2, and adds an nginx route. The app is live within ~60 seconds. Multiple apps can be queued and processed sequentially.

**⚔️ Apps** — A directory of everything Forge has built. Open, edit (context-aware re-forge), view logs, roll back to any previous commit, build to production, or enable a custom subdomain — all from one place.

---

## Architecture

```
Foundry Core (this repo)
├── 🔥 Runtime        — AI operational chat with live codebase context
├── ⚒️ Forge          — AI app generator with real-time deploy logs
└── ⚔️ Apps           — Forged app registry and management

Forged Apps (separate, on VPS)
└── /opt/forged-apps/{slug}/   — each app is git-tracked, PM2-managed, nginx-routed
```

Foundry Core itself is **only editable via git** — push from local, VPS pulls and rebuilds. Forged apps are fully managed from within Foundry.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript |
| Monorepo | Turborepo, pnpm workspaces |
| AI | OpenAI GPT-4.1-mini (context structuring) → Claude Haiku/Sonnet/Opus (streaming) |
| Deployment | Ubuntu VPS, PM2, nginx, Let's Encrypt SSL |
| Version control | GitHub |

---

## AI Pipeline

Every chat message goes through a two-stage streaming pipeline:

1. **GPT-4.1-mini** — compresses the full operational context (git state, file tree, recent commits, source files) into a focused prompt
2. **Claude** — streams the response word by word using the structured context

Model selector: **Haiku** (fast) · **Sonnet** (balanced) · **Opus** (quality). Token usage shown per message and as a session total. File context auto-refreshes every 5 minutes.

---

## Forge Pipeline

1. User enters app name + description
2. Claude (Opus) generates a complete Next.js 14 codebase as structured JSON
3. Claude (Haiku) generates a polished app store description
4. Files written to `/opt/forged-apps/{slug}/` with `git init + initial commit`
5. `npm install` streams logs to the UI in real time
6. PM2 starts the app on the next available port (4000+)
7. nginx location block added → app live at `drusinov.eu/apps/{slug}/`
8. App registered in `/opt/foundry/forged-apps.json`

---

## Apps Management

| Action | Description |
|---|---|
| **Open** | Visit the live app |
| **Edit** | Re-describe — Claude reads existing files and only changes what's needed |
| **Logs** | Inline PM2 log viewer with refresh |
| **History** | Git commit log with one-click rollback to any commit |
| **Build → Prod** | Runs `next build`, switches PM2 to `next start` |
| **Enable subdomain** | nginx server block + certbot SSL for `{slug}.drusinov.eu` |
| **Remove** | Stops PM2, removes from registry |

Health monitor polls every 60s, auto-posts crash alerts to the Runtime chat.

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
pnpm turbo build --filter=web

git push origin main
ssh root@your-vps "cd /opt/foundry && git pull origin main && pnpm turbo build --filter=web && pm2 restart foundry"
```

---

## Environment

No `.env` — API keys entered in the UI and stored in `localStorage`:
- **OpenAI key** — GPT-4.1-mini for context structuring
- **Anthropic key** — Claude for streaming responses and app generation

VPS: Foundry Core at `/opt/foundry`, forged apps at `/opt/forged-apps/`.

---

## Project structure

```
apps/web/src/
  app/
    api/
      ai/                    — Streaming two-stage pipeline
      apps/[slug]/
        build/               — Production mode switch
        commits/             — Git log for rollback
        logs/                — PM2 log streaming
        rollback/            — Git checkout + PM2 restart
        subdomain/           — nginx + certbot SSL
      file-runtime/          — Live codebase snapshot
      forge/                 — Generation + deploy + edit + update
      git-state/             — Live git state
    page.tsx                 — Tab layout (Runtime / Forge / Apps)
    globals.css              — Design system
  components/
    command/                 — ⌘K command palette
    system/                  — OperationalChat, StatusRail
  core/
    context/                 — AI prompt construction
    state/                   — Session-persistent interaction store
    types/                   — Shared TypeScript types
  hooks/
    useAiRuntime.ts          — Streaming AI client
    useFileRuntime.ts        — Auto-refreshing codebase context
    useGitRuntime.ts         — Live git state
```

---

*Built by [Deyan Rusinov](https://github.com/drusinov)*
