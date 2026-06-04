import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? `set (${supabaseUrl.substring(0, 45)}...)` : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey ? `set (${anonKey.substring(0, 20)}...)` : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: serviceKey ? `set (${serviceKey.substring(0, 20)}...)` : 'MISSING',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'MISSING',
  };

  // Test 1: raw fetch to Supabase REST base URL (no auth needed)
  let rawFetchStatus = 'untested';
  let rawFetchError = null;
  if (supabaseUrl) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: { apikey: anonKey || '', Authorization: `Bearer ${anonKey || ''}` },
        signal: AbortSignal.timeout(8000),
      });
      rawFetchStatus = `http_${res.status}`;
    } catch (e: unknown) {
      rawFetchStatus = 'failed';
      rawFetchError = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    }
  }

  // Test 2: supabase-js client query
  let dbStatus = 'untested';
  let dbError = null;
  if (supabaseUrl && serviceKey) {
    try {
      const supabase = createClient(supabaseUrl, serviceKey);
      const { error } = await supabase.from('users').select('id').limit(1);
      dbStatus = error ? `postgrest_error: ${error.code}` : 'connected';
      dbError = error ? `${error.message} | hint: ${error.hint} | details: ${error.details}` : null;
    } catch (e: unknown) {
      dbStatus = 'exception';
      dbError = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    }
  }

  return NextResponse.json({
    ok: dbStatus === 'connected',
    nodeVersion: process.version,
    env: envCheck,
    rawFetch: { status: rawFetchStatus, error: rawFetchError },
    db: { status: dbStatus, error: dbError },
  });
}
