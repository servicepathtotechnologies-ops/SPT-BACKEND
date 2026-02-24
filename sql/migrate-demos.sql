-- Run this in Supabase SQL Editor if "demos" table does not exist.
-- Creates the demos table for Book a Demo submissions (stored in Supabase, email sent to servicepathtotechnologies@gmail.com).

CREATE TABLE IF NOT EXISTS demos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  VARCHAR(150) NOT NULL,
  email      VARCHAR(150) NOT NULL,
  company    VARCHAR(150),
  demo_date  TIMESTAMP NOT NULL,
  service    VARCHAR(150),
  notes      TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_demos_created_at ON demos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demos_email ON demos (email);
