require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function seed() {
  console.log('🌱 Seeding Supabase...\n');

  // Seed rooms
  const rooms = [
    { id: 'APT-01', name: 'Appointment Room 1', category: 'Appointment Rooms', status: 'occupied', patient: 'Riya Sharma',  need: 'Needs Checkup', notes: '', assigned_at: new Date(Date.now() - 8  * 60000).toISOString() },
    { id: 'APT-02', name: 'Appointment Room 2', category: 'Appointment Rooms', status: 'available', patient: null, need: null, notes: '', assigned_at: null },
    { id: 'APT-03', name: 'Appointment Room 3', category: 'Appointment Rooms', status: 'available', patient: null, need: null, notes: '', assigned_at: null },
    { id: 'APT-04', name: 'Appointment Room 4', category: 'Appointment Rooms', status: 'available', patient: null, need: null, notes: '', assigned_at: null },
    { id: 'CHK-01', name: 'Checkup Room 1',     category: 'Checkup Rooms',     status: 'available', patient: null, need: null, notes: '', assigned_at: null },
    { id: 'CHK-02', name: 'Checkup Room 2',     category: 'Checkup Rooms',     status: 'occupied', patient: 'Arjun Mehta', need: 'Needs Checkup', notes: '', assigned_at: new Date(Date.now() - 22 * 60000).toISOString() },
    { id: 'CHK-03', name: 'Checkup Room 3',     category: 'Checkup Rooms',     status: 'available', patient: null, need: null, notes: '', assigned_at: null },
    { id: 'CHK-04', name: 'Checkup Room 4',     category: 'Checkup Rooms',     status: 'available', patient: null, need: null, notes: '', assigned_at: null },
    { id: 'MRI-01', name: 'MRI Scanner 1',      category: 'MRI Scan Rooms',    status: 'occupied', patient: 'Priya Nair',  need: 'Needs Scan',    notes: '', assigned_at: new Date(Date.now() - 35 * 60000).toISOString() },
    { id: 'MRI-02', name: 'MRI Scanner 2',      category: 'MRI Scan Rooms',    status: 'available', patient: null, need: null, notes: '', assigned_at: null },
    { id: 'XRY-01', name: 'X-Ray Room 1',       category: 'X-Ray Rooms',       status: 'occupied', patient: 'Karan Rao',   need: 'Needs Scan',    notes: '', assigned_at: new Date(Date.now() - 5  * 60000).toISOString() },
    { id: 'XRY-02', name: 'X-Ray Room 2',       category: 'X-Ray Rooms',       status: 'available', patient: null, need: null, notes: '', assigned_at: null },
  ];

  const { error: roomErr } = await sb.from('rooms').upsert(rooms, { onConflict: 'id' });
  if (roomErr) {
    console.log('❌ Rooms seed failed:', roomErr.message);
    console.log('\n⚠️  Please run this SQL in Supabase dashboard first:');
    console.log('   ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;');
    console.log('   ALTER TABLE patients DISABLE ROW LEVEL SECURITY;');
    console.log('   ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;');
    console.log('\n   URL: https://app.supabase.com/project/qrcnpaikpzrcabdnrydu/sql/new');
    return;
  }
  console.log('✅ Rooms seeded (12 rooms)');

  // Verify
  const { data } = await sb.from('rooms').select('id, status, patient');
  console.log('\n📊 Rooms in Supabase:');
  data?.forEach(r => console.log(`   ${r.id} — ${r.status}${r.patient ? ' → ' + r.patient : ''}`));

  console.log('\n🎉 Supabase is fully set up and ready!');
  console.log('   All room assignments will now persist in Supabase.');
  console.log('   Patient registrations will also be saved to Supabase.');
}

seed().catch(console.error);
