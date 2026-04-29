require('dotenv').config();
const https = require('https');

// We need to check what's in the tables and fix RLS via the dashboard
// Let's first try reading with the anon key to see what's there

const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
  console.log('Checking tables...\n');

  const { data: rooms, error: re } = await sb.from('rooms').select('*');
  if (re) console.log('❌ Rooms read error:', re.message);
  else console.log(`✅ Rooms: ${rooms.length} rows`, rooms.map(r => r.id));

  const { data: pts, error: pe } = await sb.from('patients').select('count');
  if (pe) console.log('❌ Patients read error:', pe.message);
  else console.log('✅ Patients table accessible');
}

check();
