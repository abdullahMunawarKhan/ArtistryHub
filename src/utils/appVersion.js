import { supabase } from "./supabase";

export async function fetchLatestAppVersion() {
  const { data, error } = await supabase
    .from("appversions")
    .select("version_no, version_url, force_update")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}
