-- Real-time CRM: status workflows and status_history
-- Contacts: Pending, Processing, Contacted, Qualified, Lead, Lost
-- Demos: Pending, Scheduled, Completed, Cancelled, Lead, Lost
-- Default for new rows: Pending
-- Handles both VARCHAR and ENUM status columns (converts enum to varchar).

-- 1) status_history table
CREATE TABLE IF NOT EXISTS status_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('contact', 'demo')),
  entity_id   UUID NOT NULL,
  old_status  VARCHAR(50),
  new_status  VARCHAR(50) NOT NULL,
  updated_by  UUID,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_status_history_entity ON status_history (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_status_history_updated_at ON status_history (updated_at DESC);

-- 2) Contacts: ensure column is VARCHAR then migrate values
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_status_check;
-- Convert enum or other type to varchar (no-op if already varchar)
ALTER TABLE contacts ALTER COLUMN status TYPE VARCHAR(50) USING status::text;

UPDATE contacts SET status = 'Pending'  WHERE status IN ('new', '') OR status IS NULL;
UPDATE contacts SET status = 'Contacted' WHERE status = 'contacted';
UPDATE contacts SET status = 'Qualified'  WHERE status = 'qualified';
UPDATE contacts SET status = 'Lead'       WHERE status = 'converted';
UPDATE contacts SET status = 'Pending'   WHERE status NOT IN ('Pending','Processing','Contacted','Qualified','Lead','Lost');

ALTER TABLE contacts ADD CONSTRAINT contacts_status_check CHECK (status IN (
  'Pending', 'Processing', 'Contacted', 'Qualified', 'Lead', 'Lost'
));
ALTER TABLE contacts ALTER COLUMN status SET DEFAULT 'Pending';
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts (status);

-- 3) Demos: same
ALTER TABLE demos DROP CONSTRAINT IF EXISTS demos_status_check;
ALTER TABLE demos ALTER COLUMN status TYPE VARCHAR(50) USING status::text;

UPDATE demos SET status = 'Pending' WHERE status IN ('new', '') OR status IS NULL;
UPDATE demos SET status = 'Lead' WHERE status = 'converted';
UPDATE demos SET status = 'Pending' WHERE status NOT IN ('Pending','Scheduled','Completed','Cancelled','Lead','Lost');

ALTER TABLE demos ADD CONSTRAINT demos_status_check CHECK (status IN (
  'Pending', 'Scheduled', 'Completed', 'Cancelled', 'Lead', 'Lost'
));
ALTER TABLE demos ALTER COLUMN status SET DEFAULT 'Pending';
CREATE INDEX IF NOT EXISTS idx_demos_status ON demos (status);
