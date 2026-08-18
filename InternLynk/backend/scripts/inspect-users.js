import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

const adminClient = createClient(supabaseUrl, serviceKey);
const anonClient = createClient(supabaseUrl, anonKey);

async function inspect() {
  console.log('--- ALL AUTH USERS ---');
  const { data: { users }, error: authErr } = await adminClient.auth.admin.listUsers();
  console.log(users.map(u => ({ id: u.id, email: u.email, metadata: u.user_metadata })));

  console.log('--- ALL PROFILES ---');
  const { data: profiles, error: profErr } = await adminClient.from('profiles').select('*');
  console.log('Profiles in DB:', profiles);

  console.log('--- TEST ANON ACCESS ---');
  const { data: anonProfiles, error: anonErr } = await anonClient.from('profiles').select('*');
  console.log('Anon profiles query:', { data: anonProfiles, error: anonErr });
}

inspect();
