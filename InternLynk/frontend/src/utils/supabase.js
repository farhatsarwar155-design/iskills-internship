import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://niukjfjbwsdptejegwsf.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pdWtqZmpid3NkcHRlamVnd3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4OTA2NzgsImV4cCI6MjEwMjQ2NjY3OH0.yL-y9HsRSAG0ZFP4zWNS7gDminnxP3R1OIGxJC2aZ3c'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: { eventsPerSecond: 5 },
  },
  // Add schema cache refresh options
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'aiilp-web',
    },
  },
})

/**
 * Force refresh Supabase schema cache by running a simple query
 * This can help resolve "column not found in schema cache" errors
 */
export async function refreshSchemaCache() {
  try {
    // Run a simple query to force schema refresh
    await supabase.from('internships').select('id').limit(1)
    console.log('[Supabase] Schema cache refresh attempted')
  } catch (error) {
    console.warn('[Supabase] Schema cache refresh query failed:', error.message)
  }
}