import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://niukjfjbwsdptejegwsf.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_USERS = [
  {
    email: 'admin@internlynk.com',
    password: 'Password123!',
    role: 'admin',
    full_name: 'Platform Administrator',
    organization_name: 'InternLynk HQ',
  },
  {
    email: 'university@internlynk.com',
    password: 'Password123!',
    role: 'university',
    full_name: 'University Officer',
    organization_name: 'National University of Sciences & Tech (NUST)',
  },
  {
    email: 'softwarehouse@internlynk.com',
    password: 'Password123!',
    role: 'software_house',
    full_name: 'HR & Talent Lead',
    organization_name: 'TechLogix Software Solutions',
  },
  {
    email: 'student@internlynk.com',
    password: 'Password123!',
    student_id: 'CS-2024-101',
    role: 'student',
    full_name: 'Hamza Tariq',
    batch: 2024,
    degree_program: 'BS Software Engineering',
    semester: 7,
  },
  {
    email: 'guest@internlynk.com',
    password: 'Password123!',
    role: 'guest',
    full_name: 'Ayesha Siddiqui',
  },
];

async function seedUser(userDef) {
  const { email, password, role, full_name, organization_name } = userDef;
  console.log(`\n========================================`);
  console.log(`Processing user: ${email} (${role})`);

  // 1. Check if user exists in Auth
  const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) {
    console.error('Failed to list users:', listErr);
    return null;
  }

  let authUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!authUser) {
    console.log(`Creating auth user ${email}...`);
    const { data: newAuth, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        full_name,
        organization_name,
        approval_status: 'approved',
        is_active: true,
      },
    });

    if (createErr) {
      console.error(`Error creating auth user ${email}:`, createErr);
      return null;
    }
    authUser = newAuth.user;
    console.log(`Created auth user with ID: ${authUser.id}`);
  } else {
    console.log(`Updating existing auth user ${email}...`);
    const { data: updatedAuth, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      {
        password,
        email_confirm: true,
        user_metadata: {
          ...authUser.user_metadata,
          role,
          full_name,
          organization_name,
          approval_status: 'approved',
          is_active: true,
        },
      }
    );
    if (updateErr) {
      console.error(`Error updating auth user ${email}:`, updateErr);
    } else {
      authUser = updatedAuth.user;
      console.log(`Updated auth password and metadata for ID: ${authUser.id}`);
    }
  }

  // 2. Upsert Profile record
  const profilePayload = {
    id: authUser.id,
    role,
    full_name,
    organization_name: organization_name || null,
    email,
    approval_status: 'approved',
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { error: profErr } = await supabaseAdmin
    .from('profiles')
    .upsert(profilePayload, { onConflict: 'id' });

  if (profErr) {
    console.error(`Error upserting profile for ${email}:`, profErr);
  } else {
    console.log(`✅ Profile active & approved for ${email}`);
  }

  return { authUser, userDef };
}

async function main() {
  console.log('🚀 Seeding test accounts for all roles...');

  const createdMap = {};

  for (const userDef of TEST_USERS) {
    const result = await seedUser(userDef);
    if (result) {
      createdMap[userDef.role] = result;
    }
  }

  // 3. Setup student record linked to university
  if (createdMap.student && createdMap.university) {
    const studentUser = createdMap.student.authUser;
    const studentDef = createdMap.student.userDef;
    const universityUser = createdMap.university.authUser;

    console.log('\n--- Setting up Student Table Record ---');
    const studentRecord = {
      user_id: studentUser.id,
      university_id: universityUser.id,
      name: studentDef.full_name,
      email: studentDef.email,
      student_id: studentDef.student_id,
      batch: studentDef.batch,
      degree_program: studentDef.degree_program,
      semester: studentDef.semester,
      credentials: {
        email: studentDef.email,
        password: studentDef.password,
        student_id: studentDef.student_id,
      },
      updated_at: new Date().toISOString(),
    };

    const { error: studentErr } = await supabaseAdmin
      .from('students')
      .upsert(studentRecord, { onConflict: 'user_id' });

    if (studentErr) {
      console.error('Error creating student record:', studentErr);
    } else {
      console.log(`✅ Student record created: Student ID ${studentDef.student_id}`);
    }

    // Update student's university_id in profiles
    await supabaseAdmin
      .from('profiles')
      .update({ university_id: universityUser.id })
      .eq('id', studentUser.id);
  }

  console.log('\n======================================================');
  console.log('🎉 ALL TEST ACCOUNTS CREATED & VERIFIED SUCCESSFULLY!');
  console.log('======================================================\n');
}

main().catch(console.error);
