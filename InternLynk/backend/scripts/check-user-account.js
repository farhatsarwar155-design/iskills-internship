import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUserAccount() {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'farhasarwar640@gmail.com')
    .maybeSingle();

  console.log("Profile for farhasarwar640@gmail.com:", profile, error);
}

checkUserAccount();
