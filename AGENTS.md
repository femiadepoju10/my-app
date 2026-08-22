## Prompt Logging

```yaml
prompt_logging:
  enabled: true
```

When disabled, skip all prompt-logging behaviour (no `.agent/prompts/` logging).


## Project Docs System

Everything you do in this project must be strictly done in line with the what is discribed in the prd.md and buildplan.md files in the docs folder, allow the users to build step by step


Maintain the following files in `docs/`:

- `docs/prd.md` — the product requirements document. Update it when product decisions change.
- `docs/buildplan.md` — the step-by-step build plan. Each build step is broken down with objectives, tasks, files, acceptance criteria, and decisions. Keep it in sync with what the project actually does.
- `docs/progress.md` — the tracking file. After every meaningful session, update step statuses (pending / in progress / done), the current phase marker, and append a short session log entry.

All project documentation must follow the database principles in the global rule: UUID primary keys on every application-owned table, restrictive foreign keys (no cascades), forward-only migrations, and explicit cleanup through application code.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build (includes `tsc` type-checking) |
| `npx tsc --noEmit` | Run TypeScript type-checking only |
| `npx tsx scripts/e2e-test.ts` | Run the end-to-end test suite (63 assertions covering the full transaction lifecycle incl. reviews, wishlist, chat, seller profiles, push subscriptions, SMS notifications, product recommendations, seller analytics, delivery tracking, and seller verification) |
| `npx tsx scripts/security-test.ts` | Run the security test suite (91 assertions covering auth, isolation, race conditions, state machine, admin auth, payment security, payout security, review security, wishlist security, chat security, push security, SMS security, recommendations security, seller analytics security, delivery tracking security, and seller verification security) |