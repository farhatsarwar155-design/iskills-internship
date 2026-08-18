import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testJoin() {
  console.log("Testing PostgREST join on applications -> profiles...");
  
  // Syntax 1: profiles(full_name, email)
  const q1 = await supabase.from('applications').select('id, status, profiles(full_name, email)').limit(1);
  console.log("Syntax 1 - profiles():", q1.error ? q1.error.message : "SUCCESS", q1.data);

  // Syntax 2: profiles!user_id(full_name, email)
  const q2 = await supabase.from('applications').select('id, status, profiles!user_id(full_name, email)').limit(1);
  console.log("Syntax 2 - profiles!user_id():", q2.error ? q2.error.message : "SUCCESS", q2.data);

  // Syntax 3: profiles:profiles!applications_user_id_fkey(full_name, email)
  const q3 = await supabase.from('applications').select('id, status, profiles:profiles!applications_user_id_fkey(full_name, email)').limit(1);
  console.log("Syntax 3 - profiles:profiles!fkey():", q3.error ? q3.error.message : "SUCCESS", q3.data);

  // Syntax 4: profiles!applications_user_id_fkey(full_name, email)
  const q4 = await supabase.from('applications').select('id, status, profiles!applications_user_id_fkey(full_name, email)').limit(1);
  console.log("Syntax 4 - profiles!fkey():", q4.error ? q4.error.message : "SUCCESS", q4.data);
}

testJoin();
