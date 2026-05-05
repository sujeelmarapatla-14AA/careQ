require('dotenv').config();
const https = require('https');

// Use Supabase Management API to run SQL
// This requires the service role key or management API token

// Read project ref from SUPABASE_URL env var — never hardcode it
const SUPABASE_URL = process.env.SUPABASE_URL;
if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL is not set in environment variables.');
  process.exit(1);
}
const PROJECT_REF = new URL(SUPABASE_URL).hostname.split('.')[0];
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!ANON_KEY) {
  console.error('❌ SUPABASE_ANON_KEY is not set in environment variables.');
  process.exit(1);
}

const sql = `
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  patient TEXT,
  need TEXT,
  notes TEXT DEFAULT '',
  assigned_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patients (
  id BIGSERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  age INT,
  gender TEXT,
  phone TEXT,
  department TEXT DEFAULT 'General OPD',
  condition TEXT,
  visit_type TEXT DEFAULT 'Walk-in',
  severity INT DEFAULT 30,
  priority TEXT DEFAULT 'Normal',
  status TEXT DEFAULT 'Waiting',
  queue_position INT,
  estimated_wait_mins INT,
  assigned_bed TEXT,
  assigned_ward TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id BIGSERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  color TEXT DEFAULT 'cyan',
  by_user TEXT DEFAULT 'System',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO rooms (id, name, category, status, patient, need) VALUES
  ('APT-01','Appointment Room 1','Appointment Rooms','occupied','Riya Sharma','Needs Checkup'),
  ('APT-02','Appointment Room 2','Appointment Rooms','available',NULL,NULL),
  ('APT-03','Appointment Room 3','Appointment Rooms','available',NULL,NULL),
  ('APT-04','Appointment Room 4','Appointment Rooms','available',NULL,NULL),
  ('CHK-01','Checkup Room 1','Checkup Rooms','available',NULL,NULL),
  ('CHK-02','Checkup Room 2','Checkup Rooms','occupied','Arjun Mehta','Needs Checkup'),
  ('CHK-03','Checkup Room 3','Checkup Rooms','available',NULL,NULL),
  ('CHK-04','Checkup Room 4','Checkup Rooms','available',NULL,NULL),
  ('MRI-01','MRI Scanner 1','MRI Scan Rooms','occupied','Priya Nair','Needs Scan'),
  ('MRI-02','MRI Scanner 2','MRI Scan Rooms','available',NULL,NULL),
  ('XRY-01','X-Ray Room 1','X-Ray Rooms','occupied','Karan Rao','Needs Scan'),
  ('XRY-02','X-Ray Room 2','X-Ray Rooms','available',NULL,NULL)
ON CONFLICT (id) DO NOTHING;
`;

const body = JSON.stringify({ query: sql });

const options = {
  hostname: `${PROJECT_REF}.supabase.co`,
  path: '/rest/v1/rpc/query',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
    'Content-Length': Buffer.byteLength(body)
  }
};

console.log('Attempting to create tables via Supabase API...');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => console.error('Request error:', e.message));
req.write(body);
req.end();
