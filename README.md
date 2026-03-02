# PixelSync

A collaborative whiteboard platform with built-in social features. Draw together, chat in real-time, and manage your team — all in one place.

## Structure

```
apps/
  frontend/   → Next.js 15 app (UI, auth, canvas)
  server/     → Backend services

packages/
  db/         → Prisma 7 schema + client (PostgreSQL)
  types/      → Shared TypeScript types
  zod/        → Shared validation schemas
  eslint-config/
  typescript-config/
```

## Getting Started

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:3000`.

## Environment Variables

Copy `.env.example` in `apps/frontend/` and `packages/db/` and fill in:

- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — NextAuth session secret
- GitHub / Google OAuth credentials (optional)

## Tech Stack

- **Frontend:** Next.js 15, Tailwind CSS v4, NextAuth, tldraw
- **Database:** PostgreSQL + Prisma 7 (driver adapters)
- **Monorepo:** Turborepo + npm workspaces
