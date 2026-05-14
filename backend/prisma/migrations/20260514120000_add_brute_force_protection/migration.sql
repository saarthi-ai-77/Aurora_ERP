-- Add brute-force protection fields to users table
ALTER TABLE "users" ADD COLUMN "failed_login_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "lockout_until" TIMESTAMP(3);

-- Add new AuditAction enum values for auth events
ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'LOGIN_FAILED';
ALTER TYPE "AuditAction" ADD VALUE 'LOGIN_SUCCESS';
