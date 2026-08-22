# Plan: V2.0 AI-Generated Product Descriptions

## Goal
Automatically generate product descriptions from uploaded images when a seller is creating or editing a listing, reducing listing effort and improving catalog quality.

## Current State
- Product listing creates images via `app/api/upload/route.ts` (Cloudinary)
- `app/(marketplace)/products/sell/page.tsx` has a description textarea
- Recommendations engine (V2.0) already calls an API route and uses Cloudinary URLs
- No OpenAI/LLM integration exists yet

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Provider | OpenAI GPT-4o-mini (vision) | Cost-effective, good image understanding |
| Trigger | Manual "Generate Description" button | Gives user control, fallback if API fails |
| Flow | Upload images → click generate → AI analyzes → textarea populated (editable) | Non-destructive, user can edit |
| Images | Use existing Cloudinary URLs | No new storage needed |
| Pricing | `OPENAI_API_KEY` env var, graceful degradation | Fail-safe: description field remains editable manually |

## Implementation Tasks

### Phase 1: Infrastructure
1. Install `openai` npm package
2. Add `OPENAI_API_KEY` to `.env.local` and `.env.example`
3. Create `lib/openai.ts` — OpenAI client wrapper with error handling

### Phase 2: API Endpoint
4. Create `app/api/ai/generate-description/route.ts`:
   - POST, authenticated
   - Body: `{ imageUrls: string[] }` (max 5, must be Cloudinary URLs from same upload)
   - Calls OpenAI GPT-4o-mini with image URLs
   - Returns `{ description: string }`
   - Error handling: 502 on OpenAI failure, 400 on invalid input

### Phase 3: Frontend Integration
5. Update `app/(marketplace)/products/sell/page.tsx`:
   - Add "Generate Description" button below the description textarea
   - Button disabled until at least one image is uploaded
   - Shows loading state while AI generates
   - On success, populates the description field (user can edit before submitting)
   - On failure, shows toast error, description remains editable

6. Update `app/dashboard/listings/[id]/edit/page.tsx` (if exists):
   - Same integration for editing existing listings

### Phase 4: Testing
7. Add Phase 9n to `scripts/e2e-test.ts` (3 assertions):
   - AI description API exists and accepts image URLs
   - Generated description is non-empty and reasonable length
   - API rejects invalid/missing image URLs

8. Add `testAiDescriptionSecurity` to `scripts/security-test.ts` (3 assertions):
   - AI description API requires authentication
   - AI description API validates image URL array
   - AI description API does not persist descriptions (read-only generation)

9. Add cleanup (none needed — no new DB tables)

### Phase 5: Configuration
10. Update `lib/env.ts` with `OPENAI_API_KEY`
11. Update `.env.example` with `OPENAI_API_KEY`
12. Update `docs/buildplan.md` and `docs/progress.md`

## Constraints & Principles
- UUID PKs on any new tables (none needed here)
- All API routes require server-side session
- ON DELETE RESTRICT for any new relations
- Forward-only migrations (none needed)
- Graceful degradation: manual description entry always works
- Never send secrets to client
