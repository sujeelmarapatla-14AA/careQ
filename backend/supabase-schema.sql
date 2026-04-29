-- ============================================================
-- CareQ Supabase Schema
-- Run this in Supabase SQL Editor:
-- https://app.supabase.com/project/qrcnpaikpzrcabdnrydu/sql
-- ============================================================

-- PATIENTS table
CREATE TABLE IF NOT EXISTS patients (
  id            BIGSERIAL PRIMARY KEY,
  token         TEXT UNIQUE NOT NULL,
  full_name     TEXT NOT NULL,
  age           INT,
  gender        TEXT,
  phone         TEXT,
  department    TEXT DEFAULT 'General OPD',
  condition     TEXT,
  visit_type    TEXT DEFAULT 'Walk-in',
  severity      INT DEFAULT 30,
  priority      TEXT DEFAULT 'Normal',
  status        TEXT DEFAULT 'Waiting',
  queue_position INT,
  estimated_wait_mins INT,
  assigned_bed  TEXT,
  assigned_ward TEXT,
  assigned_doctor TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- BEDS table
CREATE TABLE IF NOT EXISTS beds (
  id            TEXT PRIMARY KEY,
  ward          TEXT NOT NULL,
  category      TEXT DEFAULT 'general',
  status        TEXT DEFAULT 'available',
  patient_token TEXT,
  patient_name  TEXT,
  patient_age   INT,
  patient_gender TEXT,
  department    TEXT,
  assigned_doctor TEXT,
  assigned_by   TEXT,
  assigned_at   TIMESTAMPTZ,
  expected_discharge TIMESTAMPTZ,
  admission_notes TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ROOMS table
CREATE TABLE IF NOT EXISTS rooms (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  status      TEXT DEFAULT 'available',
  patient     TEXT,
  need        TEXT,
  notes       TEXT,
  assigned_at TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITY LOG table
CREATE TABLE IF NOT EXISTS activity_log (
  id        BIGSERIAL PRIMARY KEY,
  message   TEXT NOT NULL,
  type      TEXT DEFAULT 'general',
  color     TEXT DEFAULT 'cyan',
  by        TEXT DEFAULT 'System',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Seed rooms ──────────────────────────────────────────────
INSERT INTO rooms (id, name, category, status, patient, need, assigned_at) VALUES
  ('APT-01','Appointment Room 1','Appointment Rooms','occupied','Riya Sharma','Needs Checkup', NOW() - INTERVAL '8 minutes'),
  ('APT-02','Appointment Room 2','Appointment Rooms','available',NULL,NULL,NULL),
  ('APT-03','Appointment Room 3','Appointment Rooms','available',NULL,NULL,NULL),
  ('APT-04','Appointment Room 4','Appointment Rooms','available',NULL,NULL,NULL),
  ('CHK-01','Checkup Room 1','Checkup Rooms','available',NULL,NULL,NULL),
  ('CHK-02','Checkup Room 2','Checkup Rooms','occupied','Arjun Mehta','Needs Checkup', NOW() - INTERVAL '22 minutes'),
  ('CHK-03','Checkup Room 3','Checkup Rooms','available',NULL,NULL,NULL),
  ('CHK-04','Checkup Room 4','Checkup Rooms','available',NULL,NULL,NULL),
  ('MRI-01','MRI Scanner 1','MRI Scan Rooms','occupied','Priya Nair','Needs Scan', NOW() - INTERVAL '35 minutes'),
  ('MRI-02','MRI Scanner 2','MRI Scan Rooms','available',NULL,NULL,NULL),
  ('XRY-01','X-Ray Room 1','X-Ray Rooms','occupied','Karan Rao','Needs Scan', NOW() - INTERVAL '5 minutes'),
  ('XRY-02','X-Ray Room 2','X-Ray Rooms','available',NULL,NULL,NULL)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (optional but recommended)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Allow all access for service role (backend uses service role key)
CREATE POLICY "Allow all for service role" ON patients FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON beds FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON rooms FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON activity_log FOR ALL USING (true);
