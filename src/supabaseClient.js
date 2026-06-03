import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dousktulqahtntrjcyod.supabase.co/"

const supabaseAnonKey = "sb_publishable_hZhgkT1s1NF542_UDfb4HA_2ppEwwDO"


export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);