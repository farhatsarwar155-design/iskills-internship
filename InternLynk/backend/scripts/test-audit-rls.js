import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testAuditLogsQuery() {
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@internlynk.com',
    password: 'Password123!'
  });
  if (authErr) return console.error("Login error:", authErr);

  console.log("Logged in user:", authData.user.id);

  const { data: adminLogs, error: adminErr } = await supabase
    .from('admin_logs')
    .select('id, admin_id, action, target_type, target_id, feedback, metadata, timestamp');

  console.log("admin_logs query result:", { count: adminLogs?.length, error: adminErr });

  const { data: actLogs, error: actErr } = await supabase
    .from('activity_logs')
    .select('id, actor_id, role, action, target_type, target_id, metadata, timestamp');

  console.log("activity_logs query result:", { count: actLogs?.length, error: actErr });
}

testAuditLogsQuery();
