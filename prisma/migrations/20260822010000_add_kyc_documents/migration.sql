-- Add KYC documents table and types

CREATE TYPE "KycDocumentType" AS ENUM ('passport', 'driver_license', 'national_id');

CREATE TYPE "KycStatus" AS ENUM ('pending', 'verified', 'rejected');

CREATE TABLE "kyc_documents" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL UNIQUE,
    "document_type" "KycDocumentType" NOT NULL,
    "document_number" VARCHAR(255),
    "document_image_url" TEXT NOT NULL,
    "selfie_image_url" TEXT,
    "status" "KycStatus" DEFAULT 'pending' NOT NULL,
    "admin_note" VARCHAR(500),
    "submitted_at" TIMESTAMPTZ(6) DEFAULT now(),
    "reviewed_at" TIMESTAMPTZ(6),
    "reviewer_id" UUID,
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT,
    FOREIGN KEY ("reviewer_id") REFERENCES "users" ("id") ON DELETE RESTRICT
);

CREATE INDEX "kyc_documents_status_index" ON "kyc_documents" ("status");
CREATE INDEX "kyc_documents_reviewer_id_index" ON "kyc_documents" ("reviewer_id");
