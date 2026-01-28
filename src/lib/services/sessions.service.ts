import type { SupabaseClient } from "@/db/supabase.client";
import type { SessionDTO } from "@/types";
import type { GetSessionsQuery } from "@/lib/schemas/session.schema";

/**
 * Get session by unique URL slug
 * @param supabase - Supabase client instance
 * @param slug - Unique URL slug for the session
 * @returns Full session DTO or null if not found
 */
export async function getSessionBySlug(supabase: SupabaseClient, slug: string): Promise<SessionDTO | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select("id, name, speaker, description, session_date, unique_url_slug, created_at")
    .eq("unique_url_slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found
      return null;
    }
    throw error;
  }

  // Transform snake_case to camelCase
  return {
    id: data.id,
    name: data.name,
    speaker: data.speaker,
    description: data.description,
    sessionDate: data.session_date,
    uniqueUrlSlug: data.unique_url_slug,
    createdAt: data.created_at,
  };
}

/**
 * Get all sessions with pagination and sorting
 * @param supabase - Supabase client instance
 * @param queryParams - Validated query parameters (page, limit, sortBy, sortOrder)
 * @returns Object containing array of sessions and total count
 */
export async function getAllSessions(
  supabase: SupabaseClient,
  queryParams: GetSessionsQuery
): Promise<{ data: SessionDTO[]; total: number }> {
  const { page, limit, sortBy, sortOrder } = queryParams;

  // Map camelCase field names to snake_case database columns
  const sortByMap: Record<string, string> = {
    createdAt: "created_at",
    sessionDate: "session_date",
    name: "name",
  };

  const dbSortBy = sortByMap[sortBy] || "created_at";

  // Calculate offset for pagination
  const offset = (page - 1) * limit;

  // Get total count
  const { count, error: countError } = await supabase.from("sessions").select("*", { count: "exact", head: true });

  if (countError) {
    throw new Error(`Failed to fetch sessions count: ${countError.message}`);
  }

  const total = count || 0;

  // Get paginated data with sorting
  const { data, error } = await supabase
    .from("sessions")
    .select("id, name, speaker, description, session_date, unique_url_slug, created_at")
    .order(dbSortBy, { ascending: sortOrder === "asc" })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch sessions: ${error.message}`);
  }

  // Transform snake_case to camelCase
  const sessionDTOs: SessionDTO[] = (data || []).map((session) => ({
    id: session.id,
    name: session.name,
    speaker: session.speaker,
    description: session.description,
    sessionDate: session.session_date,
    uniqueUrlSlug: session.unique_url_slug,
    createdAt: session.created_at,
  }));

  return { data: sessionDTOs, total };
}
