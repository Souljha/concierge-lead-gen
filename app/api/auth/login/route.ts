import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import { ApiResponse } from '@/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SESSION_COOKIE = 'auth-session';
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours
const DEFAULT_FIRM_ID = '00000000-0000-0000-0000-000000000001';

const DEMO_USERS = [
  { email: 'admin@demo.com', password: 'admin123', role: 'admin', name: 'Demo Admin', firm_id: DEFAULT_FIRM_ID },
  { email: 'advisor@demo.com', password: 'advisor123', role: 'advisor', name: 'Demo Advisor', firm_id: DEFAULT_FIRM_ID },
];

function buildSessionCookie(data: { id: string; email: string; name: string; role: string; firm_id?: string }): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function setSessionCookie(response: NextResponse, cookieValue: string): void {
  response.cookies.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check demo users first
    const demoUser = DEMO_USERS.find(
      u => u.email === email && u.password === password
    );

    if (demoUser) {
      let userId: string | undefined;

      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id, role, firm_id')
        .eq('email', demoUser.email)
        .single();

      if (!existingUser) {
        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            email: demoUser.email,
            full_name: demoUser.name,
            role: demoUser.role,
            firm_id: DEFAULT_FIRM_ID,
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating demo user:', createError);
        }
        userId = newUser?.id;
      } else {
        userId = existingUser.id;
      }

      const sessionData = {
        id: userId ?? '',
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
        firm_id: demoUser.firm_id,
      };
      const response = NextResponse.json<ApiResponse>({ success: true, data: sessionData });
      setSessionCookie(response, buildSessionCookie(sessionData));
      return response;
    }

    // Check database users (admin/advisor roles only)
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, firm_id')
      .eq('email', email)
      .in('role', ['admin', 'advisor'])
      .single();

    if (error || !user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role,
      firm_id: user.firm_id ?? DEFAULT_FIRM_ID,
    };
    const response = NextResponse.json<ApiResponse>({ success: true, data: sessionData });
    setSessionCookie(response, buildSessionCookie(sessionData));
    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
