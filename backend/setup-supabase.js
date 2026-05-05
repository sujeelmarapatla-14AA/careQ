require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

async function setup() {
  console.log('🔧 Setting up Supabase tables...\n');

  // Create tables one by one using Supabase's rpc or direct insert
  // Since we can't run raw SQL without service role, we'll use the REST API approach
  // by inserting seed data after tables are created via SQL editor

  // Test connection first
  const { error: connErr } = await sb.from('rooms').select('id').limit(1);
  
  if (connErr && connErr.code === '42P01') {
    console.log('❌ Tables do not exist yet.');
    console.log('\n📋 MANUAL STEP REQUIRED:');
    const projectRef = SUPABASE_URL ? new URL(SUPABASE_URL).hostname.split('.')[0] : 'YOUR_PROJECT_REF';
    console.log(`1. Open: https://app.supabase.com/project/${projectRef}/sql/new`);
    console.log('2. Paste and run the contents of: backend/supabase-schema.sql');
    console.log('3. Then run this script again: node setup-supabase.js\n');
    return;
  }

  if (connErr) {
    console.log('❌ Connection error:', connErr.message);
    return;
  }

  console.log('✅ Tables exist! Seeding rooms...');

  // Seed rooms
  const rooms = [
    { id: 'APT-01', name: 'Appointment Room 1', category: 'Appointment Rooms', status: 'occupied', patient: 'Riya Sharma',  need: 'Needs Checkup', notes: '' },
    { id: 'APT-02', name: 'Appointment Room 2', category: 'Appointment Rooms', status: 'available', patient: null, need: null, notes: '' },
    { id: 'APT-03', name: 'Appointment Room 3', category: 'Appointment Rooms', status: 'available', patient: null, need: null, notes: '' },
    { id: 'APT-04', name: 'Appointment Room 4', category: 'Appointment Rooms', status: 'available', patient: null, need: null, notes: '' },
    { id: 'CHK-01', name: 'Checkup Room 1',     category: 'Checkup Rooms',     status: 'available', patient: null, need: null, notes: '' },
    { id: 'CHK-02', name: 'Checkup Room 2',     category: 'Checkup Rooms',     status: 'occupied', patient: 'Arjun Mehta', need: 'Needs Checkup', notes: '' },
    { id: 'CHK-03', name: 'Checkup Room 3',     category: 'Checkup Rooms',     status: 'available', patient: null, need: null, notes: '' },
    { id: 'CHK-04', name: 'Checkup Room 4',     category: 'Checkup Rooms',     status: 'available', patient: null, need: null, notes: '' },
    { id: 'MRI-01', name: 'MRI Scanner 1',      category: 'MRI Scan Rooms',    status: 'occupied', patient: 'Priya Nair',  need: 'Needs Scan',    notes: '' },
    { id: 'MRI-02', name: 'MRI Scanner 2',      category: 'MRI Scan Rooms',    status: 'available', patient: null, need: null, notes: '' },
    { id: 'XRY-01', name: 'X-Ray Room 1',       category: 'X-Ray Rooms',       status: 'occupied', patient: 'Karan Rao',   need: 'Needs Scan',    notes: '' },
    { id: 'XRY-02', name: 'X-Ray Room 2',       category: 'X-Ray Rooms',       status: 'available', patient: null, need: null, notes: '' },
  ];

  const { error: roomErr } = await sb.from('rooms').upsert(rooms, { onConflict: 'id' });
  if (roomErr) console.log('❌ Rooms seed error:', roomErr.message);
  else console.log('✅ Rooms seeded (12 rooms)');

  // Verify
  const { data: roomData } = await sb.from('rooms').select('id, status');
  console.log('\n📊 Rooms in Supabase:');
  roomData?.forEach(r => console.log(`   ${r.id} — ${r.status}`));

  console.log('\n🎉 Supabase setup complete!');
}

setup().catch(console.error);
