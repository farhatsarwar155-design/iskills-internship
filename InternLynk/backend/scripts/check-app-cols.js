import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testSelect() {
  const q1 = await supabase.from('applications').select('applied_at').limit(1);
  console.log("has applied_at?", !q1.error, q1.error?.message);

  const q2 = await supabase.from('applications').select('created_at').limit(1);
  console.log("has created_at?", !q2.error, q2.error?.message);
}

testSelect();
