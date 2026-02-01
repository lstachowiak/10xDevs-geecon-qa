import type { APIRoute } from "astro";
import { z } from "zod";
import { upvoteQuestion } from "@/lib/services/questions.service";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

// Validation schema for UUID parameter
const idParamSchema = z.string().uuid();

/**
 * POST /api/questions/:id/upvote
 * Public endpoint to increment upvote count for a question
 * No authentication required (MVP implementation)
 */
export const POST: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Validate :id parameter
    const validationResult = idParamSchema.safeParse(params.id);

    if (!validationResult.success) {
      const errorResponse: ErrorResponseDTO = {
        error: "Validation failed",
        details: { id: "Invalid UUID format" },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Get Supabase client from locals (set by middleware)
    const supabase = locals.supabase;

    // 3. Call service to upvote question
    const result = await upvoteQuestion(supabase, validationResult.data);

    // 4. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle "Question not found" error
    if (error instanceof Error && error.message === "Question not found") {
      const errorResponse: ErrorResponseDTO = {
        error: "Question not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log the error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // eslint-disable-next-line no-console
    console.error("[POST /api/questions/:id/upvote]", {
      questionId: params.id,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    // Return generic error response
    const errorResponse: ErrorResponseDTO = {
      error: "Failed to upvote question",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
