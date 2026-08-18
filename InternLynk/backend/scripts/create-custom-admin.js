import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createCustomAdmin() {
  const email = 'farhasarwar640@gmail.com';
  const password = 'farhat155';

  console.log(`[Admin Creator] Checking if auth user exists for: ${email}`);
  
  // List all users to see if already registered
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError);
    return;
  }

  let user = usersData.users.find(u => u.email === email);
  let userId;

  if (user) {
    console.log(`[Admin Creator] User already exists. Updating password to: ${password}`);
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: password }
    );
    if (updateError) {
      console.error("Error updating user password:", updateError);
      return;
    }
    userId = user.id;
  } else {
    console.log(`[Admin Creator] User does not exist. Creating new auth user...`);
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { role: 'admin' }
    });
    if (createError) {
      console.error("Error creating user:", createError);
      return;
    }
    userId = createData.user.id;
  }

  // Create or update profile
  console.log(`[Admin Creator] Creating/Updating profile row for admin user ID: ${userId}`);
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: email,
      role: 'admin',
      full_name: 'Farhat Muhammad Sarwar',
      approval_status: 'approved',
      is_active: true,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    });

  if (profileError) {
    console.error("Error upserting profile:", profileError);
  } else {
    console.log(`[Admin Creator] Successfully registered and configured admin account: ${email}`);
  }
}

createCustomAdmin();
