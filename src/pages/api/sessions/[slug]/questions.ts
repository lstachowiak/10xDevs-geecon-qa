import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createQuestionSchema } from '@/lib/schemas/question.schema';
import { getSessionBySlug } from '@/lib/services/sessions.service';
import { createQuestion } from '@/lib/services/questions.service';
import type { ErrorResponseDTO, QuestionDTO } from '@/types';

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      const errorResponse: ErrorResponseDTO = {
        error: 'Invalid request body'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Validate input using Zod schema
    const validation = createQuestionSchema.safeParse(body);
    if (!validation.success) {
      const details: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path.length > 0) {
          details[err.path[0].toString()] = err.message;
        }
      });

      const errorResponse: ErrorResponseDTO = {
        error: 'Validation failed',
        details
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Get Supabase client from locals (set by middleware)
    const supabase = locals.supabase;
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // 4. Verify session exists by slug
    const slug = params.slug;
    if (!slug) {
      const errorResponse: ErrorResponseDTO = {
        error: 'Session slug is required'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const session = await getSessionBySlug(supabase, slug);
    if (!session) {
      const errorResponse: ErrorResponseDTO = {
        error: 'Session not found'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. Create question (happy path)
    const question = await createQuestion(
      supabase,
      session.id,
      validation.data
    );

    // 6. Return created question with 201 status
    return new Response(JSON.stringify(question), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    console.error('Error creating question:', error);

    const errorResponse: ErrorResponseDTO = {
      error: 'Internal server error'
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
