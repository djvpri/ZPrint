-- Migration: Add demo fields to Tenant
-- Jalankan via Railway Console psql atau prisma migrate

ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "is_demo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "demo_expires_at" TIMESTAMP(3);
