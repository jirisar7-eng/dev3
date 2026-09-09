-- Reconcile Study evidence metadata missing from the migration chain.
-- Idempotent for environments where the columns already exist.

ALTER TABLE "Study"
ADD COLUMN IF NOT EXISTS "causality" TEXT DEFAULT 'NOT_ESTABLISHED',
ADD COLUMN IF NOT EXISTS "evidenceDirection" TEXT DEFAULT 'SUPPORTIVE',
ADD COLUMN IF NOT EXISTS "evidenceLevel" TEXT DEFAULT 'B',
ADD COLUMN IF NOT EXISTS "sourceType" TEXT DEFAULT 'PEER_REVIEWED_EMPIRICAL';
