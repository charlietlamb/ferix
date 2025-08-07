# Ferix Monorepo

A Turbo monorepo using Bun, Convex (backend), and Next.js (frontend).

## Quick start

1. Set up your environment file(s) as below.
2. Install dependencies at the repo root:
   
   ```bash
   bun i
   ```
3. Run the Convex backend:
   
   ```bash
   cd packages/backend
   bun dev
   ```
   - If you previously authenticated Convex with another account or project and see errors, logout locally and retry:
     
     ```bash
     npx convex logout
     ```
4. Run the Next.js app:
   
   ```bash
   cd apps/web
   bun dev
   ```
5. Open the app at `http://localhost:3003`.

> Tip: You can also try running everything via Turborepo from the root with `bun dev`, but local development is usually clearer by running backend and frontend separately as shown above.

## Prerequisites

- Bun `>= 1.1.29`
- Node.js `>= 18`
- Git

## Environment setup

Create a `.env` file at the repo root with the following variables. Then sync it to subprojects using the provided script.

```bash
# Client
NEXT_PUBLIC_BASE_URL=http://localhost:3003
# Convex URLs (use the ones printed by `bun dev` in packages/backend or your Convex dashboard)
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=

# Server
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
RESEND_API_KEY=
OPENAI_API_KEY=
OPENROUTER_API_KEY=

# Optional
LOG_LEVEL=info
```

Sync the root `.env` into each app:

```bash
./scripts/sync-env.sh
```

This copies to:
- `packages/api/.env`
- `apps/web/.env`
- `packages/backend/.env.local`

## Project structure

- `apps/web`: Next.js web app
- `packages/backend`: Convex backend
- `packages/*`: Shared packages (env, api, ui, etc.)

## Common issues

- Convex auth/session issues locally: run `npx convex logout` and start the backend again.
- Environment variables out of sync: re-run `./scripts/sync-env.sh` after updating the root `.env`.

## Scripts (selected)

- Root
  - `bun i`: install dependencies
  - `bun dev`: run `turbo run dev` across workspaces
- Backend (`packages/backend`)
  - `bun dev`: start Convex (`convex dev`)
  - `bun run push`: one-off Convex dev boot (`npx convex dev --once`)
- Web (`apps/web`)
  - `bun dev`: start Next.js on port 3003

