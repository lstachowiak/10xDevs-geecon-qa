import type { SupabaseClient } from "@/db/supabase.client";
import type { SessionDTO, SessionViewModel, CreateSessionCommand } from "@/types";
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
 * @returns Object containing array of sessions with question counts and total count
 */
export async function getAllSessions(
  supabase: SupabaseClient,
  queryParams: GetSessionsQuery
): Promise<{ data: SessionViewModel[]; total: number }> {
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

  // Get paginated data with sorting and question count
  const { data, error } = await supabase
    .from("sessions")
    .select(
      `
      id, 
      name, 
      speaker, 
      description, 
      session_date, 
      unique_url_slug, 
      created_at,
      questions(*)
    `
    )
    .order(dbSortBy, { ascending: sortOrder === "asc" })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch sessions: ${error.message}`);
  }

  // Transform snake_case to camelCase and add question count
  const sessionViewModels: SessionViewModel[] = (data || []).map((session) => ({
    id: session.id,
    name: session.name,
    speaker: session.speaker,
    description: session.description,
    sessionDate: session.session_date,
    uniqueUrlSlug: session.unique_url_slug,
    createdAt: session.created_at,
    questionCount: Array.isArray(session.questions) ? session.questions.length : 0,
  }));

  return { data: sessionViewModels, total };
}

/**
 * Delete a session by ID
 * @param supabase - Supabase client instance
 * @param sessionId - UUID of the session to delete
 * @throws Error if session not found or deletion fails
 */
export async function deleteSession(supabase: SupabaseClient, sessionId: string): Promise<void> {
  const { error } = await supabase.from("sessions").delete().eq("id", sessionId);

  if (error) {
    throw new Error(`Failed to delete session: ${error.message}`);
  }
}

/**
 * Create a new session
 * @param supabase - Supabase client instance
 * @param sessionData - Data for the new session
 * @returns Created session DTO
 * @throws Error if creation fails or slug generation has conflicts
 */
export async function createSession(supabase: SupabaseClient, sessionData: CreateSessionCommand): Promise<SessionDTO> {
  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    // Generate unique slug from session name and random suffix
    const baseSlug = sessionData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const uniqueUrlSlug = `${baseSlug}-${randomSuffix}`;

    // Try to insert the session
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        name: sessionData.name,
        speaker: sessionData.speaker,
        description: sessionData.description || null,
        session_date: sessionData.sessionDate || null,
        unique_url_slug: uniqueUrlSlug,
      })
      .select("id, name, speaker, description, session_date, unique_url_slug, created_at")
      .single();

    // If successful, return the created session
    if (!error && data) {
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

    // If error is due to unique constraint violation, retry
    if (error?.code === "23505") {
      attempt++;
      continue;
    }

    // For other errors, throw
    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }
  }

  // If all retries failed
  throw new Error("Failed to generate unique slug after maximum retries");
}
