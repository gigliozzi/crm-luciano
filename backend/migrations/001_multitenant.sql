-- Migration 001: Multi-tenant core and Kanban schema
-- UP
BEGIN TRANSACTION;

-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter',
  tz TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  status TEXT NOT NULL DEFAULT 'active', -- active|trial|past_due|canceled
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Users: add multi-tenant fields (SQLite supports ADD COLUMN)
ALTER TABLE users ADD COLUMN tenant_id INTEGER;
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'admin'; -- admin|manager|agent|assistant
ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1; -- 1=true, 0=false
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- Kanban stages (per tenant)
CREATE TABLE IF NOT EXISTS stages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  key TEXT NOT NULL,          -- ex: new, qualifying, scheduled, proposal, won, lost
  label TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  wip_limit INTEGER,          -- optional
  is_closed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, key)
);
CREATE INDEX IF NOT EXISTS idx_stages_tenant_order ON stages(tenant_id, "order");

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  stage TEXT NOT NULL,               -- references stages.key (logical)
  owner_id INTEGER,                  -- user id
  source TEXT,                       -- site|ads|referral|whatsapp|other
  interest_type TEXT,                -- buy|rent
  property_type TEXT,                -- house|apartment|office|land
  min_price REAL,
  max_price REAL,
  city TEXT,
  neighborhood TEXT,
  next_followup_at TEXT,             -- ISO date/time
  last_contact_at TEXT,
  notes_rich TEXT,
  tags TEXT,                         -- comma-separated for SQLite
  position INTEGER NOT NULL DEFAULT 0, -- ordering inside the column
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_stage_owner ON leads(tenant_id, stage, owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow ON leads(tenant_id, next_followup_at);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(tenant_id, created_at);

-- Lead -> properties of interest
CREATE TABLE IF NOT EXISTS lead_properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  lead_id INTEGER NOT NULL,
  property_ref TEXT NOT NULL,
  label TEXT,
  metadata_json TEXT,
  UNIQUE(tenant_id, lead_id, property_ref)
);
CREATE INDEX IF NOT EXISTS idx_lead_properties_by_lead ON lead_properties(tenant_id, lead_id);

-- Lead timeline / audit
CREATE TABLE IF NOT EXISTS lead_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  lead_id INTEGER NOT NULL,
  type TEXT NOT NULL,            -- created|stage_changed|note|contact|attachment|proposal|followup
  payload_json TEXT,             -- JSON string
  created_by INTEGER,            -- user id
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lead_events_by_lead ON lead_events(tenant_id, lead_id, created_at);

-- Attachments
CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  lead_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  kind TEXT,                     -- doc|image|proposal|other
  created_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tenant settings (generic key/value JSON)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  key TEXT NOT NULL,
  value_json TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, key)
);

-- Subscriptions / billing state
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  provider TEXT NOT NULL DEFAULT 'stripe',
  external_id TEXT,
  plan TEXT NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'trialing', -- trialing|active|past_due|canceled
  current_period_end TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

COMMIT;

-- DOWN
BEGIN TRANSACTION;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS lead_events;
DROP TABLE IF EXISTS lead_properties;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS stages;
DROP TABLE IF EXISTS tenants;

-- Revert users table to original structure (SQLite: recreate table without new columns)
CREATE TABLE IF NOT EXISTS users_tmp (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO users_tmp (id, email, password_hash, name, created_at)
  SELECT id, email, password_hash, name, created_at FROM users;
DROP TABLE users;
ALTER TABLE users_tmp RENAME TO users;
COMMIT;

