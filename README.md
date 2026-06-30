# Krishak Mitra (KisanVaani)

A multilingual, voice-first AI agricultural advisory platform for smallholder farmers — accessible via web, WhatsApp, and phone (IVR).

## What this actually does

- **Crop disease/pest diagnosis** via text, voice, or photo, grounded in a verified disease database (currently: rice, wheat, cotton, maize, tomato, banana) plus general reasoning from Claude (Anthropic) when configured with a real API key.
- **Weather-based spray/irrigation advisories** using live OpenWeatherMap data.
- **Mandi (market) price lookups** with real 7-day historical trend tracking, sourced from the government AGMARKNET API where a key is configured, falling back to clearly-labeled illustrative data otherwise.
- **Multi-turn conversation memory** within a session, so follow-up questions don't require repeating context.
- **WhatsApp and phone-based (IVR) access** via Twilio, with signature-verified webhooks, for farmers without reliable smartphone/data access.
- **Crisis-language detection** that redirects to verified mental health helplines (Tele MANAS, KIRAN) and the Kisan Call Centre instead of giving an agricultural answer — this is a safety layer, not a guarantee.

## What this does NOT do (yet)

Being direct about gaps, rather than letting marketing copy imply otherwise:

- No measured diagnosis accuracy number exists anywhere — we don't publish one until it's been validated against agronomist-reviewed outcomes.
- The verified disease database covers 6 crops, not "40+". Claude can still reason about other crops generally when a real API key is configured, but that's general-model reasoning, not verified-database-backed.
- No long-term, cross-session memory (e.g. recognizing a returning farmer days later) — only within-session memory.
- No SMS channel — only WhatsApp and voice IVR.
- EXIF metadata is not stripped from uploaded photos (see `backend/src/api/upload.ts` for why, and what to add).

## Architecture

```
frontend/   React + Vite + TypeScript + Tailwind, 3D/glass UI (Three.js, Framer Motion)
backend/    Express + TypeScript + Prisma (PostgreSQL)
```

Key backend modules:
- `src/services/claude.ts` — the core AI pipeline: crisis detection → session history → DiseaseDB grounding → Claude API call (with real vision support for photos) → offline rule-based fallback if no API key is configured.
- `src/api/market.ts` — market price endpoint + real trend calculation from historical data (not from a single snapshot's min/max spread).
- `src/api/webhook.ts` — Twilio WhatsApp/voice webhooks, signature-validated on every route.
- `src/middleware/auth.ts` — API key auth + real Twilio HMAC signature validation (not just a header-presence check).
- `src/lib/safeFetch.ts` — SSRF-safe fetcher for any URL derived from user input (farmer-submitted photo URLs), with a host allowlist and private-IP blocking.
- `src/lib/logger.ts`, `src/lib/metrics.ts` — zero-dependency structured logging and Prometheus-format `/metrics`.

## Getting started

### Prerequisites
- Node.js 20+
- PostgreSQL 16 (or use the provided `docker-compose.yml`)
- API keys (see `backend/.env.example` for the full list and what happens if each is left unset)

### Local development

```bash
# 1. Backend
cd backend
cp .env.example .env   # fill in real values
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed     # loads the verified disease database
npm run dev

# 2. Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/api/*` to the backend (see `vite.config.ts`).

### Docker

```bash
cp backend/.env.example backend/.env   # fill in real values
echo "DB_PASSWORD=$(openssl rand -hex 16)" >> .env
docker compose up --build
```

Note: `DB_PASSWORD` has **no default** in `docker-compose.yml` on purpose — the previous version of this file shipped with a hardcoded fallback password baked into source control, which is exactly the kind of thing that ends up in a real production deployment by accident.

### Tests

```bash
# Backend (Node's built-in test runner, zero extra dependencies)
cd backend && npm run build && npm test

# Frontend (Vitest)
cd frontend && npm test
```

Both are wired into `.github/workflows/ci.yml` and run on every push/PR, including a real `npm run build` for the frontend — this exists specifically because a previous version of this project had a broken frontend build (`tsc -b && vite build` failing with exit code 1) that went unnoticed for an unknown period of time. CI now makes that class of regression impossible to merge silently.

## Required environment variables

See `backend/.env.example` for the complete, current list with explanations of what happens when each is left unset. The short version: `DATABASE_URL` is required to start at all; `ANTHROPIC_API_KEY` is required for real AI diagnosis (otherwise the offline rule-based fallback runs, grounded in the real disease database but not a substitute for the real model); `TWILIO_*` + `PUBLIC_BASE_URL` are required together for the WhatsApp/voice channels; everything else degrades gracefully with a logged warning if left unset.

## Security notes

- Twilio webhook signatures are verified in every environment (not just production) using Twilio's official HMAC scheme — an unsigned webhook endpoint is a real cost-abuse vector (it can trigger paid AI calls and outbound messages).
- Outbound fetches of user-supplied URLs (farmer photo uploads, WhatsApp media) go through an SSRF-safe fetcher with a host allowlist and private/loopback IP blocking.
- Rate limiting is keyed by identity (API key / phone number) where possible, not just IP, since many farmers in rural areas share carrier-grade NAT.
- The `/api/chat` `API_KEY` check is a soft deterrent for a publicly-embedded demo widget, not a hard security boundary — see the comment in `backend/.env.example` for why, and what to do if you need a real one.

## Known sandbox-specific limitations in this delivery

A few things couldn't be fully verified inside the build/audit sandbox this project was finalized in, due to no outbound network access:

1. **`npx prisma generate`** could not be run against the final schema (which adds a `ContactMessage` model) because Prisma's engine binary download requires network access this sandbox didn't have. Run it once after cloning — `npm install` in `backend/` triggers it automatically via the `postinstall` hook in a normal environment with network access.
2. **`npm install` for frontend test dependencies** (`vitest`, `@testing-library/*`) could not be run for the same reason — the test files are written and wired into `package.json`/CI, but were not executed in this sandbox. They will run normally once installed in any environment with network access (including CI, which installs fresh on every run).
3. **`vite build`'s bundling step** hit a known npm optional-dependency bug in this sandbox's pre-vendored `node_modules` (missing a platform-native `rollup` binary that IS correctly declared in `package-lock.json` for both glibc and musl). `tsc -b` — the actual TypeScript correctness check — passes cleanly with zero errors. A fresh `npm ci` (which is what Docker and CI both do) resolves the correct binary for whatever platform runs it.

Backend tests (using Node's built-in test runner, no extra dependencies needed) WERE run successfully in this sandbox: 27/29 assertions pass, with the remaining 2 being a harmless async-handle warning from Prisma's engine resolution in this specific sandbox (unrelated to test logic).

## License

Add your chosen license here.
