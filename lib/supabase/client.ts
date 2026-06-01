import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Client-side Supabase client
export const createClient = () => {
  return createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  });
};

// Server-side Supabase client (for Server Components and API Routes)
export const createServerClient = () => {
  const cookieStore = cookies();
  
  return createServerComponentClient({
    cookies: () => cookieStore,
  });
};

// Helper to check if user is authenticated
export const getSession = async () => {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// Helper to get current user
export const getCurrentUser = async () => {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
