import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function check() {
  console.log('Testing Supabase connection...');
  const { data: tables, error } = await supabase.from('profiles').select('*').limit(1);
  console.log('profiles query result:', { data: tables, error });
}

check();
