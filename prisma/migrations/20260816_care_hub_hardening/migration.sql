-- Migration: 20260816_care_hub_hardening
-- Safe non-destructive update adding CaseEvent linkage to CarePlan and CareDay

-- Add columns to CaseEvent if they do not exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CaseEvent' AND column_name='sourceType') THEN
        ALTER TABLE "CaseEvent" ADD COLUMN "sourceType" TEXT DEFAULT 'MANUAL';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CaseEvent' AND column_name='carePlanId') THEN
        ALTER TABLE "CaseEvent" ADD COLUMN "carePlanId" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CaseEvent' AND column_name='careDayId') THEN
        ALTER TABLE "CaseEvent" ADD COLUMN "careDayId" TEXT;
    END IF;
END $$;

-- Create indices on CaseEvent for Care relations
CREATE INDEX IF NOT EXISTS "CaseEvent_carePlanId_idx" ON "CaseEvent"("carePlanId");
CREATE INDEX IF NOT EXISTS "CaseEvent_careDayId_idx" ON "CaseEvent"("careDayId");
CREATE INDEX IF NOT EXISTS "CaseEvent_sourceType_idx" ON "CaseEvent"("sourceType");

-- Foreign key constraints with cascade/set null rules
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'CaseEvent_carePlanId_fkey'
    ) THEN
        ALTER TABLE "CaseEvent" 
        ADD CONSTRAINT "CaseEvent_carePlanId_fkey" 
        FOREIGN KEY ("carePlanId") REFERENCES "CarePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'CaseEvent_careDayId_fkey'
    ) THEN
        ALTER TABLE "CaseEvent" 
        ADD CONSTRAINT "CaseEvent_careDayId_fkey" 
        FOREIGN KEY ("careDayId") REFERENCES "CareDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
