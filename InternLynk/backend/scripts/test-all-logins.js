import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

const USERS_TO_TEST = [
  { role: 'admin', email: 'admin@internlynk.com', password: 'Password123!' },
  { role: 'software_house', email: 'softwarehouse@internlynk.com', password: 'Password123!' },
  { role: 'university', email: 'university@internlynk.com', password: 'Password123!' },
  { role: 'student', email: 'student@internlynk.com', password: 'Password123!' },
  { role: 'guest', email: 'guest@internlynk.com', password: 'Password123!' },
];

async function testAllLogins() {
  console.log('Testing login and profile fetch for all users...');

  for (const u of USERS_TO_TEST) {
    console.log(`\n----------------------------------------`);
    console.log(`Testing Login: ${u.email} (${u.role})`);
    const client = createClient(supabaseUrl, anonKey);
    const { data: authData, error: authErr } = await client.auth.signInWithPassword({
      email: u.email,
      password: u.password,
    });

    if (authErr) {
      console.error(`❌ Auth error for ${u.email}:`, authErr);
      continue;
    }

    console.log(`✅ Auth successful! User ID: ${authData.user.id}`);

    // Query profile as authenticated client
    const { data: profile, error: profErr } = await client
      .from('profiles')
      .select('id, role, university_id, profile_picture, created_at, updated_at, approval_status, is_active, full_name, organization_name, email')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profErr) {
      console.error(`❌ Profile fetch error for ${u.email}:`, profErr);
    } else if (!profile) {
      console.error(`❌ No profile found for ${u.email}`);
    } else {
      console.log(`✅ Profile fetched successfully:`, profile);
    }
  }
}

testAllLogins();
