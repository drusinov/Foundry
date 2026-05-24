# Foundry

**AI-native operational workspace.** A personal command center for building, deploying, and managing software — powered by Claude, running on a VPS, protected by user authentication.

Live at **[drusinov.eu](https://drusinov.eu)**

---

## What it is

Foundry is three tools in one, behind a single login:

**🔥 Foundry Runtime** *(admin only)* — An operational AI cockpit. Claude reads your entire live codebase, git state, recent commits and diffs in real time, then streams context-aware responses word by word. Includes a real bash tool — Claude can execute read-only commands (`grep`, `find`, `cat`, `git log`, `ps`, etc.) directly on the VPS during a conversation, with a strict whitelist blocking all write operations. Model selector (H / S / O). Cost per message. One-click clear. Health monitor auto-posts crash alerts.

**⚒️ Forge** — An AI app builder. Name an app, describe what it should do, and Forge generates a complete Next.js codebase, deploys it to your VPS with real-time log streaming, registers it with PM2, and adds an nginx route. Cost estimation shown before you submit. Edit any forged app — Claude reads the existing code and only changes what's needed. Multiple apps queue and process sequentially.

**⚔️ Apps** — A directory of everything Forge has built. Each app has a unique AI-generated SVG icon. Start/stop on demand. Edit, view logs, roll back to any git commit, or remove. Auto-heal: nginx port mismatches are detected and corrected automatically on every start and every 60 seconds.

---

## Architecture

```
Foundry Core (this repo)
├── 🔥 Runtime        — Streaming AI chat, live codebase context, real bash tool (admin)
├── ⚒️ Forge          — AI app generator with real-time deploy logs + cost estimation
└── ⚔️ Apps           — Forged app registry: start/stop, edit, logs, history, rollback

Auth layer
├── SQLite DB         — Users, roles, API keys per account (@libsql/client)
├── JWT sessions      — 30-day httpOnly cookies (jose)
└── Edge middleware   — Protects all routes, injects user context

Infrastructure
├── PM2               — Process management for Foundry + all forged apps
├── nginx             — Reverse proxy, routes /apps/{slug}/ to each app's port
├── Auto-heal         — nginx port mismatch detection and correction
└── git               — Every forged app is git-tracked, rollback to any commit
```

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript |
| Monorepo | Turborepo, pnpm workspaces |
| Auth | JWT (jose), bcryptjs, @libsql/client (SQLite) |
| AI | OpenAI GPT-4.1-mini (context structuring) → Claude Haiku/Sonnet/Opus (streaming) |
| Bash tool | Read-only whitelist executor — grep, find, cat, ls, git log/diff/status, ps, pm2 list |
| Deployment | Ubuntu VPS, PM2, nginx, Let's Encrypt SSL |

---

## User system

| Role | Access |
|---|---|
| `admin` | 🔥 Runtime + ⚒️ Forge + ⚔️ Apps + user management + bash tool |
| `user` | ⚒️ Forge + ⚔️ Apps only |

- Anyone can create an account at `/signup`
- New accounts always get `user` role
- Admin creates privileged accounts from the avatar menu → Users panel
- API keys (OpenAI + Anthropic) stored per-account in the DB — never in localStorage
- First visit → `/setup` creates the admin account (one-time, locks after use)

---

## AI Pipeline

**Runtime** uses a two-stage streaming pipeline:

1. **GPT-4.1-mini** — compresses the full operational context (git state, all source files, recent commits) into a focused prompt
2. **Claude** — streams the response word by word, with optional bash tool use for real VPS inspection

When Claude uses the bash tool, commands appear inline as collapsible code blocks with the exact command and real output. No hallucination — actual live data from the VPS.

**Cost display:** every response shows estimated cost (e.g. `$0.018`) next to the token count, calculated per model.

---

## Forge Pipeline

1. User enters app name + description
2. Claude (Opus) generates a complete Next.js codebase
3. Claude (Haiku) generates a description and a unique SVG icon
4. Files written to `/opt/forged-apps/{slug}/`, git init + first commit
5. `npm install` streams logs to the UI in real time
6. PM2 starts the app on the next available port (4000+)
7. nginx location block added → app live at `drusinov.eu/apps/{slug}/`
8. Registered in `/opt/foundry/forged-apps.json` with userId, cost, icon

**Edit:** reads existing files → Claude makes targeted changes → writes only changed files → PM2 restart. No full regeneration.

---

## Setup

```bash
# Clone and install
git clone https://github.com/drusinov/Foundry && cd Foundry && pnpm install

# Set JWT secret on VPS
echo "JWT_SECRET=$(openssl rand -base64 32)" >> /opt/foundry/apps/web/.env.local

# Deploy
git push origin main
ssh root@your-vps "cd /opt/foundry && git pull && pnpm install && pnpm turbo build --filter=web && pm2 restart foundry"

# First run: visit /setup to create admin account
```

---

## Environment

| Variable | Where | Purpose |
|---|---|---|
| `JWT_SECRET` | `.env.local` on VPS | Signs session tokens |
| OpenAI key | DB per user | GPT-4.1-mini context structuring |
| Anthropic key | DB per user | Claude code generation + chat |

---

## Design system

```css
--bg-base: #13131A;  --bg-raised: #1A1A24;  --bg-overlay: #20202C;
--text-1: #EEEEF2;   --text-4: rgba(238,238,242,0.2);
--blue: #6399FF;  --green: #4ADE80;  --red: #F87171;  --forge: #A78BFA;
```

---

*Built by [Deyan Rusinov](https://github.com/drusinov)*
