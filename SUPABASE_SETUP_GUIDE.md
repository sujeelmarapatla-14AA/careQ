# 🚀 Supabase Setup Guide for CareQ

## 📋 Overview

This guide will help you connect your CareQ application to Supabase (PostgreSQL database + authentication + storage).

---

## 🎯 Step 1: Create Supabase Project

### 1.1 Sign Up / Login
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign up or login with GitHub/Google

### 1.2 Create New Project
1. Click **"New Project"**
2. Fill in:
   - **Name**: CareQ
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Free tier is fine for development
3. Click **"Create new project"**
4. Wait 2-3 minutes for setup to complete

---

## 🔑 Step 2: Get Your Credentials

### 2.1 Get API Keys
1. In your Supabase project dashboard
2. Go to **Settings** (⚙️ icon in sidebar)
3. Click **API**
4. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long string)
   - **service_role key**: `eyJhbGc...` (different long string)

### 2.2 Get Database Connection String
1. Still in Settings
2. Click **Database**
3. Scroll to **Connection string**
4. Select **URI** tab
5. Copy the connection string
6. It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

---

## 📝 Step 3: Update .env Files

### 3.1 Backend .env (`backend/.env`)

Open `backend/.env` and replace the placeholder values:

```env
PORT=5000
JWT_SECRET=ultimate_careq_secret_key_123
FRONTEND_URL=*

# SUPABASE CONFIGURATION
SUPABASE_URL=https://xxxxx.supabase.co  # ← Replace with your Project URL
SUPABASE_ANON_KEY=eyJhbGc...  # ← Replace with your anon/public key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ← Replace with your service_role key
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres  # ← Replace with your connection string
```

**Important**: Replace `[YOUR-PASSWORD]` in DATABASE_URL with your actual database password!

### 3.2 Frontend .env (`frontend/.env`)

Open `frontend/.env` and replace the placeholder values:

```env
VITE_API_URL=http://localhost:5000

# SUPABASE CONFIGURATION
VITE_SUPABASE_URL=https://xxxxx.supabase.co  # ← Replace with your Project URL
VITE_SUPABASE_ANON_KEY=eyJhbGc...  # ← Replace with your anon/public key
```

**Note**: Frontend only needs URL and anon key (not service_role key for security)

---

## 🗄️ Step 4: Create Database Tables

### 4.1 Open SQL Editor
1. In Supabase dashboard
2. Click **SQL Editor** in sidebar
3. Click **"New query"**

### 4.2 Run This SQL Script

Copy and paste this entire script, then click **"Run"**:

```sql
-- ═══════════════════════════════════════════════════════════
-- CAREQ DATABASE SCHEMA FOR SUPABASE
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────
-- USERS TABLE
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- PATIENTS TABLE
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_number TEXT UNIQUE NOT NULL,
  patient_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  phone TEXT,
  condition TEXT,
  severity INTEGER DEFAULT 30,
  department TEXT DEFAULT 'General OPD',
  visit_type TEXT DEFAULT 'Walk-in',
  status TEXT DEFAULT 'Waiting',
  verified BOOLEAN DEFAULT FALSE,
  verified_by TEXT,
  medical_history TEXT,
  current_medications TEXT,
  allergies TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- BEDS TABLE
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS beds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bed_number TEXT NOT NULL,
  ward_type TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  floor INTEGER,
  assigned_patient_id UUID REFERENCES patients(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- BED ALLOCATIONS TABLE
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  bed_id UUID REFERENCES beds(id),
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  released_at TIMESTAMP,
  notes TEXT
);

-- ─────────────────────────────────────────────────────────
-- RESOURCES TABLE
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  subtype TEXT,
  status TEXT DEFAULT 'available',
  location TEXT,
  metadata JSONB,
  supports_slots BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- RESOURCE SLOTS TABLE
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resource_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID REFERENCES resources(id),
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'available',
  patient_id UUID REFERENCES patients(id),
  patient_name TEXT,
  booked_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- RESOURCE ASSIGNMENTS TABLE
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resource_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID REFERENCES resources(id),
  patient_id UUID REFERENCES patients(id),
  patient_name TEXT,
  assigned_by UUID REFERENCES users(id),
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  status TEXT DEFAULT 'active',
  is_emergency BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- ─────────────────────────────────────────────────────────
-- ACTIVITY LOG TABLE
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  performed_by UUID REFERENCES users(id),
  patient_id UUID REFERENCES patients(id),
  patient_name TEXT,
  resource_id UUID REFERENCES resources(id),
  resource_name TEXT,
  bed_id UUID REFERENCES beds(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- INDEXES FOR PERFORMANCE
-- ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_patients_token ON patients(token_number);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
CREATE INDEX IF NOT EXISTS idx_slots_date ON resource_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);

-- ─────────────────────────────────────────────────────────
-- SEED INITIAL DATA
-- ─────────────────────────────────────────────────────────

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password, role, name) 
VALUES ('admin@careq.com', '$2a$08$8K1p/a0dL3LKzOWR2qGdCOb6Q8JXw5mxhKZX5rJ9vYxKZX5rJ9vYx', 'admin', 'Admin User')
ON CONFLICT (email) DO NOTHING;

-- Insert default staff user (password: staff123)
INSERT INTO users (email, password, role, name) 
VALUES ('staff@careq.com', '$2a$08$8K1p/a0dL3LKzOWR2qGdCOb6Q8JXw5mxhKZX5rJ9vYxKZX5rJ9vYx', 'staff', 'Staff Member')
ON CONFLICT (email) DO NOTHING;

-- Insert sample resources
INSERT INTO resources (id, name, type, subtype, status, location, metadata, supports_slots) VALUES
('CONS-01', 'Room C-1', 'consultation', NULL, 'available', 'Floor 1, Wing A', '{"doctor": "Dr. Mehta", "specialty": "Cardiology"}', FALSE),
('CONS-02', 'Room C-2', 'consultation', NULL, 'available', 'Floor 1, Wing A', '{"doctor": "Dr. Rao", "specialty": "Neurology"}', FALSE),
('MRI-01', 'MRI Unit 1', 'mri', NULL, 'available', 'Floor 3, Radiology', '{"machine_model": "Siemens 3T", "slot_duration_mins": 30}', TRUE),
('XRAY-01', 'X-Ray Room 1', 'xray', NULL, 'available', 'Floor 2, Radiology', '{"machine_model": "Philips Digital", "slot_duration_mins": 15}', TRUE),
('CT-01', 'CT Scanner 1', 'ct', NULL, 'available', 'Floor 3, Radiology', '{"machine_model": "Toshiba 64-slice", "slot_duration_mins": 20}', TRUE),
('ICU-CARDIAC', 'Cardiac ICU', 'icu', 'cardiac', 'available', 'Floor 4, Wing A', '{"unit": "Cardiac ICU", "beds_in_unit": 8}', FALSE),
('EQ-VENT-01', 'Ventilator #1', 'equipment', 'ventilator', 'available', 'ICU Floor 4', '{"serial": "VNT-2291", "brand": "Philips"}', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'Database schema created successfully!' AS message;
```

