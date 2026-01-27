import type { SupabaseClient } from '@/db/supabase.client';

/**
 * Get session by unique URL slug
 * @param supabase - Supabase client instance
 * @param slug - Unique URL slug for the session
 * @returns Session with id or null if not found
 */
export async function getSessionBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('id')
    .eq('unique_url_slug', slug)
    .single();
  
  if (error || !data) return null;
  return data;
}
