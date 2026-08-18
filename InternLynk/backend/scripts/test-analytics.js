import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Login as admin
async function testAnalytics() {
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@internlynk.com',
    password: 'Password123!'
  });
  if (authErr) return console.error("Admin login error:", authErr);

  console.log("Logged in as admin. Testing analytics functions...");

  // 1. fetchUserAnalytics test
  try {
    const q1 = await supabase.from('profiles').select('id, role, created_at, is_active, approval_status');
    console.log("1. Profiles query:", q1.error ? q1.error.message : "OK", q1.data?.length);

    const qUni = await supabase.from('students').select('university_id, profiles:university_id(organization_name, full_name)');
    console.log("1b. Students-Uni join:", qUni.error ? qUni.error.message : "OK", qUni.data?.length);
  } catch(e) { console.error("Err 1:", e); }

  // 2. fetchInternshipAnalytics test
  try {
    const q2 = await supabase.from('internships').select('id, status, created_at, approved_at, software_house_id, profiles:software_house_id(organization_name, full_name)');
    console.log("2. Internships query:", q2.error ? q2.error.message : "OK", q2.data?.length);
  } catch(e) { console.error("Err 2:", e); }

  // 3. fetchApplicationAnalytics test
  try {
    const q3 = await supabase.from('applications').select(`
      id, status, applied_at, updated_at, user_id, internship_id,
      profiles:user_id(role), internships:internship_id(title)
    `);
    console.log("3. Applications query:", q3.error ? q3.error.message : "OK", q3.data?.length);
  } catch(e) { console.error("Err 3:", e); }

  // 4. cv_forms query test
  try {
    const q4 = await supabase.from('cv_forms').select('id, is_complete, user_id');
    console.log("4. cv_forms query:", q4.error ? q4.error.message : "OK", q4.data?.length);
  } catch(e) { console.error("Err 4:", e); }
}

testAnalytics();
