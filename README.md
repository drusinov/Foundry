# Foundry

**AI-native operational workspace.** A personal command center for building, deploying, and managing software — powered by Claude, running on a VPS, protected by user authentication.

Live at **[drusinov.eu](https://drusinov.eu)**

---

## What it is

Foundry is three things in one:

**🔥 Foundry Runtime** *(admin only)* — An operational cockpit where you talk to Claude about your codebase. It reads your live git state, file tree, and source files, then streams context-aware responses word by word. Model selector (Haiku / Sonnet / Opus). Token usage per message. Health monitor auto-posts crash alerts. Session persists across page refreshes.

**⚒️ Forge** — An AI app builder. Name an app, describe what it should do, and Forge generates a complete Next.js codebase, deploys it to your VPS with real-time log streaming, registers it with PM2, and adds an nginx route. Cost estimation shown before you submit. Multiple apps can be queued and processed sequentially.

**⚔️ Apps** — A directory of everything Forge has built. Each app has a unique AI-generated SVG icon. Start/stop on demand (only one app runs at a time to conserve VPS memory). Edit (context-aware re-forge), view logs, roll back to any git commit, or remove.

---

## Architecture

```
Foundry Core (this repo)
├── 🔥 Runtime        — Streaming AI chat with live codebase context (admin only)
├── ⚒️ Forge          — AI app generator with real-time deploy logs + cost estimation
└── ⚔️ Apps           — Forged app registry: start/stop, edit, logs, history, rollback

Auth layer
├── SQLite DB         — Users, roles, encrypted API keys per account
├── JWT sessions      — 30-day httpOnly cookies
└── Edge middleware   — Protects all routes, injects user context

Forged Apps (VPS)
└── /opt/forged-apps/{slug}/   — each app: git-tracked, PM2-managed, nginx-routed
```

Foundry Core is **only editable via git** — push from local, VPS pulls and rebuilds. Forged apps are fully managed from within Foundry.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript |
| Monorepo | Turborepo, pnpm workspaces |
| Auth | JWT (jose), bcryptjs, @libsql/client (SQLite) |
| AI | OpenAI GPT-4.1-mini (context structuring) → Claude Haiku/Sonnet/Opus (streaming) |
| Deployment | Ubuntu VPS, PM2, nginx, Let's Encrypt SSL |

---

## User system

- **Admin** — full access to all three tabs, user management panel
- **User** — access to Forge and Apps only
- API keys (OpenAI + Anthropic) stored per-account in the DB — never in localStorage
- Admin creates accounts from within Foundry (Users panel in the avatar menu)
- First visit after deploy → `/setup` to create the admin account (locks after first use)

---

## AI Pipeline

Every Runtime chat message goes through a two-stage streaming pipeline:

1. **GPT-4.1-mini** — compresses the full operational context (git state, file tree, recent commits, source files) into a focused prompt
2. **Claude** — streams the response word by word

Model selector: **H** Haiku (fast) · **S** Sonnet (balanced) · **O** Opus (quality). Keys fetched from the database using the session — never transmitted from the client.

---

## Forge Pipeline

1. User enters app name + description
2. Claude (Opus) generates a complete Next.js codebase as structured JSON
3. Claude (Haiku) generates a polished app store description
4. Claude (Haiku) generates a unique SVG icon for the app
5. Files written to `/opt/forged-apps/{slug}/`, git init + initial commit
6. `npm install` streams logs to the UI in real time
7. PM2 starts the app on the next available port (4000+)
8. nginx location block added → app live at `drusinov.eu/apps/{slug}/`
9. App registered in `/opt/foundry/forged-apps.json` with userId, cost estimate, icon

---

## Apps Management

| Action | Description |
|---|---|
| **▶ Start / ■ Stop** | On-demand — only one app uses VPS resources at a time |
| **Open ↗** | Visit the live app (only shown when running) |
| **Edit** | Re-describe — Claude reads existing files and only changes what's needed |
| **Runtime logs** | Inline PM2 log viewer (reads log files directly, instant) |
| **Version history** | Git commit log with one-click rollback to any commit |
| **Remove** | Stops PM2 process, removes from registry |

Health monitor polls every 60s, auto-posts crash alerts to the Runtime chat.

---

## Key status dots

In the Runtime input bar and account menu:
- 🟢 Bright green = OpenAI key configured
- 🔵 Bright purple = Anthropic key configured
- Faded = not set

Clicking the dots opens the key update panel. Keys are stored in the database per user — designed for future support of choosing which engine structures prompts vs which generates responses.

---

## Local development

```bash
git clone https://github.com/drusinov/Foundry
cd Foundry
pnpm install
pnpm turbo dev --filter=web
```

Open [http://localhost:3000](http://localhost:3000). On first run, visit `/setup` to create your admin account.

---

## Deployment

```bash
# Build locally first
pnpm turbo build --filter=web

# Push and deploy
git push origin main
ssh root@your-vps "cd /opt/foundry && git pull origin main && pnpm install && pnpm turbo build --filter=web && pm2 restart foundry"
```

**First deploy — set JWT secret on VPS:**
```bash
echo "JWT_SECRET=$(openssl rand -base64 32)" >> /opt/foundry/apps/web/.env.local
```

Then visit `/setup` to create the admin account.

---

## Environment

No `.env` committed — keys and secrets live in `.env.local` on the VPS and in the SQLite DB per user.

| Variable | Location | Purpose |
|---|---|---|
| `JWT_SECRET` | `.env.local` on VPS | Signs session tokens |
| OpenAI key | DB, per user | GPT-4.1-mini context structuring |
| Anthropic key | DB, per user | Claude code generation + chat |

---

## Project structure

```
apps/web/src/
  lib/
    db.ts                  — libsql/SQLite client, user schema, typed queries
    auth.ts                — JWT sign/verify, getSession helper
  middleware.ts            — Edge JWT protection, role injection
  app/
    login/page.tsx         — Login UI
    setup/page.tsx         — First-run admin creation (locks after use)
    api/
      auth/                — login, logout, me, keys, register, setup
      users/               — admin: list + delete users
      ai/                  — Streaming two-stage pipeline (keys from DB)
      apps/                — Registry CRUD, filtered by userId
      apps/[slug]/
        start/             — PM2 start
        stop/              — PM2 stop
        build/             — Production build switch
        commits/           — Git log for rollback
        logs/              — PM2 log file reader
        rollback/          — Git checkout + PM2 restart
        icon/              — Generate + save SVG icon
        subdomain/         — nginx + certbot SSL
      forge/               — Generation (Claude) + deploy (SSE) + edit + update
      balance/             — OpenAI billing API check
      file-runtime/        — Live codebase snapshot for AI context
      git-state/           — Live git state (branch, commit, diff)
    page.tsx               — Tab layout, role-based tabs, user avatar + management
    globals.css            — Design system (dark theme, CSS variables)
  components/
    command/               — ⌘K command palette
    system/                — OperationalChat (streaming), StatusRail
  core/
    context/               — AI prompt construction, context compression
    state/                 — Session-persistent interaction store
    types/                 — Shared TypeScript types
  hooks/
    useAiRuntime.ts        — Streaming AI client
    useFileRuntime.ts      — Auto-refreshing codebase context (5min)
    useGitRuntime.ts       — Live git state
```

---

*Built by [Deyan Rusinov](https://github.com/drusinov)*
