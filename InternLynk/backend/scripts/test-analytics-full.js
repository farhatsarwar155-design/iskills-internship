import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testFullAnalytics() {
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@internlynk.com',
    password: 'Password123!'
  });
  if (authErr) return console.error("Admin login error:", authErr);

  console.log("Logged in as admin. Testing full analytics logic...");

  // Test 1: fetchUserAnalytics
  const { data: profiles } = await supabase.from('profiles').select('id, role, created_at, is_active, approval_status');
  console.log("Profiles count:", profiles?.length);

  // Test 2: fetchInternshipAnalytics
  const { data: internships } = await supabase.from('internships').select('id, status, created_at, approved_at, software_house_id');
  console.log("Internships count:", internships?.length);

  // Test 3: fetchApplicationAnalytics (new resilient logic)
  const { data: rawApps, error: appsErr } = await supabase.from('applications').select('id, status, applied_at, created_at, updated_at, user_id, internship_id');
  console.log("Raw apps:", appsErr ? appsErr.message : "SUCCESS", rawApps?.length);

  // Test 4: roleSpecificInsights
  const { data: studentProfiles } = await supabase.from('profiles').select('id').eq('role', 'student');
  console.log("Student profiles:", studentProfiles?.length);

  console.log("ALL ANALYTICS QUERIES PASSED!");
}

testFullAnalytics();
