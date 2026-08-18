import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceKey);

async function setAdmin() {
  const email = 'farhatsarwar.155@gmail.com';
  console.log(`Setting role to admin for ${email}...`);

  // Update profile
  const { data: profile, error: pErr } = await supabaseAdmin
    .from('profiles')
    .update({ 
      role: 'admin',
      approval_status: 'approved',
      is_active: true,
      full_name: 'Farhat Muhammad Sarwar'
    })
    .eq('email', email)
    .select();

  console.log('Profile update:', { profile, pErr });

  // Update auth metadata
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const targetUser = users.find(u => u.email === email);
  if (targetUser) {
    const { data: authUpdate, error: aErr } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      {
        user_metadata: {
          ...targetUser.user_metadata,
          role: 'admin',
          approval_status: 'approved',
          is_active: true,
          full_name: 'Farhat Muhammad Sarwar'
        }
      }
    );
    console.log('Auth user metadata updated:', { authUpdate, aErr });
  }
}

setAdmin();
