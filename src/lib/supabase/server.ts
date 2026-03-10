import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedSupabaseServer: SupabaseClient | null = null;

function getSupabaseServerClient(): SupabaseClient {
  if (cachedSupabaseServer) {
    return cachedSupabaseServer;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable. " +
      "Please add it to your Vercel environment variables."
    );
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. " +
      "Please add it to your Vercel environment variables."
    );
  }

  cachedSupabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);
  return cachedSupabaseServer;
}

export const supabaseServer: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseServerClient();
    const value = Reflect.get(client as unknown as object, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
