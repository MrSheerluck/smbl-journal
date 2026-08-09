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

## Development

```bash
pnpm install
pnpm dev:web    # SvelteKit on :5173
pnpm dev:api    # API on :8080
```

The API needs a Turso database. Copy `apps/api/.env.example` to `apps/api/.env` and fill in:

```
DATABASE_URL=libsql://<db>-<user>.turso.io
TURSO_AUTH_TOKEN=<token>
```

## Status

Phase 1 done: landing page with waitlist capture, wired to the API and Turso. Next: phase 2 (WorkOS auth).


## LICENSE
MIT
