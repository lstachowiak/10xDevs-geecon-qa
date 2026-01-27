import type { SupabaseClient } from '@/db/supabase.client';
import type { CreateQuestionCommand, QuestionDTO } from '@/types';

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
    .from('questions')
    .insert({
      session_id: sessionId,
      content: command.content,
      author_name: command.authorName || 'Anonymous'
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
    createdAt: data.created_at
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
  includeAnswered: boolean = false
): Promise<QuestionDTO[]> {
  let query = supabase
    .from('questions')
    .select('*')
    .eq('session_id', sessionId);

  // Filter out answered questions if includeAnswered is false
  if (!includeAnswered) {
    query = query.eq('is_answered', false);
  }

  // Sort by upvote count (descending) and created_at (ascending)
  query = query.order('upvote_count', { ascending: false });
  query = query.order('created_at', { ascending: true });

  const { data, error } = await query;

  if (error) throw error;

  // Transform snake_case database fields to camelCase DTOs
  return (data || []).map(question => ({
    id: question.id,
    sessionId: question.session_id,
    content: question.content,
    authorName: question.author_name,
    isAnswered: question.is_answered,
    upvoteCount: question.upvote_count,
    createdAt: question.created_at
  }));
}
