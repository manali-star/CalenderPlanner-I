import { createClient } from "@supabase/supabase-js";

const fallbackSupabaseUrl = "https://dousktulqahtntrjcyod.supabase.co";
const fallbackSupabaseAnonKey = "sb_publishable_hZhgkT1s1NF542_UDfb4HA_2ppEwwDO";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL?.trim() || fallbackSupabaseUrl;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || fallbackSupabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
