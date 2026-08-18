import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAdminLogsTable() {
  const { data, error } = await supabase.from('admin_logs').select('*');
  console.log("Service role admin_logs:", data?.length, error);
  console.log("Rows:", data);
}

checkAdminLogsTable();
