import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function inspect() {
  console.log('Testing creating a test user directly...');
  const testEmail = `test_${Date.now()}@example.com`;
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: 'Password123!',
    email_confirm: true,
    user_metadata: {
      role: 'guest',
      full_name: 'Test Guest',
    },
  });

  console.log('createUser result:', { data, error });
}

inspect();
