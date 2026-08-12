import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';

  if (!supabaseUrl || !supabaseAnonKey) {
    // Provide a fallback dummy client for local development when keys aren't configured yet
    return createBrowserClient(
      'https://dummy-project.supabase.co',
      'dummy-anon-key'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
