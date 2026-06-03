import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? `set (${supabaseUrl.substring(0, 40)}...)` : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey ? `set (${anonKey.substring(0, 20)}...)` : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: serviceKey ? `set (${serviceKey.substring(0, 20)}...)` : 'MISSING',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'MISSING',
  };

  // Test Supabase connection
  let dbStatus = 'untested';
  let dbError = null;

  if (supabaseUrl && serviceKey) {
    try {
      const supabase = createClient(supabaseUrl, serviceKey);
      const { error } = await supabase.from('users').select('id').limit(1);
      dbStatus = error ? 'error' : 'connected';
      dbError = error ? error.message : null;
    } catch (e: unknown) {
      dbStatus = 'fetch_failed';
      dbError = e instanceof Error ? e.message : String(e);
    }
  } else {
    dbStatus = 'skipped_missing_env';
  }

  return NextResponse.json({
    ok: dbStatus === 'connected',
    env: envCheck,
    db: { status: dbStatus, error: dbError },
  });
}
