import { cookies, headers } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export function createSupabaseRouteClient() {
  const headerStore = headers();
  const authHeader = headerStore.get('authorization');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. " +
      "Please add them to your Vercel environment variables."
    );
  }

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }

  const cookieStore = cookies();

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
              sameSite: 'none',
              secure: true,
              path: '/',
            });
          } catch (error) {
            // Handle cookie setting errors (e.g., in Edge runtime)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value: '',
              ...options,
              sameSite: 'none',
              secure: true,
              path: '/',
              maxAge: 0,
            });
          } catch (error) {
            // Handle cookie removal errors
          }
        }
      }
    }
  );
}
