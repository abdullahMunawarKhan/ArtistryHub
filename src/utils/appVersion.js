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

export function isVersionLower(v1, v2) {
  if (!v1 || !v2) return false;
  const a = v1.split(".").map(Number);
  const b = v2.split(".").map(Number);

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    if (x < y) return true;
    if (x > y) return false;
  }
  return false;
}
