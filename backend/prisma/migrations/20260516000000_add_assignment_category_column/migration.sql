-- Add category column to assignments table
-- AssignmentCategory enum already exists from init migration

ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "category" "AssignmentCategory" NOT NULL DEFAULT 'UPLOAD_BASED';
