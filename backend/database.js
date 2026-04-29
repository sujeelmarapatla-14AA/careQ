const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes('your-project-id')) {
  console.warn('⚠️  Supabase not configured — running in local memory mode');
  module.exports = { supabase: null, isConnected: false };
} else {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('✅ Supabase client initialized:', SUPABASE_URL);
  module.exports = { supabase, isConnected: true };
}
