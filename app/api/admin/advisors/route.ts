import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/types';
import { requireAdminSession } from '@/lib/auth/session';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const session = requireAdminSession(req);
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const firmId = session.firm_id ?? '00000000-0000-0000-0000-000000000001';

  try {
    const { data: advisors, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email')
      .eq('role', 'advisor')
      .eq('firm_id', firmId)
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching advisors:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch advisors' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: advisors || [],
    });

  } catch (error) {
    console.error('Error in advisors endpoint:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
