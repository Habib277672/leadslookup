# LeadsLookup

A lead-discovery tool for freelancers: find real local businesses by category and location, then save and track them.

**Status:** early development (Phase 0, foundation). The product features are not built yet.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui (Radix), pnpm, Vitest, Docker.

## Requirements

- Node.js 24
- pnpm 12 (the version is pinned in `package.json`)
- Docker Desktop (optional, for the container)

## Getting started

```bash
pnpm install
pnpm dev
```

Open on Local Machine : http://localhost:3000.

## Scripts

| Command          | What it does                                         |
| ---------------- | ---------------------------------------------------- |
| `pnpm dev`       | Start the development server                         |
| `pnpm build`     | Create a production build                            |
| `pnpm lint`      | Run ESLint                                           |
| `pnpm typecheck` | Generate route types and run the TypeScript compiler |
| `pnpm test`      | Run the unit tests once                              |

## Docker

```bash
docker compose up --build
```

The app is served at http://localhost:3000 and is only reachable from your own machine.

## Continuous integration

GitHub Actions runs lint, typecheck, tests and a production build on every push to `main` and on pull requests.
