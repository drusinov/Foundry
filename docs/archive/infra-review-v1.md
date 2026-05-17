# AI Workspace Platform — Architectural Review & Design Document

**Classification:** Principal Architect Review  
**Status:** Pre-Implementation  
**Scope:** Full-stack pivot from crypto trading bot to AI engineering workspace

---

## Table of Contents

1. [Executive Summary & Critical Findings](#1-executive-summary--critical-findings)
2. [Existing State Audit](#2-existing-state-audit)
3. [Risk Register](#3-risk-register)
4. [Migration Strategy — Crypto Bot Archival](#4-migration-strategy--crypto-bot-archival)
5. [Production Topology](#5-production-topology)
6. [Docker Architecture](#6-docker-architecture)
7. [CI/CD Structure](#7-cicd-structure)
8. [Rollback Process](#8-rollback-process)
9. [Backup & Verification Strategy](#9-backup--verification-strategy)
10. [Local Development Workflow](#10-local-development-workflow)
11. [Environment Management Strategy](#11-environment-management-strategy)
12. [Security Posture](#12-security-posture)
13. [What To Build First — Phased Delivery](#13-what-to-build-first--phased-delivery)
14. [Rejected Patterns & Why](#14-rejected-patterns--why)

---

## 1. Executive Summary & Critical Findings

### Bottom Line Up Front

This pivot is architecturally sound at the stated scope. The existing operational discipline (backups, rollback, SSH workflow, deployment scripts) is a genuine asset — do not discard it in favor of new abstractions. The preferred stack (Django + DRF + PostgreSQL + Next.js + Docker Compose + Nginx) is the right call. Resist any pressure to complicate it.

### Critical Findings

**FINDING 1 — The live crypto bot is a blast radius problem.**  
You cannot do a casual "we'll migrate when ready" approach. The bot likely holds API keys, potentially real funds, and has cron jobs or background processes. A half-finished migration that leaves both systems partially running creates data corruption risk and financial exposure. This must be the first thing resolved with a hard cutoff date.

**FINDING 2 — "Project memory" is architecturally underspecified.**  
"Project memory/context system" can mean anything from a JSON blob in a database row to a vector embedding store with semantic search. These have radically different complexity profiles. You need to define this concretely before any architecture decision about storage is final. The wrong choice here creates a painful migration later.

**FINDING 3 — The "Deploy button" feature is scope creep masquerading as a core feature.**  
A button that deploys infrastructure is an extremely high-risk, high-complexity feature. Before building it, you need to answer: what exactly is it deploying? To where? With what authentication? What happens when it fails mid-deployment? This is not a sprint-1 feature.

**FINDING 4 — Multi-model AI chat is a solved problem that requires abstraction discipline.**  
OpenAI and Anthropic have different API contracts, different token pricing, different streaming behaviors, different error codes. An abstraction layer that papers over these differences will leak abstractions constantly. Build the thinnest possible adapter layer and be explicit about what is NOT abstracted.

**FINDING 5 — Snapshot/rollback system needs a clear definition boundary.**  
"Save State" could mean: a database backup, a Docker image tag, a Git commit, a filesystem snapshot, or all of the above. These have different restore procedures, different RPO/RTO characteristics, and different storage costs. Define the boundary explicitly or you'll build all of them partially.

---

## 2. Existing State Audit

### What You Actually Have

| Asset | Value | Risk | Notes |
|---|---|---|---|
| Ubuntu VPS | High | Live bot running | Single point of failure — no redundancy |
| GitHub repository | High | Low | Needs branch strategy defined |
| Domain + Nginx | High | Low | Config may need restructuring for new app |
| Deployment scripts | Medium | Medium | Likely crypto-specific, may need adaptation |
| Backup/recovery tooling | High | Low | Preserve this operational discipline |
| Validation scripts | Medium | Low | Adapt, don't discard |
| SSH workflow | High | Low | Keep as primary deployment path |
| Crypto bot stack | Liability | HIGH | Active exposure — must be archived cleanly |

### Unknowns That Must Be Resolved Before Architecture Is Final

1. **VPS specifications** — CPU, RAM, disk. This determines whether you can run Django + PostgreSQL + Redis + Nginx + Next.js SSR on one box without resource contention. If the VPS is a 1GB RAM droplet, the architecture changes.

2. **Crypto bot dependencies** — Does the bot use PostgreSQL? Redis? Does it have open WebSocket connections to exchanges? Does it run as a systemd service or in Docker? This determines archival complexity.

3. **Existing Nginx config** — Is it serving the bot's API? Are there Let's Encrypt certificates? What domain routing exists? Changing Nginx mid-production is a common source of downtime.

4. **Backup target** — Where do backups currently go? S3? Local disk? Another VPS? This determines the disaster recovery plan.

5. **GitHub Actions status** — Is CI/CD already wired up? What secrets exist in the repo?

### Operational Discipline Audit

The following practices from the crypto bot project MUST be carried forward:

- **Deployment gating via validation scripts** — Keep this. Extend it for the new stack.
- **Snapshot before deploy** — Keep this. Make it mandatory in CI/CD.
- **SSH-based deployment** — Keep this as the fallback path when automation fails.
- **Backup verification** — Keep this. Automate the restore test.
- **Rollback procedure** — Keep this. Document the exact commands.

---

## 3. Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Crypto bot disruption during migration | High | High | Hard cutover date, bot archived before new stack deployed |
| API key exposure during pivot | Medium | Critical | Rotate all keys during migration, audit GitHub history |
| VPS resource exhaustion | Medium | High | Monitor memory/CPU during staged rollout |
| PostgreSQL data loss during schema migration | Low | Critical | pg_dump before every migration, test restore |
| Nginx misconfiguration causing downtime | Medium | High | Blue/green approach with port-level testing before DNS cut |
| AI API rate limits breaking chat feature | Medium | Medium | Circuit breaker pattern, graceful degradation |
| "Project memory" scope creep into a search engine | High | High | Define MVP as: JSON blob in DB, vector search in v2 |
| Deploy button destroying production | Medium | Critical | Defer to post-MVP, require explicit confirmation + dry-run |
| Docker image bloat consuming disk | Medium | Medium | Image pruning policy, multi-stage builds |
| GitHub Actions secrets exposure | Low | Critical | Audit secrets, use environment-scoped secrets |

---

## 4. Migration Strategy — Crypto Bot Archival

### Phase 0: Pre-Migration Audit (Day 1–2)

Before touching anything on the VPS, document the current state completely.

```bash
# Run this on the VPS and save the output
systemctl list-units --type=service --state=running > /tmp/running_services.txt
docker ps -a > /tmp/docker_state.txt
docker network ls > /tmp/docker_networks.txt
crontab -l > /tmp/cron_jobs.txt
nginx -T > /tmp/nginx_config_dump.txt
du -sh /var/lib/postgresql/ > /tmp/pg_size.txt
pg_dumpall -U postgres | gzip > /tmp/full_db_backup_$(date +%Y%m%d).sql.gz
env > /tmp/env_snapshot.txt  # WARNING: contains secrets — keep local only
ls -la /opt/ /srv/ /home/ > /tmp/directory_layout.txt
```

**Create a private Git repository or encrypted archive with this snapshot.** This is your forensic baseline.

### Phase 1: Bot Archival (Day 2–3)

**Step 1: Freeze the bot.**
```bash
# Stop trading activity first (graceful shutdown)
systemctl stop crypto-bot  # or docker compose stop bot
# Verify no open positions or pending orders before proceeding
```

**Step 2: Final database dump.**
```bash
pg_dump -U postgres crypto_bot_db | gzip > ~/archives/crypto_bot_final_$(date +%Y%m%d_%H%M%S).sql.gz
```

**Step 3: Archive the codebase.**
```bash
tar -czf ~/archives/crypto_bot_code_$(date +%Y%m%d).tar.gz /path/to/bot/
# Push any uncommitted work to a dedicated archive branch in GitHub
git checkout -b archive/crypto-bot-$(date +%Y%m%d)
git push origin archive/crypto-bot-$(date +%Y%m%d)
```

**Step 4: Preserve but disable.**
- Do NOT delete the bot's Docker containers, volumes, or database yet.
- Rename/prefix them to `archived_*` to prevent accidental restart.
- Remove the bot from systemd autostart.
- Keep the archive for minimum 90 days before any cleanup.

```bash
# Prefix container names to make them clearly archived
docker rename crypto_bot archived_crypto_bot
# Remove from autostart without deleting
systemctl disable crypto-bot
```

**Step 5: Revoke and rotate API keys.**
- Immediately revoke all exchange API keys from the exchange's dashboard.
- Rotate any other secrets the bot held (database passwords, webhook tokens).
- Audit GitHub repository history for any accidentally committed secrets (`git log -p | grep -i "api_key\|secret\|password"`).

### Phase 2: Infrastructure Preparation (Day 3–5)

**Do not tear down the bot stack yet.** Run the new stack in parallel on different ports first.

1. Provision the new directory structure (see Section 5).
2. Bring up the new Docker Compose stack on non-production ports (8000, 3001).
3. Configure Nginx with the new upstream but commented out (not live yet).
4. Run health checks against the new stack.
5. Switch Nginx to point to the new stack.
6. Monitor for 24 hours.
7. Only after 24h stable: archive old containers.

**The parallel-run phase is non-negotiable.** Having a working fallback to the old Nginx config is the only thing that prevents a botched migration from becoming downtime.

### Rollback to Bot (Emergency Only)

If the new stack fails critically within 72 hours of cutover:

```bash
# Revert Nginx to archived config
cp /etc/nginx/sites-available/crypto_bot_backup.conf /etc/nginx/sites-available/default
nginx -t && systemctl reload nginx

# Restart bot (not re-enabling trading — just restoring service)
docker start archived_crypto_bot
systemctl start crypto-bot
```

This rollback path becomes unavailable once the bot's exchange API keys are revoked. That revocation is intentional and irreversible — it is the point of no return.

---

## 5. Production Topology

### Single-VPS Architecture

```
Internet
    │
    ▼
[Nginx]  ← TLS termination, rate limiting, static files
    │
    ├─── /api/*  ──────► [Django + Gunicorn]  :8000
    │                         │
    │                         ├── [PostgreSQL]  :5432
    │                         └── [Redis]       :6379
    │
    ├─── /ws/*   ──────► [Django Channels / Daphne]  :8001
    │                    (for streaming AI responses)
    │
    └─── /*      ──────► [Next.js]  :3000
                         (standalone build, no Node server in prod)
```

### Directory Layout on VPS

```
/srv/aiworkspace/
├── .env.production          # secrets — NOT in git
├── docker-compose.yml
├── docker-compose.override.yml  # local dev overrides only
├── nginx/
│   ├── nginx.conf
│   └── certs/               # Let's Encrypt managed by certbot
├── backend/                 # Django app (bind mount in dev, built image in prod)
├── frontend/                # Next.js app
├── postgres/
│   └── data/                # PostgreSQL data dir (Docker volume)
├── redis/
│   └── data/
├── backups/
│   ├── db/
│   ├── snapshots/
│   └── verify/
├── scripts/
│   ├── deploy.sh
│   ├── rollback.sh
│   ├── snapshot.sh
│   ├── verify_backup.sh
│   └── health_check.sh
└── logs/
    ├── nginx/
    ├── django/
    └── deploy/
```

### Network Segmentation

Use Docker internal networks. The database and Redis must NOT be exposed on host ports in production.

```yaml
networks:
  frontend_net:    # Nginx → Django, Nginx → Next.js
  backend_net:     # Django → PostgreSQL, Django → Redis
  # No single network bridging all services — enforces isolation
```

PostgreSQL and Redis: `expose` (container-to-container) only, never `ports` (host-bound) in production.

---

## 6. Docker Architecture

### Service Layout

```yaml
# docker-compose.yml (production)
version: "3.9"

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups/db:/backups  # backup scripts write here
    networks:
      - backend_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - backend_net
    healthcheck:
      test: ["CMD", "redis-cli", "--pass", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    restart: unless-stopped
    env_file: .env.production
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./logs/django:/app/logs
      - media_files:/app/media
    networks:
      - frontend_net
      - backend_net
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8000/health/ || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
    restart: unless-stopped
    env_file: .env.production
    networks:
      - frontend_net
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/ || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:1.25-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/certs:/etc/nginx/certs:ro
      - ./logs/nginx:/var/log/nginx
      - media_files:/var/www/media:ro
    depends_on:
      - backend
      - frontend
    networks:
      - frontend_net

volumes:
  postgres_data:
  redis_data:
  media_files:

networks:
  frontend_net:
  backend_net:
```

### Django Dockerfile (Multi-stage)

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc curl && rm -rf /var/lib/apt/lists/*

FROM base AS builder
COPY requirements.txt .
RUN pip install --prefix=/install --no-cache-dir -r requirements.txt

FROM base AS development
COPY --from=builder /install /usr/local
COPY . .
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

FROM base AS production
COPY --from=builder /install /usr/local
COPY . .
RUN python manage.py collectstatic --noinput
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--timeout", "120", \
     "--access-logfile", "/app/logs/access.log", \
     "--error-logfile", "/app/logs/error.log"]
```

### Critical Docker Rules

1. **Never use `latest` tags for dependencies** — pin exact versions (`postgres:16.2-alpine`, not `postgres:latest`). Unpinned images break silently after upgrades.

2. **healthchecks are required on all services** — `depends_on` without condition-based healthchecks is a race condition. The backend will fail to start if it connects to PostgreSQL before it's ready.

3. **Never store secrets in Docker environment variables passed via command line** — use `env_file` or Docker secrets. `docker inspect` exposes environment variables to any user with Docker socket access.

4. **Separate `docker-compose.override.yml` for development** — the base `docker-compose.yml` should be valid for production. Dev-only configurations (volume bind mounts for hot reload, debug ports) belong in override.

5. **Log rotation** — configure `logging.driver: json-file` with `max-size` and `max-file` options on every container. Without this, logs fill the disk silently.

---

## 7. CI/CD Structure

### Philosophy

**The VPS is the deployment target. GitHub Actions is the automation layer, not the control plane.** You should be able to deploy manually via SSH when GitHub is down. CI/CD automates the happy path; it should not be the only path.

### Branch Strategy

```
main          ← production only. Direct push disabled. Merges via PR only.
staging       ← pre-production. Auto-deploys to staging environment (same VPS, different port).
develop       ← integration branch. CI runs, no auto-deploy.
feature/*     ← developer branches. CI runs.
hotfix/*      ← emergency patches. Merges directly to main with required review.
archive/*     ← crypto bot archival branches. Read-only after archival.
```

### GitHub Actions Workflows

#### 1. CI — Pull Request Validation

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, staging, develop]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: pip
      - run: pip install -r requirements.txt -r requirements-dev.txt
      - run: python -m pytest --cov=. --cov-report=xml
      - run: python -m ruff check .
      - run: python -m mypy .

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
      - run: npm ci
        working-directory: frontend
      - run: npm run lint
        working-directory: frontend
      - run: npm run type-check
        working-directory: frontend
      - run: npm test
        working-directory: frontend

  docker-build-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build --target production ./backend
      - run: docker build --target production ./frontend
```

#### 2. Deploy — Production

```yaml
# .github/workflows/deploy-production.yml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # Requires manual approval in GitHub UI

    steps:
      - uses: actions/checkout@v4

      - name: Snapshot before deploy
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: /srv/aiworkspace/scripts/snapshot.sh pre-deploy

      - name: Deploy
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /srv/aiworkspace
            git pull origin main
            docker compose build --no-cache backend frontend
            docker compose up -d --no-deps backend frontend
            
      - name: Health check
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: /srv/aiworkspace/scripts/health_check.sh || /srv/aiworkspace/scripts/rollback.sh

      - name: Notify on failure
        if: failure()
        # ... notification step (Slack, email, etc.)
```

### Deployment Script

```bash
#!/bin/bash
# scripts/deploy.sh
set -euo pipefail

DEPLOY_LOG="/srv/aiworkspace/logs/deploy/$(date +%Y%m%d_%H%M%S).log"
exec > >(tee -a "$DEPLOY_LOG") 2>&1

echo "=== Deploy started at $(date) ==="
echo "=== Commit: $(git rev-parse HEAD) ==="

# 1. Snapshot current state
./scripts/snapshot.sh "pre-deploy-$(git rev-parse --short HEAD)"

# 2. Pull latest
git pull origin main

# 3. Run database migrations (with rollback on failure)
docker compose run --rm backend python manage.py migrate --check
if [ $? -ne 0 ]; then
    docker compose run --rm backend python manage.py migrate
fi

# 4. Build new images
docker compose build backend frontend

# 5. Rolling restart (avoids full downtime)
docker compose up -d --no-deps --wait backend
docker compose up -d --no-deps --wait frontend

# 6. Health check
./scripts/health_check.sh

# 7. Clean up old images (keep last 3)
docker image prune -f --filter "until=168h"

echo "=== Deploy completed successfully at $(date) ==="
```

### Health Check Script

```bash
#!/bin/bash
# scripts/health_check.sh
set -euo pipefail

BACKEND_URL="http://localhost:8000/health/"
FRONTEND_URL="http://localhost:3000/"
MAX_RETRIES=10
SLEEP=3

check_endpoint() {
    local url=$1
    local name=$2
    for i in $(seq 1 $MAX_RETRIES); do
        if curl -sf "$url" > /dev/null 2>&1; then
            echo "✓ $name healthy"
            return 0
        fi
        echo "  Attempt $i/$MAX_RETRIES for $name..."
        sleep $SLEEP
    done
    echo "✗ $name failed health check"
    return 1
}

check_endpoint "$BACKEND_URL" "Backend"
check_endpoint "$FRONTEND_URL" "Frontend"

# Database connectivity check via Django
docker compose exec -T backend python manage.py check --database default
echo "✓ Database connectivity verified"

echo "All health checks passed."
```

---

## 8. Rollback Process

### Rollback Tiers

**Tier 1 — Application Rollback (< 5 minutes)**
Previous Docker image is still on the VPS. Simply restart with the previous build.

```bash
#!/bin/bash
# scripts/rollback.sh
set -euo pipefail

echo "=== ROLLBACK INITIATED at $(date) ==="

# Identify the previous image tag
PREV_BACKEND=$(docker images aiworkspace-backend --format "{{.Tag}}" | sed -n '2p')
PREV_FRONTEND=$(docker images aiworkspace-frontend --format "{{.Tag}}" | sed -n '2p')

echo "Rolling back to backend:$PREV_BACKEND, frontend:$PREV_FRONTEND"

# Revert to previous images
docker compose stop backend frontend
docker tag aiworkspace-backend:$PREV_BACKEND aiworkspace-backend:rollback
docker tag aiworkspace-frontend:$PREV_FRONTEND aiworkspace-frontend:rollback

# Restart with previous image
BACKEND_IMAGE=aiworkspace-backend:rollback \
FRONTEND_IMAGE=aiworkspace-frontend:rollback \
docker compose up -d backend frontend

# Verify
./scripts/health_check.sh && echo "=== Rollback successful ===" \
                           || echo "=== Rollback health check FAILED — manual intervention required ==="
```

**Tier 2 — Database Rollback (5–20 minutes)**
Requires a pre-deployment database snapshot.

```bash
# DESTRUCTIVE — only use if application rollback is insufficient
# Requires the service to be stopped during restore

docker compose stop backend
docker compose exec db pg_restore \
    --dbname=aiworkspace \
    --username=${DB_USER} \
    --clean \
    /backups/pre-deploy-snapshot.sql
docker compose start backend
./scripts/health_check.sh
```

**Tier 3 — Full VPS Snapshot Restore (20–60 minutes)**
For catastrophic failures. VPS provider snapshot (DigitalOcean Droplet Snapshot, Hetzner Snapshot, etc.). This is the last resort — it reverts everything including OS state.

### Rollback Decision Tree

```
Deploy fails health check
        │
        ├─ Is it code-only? (No DB migration ran)
        │       └─ YES → Tier 1 Rollback (immediate)
        │
        ├─ Did a migration run that is backwards-compatible?
        │       └─ YES → Tier 1 Rollback (migration left in place)
        │
        ├─ Did a destructive migration run?
        │       └─ YES → Tier 2 Rollback (database restore)
        │
        └─ Is the VPS itself compromised / corrupted?
                └─ YES → Tier 3 (provider snapshot restore)
```

### Migration Safety Policy

**Every Django migration must be reviewed before deployment for:**

1. **Reversibility** — Can this be rolled back with `migrate --backwards`? If not, document why.
2. **Locking** — Does this lock a table that receives heavy writes? (e.g., `ALTER TABLE ADD COLUMN NOT NULL` without a default locks the table in older PostgreSQL)
3. **Data loss** — Does this delete columns or tables? Require an explicit annotation in the migration file.

```python
# migrations/0005_drop_legacy_column.py
# ROLLBACK NOTE: This migration is NOT reversible.
# A database backup was taken before this deployment.
# Backup location: /backups/db/pre-deploy-20250610.sql.gz
class Migration(migrations.Migration):
    reversible = False  # Custom annotation for audit trail
```

---

## 9. Backup & Verification Strategy

### Backup Schedule

| Type | Frequency | Retention | Storage |
|---|---|---|---|
| PostgreSQL full dump | Daily at 02:00 UTC | 30 days | VPS local + offsite (S3/Backblaze) |
| PostgreSQL WAL (if configured) | Continuous | 7 days | Offsite only |
| Pre-deploy snapshot | Every deployment | Until next deployment | VPS local |
| VPS provider snapshot | Weekly | 4 snapshots | Provider |
| Media files | Daily | 14 days | Offsite |
| Docker image tags | Every build | 5 most recent | VPS local |

### Backup Script

```bash
#!/bin/bash
# scripts/backup.sh
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/srv/aiworkspace/backups/db"
BACKUP_FILE="$BACKUP_DIR/aiworkspace_$TIMESTAMP.sql.gz"

# Dump
docker compose exec -T db pg_dump \
    -U $DB_USER \
    -d $DB_NAME \
    | gzip > "$BACKUP_FILE"

echo "Backup written: $BACKUP_FILE ($(du -sh $BACKUP_FILE | cut -f1))"

# Verify (critical — a backup you haven't tested is not a backup)
./scripts/verify_backup.sh "$BACKUP_FILE"

# Offsite sync
aws s3 cp "$BACKUP_FILE" "s3://${BACKUP_BUCKET}/db/" \
    --storage-class STANDARD_IA

# Prune local backups older than 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "Backup and offsite sync completed."
```

### Backup Verification Script

**This is the most commonly skipped step and the most important one.**

```bash
#!/bin/bash
# scripts/verify_backup.sh
set -euo pipefail

BACKUP_FILE=$1
VERIFY_DB="aiworkspace_verify_$(date +%s)"

echo "=== Verifying backup: $BACKUP_FILE ==="

# Create temporary verification database
docker compose exec -T db createdb -U $DB_USER "$VERIFY_DB"

# Attempt restore into verification database
zcat "$BACKUP_FILE" | docker compose exec -T db psql \
    -U $DB_USER \
    -d "$VERIFY_DB" \
    --quiet

# Sanity check: count rows in critical tables
ROW_COUNT=$(docker compose exec -T db psql \
    -U $DB_USER \
    -d "$VERIFY_DB" \
    -t -c "SELECT COUNT(*) FROM django_migrations;")

if [ "$ROW_COUNT" -gt "0" ]; then
    echo "✓ Backup verified: $ROW_COUNT migration records found"
else
    echo "✗ Backup verification FAILED: no migration records"
    docker compose exec -T db dropdb -U $DB_USER "$VERIFY_DB"
    exit 1
fi

# Clean up verification database
docker compose exec -T db dropdb -U $DB_USER "$VERIFY_DB"
echo "=== Backup verification passed ==="
```

### What Constitutes a Valid Backup

A backup is only valid if:
1. The file is not zero-length
2. The gzip can be decompressed without error
3. The SQL can be restored to a test database without errors
4. Key table row counts are non-zero
5. The offsite copy matches the local checksum

Automate this check. A backup that has never been restored is a liability, not an asset.

---

## 10. Local Development Workflow

### Developer Setup

```bash
# Clone and setup
git clone git@github.com:org/aiworkspace.git
cd aiworkspace
cp .env.example .env.local

# Start development stack
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Apply migrations
docker compose exec backend python manage.py migrate

# Create superuser
docker compose exec backend python manage.py createsuperuser

# Frontend is available at http://localhost:3000
# Django admin at http://localhost:8000/admin/
# API at http://localhost:8000/api/
```

### Development Override

```yaml
# docker-compose.override.yml (NOT committed for production, git-tracked for dev)
version: "3.9"

services:
  backend:
    build:
      target: development
    volumes:
      - ./backend:/app  # Live reload via bind mount
    ports:
      - "8000:8000"     # Expose for direct access
      - "5678:5678"     # debugpy port
    environment:
      - DEBUG=True
      - DJANGO_SETTINGS_MODULE=config.settings.development
    command: python manage.py runserver 0.0.0.0:8000

  frontend:
    build:
      target: development
    volumes:
      - ./frontend:/app
      - /app/node_modules  # Anonymous volume — prevents host node_modules clobbering container
    ports:
      - "3000:3000"
    command: npm run dev
    environment:
      - NODE_ENV=development

  db:
    ports:
      - "5432:5432"  # Expose for local database clients (TablePlus, DBeaver, etc.)
```

### Development Principles

1. **The `docker-compose.override.yml` is the canonical dev configuration.** Do not modify `docker-compose.yml` for dev-only changes.

2. **Migrations must be generated in the container, not on the host.** The container environment is the canonical Python environment.
   ```bash
   docker compose exec backend python manage.py makemigrations
   ```

3. **Never run `docker compose down -v` casually.** The `-v` flag deletes named volumes including the development database. Establish this as a team norm.

4. **Fixture data for development.** Create a `fixtures/` directory with anonymized seed data. New developers should be able to run `python manage.py loaddata dev_seed` to get a working local environment without manual setup.

---

## 11. Environment Management Strategy

### Environment Hierarchy

```
.env.example         ← Committed to git. Documents all variables with placeholder values.
.env.local           ← Developer local overrides. In .gitignore.
.env.staging         ← On VPS only. Not in git. Loaded via env_file.
.env.production      ← On VPS only. Not in git. Loaded via env_file.
```

### Required Environment Variables

```bash
# .env.example — commit this file
# === Django ===
DJANGO_SECRET_KEY=replace-with-50-char-random-string
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DJANGO_SETTINGS_MODULE=config.settings.production

# === Database ===
DB_NAME=aiworkspace
DB_USER=aiworkspace_user
DB_PASSWORD=replace-with-strong-password
DB_HOST=db
DB_PORT=5432

# === Redis ===
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
REDIS_PASSWORD=replace-with-strong-password

# === AI APIs ===
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# === Storage ===
BACKUP_BUCKET=your-backup-bucket-name
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=us-east-1

# === Application ===
CORS_ALLOWED_ORIGINS=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

### Settings Module Structure

```
backend/config/settings/
├── base.py          ← Common settings (installed apps, middleware, etc.)
├── development.py   ← DEBUG=True, local DB, relaxed CORS
├── staging.py       ← Production-like but with extra logging
├── production.py    ← Hardened: HTTPS-only, strict CSP, minimal logging
└── test.py          ← In-memory DB, mocked external services
```

### Secret Rotation Policy

| Secret | Rotation Frequency | Rotation Trigger |
|---|---|---|
| DJANGO_SECRET_KEY | Annually | Suspected compromise |
| DB_PASSWORD | Annually | Developer offboarding |
| OPENAI_API_KEY | Per-billing cycle audit | Suspected exposure |
| ANTHROPIC_API_KEY | Per-billing cycle audit | Suspected exposure |
| VPS SSH Deploy Key | When GitHub Actions changes | Developer offboarding |

### GitHub Actions Secrets

Scope secrets to environments, not to the repository:

- Repository secrets: only non-sensitive build configuration
- `production` environment secrets: VPS_HOST, VPS_SSH_KEY, production API keys
- `staging` environment secrets: separate VPS credentials, staging API keys

This prevents a compromised PR from exfiltrating production secrets.

---

## 12. Security Posture

### Non-Negotiables

1. **PostgreSQL and Redis MUST NOT be port-exposed on the host in production.** Use Docker internal networks only.

2. **The Django admin panel must be behind HTTP basic auth or IP restriction at the Nginx level,** in addition to Django's own auth. Admin panels are a top target for automated attacks.

3. **AI API keys must be server-side only.** No API key should ever reach the browser. All AI calls go through your Django API layer.

4. **Rate limit the AI proxy endpoints.** An exposed AI relay endpoint without rate limiting is a direct financial liability. A single determined user can burn through hundreds of dollars of API credits.

   ```python
   # Use django-ratelimit or DRF throttling
   class AIChatView(APIView):
       throttle_classes = [UserRateThrottle]
       throttle_scope = 'ai_chat'  # Configure in settings: 10/min per user
   ```

5. **Content Security Policy.** Next.js sends permissive defaults. Tighten CSP before going live.

6. **Dependency scanning.** Add `pip-audit` to CI for backend, `npm audit` is already in the frontend pipeline. Run weekly via scheduled GitHub Actions.

7. **SSH hardening.** If not already done:
   ```
   # /etc/ssh/sshd_config
   PasswordAuthentication no
   PermitRootLogin no
   MaxAuthTries 3
   ```

8. **UFW firewall.** Only ports 80, 443, and your SSH port should be open to the internet.

---

## 13. What To Build First — Phased Delivery

### MVP (Sprint 1–3): The Thin Slice

Build the smallest thing that proves the architecture works end-to-end.

**Sprint 1: Infrastructure foundation**
- [ ] Bot archival complete
- [ ] New directory structure on VPS
- [ ] Docker Compose stack: Django + PostgreSQL + Redis + Nginx + Next.js
- [ ] Basic deployment script + health check
- [ ] `.env.production` configured
- [ ] Let's Encrypt cert configured
- [ ] GitHub Actions CI pipeline (tests only)

**Sprint 2: Core AI chat**
- [ ] Django: `/api/chat/` endpoint accepting model + messages
- [ ] Thin OpenAI + Anthropic adapter (not LangChain — write 50 lines of Python)
- [ ] Streaming responses via Server-Sent Events
- [ ] Next.js: basic chat UI, no auth
- [ ] Rate limiting on AI endpoints

**Sprint 3: Auth + Project model**
- [ ] Django: user authentication (consider django-allauth for simplicity)
- [ ] Project model: name, description, created_at, user FK
- [ ] Project context: a simple TextField on the Project model (NOT a vector DB yet)
- [ ] Wire chat to project context: prepend project context to system prompt

**This is your MVP.** It is not impressive. That is correct. Prove the deployment pipeline works before building features.

### v1.0 (Sprint 4–6): Save State + Snapshot System

- [ ] Snapshot model: project_id, timestamp, git_commit, db_dump_path, notes
- [ ] `scripts/snapshot.sh` writes to the Snapshot model via Django management command
- [ ] UI: list snapshots, restore snapshot (with confirmation)
- [ ] Backup verification run automatically after each snapshot
- [ ] Pre-deploy snapshot mandatory in CI/CD

### v1.1 (Sprint 7–9): Deploy Button (Carefully)

- [ ] Define exactly what "deploy" means before writing a line of code
- [ ] Scope it narrowly: deploy THIS application to THIS VPS via SSH
- [ ] Dry-run mode that shows what would happen without doing it
- [ ] Explicit human confirmation required (not auto-triggered)
- [ ] Full audit log of every deploy action

### Future Considerations (Post-v1.1)

- **Vector search for project memory** — Only add this if the simple TextField context proves insufficient. pgvector extension for PostgreSQL is the right choice here (NOT a separate vector database — that's premature for a single-VPS setup).
- **Multi-user + team features** — Row-level security in PostgreSQL.
- **Staging environment** — Second VPS or separate Docker Compose project on the same VPS with different ports.
- **Metrics + alerting** — Grafana + Prometheus or a managed service (Better Uptime, etc.).

---

## 14. Rejected Patterns & Why

### Kubernetes
**Rejected.** You have one VPS, one application, one team member (or very small team). Kubernetes adds: cluster management overhead, YAML configuration complexity, networking abstractions that break in non-obvious ways, and a steep operational learning curve. The failure modes of Kubernetes are significantly harder to debug than Docker Compose failures. Docker Compose on a single VPS handles thousands of requests per second. You will not outgrow it at this stage.

### LangChain
**Rejected as the primary abstraction layer.** LangChain is impressive in demos and frustrating in production. Its abstractions leak constantly, its release cadence breaks APIs regularly, and it adds a significant debugging layer between you and the underlying API. Write a 50-line `ai_adapter.py` that calls OpenAI and Anthropic directly. You will understand it completely, you can debug it in minutes, and it will never surprise you with an abstraction failure.

Exception: LangChain's specific utilities (document loaders, text splitters) may be useful when implementing vector search in v1.1. Use specific utilities, not the full framework.

### Separate Vector Database (Pinecone, Weaviate, Qdrant)
**Rejected for MVP.** A plain `TextField` storing project context is sufficient to prove the concept. If semantic search becomes a proven need, `pgvector` (a PostgreSQL extension) handles it without adding an operational dependency. A separate vector database adds: another service to operate, another backup target, another failure point, and another bill. Add it only when PostgreSQL + pgvector demonstrably fails to meet requirements.

### Microservices
**Rejected.** A Django monolith with DRF is the correct architecture for a product that doesn't exist yet. Microservices optimize for team scaling and independent deployment, neither of which is your constraint. A monolith is easier to test, easier to deploy, easier to debug, and easier to refactor. If you hit genuine scaling constraints (unlikely on a single VPS in year one), a Django service can be extracted then.

### Event-Driven Architecture / Message Queues (Kafka, RabbitMQ)
**Rejected.** Celery + Redis is sufficient for any background job requirements. Do not introduce a message broker without a concrete use case that Redis + Celery cannot satisfy.

### Separate Frontend CDN Deployment (Vercel, Netlify)
**Not rejected, but deferred.** Deploying Next.js to Vercel is operationally simpler and the Next.js team has optimized for it. However, it creates a split deployment model (backend on VPS, frontend on CDN) that adds complexity to your environment variables, CORS configuration, and deployment coordination. For a v1 with low traffic, run Next.js standalone on the VPS. Move to Vercel when you have a concrete performance reason.

### GitOps / ArgoCD / Flux
**Rejected.** This is a VPS with SSH access. Your deployment model is `git pull && docker compose up`. GitOps tooling is designed for Kubernetes clusters with multiple environments and multiple teams. It adds substantial operational complexity with no benefit at this scale.

---

## Appendix: Quick Reference Commands

```bash
# Deploy (manual)
ssh user@vps "cd /srv/aiworkspace && ./scripts/deploy.sh"

# Rollback (immediate)
ssh user@vps "cd /srv/aiworkspace && ./scripts/rollback.sh"

# Take snapshot
ssh user@vps "cd /srv/aiworkspace && ./scripts/snapshot.sh manual-$(date +%Y%m%d)"

# View logs
ssh user@vps "docker compose -f /srv/aiworkspace/docker-compose.yml logs -f --tail=100 backend"

# Database shell
ssh user@vps "docker compose -f /srv/aiworkspace/docker-compose.yml exec db psql -U aiworkspace_user aiworkspace"

# Django shell
ssh user@vps "docker compose -f /srv/aiworkspace/docker-compose.yml exec backend python manage.py shell"

# Run migrations
ssh user@vps "docker compose -f /srv/aiworkspace/docker-compose.yml exec backend python manage.py migrate"

# Emergency: stop everything
ssh user@vps "cd /srv/aiworkspace && docker compose down"

# Emergency: restore from backup
ssh user@vps "cd /srv/aiworkspace && ./scripts/restore_backup.sh /backups/db/aiworkspace_TIMESTAMP.sql.gz"
```

---

*Document version: 1.0 — Pre-implementation review*  
*Next review: After Sprint 1 completion*  
*Owner: Principal Architect*
