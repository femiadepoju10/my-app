-- Add dispute automation fields

ALTER TABLE "disputes" ADD COLUMN "auto_triage_category" VARCHAR(50);
ALTER TABLE "disputes" ADD COLUMN "risk_score" INTEGER;
ALTER TABLE "disputes" ADD COLUMN "suggested_resolution" VARCHAR(50);
ALTER TABLE "disputes" ADD COLUMN "auto_resolved" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "disputes" ADD COLUMN "auto_resolved_at" TIMESTAMPTZ(6);

CREATE INDEX "disputes_risk_score_index" ON "disputes" ("risk_score");
CREATE INDEX "disputes_auto_triage_category_index" ON "disputes" ("auto_triage_category");
