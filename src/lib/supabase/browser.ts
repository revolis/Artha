import { createBrowserClient } from "@supabase/ssr";

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

const STORAGE_KEY = 'sb-auth-token';

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
        storage: typeof window !== 'undefined' ? {
          getItem: (key: string) => {
            try {
              return window.localStorage.getItem(key);
            } catch {
              return null;
            }
          },
          setItem: (key: string, value: string) => {
            try {
              window.localStorage.setItem(key, value);
              if (key.includes('auth-token')) {
                const parsed = JSON.parse(value);
                if (parsed?.access_token) {
                  window.localStorage.setItem(STORAGE_KEY, parsed.access_token);
                }
              }
            } catch {
            }
          },
          removeItem: (key: string) => {
            try {
              window.localStorage.removeItem(key);
              if (key.includes('auth-token')) {
                window.localStorage.removeItem(STORAGE_KEY);
              }
            } catch {
            }
          },
        } : undefined,
      },
    }
  );
  
  return supabaseInstance;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const directToken = window.localStorage.getItem(STORAGE_KEY);
    if (directToken) return directToken;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] ?? '';
    const supabaseKey = `sb-${projectRef}-auth-token`;
    const stored = window.localStorage.getItem(supabaseKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.access_token || null;
    }
  } catch {
  }
  return null;
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const storedToken = getStoredToken();
  if (storedToken) {
    return {
      'Authorization': `Bearer ${storedToken}`,
    };
  }

  try {
    const supabase = createSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, session.access_token);
      }
      return {
        'Authorization': `Bearer ${session.access_token}`,
      };
    }
  } catch {
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

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
