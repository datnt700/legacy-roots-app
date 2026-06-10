import { getSupabase } from "@/lib/supabase";

const DEFAULT_FAMILY_SLUG = "legacy-roots";

export async function getDefaultFamilyId() {
  const supabase = getSupabase();
  const slug = process.env.SUPABASE_FAMILY_SLUG ?? DEFAULT_FAMILY_SLUG;

  const { data, error } = await supabase
    .from("families")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error(`Family "${slug}" was not found.`);
  }

  return data.id as string;
}
