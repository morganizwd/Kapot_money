import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const getUserProfile = cache(async () => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("user_profiles").select("*").maybeSingle();

  if (error) {
    throw error;
  }

  return data;
});
