-- Adds amendment tracking to safeguarding_incidents.
-- Original notes and created_by are preserved as the immutable record.
-- Amendments are stored in the amended_* columns for a full audit trail.

ALTER TABLE safeguarding_incidents
  ADD COLUMN IF NOT EXISTS amended_notes   TEXT,
  ADD COLUMN IF NOT EXISTS amended_by      TEXT,
  ADD COLUMN IF NOT EXISTS amended_at      TIMESTAMPTZ;
