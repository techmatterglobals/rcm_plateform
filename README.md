# RCM AI Platform

An internal, company-managed AI workspace for medical billing and revenue cycle
management (RCM) operations — replacing ad-hoc personal ChatGPT/Claude/Gemini
usage with a single secure, auditable platform purpose-built for RCM work.

Not a general chatbot: every module — Medical Coding, Medical Billing,
Eligibility & VOB, Prior Authorization, Denial Management, Appeal Generator,
Medical Record Review, Document Analyzer — is a specialized AI assistant backed
by a shared chat engine, retrieval-augmented generation over your company's
knowledge base, and compliance controls (PHI detection/masking, audit logging,
retention policies, RBAC).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Radix UI primitives (shadcn-style), TanStack Query, React Hook Form + Zod |
| Backend | FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2 |
| Database | PostgreSQL 16 + pgvector |
| Cache / queue | Redis, Celery (worker + beat) |
| Storage | S3-compatible object storage (MinIO locally, S3/R2/etc. in production) |
| AI | Anthropic Claude, OpenAI GPT, Google Gemini — behind one provider-agnostic interface |
| Auth | JWT, Google Workspace SSO, Microsoft Entra ID SSO, RBAC |

## Architecture

```
tmchat/
├── backend/                    FastAPI application
│   ├── app/
│   │   ├── api/v1/endpoints/   REST endpoints, one module per feature
│   │   ├── core/               config, security (JWT/encryption), middleware, RBAC deps
│   │   ├── db/                 SQLAlchemy session/base, seed script
│   │   ├── models/             ORM models (one file per domain)
│   │   ├── schemas/            Pydantic request/response schemas
│   │   ├── repositories/       thin data-access layer over SQLAlchemy
│   │   ├── services/
│   │   │   ├── ai/             provider-agnostic AI abstraction (Claude/GPT/Gemini/Auto)
│   │   │   ├── rag/            chunking, embeddings, pgvector retrieval
│   │   │   ├── phi/            PHI detection, masking, block-on-detection policy
│   │   │   ├── documents/      file extraction (pdf/docx/xlsx), virus-scan hook
│   │   │   └── analytics/      usage aggregation queries
│   │   ├── tasks/               Celery tasks (document/KB ingestion, retention sweep)
│   │   └── main.py              FastAPI app, middleware, exception handlers
│   ├── alembic/                 database migrations
│   └── requirements.txt
├── frontend/                    Next.js application
│   ├── app/                     App Router pages (route groups: (auth), (app))
│   ├── components/              ui/ primitives, chat/, layout/, admin/, kb/, prompts/, analytics/, documents/
│   ├── hooks/                   TanStack Query hooks, one file per domain
│   └── lib/                     API client, types, auth context, utils
├── docker-compose.yml
└── .env.example
```

### Design decisions worth knowing

- **One chat engine, many assistants.** Medical Coding, Billing, Eligibility, Prior
  Auth, Denials, Appeals, and Record Review are not separate codepaths — they are
  rows in the `assistants` table (system prompt, capabilities, suggested prompts,
  whether they use the knowledge base) rendered through one shared React chat
  component and one backend `/chat` endpoint. Add a new specialty by inserting a
  row, not writing new UI or API code.
- **RAG is provider-agnostic but not provider-optional.** Chat completion can run
  on Claude, GPT, or Gemini (or "Auto", which picks per task type), but embeddings
  always come from one canonical provider (OpenAI, falling back to Gemini) so
  vectors stay comparable in `pgvector`.
- **PHI compliance is enforced server-side.** Every inbound chat message is
  scanned for PHI patterns before it reaches an AI provider; if PHI is detected
  and the (admin-configurable) blocking policy is on, the message is never sent
  upstream — it's persisted as blocked and audited instead.
- **Document Analyzer vs. inline chat vision.** Text-based documents (PDF, Word,
  Excel) are parsed and chunked server-side; images are intentionally not OCR'd —
  they're designed to be handled by a vision-capable model in a future iteration
  rather than a brittle OCR pass.

## Quick start (Docker Compose)

1. `cp .env.example .env` and fill in at minimum `JWT_SECRET_KEY`, `ENCRYPTION_KEY`,
   and one AI provider key (e.g. `ANTHROPIC_API_KEY`). Generate the two secrets with:
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(64))"          # JWT_SECRET_KEY
   python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"  # ENCRYPTION_KEY
   ```
2. `docker compose up --build`
   - Postgres (with pgvector), Redis, and MinIO start first.
   - The `backend` service runs `alembic upgrade head` then seeds roles, an admin
     user, the 9 assistants, and default settings — then starts the API.
   - `celery-worker` and `celery-beat` handle document/KB ingestion and the daily
     retention sweep.
   - The frontend builds and starts on port 3000.
3. Open http://localhost:3000 and sign in with the seeded admin account printed
   in the `backend` container logs (defaults to `admin@techmatter.co` /
   `change-me-immediately` unless you set `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`
   in `.env` — change this password immediately in a real deployment).
4. API docs: http://localhost:8000/api/docs (OpenAPI/Swagger).

## Running without Docker

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Postgres with the pgvector extension must be running and reachable at
# DATABASE_URL; Redis must be running for chat rate limiting/Celery.
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload
```

In a second terminal, run the background worker (needed for document/knowledge
base processing):

```bash
celery -A app.tasks.celery_app worker --loglevel=info
celery -A app.tasks.celery_app beat --loglevel=info   # retention sweep, optional locally
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment variables

See [`.env.example`](.env.example) for the full list with descriptions. Nothing
has an insecure built-in default for secrets (`JWT_SECRET_KEY`, `ENCRYPTION_KEY`)
— the app refuses to start without them.

## Deploying to production

- Build both images (`docker build ./backend`, `docker build ./frontend
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1`) and run them
  behind your platform of choice (ECS, Cloud Run, Kubernetes, etc.) alongside a
  managed Postgres with the `pgvector` extension enabled, managed Redis, and S3
  (point `S3_ENDPOINT_URL` at your real bucket region, or remove it to use AWS's
  default endpoint resolution).
- Put the frontend and backend behind TLS; set `APP_ENV=production` so the
  backend adds `Strict-Transport-Security` and marks cookies `Secure`.
- Configure Google Workspace / Microsoft Entra ID OAuth client credentials and
  set the corresponding redirect URIs to your production frontend domain.
- Run `alembic upgrade head` as a release step, then `python -m app.db.seed`
  once (it's idempotent — safe to run again, but only needed the first time).

## Compliance features implemented

PHI detection & masking, configurable block-on-PHI policy, RBAC (Admin /
Supervisor / Employee with fine-grained permissions), audit logging on every
sensitive action, encryption at rest for provider API keys, encrypted-at-rest
object storage (server-side encryption on upload), configurable conversation
retention with an automatic daily sweep, session timeout policy, and a pluggable
virus-scan hook on every upload (no-op by default; swap in a ClamAV sidecar via
`app/services/documents/virus_scan.py`).
