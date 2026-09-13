# 01 — Standardize on pnpm

Status: resolved
Type: task

## Goal
Remove the mixed-lockfile ambiguity so both projects use pnpm consistently.

## Changes (core repo)
- Delete `package-lock.json` (keep `pnpm-lock.yaml`).
- Add `"packageManager": "pnpm@<version>"` to `package.json`.
- Leave the untracked `pnpm-workspace.yaml` as-is — it only carries pnpm v10 `allowBuilds` approvals; it is NOT monorepo scaffolding and needs no `packages:` glob.

## Acceptance criteria
- `pnpm install` runs clean from `pnpm-lock.yaml`; no `package-lock.json` remains.
- CI (lint/test) still passes.

## Notes
Independent prep; no dependency on other tickets.

## Comments

**2026-09-01 — implemented.** Removed `package-lock.json` (untracked from git too) and pinned `packageManager: pnpm@11.20.0`. Also **tracked `pnpm-workspace.yaml`** rather than leaving it untracked: with the npm lockfile gone, Vercel builds exclusively from `pnpm-lock.yaml`, and pnpm 10+ skips dependency build scripts unless the `allowBuilds` approvals in that file are present — `sharp`, `@prisma/engines` and `esbuild` all need them. Leaving it out of the repo would have broken the deploy.
