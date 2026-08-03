import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// シンプルな認証なし版：ブラウザから直接Supabaseにアクセスする。
// .env.local に NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してから使用する。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: ReturnType<typeof createSupabaseClient<any, any, any>> | null = null;

export function createClient() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      ".env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください"
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client = createSupabaseClient<any, any, any>(url, key);
  return client;
}
