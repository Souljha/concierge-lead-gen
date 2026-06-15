import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';

export interface SessionData {
  id: string;
  email: string;
  name: string;
  role: string;
  firm_id?: string;
}

const SESSION_COOKIE = 'auth-session';

export function getSessionFromRequest(req: NextRequest): SessionData | null {
  try {
    const cookieValue = req.cookies.get(SESSION_COOKIE)?.value;
    if (!cookieValue) return null;

    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const dotIndex = cookieValue.lastIndexOf('.');
    if (dotIndex === -1) return null;

    const payload = cookieValue.slice(0, dotIndex);
    const sig = cookieValue.slice(dotIndex + 1);

    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    if (sig !== expected) return null;

    const json = Buffer.from(payload, 'base64url').toString('utf8');
    return JSON.parse(json) as SessionData;
  } catch {
    return null;
  }
}

export function requireAdminSession(req: NextRequest): SessionData | null {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return null;
  return session;
}
