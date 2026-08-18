import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seedAuditLogsProper() {
  // Find admin profile
  const { data: admin } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
  const adminId = admin ? admin.id : null;

  // Find other profiles to use as target_id UUIDs
  const { data: profiles } = await supabase.from('profiles').select('id, email, role');
  const sh = profiles.find(p => p.role === 'software_house');
  const uni = profiles.find(p => p.role === 'university');
  const stu = profiles.find(p => p.role === 'student');

  const sampleLogs = [
    {
      admin_id: adminId,
      action: 'account_approved',
      target_type: 'user',
      target_id: sh?.id || adminId,
      feedback: 'Verified software house registration & company documentation.',
      metadata: { role: 'software_house', organization: 'TechLogix Software Solutions' },
      timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    },
    {
      admin_id: adminId,
      action: 'account_approved',
      target_type: 'user',
      target_id: uni?.id || adminId,
      feedback: 'Verified university officer credentials and institutional accreditation.',
      metadata: { role: 'university', organization: 'National University of Sciences & Tech' },
      timestamp: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    },
    {
      admin_id: adminId,
      action: 'internship_approved',
      target_type: 'internship',
      target_id: sh?.id || adminId,
      feedback: 'Internship posting for Full Stack Developer approved.',
      metadata: { title: 'Full Stack Developer Internship', stipend: 35000, duration: '3 Months' },
      timestamp: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    },
    {
      admin_id: adminId,
      action: 'user_created',
      target_type: 'user',
      target_id: stu?.id || adminId,
      feedback: 'Student portal account provisioned via university roster.',
      metadata: { role: 'student', email: 'student@internlynk.com' },
      timestamp: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    },
    {
      admin_id: adminId,
      action: 'system_initialized',
      target_type: 'system',
      target_id: adminId,
      feedback: 'Platform database security policies and role controls initialized.',
      metadata: { platform: 'InternLynk', version: '1.0.0', status: 'healthy' },
      timestamp: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    },
  ];

  for (const log of sampleLogs) {
    const { error } = await supabase.from('admin_logs').insert(log);
    if (error) console.error("Error inserting log:", error);
  }

  const { data: countData } = await supabase.from('admin_logs').select('*');
  console.log(`Successfully seeded ${countData?.length} audit logs in DB!`);
}

seedAuditLogsProper();