### 4.3 Verify Tables Created
1. Click **Table Editor** in sidebar
2. You should see all tables listed:
   - users
   - patients
   - beds
   - allocations
   - resources
   - resource_slots
   - resource_assignments
   - activity_log

---

## 📦 Step 5: Install Supabase Client Libraries

### 5.1 Backend
```bash
cd backend
npm install @supabase/supabase-js
```

### 5.2 Frontend
```bash
cd frontend
npm install @supabase/supabase-js
```

---

## 🔧 Step 6: Create Supabase Client Files

### 6.1 Backend Client (`backend/supabase.js`)

Create this file:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase credentials not found in .env file');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
```

### 6.2 Frontend Client (`frontend/src/supabase.js`)

Create this file:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase credentials not found in .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## ✅ Step 7: Test Connection

### 7.1 Test Backend Connection

Create `backend/test-supabase.js`:

```javascript
require('dotenv').config();
const supabase = require('./supabase');

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Connection failed:', error.message);
  } else {
    console.log('✅ Connection successful!');
    console.log('Sample data:', data);
  }
}

testConnection();
```

Run it:
```bash
cd backend
node test-supabase.js
```

### 7.2 Test Frontend Connection

In your browser console (F12):
```javascript
import { supabase } from './supabase';

const { data, error } = await supabase.from('users').select('*').limit(1);
console.log('Data:', data);
console.log('Error:', error);
```

---

## 🔐 Step 8: Security Setup (Important!)

### 8.1 Enable Row Level Security (RLS)

In Supabase SQL Editor, run:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies (example for patients table)
CREATE POLICY "Enable read access for authenticated users" ON patients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON patients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

### 8.2 Add .env to .gitignore

Make sure `.env` files are NOT committed to git:

```bash
# Add to .gitignore
backend/.env
frontend/.env
.env
.env.local
```

---

## 📊 Step 9: Migrate from SQLite to Supabase

### Option 1: Manual Migration
1. Export data from SQLite
2. Import to Supabase using SQL Editor

### Option 2: Keep Both (Recommended for now)
- Keep SQLite for local development
- Use Supabase for production
- Add environment variable to switch:
  ```env
  USE_SUPABASE=true  # or false for SQLite
  ```

---

## 🎯 Quick Reference

### Environment Variables Summary

**Backend (.env)**:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://...
```

**Frontend (.env)**:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Common Commands

```bash
# Install dependencies
npm install @supabase/supabase-js

# Test connection
node backend/test-supabase.js

# Restart servers
cd backend && npm start
cd frontend && npm run dev
```

---

## 🆘 Troubleshooting

### "Invalid API key"
- Check that you copied the correct keys
- Make sure no extra spaces in .env file
- Restart your servers after updating .env

### "relation does not exist"
- Run the SQL schema script in Supabase SQL Editor
- Check that all tables were created

### "Connection refused"
- Check SUPABASE_URL is correct
- Verify your project is active in Supabase dashboard

### Environment variables not loading
- Restart your development servers
- Check .env file is in correct location
- Verify variable names (VITE_ prefix for frontend)

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Your Supabase setup is complete! 🎉**

Next steps:
1. Fill in your actual credentials in .env files
2. Run the SQL schema script
3. Install @supabase/supabase-js
4. Test the connection
5. Start building!
