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
