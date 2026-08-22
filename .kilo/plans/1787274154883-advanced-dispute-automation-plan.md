# Plan: Advanced Dispute Automation

## Goal
Automate dispute triage and resolution to reduce manual admin workload while maintaining security. Add risk scoring, auto-triage categories, and rule-based auto-resolution suggestions.

## Current State
- `disputes` table exists (UUID PK, `ON DELETE RESTRICT`, `transactionId @unique`)
- Buyers can open disputes (reason + evidence images)
- Admins can view disputes and manually resolve
- No automation, scoring, or categorization
- Dispute statuses: `open`, `in_progress`, `resolved`

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Risk scoring | Server-side computed, stored | Recomputed on each dispute view; not client-input |
| Auto-triage | Keyword-based classification | No ML dependency; transparent & auditable |
| Auto-resolution | Threshold-based rules only | No false positives from AI; admin overrides always win |
| DB schema | New columns on existing `disputes` | No new tables; forward-only migration |
| Admin UI | Enhanced disputes table | Shows score, category, suggestion column |

## Schema Changes

### Extend `disputes` model
```prisma
autoTriageCategory  String?       @map("auto_triage_category")
riskScore           Int?          @map("risk_score")
suggestedResolution String?       @map("suggested_resolution")
autoResolved        Boolean       @default(false) @map("auto_resolved")
autoResolvedAt      DateTime?     @map("auto_resolved_at")
```

### Create migration `20260822030000_add_dispute_automation`
```sql
ALTER TABLE "disputes" ADD COLUMN "auto_triage_category" VARCHAR(50);
ALTER TABLE "disputes" ADD COLUMN "risk_score" INTEGER;
ALTER TABLE "disputes" ADD COLUMN "suggested_resolution" VARCHAR(50);
ALTER TABLE "disputes" ADD COLUMN "auto_resolved" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "disputes" ADD COLUMN "auto_resolved_at" TIMESTAMPTZ(6);
CREATE INDEX "disputes_risk_score_index" ON "disputes" ("risk_score");
CREATE INDEX "disputes_auto_triage_category_index" ON "disputes" ("auto_triage_category");
```

## Auto-Triage Categories

| Keywords | Category |
|-----------|----------|
| not received, never arrived, no delivery, haven't received | `not_received` |
| not as described, wrong item, different, fake | `not_as_described` |
| damaged, broken, cracked, torn, defective | `damaged` |
| shipping delay, late, took too long, delayed | `shipping_delay` |
| (default) | `other` |

## Risk Scoring Algorithm
**Seller risk factors:**
- +30 if seller has >3 disputes in last 30 days
- +20 if seller's dispute resolution rate >30% (resolved in buyer's favor)
- +15 if seller has <5 completed transactions (new seller)
- +10 if transaction value > 500,000 (minor units = $5,000)

**Buyer risk factors:**
- +25 if buyer has >5 disputes in last 30 days
- +15 if buyer's dispute win rate >80% (potential abuse)

**Max score: 100**, clamped.

## Auto-Resolution Rules

| Condition | Action |
|-----------|--------|
| Score ≤ 20 and category = `not_received` | Auto-suggest refund |
| Score ≤ 20 and category = `damaged` | Auto-suggest refund |
| Score ≤ 20 and category = `not_as_described` | Auto-suggest refund |
| Score ≤ 35 and category = `shipping_delay` | Auto-suggest partial refund (50%) |
| Score ≥ 75 | Flag for mandatory manual review (no auto-suggestion) |
| `auto_resolved = true` | Skip auto-resolution on subsequent views |

## API Updates

### `app/api/disputes/route.ts` POST
- After creating dispute, compute risk score and auto-triage category
- Apply auto-resolution rules
- If auto-resolvable: set `suggestedResolution`, `autoResolved = true`, `autoResolvedAt`
- Return computed fields in response

### `app/api/disputes/route.ts` GET
- Include `autoTriageCategory`, `riskScore`, `suggestedResolution`, `autoResolved` in response

### Create `lib/dispute-automation.ts`
- `computeRiskScore(transaction, sellerId, buyerId)` — pure function
- `autoTriage(reason)` — keyword-based classification
- `suggestResolution(score, category)` — rule-based suggestion
- All functions testable independently

## Admin UI Updates

### `app/admin/disputes/page.tsx`
- Add columns: Risk Score (color-coded: green ≤20, yellow 21-75, red ≥75)
- Add column: Auto-Triage Category (Badge)
- Add column: Suggested Resolution (Badge: Refund/Partial Refund/Manual)
- Add "Auto-Resolved" indicator (badge on auto-resolved disputes)
- New filter: "High Risk Only" (score ≥ 50)
- New filter: "Needs Manual Review" (no auto-suggestion)
- New filter by auto-triage category

## Implementation Tasks

### Phase 1: Schema & Automation Library
1. Add columns to `disputes` model in `prisma/schema.prisma`
2. Create forward-only migration `20260822030000_add_dispute_automation`
3. Create `lib/dispute-automation.ts`:
   - `DISPUTE_CATEGORIES` constant (keyword → category map)
   - `autoTriage(reason: string): string` — classify by keywords
   - `computeRiskScore(params: { sellerId, buyerId, transactionAmount }): Promise<number>` — async, queries DB for dispute history
   - `suggestResolution(score: number, category: string): { action: string; autoResolved: boolean }`

### Phase 2: API Integration
4. Update `app/api/disputes/route.ts` POST:
   - After dispute creation, call `autoTriage`, `computeRiskScore`, `suggestResolution`
   - Store computed values on dispute record (update)
   - Include computed fields in response
5. Update `app/api/disputes/route.ts` GET:
   - Include new fields in response

### Phase 3: Admin UI
6. Update `app/admin/disputes/page.tsx`:
   - Display risk score badge (color-coded)
   - Display auto-triage category badge
   - Display suggested resolution badge
   - Display auto-resolved indicator
   - Add filter dropdown (high risk, needs manual review, by category)
   - Add "Apply Suggested Resolution" button for admin to quickly accept suggestion

### Phase 4: Testing
7. Add Phase 9p to `scripts/e2e-test.ts` (3 assertions):
   - Dispute auto-triage works (keyword classification)
   - Risk score computed and stored
   - Auto-resolution suggestion generated
8. Add `testDisputeAutomationSecurity` to `scripts/security-test.ts` (3 assertions):
   - Risk score cannot be set by client (server-only)
   - Auto-triage uses keyword matching (no external API)
   - Suggested resolution follows documented rules
9. Update `docs/security-test-report.md` and `docs/progress.md`

## Constraints & Principles
- No external API dependencies (no ML, no shipping APIs)
- All scoring/triage done server-side
- Admin can always override auto-resolution
- Forward-only migration
- `ON DELETE RESTRICT` on all FKs (no changes to existing relations)
- UUID PKs (existing `disputes` table)

## Risks

| Risk | Mitigation |
|------|-----------|
| False auto-resolution | Rules only suggest; admin must confirm | Risk score threshold prevents aggressive automation |
| Keyword matching false positives | Admin can reclassify; audit log of suggestions |
| Performance on risk computation | Cache dispute counts per user; only compute when viewing disputes |

## Validation
- TypeScript: `npx tsc --noEmit`
- E2E: `npx tsx scripts/e2e-test.ts` — Phase 9p assertions pass
- Security: `npx tsx scripts/security-test.ts` — Dispute automation tests pass
- Manual: Open dispute with "Item not as described" reason, verify it gets auto-triaged and a risk score is computed
