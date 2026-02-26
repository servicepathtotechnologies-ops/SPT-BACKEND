-- Enable UUID generation (required for gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Contact form submissions
CREATE TABLE IF NOT EXISTS contacts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  VARCHAR(150) NOT NULL,
  email      VARCHAR(150) NOT NULL,
  phone      VARCHAR(20),
  company    VARCHAR(150),
  message    TEXT NOT NULL,
  status     VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Processing','Contacted','Qualified','Lead','Lost')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts (email);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts (status);

-- Admin users (for JWT auth; password stored hashed with bcrypt)
CREATE TABLE IF NOT EXISTS admins (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_email ON admins (email);

-- Demo / booking submissions
CREATE TABLE IF NOT EXISTS demos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  VARCHAR(150) NOT NULL,
  email      VARCHAR(150) NOT NULL,
  company    VARCHAR(150),
  demo_date  TIMESTAMP NOT NULL,
  service    VARCHAR(150),
  notes      TEXT,
  status     VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Scheduled','Completed','Cancelled','Lead','Lost')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_demos_created_at ON demos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demos_email ON demos (email);
CREATE INDEX IF NOT EXISTS idx_demos_status ON demos (status);

-- Status change history (real-time CRM)
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
