-- Add status column for CRM tracking (contacts and demos)
-- Run this after initial schema if tables already exist.

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'new';

ALTER TABLE demos
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'new';

-- Optional: index for filtering by status
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts (status);
CREATE INDEX IF NOT EXISTS idx_demos_status ON demos (status);

COMMENT ON COLUMN contacts.status IS 'CRM status: new, contacted, qualified, converted, lost';
COMMENT ON COLUMN demos.status IS 'CRM status: new, contacted, qualified, converted, lost';
