import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name: string) {
          const value = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1];
          return value;
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number; domain?: string; sameSite?: string; secure?: boolean }) {
          let cookie = `${name}=${value}; path=${options.path ?? '/'}; SameSite=None; Secure`;
          if (options.maxAge) {
            cookie += `; Max-Age=${options.maxAge}`;
          }
          document.cookie = cookie;
        },
        remove(name: string, options: { path?: string }) {
          document.cookie = `${name}=; path=${options.path ?? '/'}; Max-Age=0; SameSite=None; Secure`;
        },
      },
    }
  );
}
