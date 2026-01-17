import { createBrowserClient } from "@supabase/ssr";

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  if (supabaseInstance) return supabaseInstance;
  
  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    }
  );
  
  return supabaseInstance;
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    return {
      'Authorization': `Bearer ${session.access_token}`,
    };
  }
  return {};
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...authHeaders,
    },
  });
}
