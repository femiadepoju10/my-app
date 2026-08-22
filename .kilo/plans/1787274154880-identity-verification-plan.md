# Plan: V2.0 Identity Verification (KYC) — ✅ COMPLETED

## Goal
Add government ID verification for users, extending the existing `sellerVerificationStatus` system into a full KYC workflow with document upload, admin review, and verification-gated feature limits.

## Status: COMPLETE
- TypeScript: PASS
- Build: PASS (55 pages)
- E2E: 71/71 PASS (+4 KYC assertions)
- Security: 104/104 PASS (+7 KYC security assertions)

## Current State
- `users.sellerVerificationStatus` auto-set to "pending" on first product listing
- Admin can set to "verified"/"rejected" + `verifiedAt` + `verificationNote` via `app/api/admin/users/route.ts` PATCH
- `app/api/upload/route.ts` handles Cloudinary uploads (auth + rate-limit + type/size validation)
- No document storage or user self-service submission exists yet

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Schema | New `kyc_documents` table | Audit trail, multi-doc support, ON DELETE RESTRICT |
| KYC states | Extend existing field | Reuse `sellerVerificationStatus` — no new column needed |
| Document types | passport, driver_license, national_id | Covers key Nigerian + international IDs |
| Feature gating | Apply on product creation + payouts | Natural choke points already have checks |
| Image storage | Cloudinary `skillbridge/kyc` folder | Existing upload infra, auth-gated delivery |

## Schema Changes

### New Model: `kyc_documents`
```prisma
model kyc_documents {
  id            String       @id @default(uuid())
  userId        String       @unique @map("user_id")
  documentType  KycDocumentType @map("document_type")
  documentNumber String?      @map("document_number")
  documentImageUrl String    @map("document_image_url")
  selfieImageUrl String?     @map("selfie_image_url")
  status        KycStatus    @default(pending)
  adminNote     String?      @db.VarChar(500) @map("admin_note")
  submittedAt   DateTime     @default(now()) @map("submitted_at") @db.Timestamptz(6)
  reviewedAt    DateTime?    @map("reviewed_at") @db.Timestamptz(6)
  reviewerId    String?      @map("reviewer_id")

  user       users? @relation(fields: [userId], references: [id], onDelete: Restrict)
  reviewer   users? @relation("KycReviewer", fields: [reviewerId], references: [id], onDelete: Restrict)

  @@index([status])
  @@map("kyc_documents")
}

enum KycDocumentType {
  passport
  driver_license
  national_id
}

enum KycStatus {
  pending
  verified
  rejected
}
```

### Extend `users` model
```prisma
kycDocument kyc_documents?  // relation
```

## Implementation Tasks

### Phase 1: Schema & Migration
1. Add `kyc_documents` model + enums to `prisma/schema.prisma`
2. Add `kycDocument` relation to `users` model
3. Create forward-only migration: `20260822010000_add_kyc_documents`
4. Run `prisma generate`

### Phase 2: User API — KYC Submission
5. Create `app/api/kyc/route.ts`:
   - **POST**: Authenticated user submits KYC (documentType, documentNumber, documentImageUrl, selfieImageUrl). Sets `sellerVerificationStatus` to "pending" on `users`. Creates `kyc_documents` record. Rejects if user already has a pending/verified KYC document.
   - **GET**: Authenticated user fetches their KYC status + document type + admin note
6. Update `app/api/user/profile/route.ts`:
   - Add `kycStatus`, `kycDocumentType` to GET response

### Phase 3: Admin API — KYC Review
7. Update `app/api/admin/users/route.ts` PATCH:
   - Add `kycStatus` field support ("pending" | "verified" | "rejected")
   - When `kycStatus` is set, update both `users.sellerVerificationStatus` and `kyc_documents.status`
   - Set `verifiedAt` when status becomes "verified"
   - Require admin role (existing check already in place)
   - Prevent self-modification (existing check already in place)
8. Update `app/api/admin/users/route.ts` GET:
   - Include `kycStatus`, `kycDocumentType`, `kycSubmittedAt` in user response
   - Add optional `?kycPending=true` filter

### Phase 4: Upload Integration
9. Update `app/api/upload/route.ts`:
   - Add `folder` field to allow `skillbridge/kyc` for KYC uploads
   - Validate that KYC uploads are authenticated (already enforced)
   - Add `kyc` to allowed folder names

### Phase 5: User UI — KYC Submission
10. Create `app/dashboard/kyc/page.tsx` — server-rendered page:
    - If no KYC: show submission form (document type selector, document number input, Cloudinary upload widget for ID doc + selfie)
    - If pending: show "Under Review" status with submitted details
    - If verified: show "Verified" badge with review date
    - If rejected: show rejection reason + "Resubmit" button
11. Add "KYC Verification" link to `app/dashboard/layout.tsx` DASHBOARD_TABS
12. Add KYC status badge to `app/dashboard/profile/page.tsx`

### Phase 6: Admin UI — KYC Review
13. Update `app/admin/users/page.tsx`:
    - Add KYC status column (Verified/Pending/Rejected/Not Submitted)
    - Add "Review KYC" button opening modal with:
      - Document type, number, image preview (signed URL)
      - Selfie image preview (if provided)
      - Approve / Reject buttons
      - Admin note textarea
    - Add "Pending KYC Only" filter toggle

### Phase 7: Feature Gating
14. Update `app/api/products/route.ts` POST:
    - Before creating product, check user's `kyc_documents` record
    - If no KYC record OR KYC status is "rejected": return 403 "KYC verification required to list products"
    - If KYC status is "pending" or "verified": proceed (existing `sellerVerificationStatus` auto-set to "pending" on first listing remains)
    - Rationale: KYC = identity proof (government ID); `sellerVerificationStatus` = business/admin approval — both must clear for selling
    - Buyers are NOT gated (PRD: one account = buyer + seller, KYC only gates selling)

### Phase 8: Testing
15. Add Phase 9m to `scripts/e2e-test.ts` (4 assertions):
    - User can submit KYC → status becomes "pending"
    - Admin can approve KYC → status becomes "verified" 
    - Admin can reject KYC → status becomes "rejected", note set
    - Non-admin cannot modify own KYC status
16. Add `testKycSecurity` to `scripts/security-test.ts` (5 assertions):
    - KYC API requires authentication
    - KYC API prevents duplicate submissions
    - Admin KYC PATCH requires admin role
    - Admin KYC PATCH prevents self-modification
    - kyc_documents schema has UUID PK with ON DELETE RESTRICT
17. Add cleanup for `kyc_documents` in E2E test teardown (before users)

## Constraints & Principles
- UUID PKs on all new tables
- `ON DELETE RESTRICT` on all new FKs (no cascades)
- Forward-only migration (no edits to existing migrations)
- All API routes require server-side session check
- Admin-only operations enforce `session.user.role === "admin"`
- Document images served via Cloudinary signed URLs (auth-gated delivery)
