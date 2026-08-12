# smbl journal

A private, end-to-end encrypted journal and its open source and **free to use forever**.

The complete text-based journal is free, no limits. Paid plans (if they come) will cover extras like attachments and rich media

## Stack

- **Web:** SvelteKit + TailwindCSS v4
- **API:** Rust + Axum
- **DB:** Turso Cloud (libsql)
- **Auth:** WorkOS (email/password)
- **Encryption:** client-side, mandatory (envelope: Argon2id passphrase key → AES-256-GCM)


## Repo layout

```
apps/web/          SvelteKit app
apps/api/          Rust Axum API
```

## Architecture

Auth uses a **BFF (backend-for-frontend)** pattern. The SvelteKit server is the single place that owns the `httpOnly` session cookie and runs route guards; the Rust API never
sets cookies and only accepts a verified WorkOS session JWT (via `Authorization: Bearer`).

```
Browser ──cookie──► SvelteKit (BFF) ──Bearer JWT──► Rust API ──► Turso
```

The client only ever talks to its own origin (the BFF). Authenticated/private calls are proxied server-to-server to the API, so no browser CORS and no session token exposure in JS.

## Development

```bash
pnpm install
pnpm dev:web    # SvelteKit on :5173
pnpm dev:api    # API on :8080
```

Copy `.env.example` → `.env` in both `apps/api/` and `apps/web/` and fill in.

The API needs a Turso database (`DATABASE_URL`, `TURSO_AUTH_TOKEN`). The web app needs
`API_URL` (server-side), `WORKOS_CLIENT_ID`, `WORKOS_REDIRECT_URI`, and `SECURE_COOKIES=false`
for local dev. In the WorkOS dashboard, set the Redirect URI to
`http://localhost:5173/auth/callback` to match `WORKOS_REDIRECT_URI`.

## WorkOS dashboard setup

Both environments (staging for dev, production for deploy) need these in
**Applications → your app → Redirects**:

| Setting | Local dev (staging) | Production |
|---|---|---|
| Redirect URIs | `http://localhost:5173/auth/callback` | `https://journal.smbl.dev/auth/callback` |
| Initiate login URI | `http://localhost:5173/auth/login` | `https://journal.smbl.dev/auth/login` |
| Sign-out URIs | `http://localhost:5173/login` | `https://journal.smbl.dev/login` |
| App homepage URL | `http://localhost:5173/` | `https://journal.smbl.dev/` |
| Sign-up URL | **leave empty** | **leave empty** |

> The **Sign-up URL must stay empty**. If set, AuthKit bounces every signup attempt to it
> without a code (the flow breaks). `screen_hint=sign-up` + `max_age=0` in `/auth/login`
> handle direct signup correctly.

To host the login/signup pages on your own domain (instead of the random
`*.authkit.app` staging domain), configure a **custom AuthKit domain** — production
environment only: WorkOS dashboard → **Domains** → **Configure AuthKit domain** →
`auth.smbl.dev`, then add the CNAME (on Cloudflare: **DNS-only, not proxied**).

## Production checklist (Phase 6)

- **Web env** (`apps/web/.env`): `API_URL=https://api.smbl.dev`,
  `PUBLIC_API_URL=https://api.smbl.dev`, `WEB_ORIGIN=https://journal.smbl.dev`,
  `WORKOS_CLIENT_ID=<prod client>`, `WORKOS_REDIRECT_URI=https://journal.smbl.dev/auth/callback`,
  `SECURE_COOKIES=true`.
- **API env** (`apps/api/.env`): `CORS_ORIGINS=https://journal.smbl.dev`, production
  `WORKOS_CLIENT_ID`/`WORKOS_CLIENT_SECRET`, Turso production DB.
- **WorkOS dashboard**: values from the table above + custom AuthKit domain (`auth.smbl.dev`).
- **DNS**: `journal.smbl.dev` → Cloudflare Worker (already in `wrangler.jsonc`);
  `api.smbl.dev` → Hetzner VPS (Caddy TLS); `auth.smbl.dev` → CNAME to WorkOS (DNS-only).
- **HTTPS everywhere** — WorkOS rejects `http` redirect URIs in production.

## Status

**Done:**
- Phases 0–2: workspace, landing + waitlist, full WorkOS auth via the BFF (signup / login /
  email-confirmation / password-reset hosted by WorkOS; logout also ends the WorkOS session).
- Phase 3 core: client-side vault setup — first login redirects to `/setup` (passphrase creation,
  entropy meter, E2EE explainer), the wrapped vault key is persisted via the BFF, and
  `/home` is a guarded blank page. Returning users skip setup (`/setup` ↔ `/home` routing by
  `vault_setup`).

**Not yet built:** entries (Phase 4), archive/settings (Phase 5), deployment (Phase 6).


## LICENSE
MIT
