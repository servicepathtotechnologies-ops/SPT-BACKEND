-- Run this in Supabase SQL Editor if "contacts" table does not exist.
-- Contact form submissions are stored here; admin gets email to servicepathtotechnologies@gmail.com.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS contacts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  VARCHAR(150) NOT NULL,
  email      VARCHAR(150) NOT NULL,
  phone      VARCHAR(20),
  company    VARCHAR(150),
  message    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts (email);
