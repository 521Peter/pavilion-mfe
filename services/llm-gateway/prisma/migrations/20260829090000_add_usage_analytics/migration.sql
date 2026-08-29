ALTER TABLE "runs" ADD COLUMN "usage_snapshot" JSONB;
ALTER TABLE "usage_records" ADD COLUMN "idempotency_key" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT "run_id" FROM "usage_records"
    WHERE "run_id" IS NOT NULL
    GROUP BY "run_id" HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'duplicate usage_records.run_id prevents idempotency migration';
  END IF;
END $$;

UPDATE "usage_records"
SET "idempotency_key" = 'run:' || "run_id"
WHERE "run_id" IS NOT NULL;

CREATE UNIQUE INDEX "usage_records_idempotency_key_key"
ON "usage_records"("idempotency_key");
CREATE INDEX "runs_status_created_at_idx"
ON "runs"("status", "created_at");
CREATE INDEX "usage_records_deployment_id_created_at_idx"
ON "usage_records"("deployment_id", "created_at");
