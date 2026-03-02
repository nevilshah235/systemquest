-- Migration: LLD Interactive Builder
-- Adds lldConfig to missions and lldState to lld_attempts
-- Run with: npx prisma migrate dev --name lld_interactive_builder

-- Add lldConfig column to missions table
ALTER TABLE missions ADD COLUMN lldConfig TEXT;

-- Add lldState column to lld_attempts table
ALTER TABLE lld_attempts ADD COLUMN lldState TEXT;
