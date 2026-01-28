import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateQuestionCommand, QuestionDTO, UpvoteResponseDTO, UpdateQuestionCommand } from "@/types";

/**
 * Create a new question for a session
 * @param supabase - Supabase client instance
 * @param sessionId - ID of the session to add question to
 * @param command - Question data from request
 * @returns Created question as QuestionDTO
 * @throws Error if database operation fails
 */
export async function createQuestion(
  supabase: SupabaseClient,
  sessionId: string,
  command: CreateQuestionCommand
): Promise<QuestionDTO> {
  const { data, error } = await supabase
    .from("questions")
    .insert({
      session_id: sessionId,
      content: command.content,
      author_name: command.authorName || "Anonymous",
    })
    .select()
    .single();

  if (error) throw error;

  // Transform snake_case database fields to camelCase DTO
  return {
    id: data.id,
    sessionId: data.session_id,
    content: data.content,
    authorName: data.author_name,
    isAnswered: data.is_answered,
    upvoteCount: data.upvote_count,
    createdAt: data.created_at,
  };
}

/**
 * Get all questions for a session with optional filtering
 * @param supabase - Supabase client instance
 * @param sessionId - ID of the session to get questions for
 * @param includeAnswered - Whether to include answered questions (default: false)
 * @returns Array of questions sorted by upvote count (desc) and creation date (asc)
 * @throws Error if database operation fails
 */
export async function getQuestionsBySessionId(
  supabase: SupabaseClient,
  sessionId: string,
  includeAnswered = false
): Promise<QuestionDTO[]> {
  let query = supabase.from("questions").select("*").eq("session_id", sessionId);

  // Filter out answered questions if includeAnswered is false
  if (!includeAnswered) {
    query = query.eq("is_answered", false);
  }

  // Sort by upvote count (descending) and created_at (ascending)
  query = query.order("upvote_count", { ascending: false });
  query = query.order("created_at", { ascending: true });

  const { data, error } = await query;

  if (error) throw error;

  // Transform snake_case database fields to camelCase DTOs
  return (data || []).map((question) => ({
    id: question.id,
    sessionId: question.session_id,
    content: question.content,
    authorName: question.author_name,
    isAnswered: question.is_answered,
    upvoteCount: question.upvote_count,
    createdAt: question.created_at,
  }));
}

/**
 * Increment upvote count for a question
 * @param supabase - Supabase client instance
 * @param id - ID of the question to upvote
 * @returns Updated question with new upvote count
 * @throws Error if question not found or database operation fails
 */
export async function upvoteQuestion(supabase: SupabaseClient, id: string): Promise<UpvoteResponseDTO> {
  // First, get current upvote count
  const { data: currentData, error: selectError } = await supabase
    .from("questions")
    .select("upvote_count")
    .eq("id", id)
    .single();

  if (selectError) {
    // Check if question not found (PGRST116 is Supabase error code for no rows)
    if (selectError.code === "PGRST116") {
      throw new Error("Question not found");
    }
    throw new Error(`Failed to fetch question: ${selectError.message}`);
  }

  // Increment upvote count
  const newUpvoteCount = (currentData.upvote_count || 0) + 1;

  // Update with new count
  const { data, error } = await supabase
    .from("questions")
    .update({ upvote_count: newUpvoteCount })
    .eq("id", id)
    .select("id, upvote_count")
    .single();

  if (error) {
    throw new Error(`Failed to upvote question: ${error.message}`);
  }

  // Transform snake_case database fields to camelCase DTO
  return {
    id: data.id,
    upvoteCount: data.upvote_count,
  };
}

/**
 * Update question properties
 * @param supabase - Supabase client instance
 * @param id - ID of the question to update
 * @param command - Update data from request
 * @returns Updated question as QuestionDTO
 * @throws Error if question not found or database operation fails
 */
export async function updateQuestion(
  supabase: SupabaseClient,
  id: string,
  command: UpdateQuestionCommand
): Promise<QuestionDTO> {
  // Build update object only with provided fields
  const updateData: Record<string, unknown> = {};
  if (command.isAnswered !== undefined) {
    updateData.is_answered = command.isAnswered;
  }

  // Perform update and return data in one query
  const { data, error } = await supabase.from("questions").update(updateData).eq("id", id).select().single();

  // Check if question was found
  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("Question not found");
    }
    throw new Error(`Failed to update question: ${error.message}`);
  }

  // Transform snake_case to camelCase
  return {
    id: data.id,
    sessionId: data.session_id,
    content: data.content,
    authorName: data.author_name,
    isAnswered: data.is_answered,
    upvoteCount: data.upvote_count,
    createdAt: data.created_at,
  };
}
