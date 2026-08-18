import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seedAuditLogs() {
  // Find admin profile
  const { data: admin } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
  const adminId = admin ? admin.id : null;

  const sampleLogs = [
    {
      admin_id: adminId,
      action: 'account_approved',
      target_type: 'user',
      target_id: 'softwarehouse@internlynk.com',
      feedback: 'Verified software house registration & tax documentation.',
      metadata: { role: 'software_house', organization: 'TechLogix Software Solutions' },
      timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    },
    {
      admin_id: adminId,
      action: 'account_approved',
      target_type: 'user',
      target_id: 'university@internlynk.com',
      feedback: 'Verified university officer credentials.',
      metadata: { role: 'university', organization: 'NUST University' },
      timestamp: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    },
    {
      admin_id: adminId,
      action: 'internship_approved',
      target_type: 'internship',
      target_id: 'full stack',
      feedback: 'Internship posting meets platform quality standards.',
      metadata: { stipend: 'Paid', duration: '3 Months' },
      timestamp: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    },
    {
      admin_id: adminId,
      action: 'system_initialized',
      target_type: 'system',
      target_id: 'v1.0',
      feedback: 'InternLynk platform security, role governance & RLS policies configured.',
      metadata: { version: '1.0.0', status: 'healthy' },
      timestamp: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    },
  ];

  for (const log of sampleLogs) {
    await supabase.from('admin_logs').insert(log);
  }

  console.log("Seeded sample audit logs successfully!");
}

seedAuditLogs();
